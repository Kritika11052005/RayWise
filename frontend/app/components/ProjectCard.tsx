import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { ChevronDown, Loader2, CheckCircle, Trash2 } from "lucide-react";

type PolygonPoint = {
  x: number;
  y: number;
};

type SavedProjectAnalysis = {
  totalPanels: number;
  totalPowerKw: number;
  orientation: number | string;
  layout: string;
  annualProduction: number;
  recommendations: string;
  sunAnalysis?: string;
  shadowAnalysis?: string;
};

type PanelLayoutItem = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

type SavedProject = {
  _id: string;
  _creationTime: number;
  userId: string;
  name: string;
  description?: string;
  location: {
    city: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  imageUrl?: string;
  imageSource: "upload" | "map";
  polygonPoints: PolygonPoint[];
  imageWidth: number;
  imageHeight: number;
  analysis?: SavedProjectAnalysis;
  panelLayout?: PanelLayoutItem[];
  createdAt: number;
  updatedAt: number;
  status: "draft" | "analyzed";
};

type ProjectCardProps = {
  project: SavedProject;
  onDelete: (projectId: string) => void;
};

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [converting, setConverting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const finalizeLayout = useMutation(api.finalizedLayouts.finalizeLayout);

  const handleConvertToFinalized = async () => {
    if (project.status !== "analyzed" || !project.analysis || !project.panelLayout) {
      alert("Project must be analyzed before finalizing!");
      return;
    }

    setConverting(true);
    try {
      await finalizeLayout({
        savedProjectId: project._id as Id<"savedProjects">,
        name: project.name,
        description: project.description,
        location: project.location,
        imageUrl: project.imageUrl,
        polygonPoints: project.polygonPoints,
        imageWidth: project.imageWidth,
        imageHeight: project.imageHeight,
        analysis: project.analysis,
        panelLayout: project.panelLayout,
      });

      alert(`Successfully converted "${project.name}" to finalized layout!`);
      
      // Optionally delete the saved project after conversion
      if (confirm("Delete the original saved project?")) {
        onDelete(project._id);
      }
    } catch (error) {
      console.error("Error converting to finalized layout:", error);
      alert("Failed to convert project. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDelete(project._id);
      setDeleteConfirm(false);
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-slate-500/20 hover:border-slate-500/40 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{project.name}</h4>
          <p className="text-sm text-muted-foreground">
            {project.location.city}, {project.location.country}
          </p>
          
          {project.status === "analyzed" && project.analysis && (
            <div className="mt-2 text-xs text-muted-foreground">
              {project.analysis.totalPanels} panels • {project.analysis.totalPowerKw} kW
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-3 ${
                  project.status === "analyzed"
                    ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                    : "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                }`}
                disabled={converting}
              >
                {converting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    {project.status === "analyzed" ? "Analyzed" : "Draft"}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {project.status === "analyzed" ? (
                <>
                  <DropdownMenuItem
                    onClick={handleConvertToFinalized}
                    className="cursor-pointer"
                    disabled={!project.analysis || !project.panelLayout}
                  >
                    <div className="flex items-center w-full">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      <div className="flex-1">
                        <p className="font-medium">Convert to Finalized</p>
                        <p className="text-xs text-muted-foreground">
                          Move to production-ready layouts
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem disabled className="cursor-not-allowed">
                  <div className="flex items-center w-full">
                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2" />
                    <div className="flex-1">
                      <p className="font-medium">Complete Analysis First</p>
                      <p className="text-xs text-muted-foreground">
                        Analyze project before finalizing
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className={`h-8 w-8 p-0 ${
              deleteConfirm
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "hover:bg-red-500/20 hover:text-red-400"
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}