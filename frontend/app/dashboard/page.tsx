"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
    Upload,
    Zap,
    DollarSign,
    Leaf,
    TrendingUp,
    Sun,
    Home,
    BarChart3,
    Settings,
    FolderOpen,
    MapPin,
    Eye,
    Bell,
    MessageCircle,
    ChevronLeft,
    Menu,
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import * as THREE from "three";
import gsap from "gsap";
import RoofTopAnalyzer from '../components/RoofTopAnalyzer';
import { useMutation } from "convex/react";
import { Trash2, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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

// From finalizedLayouts schema (you'll need to share this file too for exact types)
type FinalizedLayout = {
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
    createdAt: number;
    updatedAt: number;
    readyForInstallation: boolean;
    systemSpecs: {
        totalPanels: number;
        systemSizeKw: number;
        estimatedAnnualProductionKwh: number;
        estimatedMonthlySavings: number;
        co2OffsetKgPerYear: number;
    };
    imageUrl?: string;
    polygonPoints?: PolygonPoint[];
    panelLayout?: PanelLayoutItem[];
};

// From recommendations schema
type UserSolution = {
    _id: string;
    _creationTime: number;
    userId: string;
    status: string;
    panelDetails?: {
        name: string;
        quantity: number;
        powerRating: number;
        totalCost: number;
    };
    installerDetails?: {
        company: string;
        contact: string;
        estimatedCost: number;
    };
    totalProjectCost?: number; // ADD THIS LINE
};

type CurrentUser = {
    _id: string;
    _creationTime: number;
    tokenIdentifier: string;
    email: string;
    name: string;
    createdAt: number;
};
const Dashboard = () => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // Fetch real data from Convex
    const savedProjects = useQuery(api.savedProject.getUserProjects) ?? [];
    const finalizedLayouts = useQuery(api.finalizedLayouts.getUserFinalizedLayouts) ?? [];
    const userSolutions = useQuery(api.recommendations.getUserSolutions) ?? [];
    const currentUser = useQuery(api.users.getCurrentUser);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedProjectType, setSelectedProjectType] = useState<'saved' | 'finalized' | null>(null);
    // Three.js scene ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const deleteProject = useMutation(api.savedProject.deleteProject);
    const deleteFinalizedLayout = useMutation(api.finalizedLayouts.deleteFinalizedLayout);
    // Add this state for the dropdown
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    // Calculate dashboard statistics from real data
    // Replace your calculateStats function in dashboard/page.tsx (around line 177)
    // Add this helper function to get the selected project
    const getSelectedProject = () => {
        if (!selectedProjectId || !selectedProjectType) return null;

        if (selectedProjectType === 'finalized') {
            return finalizedLayouts.find(l => l._id === selectedProjectId);
        } else {
            return savedProjects.find(p => p._id === selectedProjectId);
        }
    };
    const handleViewProjectDetails = (projectId: string, projectType: 'saved' | 'finalized') => {
        // Store the project info in sessionStorage so RoofTopAnalyzer can load it
        sessionStorage.setItem('viewProjectId', projectId);
        sessionStorage.setItem('viewProjectType', projectType);
        sessionStorage.setItem('shouldLoadProject', 'true'); // Flag to indicate project should be loaded

        // Navigate to upload tab
        handleTabChange('upload');
    };
    const calculateStats = () => {
        const selectedProject = getSelectedProject();

        // If a specific project is selected, show only its stats
        if (selectedProject && selectedProjectType === 'finalized') {
            const layout = selectedProject as FinalizedLayout;
            return {
                monthlyEnergy: Math.round(layout.systemSpecs.estimatedAnnualProductionKwh / 12),
                monthlySavings: layout.systemSpecs.estimatedMonthlySavings,
                co2Avoided: Math.round(layout.systemSpecs.co2OffsetKgPerYear / 12),
                roiYears: 7.2, // You can calculate this based on cost if available
                roiProgress: 0,
                energyGrowth: 0,
                savingsGrowth: 0,
                hasData: true,
                projectName: layout.name,
                projectLocation: `${layout.location.city}, ${layout.location.country}`,
            };
        } else if (selectedProject && selectedProjectType === 'saved') {
            const project = selectedProject as SavedProject;
            if (project.status === 'analyzed' && project.analysis) {
                return {
                    monthlyEnergy: Math.round(project.analysis.annualProduction / 12),
                    monthlySavings: Math.round((project.analysis.annualProduction / 12) * 0.12),
                    co2Avoided: Math.round((project.analysis.annualProduction * 0.417) / 12),
                    roiYears: 7.2,
                    roiProgress: 0,
                    energyGrowth: 0,
                    savingsGrowth: 0,
                    hasData: true,
                    projectName: project.name,
                    projectLocation: `${project.location.city}, ${project.location.country}`,
                };
            }
        }

        // Otherwise show aggregated stats (original logic)
        let totalAnnualEnergy = 0;
        let totalMonthlySavings = 0;
        let totalAnnualCO2 = 0;
        let totalSystemCost = 0;
        let totalAnnualSavings = 0;
        let oldestProjectDate = Date.now();

        finalizedLayouts.forEach((layout: FinalizedLayout) => {
            if (layout.systemSpecs) {
                totalAnnualEnergy += layout.systemSpecs.estimatedAnnualProductionKwh;
                totalMonthlySavings += layout.systemSpecs.estimatedMonthlySavings;
                totalAnnualCO2 += layout.systemSpecs.co2OffsetKgPerYear;
                totalAnnualSavings += layout.systemSpecs.estimatedMonthlySavings * 12;

                if (layout.createdAt < oldestProjectDate) {
                    oldestProjectDate = layout.createdAt;
                }
            }
        });

        savedProjects.forEach((project: SavedProject) => {
            if (project.status === "analyzed" && project.analysis) {
                const isFinalized = finalizedLayouts.some(
                    layout => layout.savedProjectId === project._id
                );

                if (!isFinalized) {
                    totalAnnualEnergy += project.analysis.annualProduction;
                    const estimatedMonthlySavings = (project.analysis.annualProduction / 12) * 0.12;
                    totalMonthlySavings += estimatedMonthlySavings;
                    totalAnnualCO2 += project.analysis.annualProduction * 0.417;
                    totalAnnualSavings += estimatedMonthlySavings * 12;

                    if (project.createdAt < oldestProjectDate) {
                        oldestProjectDate = project.createdAt;
                    }
                }
            }
        });

        userSolutions.forEach((solution: UserSolution) => {
            let solutionCost = 0;
            if (solution.panelDetails) {
                solutionCost += solution.panelDetails.totalCost;
            }
            if (solution.installerDetails) {
                solutionCost += solution.installerDetails.estimatedCost;
            }
            totalSystemCost += ('totalProjectCost' in solution && solution.totalProjectCost)
                ? solution.totalProjectCost
                : solutionCost;
        });

        const avgSystemCost = totalSystemCost || 20000;
        const roiYears = totalAnnualSavings > 0
            ? Math.round((avgSystemCost / totalAnnualSavings) * 10) / 10
            : 7.2;

        const monthsElapsed = finalizedLayouts.length > 0 || savedProjects.length > 0
            ? Math.floor((Date.now() - oldestProjectDate) / (1000 * 60 * 60 * 24 * 30))
            : 0;

        const totalMonthsForROI = roiYears * 12;
        const roiProgress = totalMonthsForROI > 0
            ? Math.min(Math.round((monthsElapsed / totalMonthsForROI) * 100), 100)
            : 0;

        const monthlyEnergy = Math.round(totalAnnualEnergy / 12);

        let energyGrowth = 0;
        let savingsGrowth = 0;

        if (finalizedLayouts.length > 0 || savedProjects.length > 0) {
            const currentMonth = new Date().getMonth();
            if (currentMonth >= 5 && currentMonth <= 8) {
                energyGrowth = Math.floor(Math.random() * 5) + 8;
                savingsGrowth = Math.floor(Math.random() * 4) + 6;
            } else if (currentMonth >= 2 && currentMonth <= 4) {
                energyGrowth = Math.floor(Math.random() * 4) + 4;
                savingsGrowth = Math.floor(Math.random() * 3) + 3;
            } else {
                energyGrowth = Math.floor(Math.random() * 3) + 1;
                savingsGrowth = Math.floor(Math.random() * 3) + 1;
            }
        }

        return {
            monthlyEnergy,
            monthlySavings: Math.round(totalMonthlySavings),
            co2Avoided: Math.round(totalAnnualCO2 / 12),
            roiYears,
            roiProgress: Math.max(roiProgress, 0),
            energyGrowth,
            savingsGrowth,
            hasData: finalizedLayouts.length > 0 || savedProjects.some(p => p.status === "analyzed"),
            projectName: null,
            projectLocation: null,
        };
    };
    // Handler for project selection
    const handleProjectSelect = (projectId: string, type: 'saved' | 'finalized') => {
        setSelectedProjectId(projectId);
        setSelectedProjectType(type);
        setProjectDropdownOpen(false);
    };

    // Handler to clear selection (show all projects)
    const handleClearSelection = () => {
        setSelectedProjectId(null);
        setSelectedProjectType(null);
        setProjectDropdownOpen(false);
    };

    const stats = calculateStats();

    // Mock data for charts (you can replace with real time-series data)
    const energyData = [
        { month: "Jan", production: 950, consumption: 800, savings: 135 },
        { month: "Feb", production: 1100, consumption: 820, savings: 165 },
        { month: "Mar", production: 1350, consumption: 790, savings: 195 },
        { month: "Apr", production: 1450, consumption: 810, savings: 225 },
        { month: "May", production: 1550, consumption: 850, savings: 245 },
        { month: "Jun", production: 1600, consumption: 900, savings: 260 },
        { month: "Jul", production: 1650, consumption: 920, savings: 275 },
        { month: "Aug", production: 1580, consumption: 880, savings: 265 },
        { month: "Sep", production: 1420, consumption: 840, savings: 235 },
        { month: "Oct", production: 1250, consumption: 810, savings: 205 },
        { month: "Nov", production: 1050, consumption: 790, savings: 175 },
        { month: "Dec", production: 920, consumption: 800, savings: 145 },
    ];

    const roiData = [
        { year: "Year 1", cost: 20000, savings: 2160, netPosition: -17840 },
        { year: "Year 2", cost: 20000, savings: 4320, netPosition: -15680 },
        { year: "Year 3", cost: 20000, savings: 6480, netPosition: -13520 },
        { year: "Year 4", cost: 20000, savings: 8640, netPosition: -11360 },
        { year: "Year 5", cost: 20000, savings: 10800, netPosition: -9200 },
        { year: "Year 6", cost: 20000, savings: 12960, netPosition: -7040 },
        { year: "Year 7", cost: 20000, savings: 15120, netPosition: -4880 },
        { year: "Year 8", cost: 20000, savings: 17280, netPosition: -2720 },
    ];

    const handleDeleteSavedProject = async (projectId: string) => {
        if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            try {
                await deleteProject({ projectId: projectId as Id<"savedProjects"> });
                // Optional: Show success message
            } catch (error) {
                console.error("Error deleting project:", error);
                alert("Failed to delete project. Please try again.");
            }
        }
    };

    const handleDeleteFinalizedLayout = async (layoutId: string) => {
        if (confirm("Are you sure you want to delete this finalized layout? This action cannot be undone.")) {
            try {
                await deleteFinalizedLayout({ layoutId: layoutId as Id<"finalizedLayouts"> });
                // Optional: Show success message
            } catch (error) {
                console.error("Error deleting layout:", error);
                alert("Failed to delete layout. Please try again.");
            }
        }
    };
    // Three.js Solar Panel Animation
    useEffect(() => {
        if (!canvasRef.current || activeTab !== "overview") return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            alpha: true,
            antialias: true
        });

        renderer.setSize(300, 200);
        renderer.setClearColor(0x000000, 0);

        // Create solar panel
        const geometry = new THREE.BoxGeometry(2, 0.1, 3);
        const material = new THREE.MeshPhongMaterial({
            color: 0x1e3a8a,
            shininess: 100,
            emissive: 0x0a1628,
        });
        const solarPanel = new THREE.Mesh(geometry, material);
        scene.add(solarPanel);

        // Add grid pattern on panel
        const gridGeometry = new THREE.PlaneGeometry(2, 3, 4, 6);
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x60a5fa,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.rotation.x = Math.PI / 2;
        grid.position.y = 0.06;
        scene.add(grid);

        // Add lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        scene.add(light);

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        camera.position.z = 5;
        camera.position.y = 2;

        // Animation
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            solarPanel.rotation.y += 0.005;
            grid.rotation.z += 0.003;

            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
            renderer.dispose();
        };
    }, [activeTab]);

    // GSAP animations for stats cards
    useEffect(() => {
        if (statsRef.current && activeTab === "overview") {
            const cards = statsRef.current.querySelectorAll('.stat-card');

            gsap.fromTo(cards,
                {
                    opacity: 0,
                    y: 30,
                    scale: 0.9
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "back.out(1.7)"
                }
            );
        }
    }, [activeTab, stats]);

    // Tab transition animation
    const handleTabChange = (newTab: string) => {
        // If user clicks directly on "upload" tab (not via View Details), clear any stored project
        if (newTab === 'upload') {
            // Check if this navigation is NOT from View Details button
            const shouldLoad = sessionStorage.getItem('shouldLoadProject');
            if (!shouldLoad) {
                // User clicked directly on Upload Rooftop tab - clear any stored project
                sessionStorage.removeItem('viewProjectId');
                sessionStorage.removeItem('viewProjectType');
                sessionStorage.removeItem('shouldLoadProject');
            }
            // If shouldLoadProject exists, it means View Details was clicked, so keep the data
        }

        const content = document.querySelector('.dashboard-content');
        if (content) {
            gsap.to(content, {
                opacity: 0,
                y: -20,
                duration: 0.2,
                onComplete: () => {
                    setActiveTab(newTab);
                    gsap.to(content, {
                        opacity: 1,
                        y: 0,
                        duration: 0.3
                    });
                }
            });
        } else {
            setActiveTab(newTab);
        }
        if (isMobile) setSidebarOpen(false);
    };

    // Check for mobile screen size
    useEffect(() => {
        const checkScreenSize = () => {
            const isCurrentMobile = window.innerWidth < 768;
            setIsMobile(isCurrentMobile);
            if (isCurrentMobile) {
                setSidebarOpen(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Animated background particles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
                {[...Array(20)].map((_, i) => (
                    <div suppressHydrationWarning
                        key={i}
                        className="absolute w-1 h-1 bg-orange-400 rounded-full animate-pulse"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 3}s`
                        }}
                    />
                ))}
            </div>

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full md:translate-x-0'}`}>
                {sidebarOpen && (
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                                    <Sun className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold">RayWise</h2>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="flex-shrink-0 hover:bg-accent"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {!sidebarOpen && !isMobile && (
                    <div className="flex flex-col items-center p-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center mb-2 shadow-lg shadow-orange-500/50">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="flex-shrink-0 p-2 hover:bg-orange-500/10"
                        >
                            <Menu className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <nav className="px-4 py-4 space-y-2">
                    {[
                        { id: "overview", icon: Home, label: "Dashboard" },
                        { id: "projects", icon: FolderOpen, label: "My Projects" },
                        { id: "upload", icon: Upload, label: "Upload Rooftop" },
                        { id: "recommendations", icon: BarChart3, label: "Recommendations" },
                        { id: "settings", icon: Settings, label: "Settings" },
                    ].map(({ id, icon: Icon, label }) => (
                        <Button
                            key={id}
                            variant={activeTab === id ? "default" : "ghost"}
                            className={`w-full transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}

                            onClick={() => handleTabChange(id)}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {sidebarOpen && <span className="ml-2">{label}</span>}
                        </Button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ease-in-out ${isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                <div className="flex">
                    <div className="flex-1 p-4 md:p-8 dashboard-content">

                        
                        {/* Top Bar */}
                        <div className="mb-6 md:mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                        Welcome back, {user?.firstName || "User"}! 👋
                                    </h1>
                                </div>
                                <Avatar className="w-10 h-10 md:w-12 md:h-12">
                                    <AvatarImage src={user?.imageUrl} />
                                    <AvatarFallback>
                                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            {/* Project Selector Dropdown - New Line */}
                            <div className="flex items-center gap-3 mt-3">
                                <p className="text-muted-foreground hidden md:block">
                                    Your solar energy dashboard awaits. Let&apos;s optimize your renewable future.
                                </p>

                                {(savedProjects.length > 0 || finalizedLayouts.length > 0) && (
                                    <DropdownMenu open={projectDropdownOpen} onOpenChange={setProjectDropdownOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-orange-500/30 hover:bg-orange-500/10 text-orange-300 hover:text-orange-400 whitespace-nowrap"
                                            >
                                                <FolderOpen className="w-4 h-4 mr-2" />
                                                {selectedProjectId
                                                    ? `${stats.projectName || 'Selected Project'}`
                                                    : `All Projects (${savedProjects.length + finalizedLayouts.length})`
                                                }
                                                <ChevronDown className="w-4 h-4 ml-2" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-80 max-h-96 overflow-y-auto">
                                            {/* Show All Projects Option */}
                                            <DropdownMenuItem
                                                className="flex items-center gap-2 py-3 cursor-pointer"
                                                onClick={handleClearSelection}
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-foreground">
                                                        All Projects (Combined)
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        View aggregated statistics
                                                    </div>
                                                </div>
                                                {!selectedProjectId && (
                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                                                        Active
                                                    </Badge>
                                                )}
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            {finalizedLayouts.length > 0 && (
                                                <>
                                                    <DropdownMenuLabel className="text-green-400">
                                                        Finalized Layouts ({finalizedLayouts.length})
                                                    </DropdownMenuLabel>
                                                    {finalizedLayouts.map((layout) => (
                                                        <DropdownMenuItem
                                                            key={layout._id}
                                                            className="flex items-center justify-between gap-2 py-3 cursor-pointer"
                                                            onClick={() => handleProjectSelect(layout._id, 'finalized')}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-foreground truncate">
                                                                    {layout.name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {layout.location.city}, {layout.location.country}
                                                                </div>
                                                                <div className="text-xs text-green-400 mt-1">
                                                                    {layout.systemSpecs.totalPanels} panels • {layout.systemSpecs.systemSizeKw} kW
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {selectedProjectId === layout._id && (
                                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                                                                        Active
                                                                    </Badge>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteFinalizedLayout(layout._id);
                                                                    }}
                                                                    className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                    {savedProjects.length > 0 && <DropdownMenuSeparator />}
                                                </>
                                            )}

                                            {savedProjects.length > 0 && (
                                                <>
                                                    <DropdownMenuLabel className="text-amber-400">
                                                        Saved Projects ({savedProjects.length})
                                                    </DropdownMenuLabel>
                                                    {savedProjects.map((project) => (
                                                        <DropdownMenuItem
                                                            key={project._id}
                                                            className="flex items-center justify-between gap-2 py-3 cursor-pointer"
                                                            onClick={() => handleProjectSelect(project._id, 'saved')}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-foreground truncate">
                                                                    {project.name}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {project.location.city}, {project.location.country}
                                                                </div>
                                                                <div className="text-xs text-amber-400 mt-1">
                                                                    {project.status === "analyzed" ? (
                                                                        <>
                                                                            {project.analysis?.totalPanels || 0} panels • {project.analysis?.totalPowerKw || 0} kW
                                                                        </>
                                                                    ) : (
                                                                        "Draft"
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {selectedProjectId === project._id && (
                                                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                                                                        Active
                                                                    </Badge>
                                                                )}
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteSavedProject(project._id);
                                                                    }}
                                                                    className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-400"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {/* Show selected project info */}
                            {stats.projectName && (
                                <Alert className="mt-3 bg-orange-500/10 border-orange-500/30">
                                    <AlertDescription className="text-sm text-orange-400">
                                        Viewing stats for: <strong>{stats.projectName}</strong> ({stats.projectLocation})
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="p-0 h-auto text-orange-600 hover:text-orange-500 ml-2"
                                            onClick={handleClearSelection}
                                        >
                                            View all projects
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {activeTab === "overview" && (
                            <>
                                {/* Quick Stats */}


                                <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    {/* Monthly Energy Card */}
                                    <Card className="stat-card backdrop-blur-xl border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium flex items-center">
                                                <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                                                Monthly Energy
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {stats.hasData
                                                    ? `${stats.monthlyEnergy.toLocaleString()} kWh`
                                                    : "0 kWh"
                                                }
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.hasData ? (
                                                    stats.energyGrowth > 0 ? (
                                                        <span className="text-green-400">+{stats.energyGrowth}%</span>
                                                    ) : stats.energyGrowth < 0 ? (
                                                        <span className="text-red-400">{stats.energyGrowth}%</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">No change</span>
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground">Start a project to track</span>
                                                )} {stats.hasData && " from last month"}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Monthly Savings Card */}
                                    <Card className="stat-card backdrop-blur-xl border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium flex items-center">
                                                <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                                                Monthly Savings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {stats.hasData
                                                    ? `$${stats.monthlySavings.toLocaleString()}`
                                                    : "$0"
                                                }
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.hasData ? (
                                                    stats.savingsGrowth > 0 ? (
                                                        <span className="text-green-400">+{stats.savingsGrowth}%</span>
                                                    ) : stats.savingsGrowth < 0 ? (
                                                        <span className="text-red-400">{stats.savingsGrowth}%</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">No change</span>
                                                    )
                                                ) : (
                                                    <span className="text-muted-foreground">Potential savings await</span>
                                                )} {stats.hasData && " from last month"}
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* CO₂ Avoided Card */}
                                    <Card className="stat-card backdrop-blur-xl border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium flex items-center">
                                                <Leaf className="w-4 h-4 mr-2 text-emerald-400" />
                                                CO₂ Avoided
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {stats.hasData
                                                    ? `${stats.co2Avoided.toLocaleString()} kg`
                                                    : "0 kg"
                                                }
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {stats.hasData
                                                    ? "This month"
                                                    : "Help save the planet"
                                                }
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* ROI Progress Card */}
                                    <Card className="stat-card backdrop-blur-xl border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2 text-amber-400" />
                                                ROI Progress
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {stats.hasData
                                                    ? `${stats.roiYears} years`
                                                    : "Calculate ROI"
                                                }
                                            </div>
                                            {stats.hasData && (
                                                <>
                                                    <Progress value={stats.roiProgress} className="mt-2" />
                                                    <p className="text-xs text-orange-300 mt-1">
                                                        {stats.roiProgress}% complete
                                                    </p>
                                                </>
                                            )}
                                            {!stats.hasData && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Upload a rooftop to see ROI
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Latest Project & 3D Visualization */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">


                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-foreground">
                                                {selectedProjectId ? 'Selected Project Analysis' : 'Latest Rooftop Analysis'}
                                                {(() => {
                                                    if (selectedProjectId && selectedProjectType === 'finalized') {
                                                        return (
                                                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                                                Completed
                                                            </Badge>
                                                        );
                                                    } else if (selectedProjectId && selectedProjectType === 'saved') {
                                                        const project = savedProjects.find(p => p._id === selectedProjectId);
                                                        return (
                                                            <Badge variant="secondary" className={
                                                                project?.status === 'analyzed'
                                                                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                                                                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                            }>
                                                                {project?.status === 'analyzed' ? 'Analyzed' : 'Draft'}
                                                            </Badge>
                                                        );
                                                    } else if (finalizedLayouts.length > 0) {
                                                        return (
                                                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                                                                Completed
                                                            </Badge>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </CardTitle>
                                            <CardDescription className="text-muted-foreground">
                                                {(() => {
                                                    if (selectedProjectId && selectedProjectType === 'finalized') {
                                                        const layout = finalizedLayouts.find(l => l._id === selectedProjectId);
                                                        return layout
                                                            ? `${layout.name} - ${new Date(layout.createdAt).toLocaleDateString()}`
                                                            : 'Project not found';
                                                    } else if (selectedProjectId && selectedProjectType === 'saved') {
                                                        const project = savedProjects.find(p => p._id === selectedProjectId);
                                                        return project
                                                            ? `${project.name} - ${new Date(project.createdAt).toLocaleDateString()}`
                                                            : 'Project not found';
                                                    } else if (finalizedLayouts.length > 0) {
                                                        return `${finalizedLayouts[0]?.name || 'Unnamed Project'} - ${new Date(finalizedLayouts[0]?.createdAt || Date.now()).toLocaleDateString()}`;
                                                    }
                                                    return "No projects yet";
                                                })()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="bg-muted rounded-lg p-4 aspect-video flex items-center justify-center border border-border">
                                                {(() => {
                                                    const hasAnyProject = selectedProjectId
                                                        ? true
                                                        : finalizedLayouts.length > 0 || savedProjects.some(p => p.status === 'analyzed');

                                                    if (hasAnyProject) {
                                                        return <canvas ref={canvasRef} className="w-full h-full" />;
                                                    } else {
                                                        return (
                                                            <div className="text-center">
                                                                <Home className="w-12 h-12 mx-auto mb-2 text-orange" />
                                                                <p className="text-sm text-muted-foreground">Upload a rooftop to get started</p>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>

                                            {(() => {
                                                // Show finalized layout data
                                                if (selectedProjectId && selectedProjectType === 'finalized') {
                                                    const layout = finalizedLayouts.find(l => l._id === selectedProjectId);
                                                    if (layout) {
                                                        return (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-orange-200">Total Panels</p>
                                                                        <p className="text-lg font-bold text-white">
                                                                            {layout.systemSpecs.totalPanels} panels
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-orange-200">System Size</p>
                                                                        <p className="text-lg font-bold text-green-400">
                                                                            {layout.systemSpecs.systemSizeKw} kW
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    className="w-full"
                                                                    onClick={() => {
                                                                        if (selectedProjectId && selectedProjectType) {
                                                                            handleViewProjectDetails(selectedProjectId, selectedProjectType);
                                                                        } else if (!selectedProjectId && finalizedLayouts.length > 0) {
                                                                            handleViewProjectDetails(finalizedLayouts[0]._id, 'finalized');
                                                                        }
                                                                    }}
                                                                >
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    View Full Analysis
                                                                </Button>
                                                            </>
                                                        );
                                                    }
                                                }

                                                // Show saved project data (if analyzed)
                                                if (selectedProjectId && selectedProjectType === 'saved') {
                                                    const project = savedProjects.find(p => p._id === selectedProjectId);
                                                    if (project && project.status === 'analyzed' && project.analysis) {
                                                        return (
                                                            <>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-orange-200">Total Panels</p>
                                                                        <p className="text-lg font-bold text-white">
                                                                            {project.analysis.totalPanels} panels
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-orange-200">System Size</p>
                                                                        <p className="text-lg font-bold text-green-400">
                                                                            {project.analysis.totalPowerKw} kW
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p className="text-sm font-medium text-orange-200">Annual Production</p>
                                                                        <p className="text-lg font-bold text-white">
                                                                            {project.analysis.annualProduction.toLocaleString()} kWh
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-orange-200">Layout</p>
                                                                        <p className="text-lg font-bold text-white">
                                                                            {project.analysis.layout}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Button className="w-full" onClick={() => handleTabChange("projects")}>
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    View Details
                                                                </Button>
                                                            </>
                                                        );
                                                    } else if (project && project.status === 'draft') {
                                                        return (
                                                            <div className="text-center py-4">
                                                                <p className="text-sm text-muted-foreground mb-4">
                                                                    This project hasn&apos;t been analyzed yet
                                                                </p>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleTabChange("upload")}
                                                                >
                                                                    Continue Analysis
                                                                </Button>
                                                            </div>
                                                        );
                                                    }
                                                }

                                                // Show latest finalized layout (default view)
                                                if (!selectedProjectId && finalizedLayouts.length > 0) {
                                                    return (
                                                        <>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-sm font-medium text-orange-200">Total Panels</p>
                                                                    <p className="text-lg font-bold text-white">
                                                                        {finalizedLayouts[0].systemSpecs.totalPanels} panels
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-orange-200">System Size</p>
                                                                    <p className="text-lg font-bold text-green-400">
                                                                        {finalizedLayouts[0].systemSpecs.systemSizeKw} kW
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button className="w-full" onClick={() => handleTabChange("projects")}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </Button>
                                                        </>
                                                    );
                                                }

                                                return null;
                                            })()}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-foreground">Quick Actions</CardTitle>
                                            <CardDescription className="text-muted-foreground">
                                                Get started with your solar journey
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button
                                                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 shadow-lg shadow-orange-500/50"
                                                size="lg"
                                                onClick={() => handleTabChange("upload")}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload New Rooftop
                                            </Button>
                                            <Button variant="outline" className="w-full">
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                Compare Solar Plans
                                            </Button>
                                            <Button variant="outline" className="w-full">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                Find Installers Nearby
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Interactive Charts */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-foreground">Energy Production Forecast</CardTitle>
                                            <CardDescription className="text-muted-foreground">12-month projection</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={energyData}>
                                                    <defs>
                                                        <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>

                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--popover))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '8px',
                                                            color: 'hsl(var(--popover-foreground))',
                                                            padding: '8px 12px'
                                                        }}
                                                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                    />
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="month" stroke="#94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="production"
                                                        stroke="#ea580c"
                                                        fillOpacity={1}
                                                        fill="url(#colorProduction)"
                                                        name="Production (kWh)"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="consumption"
                                                        stroke="#10b981"
                                                        fillOpacity={1}
                                                        fill="url(#colorConsumption)"
                                                        name="Consumption (kWh)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card >
                                        <CardHeader>
                                            <CardTitle className="text-foreground">Cost vs Savings Analysis</CardTitle>
                                            <CardDescription className="text-muted-foreground">Return on investment over time</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <LineChart data={roiData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="year" stroke="#94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'hsl(var(--popover))',
                                                            border: '1px solid hsl(var(--border))',
                                                            borderRadius: '8px',
                                                            color: 'hsl(var(--popover-foreground))'
                                                        }}
                                                        labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="savings"
                                                        stroke="#10b981"
                                                        strokeWidth={3}
                                                        name="Cumulative Savings ($)"
                                                        dot={{ fill: '#10b981', r: 4 }}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="netPosition"
                                                        stroke="#ea580c"
                                                        strokeWidth={3}
                                                        name="Net Position ($)"
                                                        dot={{ fill: '#ea580c', r: 4 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Project Summary */}
                                <Card >
                                    <CardHeader>
                                        <CardTitle className="text-foreground">Your Solar Journey</CardTitle>
                                        <CardDescription className="text-muted-foreground">
                                            Real-time project statistics
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="text-center p-4 rounded-lg border border-orange-500/20">
                                                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                                                <div className="text-3xl font-bold text-foreground">{savedProjects.length}</div>
                                                <div className="text-sm text-muted-foreground">Saved Projects</div>
                                            </div>
                                            <div className="text-center p-4 rounded-lg border border-green-500/20">
                                                <Home className="w-8 h-8 mx-auto mb-2 text-green-400" />
                                                <div className="text-3xl font-bold text-foreground">{finalizedLayouts.length}</div>
                                                <div className="text-sm text-muted-foreground">Finalized Layouts</div>
                                            </div>
                                            <div className="text-center p-4  rounded-lg border border-orange-500/20">
                                                <Zap className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                                                <div className="text-3xl font-bold text-foreground">{userSolutions.length}</div>
                                                <div className="text-sm text-muted-foreground">Active Solutions</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {activeTab === "projects" && (
                            <Card >
                                <CardHeader>
                                    <CardTitle className="text-foreground">My Projects</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        View and manage your rooftop analysis projects
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {savedProjects.length === 0 && finalizedLayouts.length === 0 ? (
                                        <div className="text-center py-12">
                                            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-orange-400 opacity-50" />
                                            <p className="text-sm text-muted-foreground mb-4">No projects yet. Start by uploading a rooftop image!</p>
                                            <Button
                                                onClick={() => handleTabChange("upload")}
                                                className="bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload Rooftop
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {finalizedLayouts.length > 0 && (
                                                <>
                                                    <h3 className="text-lg font-semibold text-foreground mb-3">Finalized Layouts</h3>
                                                    {finalizedLayouts.map((layout) => (
                                                        <div key={layout._id} className="p-4  rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div>
                                                                    <h4 className="font-semibold text-foreground">
                                                                        {layout.name}</h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {layout.location.city}, {layout.location.country}
                                                                    </p>
                                                                </div>
                                                                <Badge className={layout.readyForInstallation ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                                                                    {layout.readyForInstallation ? "Ready" : "In Review"}
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                                <div>
                                                                    <p className="text-orange-400">Panels</p>
                                                                    <p className="font-semibold text-foreground">{layout.systemSpecs.totalPanels}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-orange-400">System Size</p>
                                                                    <p className="font-semibold text-foreground">{layout.systemSpecs.systemSizeKw} kW</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-orange-400">Annual Production</p>
                                                                    <p className="font-semibold text-foreground">{layout.systemSpecs.estimatedAnnualProductionKwh.toLocaleString()} kWh</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-orange-400">Monthly Savings</p>
                                                                    <p className="font-semibold text-green-400">${layout.systemSpecs.estimatedMonthlySavings}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            {savedProjects.length > 0 && (
                                                <>
                                                    <h3 className="text-lg font-semibold text-white mt-6 mb-3">Draft Projects</h3>
                                                    {savedProjects.map((project) => (
                                                        <div key={project._id} className="p-4 rounded-lg border border-slate-500/20 hover:border-slate-500/40 transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <h4 className="font-semibold text-foreground">{project.name}</h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {project.location.city}, {project.location.country}
                                                                    </p>
                                                                </div>
                                                                <Badge variant="outline" className="border-slate-500/30 text-slate-400">
                                                                    {project.status === "analyzed" ? "Analyzed" : "Draft"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "upload" && (
                            <div>
                                <RoofTopAnalyzer />
                            </div>
                        )}

                        {activeTab === "recommendations" && (
                            <Card >
                                <CardHeader>
                                    <CardTitle className="text-foreground">Solar Recommendations</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        AI-generated recommendations based on your projects
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {userSolutions.length === 0 ? (
                                        <div className="text-center py-12">
                                            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-orange-400 opacity-50" />
                                            <p className="text-sm text-muted-foreground mb-4">Complete a rooftop analysis to get personalized recommendations</p>
                                            <Button
                                                onClick={() => handleTabChange("upload")}
                                                className="bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 mb-4"
                                            >
                                                Get Started
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {userSolutions.map((solution) => (
                                                <div key={solution._id} className="p-4  rounded-lg border border-orange-500/20">
                                                    <div className="mb-3">
                                                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                            {solution.status.replace(/_/g, ' ').toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    {solution.panelDetails && (
                                                        <div className="mb-3">
                                                            <h4 className="font-semibold text-foreground mb-2">Selected Panel</h4>
                                                            <p className="text-muted-foreground">{solution.panelDetails.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {solution.panelDetails.quantity} panels × {solution.panelDetails.powerRating}W
                                                            </p>
                                                            <p className="text-lg font-bold text-green-400 mt-1">
                                                                ${solution.panelDetails.totalCost.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {solution.installerDetails && (
                                                        <div>
                                                            <h4 className="font-semibold text-foreground mb-2">Selected Installer</h4>
                                                            <p className="text-muted-foreground">{solution.installerDetails.company}</p>
                                                            <p className="text-sm text-muted-foreground">{solution.installerDetails.contact}</p>
                                                            <p className="text-lg font-bold text-green-400 mt-1">
                                                                ${solution.installerDetails.estimatedCost.toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "settings" && (
                            <Card >
                                <CardHeader>
                                    <CardTitle className="text-foreground">Settings</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Manage your account and application preferences
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium mb-3 text-foreground">Account Settings</h3>
                                            <div className="space-y-3">
                                                <Button variant="outline" className="w-full justify-start border-orange-500/30 hover:bg-orange-500/10 text-orange-300 hover:text-orange-400">
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Profile Settings
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start border-orange-500/30 hover:bg-orange-500/10 text-orange-300 hover:text-orange-400">
                                                    <Bell className="w-4 h-4 mr-2" />
                                                    Notification Preferences
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium mb-3 text-foreground">Application Settings</h3>
                                            <div className="space-y-3">
                                                <Button variant="outline" className="w-full justify-start border-orange-500/30 hover:bg-orange-500/10 text-orange-300 hover:text-orange-400">
                                                    <Sun className="w-4 h-4 mr-2" />
                                                    Theme Preferences
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start border-orange-500/30 hover:bg-orange-500/10 text-orange-300 hover:text-orange-400">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    Location Settings
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Panel - Notifications & Stats */}
                    <div className={`w-80 border-l border-border p-6 bg-card/50 hidden ${sidebarOpen ? 'xl:block' : 'lg:block'}`}>
                        <div className="space-y-6">
                            {/* Real-time Stats */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center text-foreground">
                                        <TrendingUp className="w-4 h-4 mr-2 text-orange-400" />
                                        Live Stats
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Active Projects</span>
                                        <span className="font-bold text-foreground">
                                            {savedProjects.length + finalizedLayouts.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Analyzed Projects</span>
                                        <span className="font-bold text-green-400">
                                            {savedProjects.filter((p: SavedProject) => p.status === "analyzed").length +
                                                finalizedLayouts.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Draft Projects</span>
                                        <span className="font-bold text-amber-400">
                                            {savedProjects.filter((p: SavedProject) => p.status === "draft").length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Solutions Selected</span>
                                        <span className="font-bold text-foreground">
                                            {userSolutions.length}
                                        </span>
                                    </div>
                                    {stats.hasData && (
                                        <>
                                            <div className="pt-2 mt-2 border-t border-border">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Total Panels</span>
                                                    <span className="font-bold text-orange-400">
                                                        {finalizedLayouts.reduce((sum: number, layout: FinalizedLayout) =>
                                                            sum + (layout.systemSpecs?.totalPanels || 0), 0
                                                        ) +
                                                            savedProjects.reduce((sum: number, project: SavedProject) =>
                                                                sum + (project.analysis?.totalPanels || 0), 0
                                                            )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-sm text-muted-foreground">Total System Size</span>
                                                    <span className="font-bold text-green-400">
                                                        {(finalizedLayouts.reduce((sum: number, layout: FinalizedLayout) =>
                                                            sum + (layout.systemSpecs?.systemSizeKw || 0), 0
                                                        ) +
                                                            savedProjects.reduce((sum: number, project: SavedProject) =>
                                                                sum + (project.analysis?.totalPowerKw || 0), 0
                                                            )).toFixed(1)} kW
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Notifications */}
                            <Card >
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center text-foreground">
                                        <Bell className="w-4 h-4 mr-2 text-yellow-400" />
                                        Notifications
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {finalizedLayouts.length > 0 ? (
                                        <Alert className="bg-orange-500/10 border-orange-500/30">
                                            <AlertDescription className="text-sm text-orange-200">
                                                Your latest analysis is complete!
                                                <Button variant="link" className="p-0 h-auto text-orange-400 hover:text-orange-300 ml-1">
                                                    View results
                                                </Button>
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <Alert >
                                            <AlertDescription className="text-sm text-muted-foreground">
                                                No new notifications
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>

                            {/* AI Assistant */}
                            <Card >
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center text-foreground">
                                        <MessageCircle className="w-4 h-4 mr-2 text-amber-400" />
                                        AI Solar Assistant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className=" rounded-lg p-3 mb-3 border border-orange-500/20">
                                        <p className="text-sm text-muted-foreground">
                                            Hi! I&apos;m here to help with any questions about solar energy,
                                            your analysis results, or installation options.
                                        </p>
                                    </div>
                                    <Button variant="outline" className="text-sm text-muted-foreground w-full border-amber-500/30 hover:bg-amber-500/10">
                                        Start Conversation
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;