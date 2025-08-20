"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
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
    Menu,
    X,
    ChevronLeft,
} from "lucide-react";

const Dashboard = () => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    // [New Code] State to hold the selected file and ref for the file input
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // [New Code] Function to handle the button click and trigger the file input
    const handleFileUploadClick = () => {
        fileInputRef.current?.click();
    };

    // [New Code] Function to handle the file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        if (file) {
            setSelectedFile(file);
            // You can now handle the file here (e.g., upload it to a server)
            console.log("Selected file:", file.name);
        }
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
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 bg-card border-r border-border transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full md:translate-x-0'}`}>
                {/* Sidebar Header (for open state) */}
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
                                className="flex-shrink-0"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Collapsed Sidebar Header (for closed state) */}
                {!sidebarOpen && !isMobile && (
                    <div className="flex flex-col items-center p-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center mb-2">
                            <Sun className="w-5 h-5 text-white" />
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="flex-shrink-0 p-2"
                        >
                            <Menu className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                {/* Navigation */}
                <nav className="px-4 py-4 space-y-2">
                    <Button
                        variant={activeTab === "overview" ? "default" : "ghost"}
                        className={`w-full transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                        onClick={() => {
                            setActiveTab("overview");
                            if (isMobile) setSidebarOpen(false);
                        }}
                    >
                        <Home className="w-4 h-4 flex-shrink-0" />
                        {sidebarOpen && <span className="ml-2">Dashboard</span>}
                    </Button>

                    <Button
                        variant={activeTab === "projects" ? "default" : "ghost"}
                        className={`w-full transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                        onClick={() => {
                            setActiveTab("projects");
                            if (isMobile) setSidebarOpen(false);
                        }}
                    >
                        <FolderOpen className="w-4 h-4 flex-shrink-0" />
                        {sidebarOpen && <span className="ml-2">My Projects</span>}
                    </Button>

                    <Button
                        variant={activeTab === "upload" ? "default" : "ghost"}
                        className={`w-full transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                        onClick={() => {
                            setActiveTab("upload");
                            if (isMobile) setSidebarOpen(false);
                        }}
                    >
                        <Upload className="w-4 h-4 flex-shrink-0" />
                        {sidebarOpen && <span className="ml-2">Upload Rooftop</span>}
                    </Button>

                    <Button
                        variant={activeTab === "recommendations" ? "default" : "ghost"}
                        className={`w-full transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                        onClick={() => {
                            setActiveTab("recommendations");
                            if (isMobile) setSidebarOpen(false);
                        }}
                    >
                        <BarChart3 className="w-4 h-4 flex-shrink-0" />
                        {sidebarOpen && <span className="ml-2">Recommendations</span>}
                    </Button>

                    <Button
                        variant={activeTab === "settings" ? "default" : "ghost"}
                        className={`w-full transition-all duration-200 ${sidebarOpen ? 'justify-start' : 'justify-center px-2'}`}
                        onClick={() => {
                            setActiveTab("settings");
                            if (isMobile) setSidebarOpen(false);
                        }}
                    >
                        <Settings className="w-4 h-4 flex-shrink-0" />
                        {sidebarOpen && <span className="ml-2">Settings</span>}
                    </Button>
                </nav>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ease-in-out ${isMobile ? 'ml-0' : sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                <div className="flex">
                    {/* Main Dashboard Area */}
                    <div className="flex-1 p-4 md:p-8">
                        {/* Top Bar */}
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                        Welcome back, {user?.firstName || "User"}! 👋
                                    </h1>
                                    <p className="text-muted-foreground mt-1 hidden md:block">
                                        Your solar energy dashboard awaits. Let&apos;s optimize your renewable future.
                                    </p>
                                </div>
                            </div>
                            <Avatar className="w-10 h-10 md:w-12 md:h-12">
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
                                            {/* Button to trigger file upload */}
                                            <Button className="w-full" size="lg" onClick={() => setActiveTab("upload")}>
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
                                                            <span className="text-sm text-muted-foreground">Number of Panels:</span>
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
                                                        <div className="flex justify-between">
                                                            <span className="text-sm text-muted-foreground">Warranty:</span>
                                                            <span className="font-medium">{rec.warranty}</span>
                                                        </div>
                                                    </div>
                                                    <Button className="w-full">
                                                        Get Detailed Quote
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
                                        <label htmlFor="rooftop-file-upload" className="sr-only">
                                            Choose File
                                        </label>
                                        <Button
                                            onClick={handleFileUploadClick} // [New Code] Added onClick handler
                                        >
                                            Choose File
                                        </Button>

                                        <input
                                            type="file"
                                            ref={fileInputRef} // [New Code] Added ref
                                            onChange={handleFileChange} // [New Code] Added onChange handler
                                            className="hidden" // [New Code] Hidden input
                                            id="rooftop-file-upload" // This ID links the input to the label

                                        />
                                        {selectedFile && (
                                            <div className="text-sm text-muted-foreground mt-2">
                                                Selected file: {selectedFile.name}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "recommendations" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Solar Recommendations</CardTitle>
                                    <CardDescription>
                                        Customized solar solutions based on your analysis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {mockRecommendations.map((rec, index) => (
                                            <div key={index} className="border rounded-lg p-6 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">{rec.type} Panels</h3>
                                                    <Badge variant="outline">{rec.efficiency} efficiency</Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Number of Panels:</span>
                                                        <span className="font-medium">{rec.panels} panels</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Total Power Output:</span>
                                                        <span className="font-medium">{rec.power}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Estimated Cost:</span>
                                                        <span className="font-medium text-green-600">{rec.cost}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Warranty:</span>
                                                        <span className="font-medium">{rec.warranty}</span>
                                                    </div>
                                                </div>
                                                <Button className="w-full">
                                                    Get Detailed Quote
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "settings" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Settings</CardTitle>
                                    <CardDescription>
                                        Manage your account and application preferences
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium mb-3">Account Settings</h3>
                                            <div className="space-y-3">
                                                <Button variant="outline" className="w-full justify-start">
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Profile Settings
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start">
                                                    <Bell className="w-4 h-4 mr-2" />
                                                    Notification Preferences
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium mb-3">Application Settings</h3>
                                            <div className="space-y-3">
                                                <Button variant="outline" className="w-full justify-start">
                                                    <Sun className="w-4 h-4 mr-2" />
                                                    Theme Preferences
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start">
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

                    {/* Right Panel - Notifications & AI Assistant */}
                    <div className={`w-80 border-l border-border p-6 bg-card/50 hidden ${sidebarOpen ? 'xl:block' : 'lg:block'}`}>
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