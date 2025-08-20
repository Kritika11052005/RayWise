"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import  { Card, CardContent, CardDescription, CardHeader, CardTitle }  from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
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
  Plus,
  MoreHorizontal,
  MapPin,
  Calendar,
  Download,
  Trash2,
  Eye,
  Bell,
  MessageCircle,
  ChevronRight,
} from "lucide-react";

const Dashboard = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - replace with real data from your API
  const mockProjects = [
    {
      id: 1,
      name: "Main Residence",
      uploadDate: "2024-08-15",
      rooftopArea: "120 sq m",
      energyPotential: "1,250 kWh/month",
      status: "Analyzed",
      savings: "$180/month"
    },
    {
      id: 2,
      name: "Office Building",
      uploadDate: "2024-08-10",
      rooftopArea: "300 sq m",
      energyPotential: "3,100 kWh/month",
      status: "In Progress",
      savings: "$465/month"
    },
  ];

  const mockRecommendations = [
    {
      type: "Monocrystalline",
      panels: 24,
      power: "9.6 kW",
      cost: "$18,000 - $22,000",
      efficiency: "22%",
      warranty: "25 years"
    },
    {
      type: "Polycrystalline",
      panels: 28,
      power: "8.4 kW",
      cost: "$14,000 - $18,000",
      efficiency: "18%",
      warranty: "20 years"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
        <div className="p-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Sun className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">SolarVision</h2>
          </div>
        </div>
        
        <nav className="px-4 space-y-2">
          <Button
            variant={activeTab === "overview" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("overview")}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === "projects" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("projects")}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            My Projects
          </Button>
          <Button
            variant={activeTab === "upload" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Rooftop
          </Button>
          <Button
            variant={activeTab === "recommendations" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("recommendations")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Recommendations
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <div className="flex">
          {/* Main Dashboard Area */}
          <div className="flex-1 p-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {user?.firstName || "User"}! 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                  Your solar energy dashboard awaits. Let&apos;s optimize your renewable future.
                </p>
              </div>
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            {activeTab === "overview" && (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                        Monthly Energy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">1,250 kWh</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-500">+12%</span> from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                        Monthly Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">$180</div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-green-500">+8%</span> from last month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Leaf className="w-4 h-4 mr-2 text-green-600" />
                        CO₂ Avoided
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">890 kg</div>
                      <p className="text-xs text-muted-foreground">
                        This month
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                        ROI Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">7.2 years</div>
                      <Progress value={23} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        23% complete
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Latest Project & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Latest Rooftop Analysis
                        <Badge variant="secondary">Completed</Badge>
                      </CardTitle>
                      <CardDescription>
                        Main Residence - Analyzed on Aug 15, 2024
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted rounded-lg p-4 aspect-video flex items-center justify-center">
                        <div className="text-center">
                          <Home className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Rooftop visualization</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Usable Area</p>
                          <p className="text-lg font-bold">120 sq m</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Energy Potential</p>
                          <p className="text-lg font-bold text-green-600">1,250 kWh/month</p>
                        </div>
                      </div>
                      <Button className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>
                        Get started with your solar journey
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full" size="lg">
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

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Energy Production Forecast</CardTitle>
                      <CardDescription>12-month projection</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Interactive chart placeholder</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Cost vs Savings Analysis</CardTitle>
                      <CardDescription>Return on investment over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <TrendingUp className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">ROI chart placeholder</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations Carousel */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recommended Solar Solutions</CardTitle>
                    <CardDescription>
                      Based on your rooftop analysis and energy needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mockRecommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{rec.type} Panels</h4>
                            <Badge variant="outline">{rec.efficiency} efficiency</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Panels:</span>
                              <span className="text-sm font-medium">{rec.panels} panels</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Power:</span>
                              <span className="text-sm font-medium">{rec.power}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Est. Cost:</span>
                              <span className="text-sm font-medium text-green-600">{rec.cost}</span>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full">
                            Get Quote
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === "projects" && (
              <Card>
                <CardHeader>
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>
                    View and manage your rooftop analysis projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Rooftop Area</TableHead>
                        <TableHead>Energy Potential</TableHead>
                        <TableHead>Est. Savings</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {project.uploadDate}
                            </div>
                          </TableCell>
                          <TableCell>{project.rooftopArea}</TableCell>
                          <TableCell>{project.energyPotential}</TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {project.savings}
                          </TableCell>
                          <TableCell>
                            <Badge variant={project.status === "Analyzed" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Report
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === "upload" && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Rooftop Image</CardTitle>
                  <CardDescription>
                    Upload an image of your rooftop for AI-powered solar analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground rounded-lg p-12 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Upload Rooftop Image</h3>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your image here, or click to browse
                    </p>
                    <Button>
                      Choose File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Notifications & AI Assistant */}
          <div className="w-80 border-l border-border p-6 bg-card/50">
            <div className="space-y-6">
              {/* Notifications */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert>
                    <AlertDescription className="text-sm">
                      Your Main Residence analysis is complete! 
                      <Button variant="link" className="p-0 h-auto">
                        View results
                      </Button>
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription className="text-sm">
                      New solar incentives available in your area.
                      <Button variant="link" className="p-0 h-auto">
                        Learn more
                      </Button>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* AI Assistant */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    AI Solar Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-3 mb-3">
                    <p className="text-sm">
                      Hi! I&apos;m here to help with any questions about solar energy, 
                      your analysis results, or installation options.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
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