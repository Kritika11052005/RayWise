"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import ProjectDetailModal from '../components/ProjectDetailModal';
import { Alert, AlertDescription } from "../components/ui/alert";
import RecommendationsGenerator from '../components/RecommendationsGenerator';
import { calculateAIROI, extractProjectMetrics } from '../../lib/Calculator';
import ProjectCard from "../components/ProjectCard";
import SolarRecommendations from "../components/SolarRecommendations"
import AISolarAssistant from '../components/AISolarAssistant';
import NotificationPanel from '../components/NotificationPanel';
import {
    Upload,
    Zap,
    DollarSign,
    Leaf,
    TrendingUp,
    Sun,
    Home,
    X,
    BarChart3,
    Settings,
    FolderOpen,
    MapPin,
    Eye,
    Bell,
    MessageCircle,
    ChevronLeft,
    Menu,
    Loader2,
    Check
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
type GeneratedRecommendations = {
    panels: Array<{
        name: string;
        type: 'monocrystalline' | 'polycrystalline' | 'thin-film';
        manufacturer: string;
        efficiency: number;
        powerRating: number;
        warranty: number;
        pricePerPanel: { min: number; max: number; currency: string };
        totalCost: number;
        description: string;
        pros: string[];
        cons: string[];
        bestFor: string[];
        reasoning: string;
    }>;
    localInstallers: Array<{
        name: string;
        company: string;
        email: string;
        phone: string;
        website?: string;
        isLocal: boolean;
        serviceArea: string;
        rating: number;
        yearsInBusiness: number;
        projectsCompleted: number;
        certifications: string[];
        services: string[];
        budgetRange: { min: number; max: number; currency: string };
        description: string;
        specializations: string[];
        estimatedCost: number;
        reasoning: string;
    }>;
    globalInstallers: Array<{
        name: string;
        company: string;
        email: string;
        phone: string;
        website?: string;
        isLocal: boolean;
        serviceArea: string;
        rating: number;
        yearsInBusiness: number;
        projectsCompleted: number;
        certifications: string[];
        services: string[];
        budgetRange: { min: number; max: number; currency: string };
        description: string;
        specializations: string[];
        estimatedCost: number;
        reasoning: string;
    }>;
    budgetAnalysis: {
        isRealistic: boolean;
        notes: string;
        recommendations: string;
    };
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
type EnergyDataPoint = {
    month: string;
    production: number;
    consumption: number;
    savings: number;
};

type ROIDataPoint = {
    year: string;
    cost: number;
    savings: number;
    netPosition: number;
};

type PredictionsData = {
    energyData: EnergyDataPoint[];
    roiData: ROIDataPoint[];
    metadata: {
        location: string;
        systemSize: number;
        projectCount: number;
        fallback?: boolean;
    };
} | null;
type PanelLayoutItem = {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
};
type Installer = {
    id: string;
    companyName: string;
    contact: {
        phone: string;
        email: string;
        address: string;
        website?: string;
    };
    rating: number;
    reviewsCount: number;
    yearsInBusiness: number;
    specialties: string[];
    certifications: string[];
    estimatedCost: {
        min: number;
        max: number;
    };
    installationTime: string;
    description: string;
    availability: string;
    warrantyYears: number;
    financingAvailable: boolean;
};

type InstallersResponse = {
    success: boolean;
    installers: Installer[];
    locationInfo: {
        city: string;
        country: string;
        averageCostPerWatt: number;
        typicalInstallationTime: string;
        localIncentives: string[];
    };
} | null;
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
    savedProjectId?: string;
    name: string;
    description?: string;
    location: {
        city: string;
        country: string;
        lat?: number;
        lon?: number;
    };
    imageUrl?: string;
    renderedLayoutImage?: string;
    imageStorageId?: string;
    polygonPoints: PolygonPoint[];
    imageWidth: number;
    imageHeight: number;
    analysis: {
        totalPanels: number;
        totalPowerKw: number;
        orientation: number | string;
        layout: string;
        annualProduction: number;
        recommendations: string;
        sunAnalysis?: string;
        shadowAnalysis?: string;
    };
    panelLayout: PanelLayoutItem[];
    systemSpecs: {
        totalPanels: number;
        systemSizeKw: number;
        estimatedAnnualProductionKwh: number;
        estimatedMonthlySavings: number;
        co2OffsetKgPerYear: number;
    };
    readyForInstallation: boolean;
    expertReviewed: boolean;  // ADD THIS LINE
    expertNotes?: string;      // ADD THIS LINE
    finalizedAt: number;
    createdAt: number;
    updatedAt: number;
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
type SolarPlan = {
    name: string;
    tier: string;
    systemSize: number;
    estimatedCost: number;
    annualProduction: number;
    roiYears: number;
    recommendation: string;
    highlights: string[];
};

type SolarPlansResponse = {
    success: boolean;
    plans: SolarPlan[];
    comparison: {
        recommendation: string;
    };
} | null;
const Dashboard = () => {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [aiRoiData, setAiRoiData] = useState<{
        roiYears: number;
        roiProgress: number;
        monthlyPayback: number;
        insights: string[];
    } | null>(null);
    const [roiLoading, setRoiLoading] = useState(false);
    // Fetch real data from Convex
    const savedProjects = useQuery(api.savedProject.getUserProjects) ?? [];
    const finalizedLayouts = useQuery(api.finalizedLayouts.getUserFinalizedLayouts) ?? [];
    const userSolutions = useQuery(api.recommendations.getUserSolutions) ?? [];
    const savedRecommendations = useQuery(api.savedRecommendations.getUserRecommendations, {}) ?? [];
    console.log('🔍 Saved Recommendations:', savedRecommendations);
    console.log('🔍 Recommendations length:', savedRecommendations.length);
    const updateLayoutStatus = useMutation(api.finalizedLayouts.updateFinalizedLayout);
    const currentUser = useQuery(api.users.getCurrentUser);
    const debugInfo = useQuery(api.savedProject.debugUser);
    console.log('🔍 Dashboard Debug:', {
        savedProjects: savedProjects.length,
        finalizedLayouts: finalizedLayouts.length,
        hasProjects: savedProjects.length > 0 || finalizedLayouts.length > 0
    });
    const [updatingLayoutStatus, setUpdatingLayoutStatus] = useState<string | null>(null);
    const [showRecommendationsGenerator, setShowRecommendationsGenerator] = useState<boolean>(false);
    const [generatedRecommendations, setGeneratedRecommendations] = useState<GeneratedRecommendations | null>(null);
    const [generatingForProjectId, setGeneratingForProjectId] = useState<string | null>(null);
    // Add these state variables with your other useState declarations (around line 200)
    const [predictions, setPredictions] = useState<PredictionsData>(null);
    const [loadingPredictions, setLoadingPredictions] = useState(false);
    // Add these state variables with your other useState declarations (around line 195)
    const [findingInstallers, setFindingInstallers] = useState(false);
    const [installers, setInstallers] = useState<InstallersResponse>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [selectedProjectType, setSelectedProjectType] = useState<'saved' | 'finalized' | null>(null);
    // Three.js scene ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const deleteProject = useMutation(api.savedProject.deleteProject);
    const deleteFinalizedLayout = useMutation(api.finalizedLayouts.deleteFinalizedLayout);
    const [comparingPlans, setComparingPlans] = useState(false);
    const [solarPlans, setSolarPlans] = useState<SolarPlansResponse>(null);
    // Add this state for the dropdown
    const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
    const [selectedProjectForModal, setSelectedProjectForModal] = useState<SavedProject | FinalizedLayout | null>(null);
    const [modalProjectType, setModalProjectType] = useState<'saved' | 'finalized' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
    const fetchPredictions = async () => {
        if (savedProjects.length === 0 && finalizedLayouts.length === 0) {
            setPredictions(null);
            return;
        }

        setLoadingPredictions(true);
        try {
            const response = await fetch('/api/generate-predictions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProjectId || undefined,
                    projectType: selectedProjectType || undefined,
                    savedProjects,
                    finalizedLayouts
                })
            });

            const data = await response.json();

            if (data.success) {
                setPredictions(data);
            } else {
                console.error('Failed to fetch predictions:', data.error);
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
        } finally {
            setLoadingPredictions(false);
        }
    };
    const getStatusInfo = (layout: FinalizedLayout) => {
        if (layout.expertReviewed) {
            return {
                label: 'Reviewed',
                className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                icon: Check
            };
        } else if (layout.readyForInstallation) {
            return {
                label: 'Ready',
                className: 'bg-green-500/20 text-green-400 border-green-500/30',
                icon: Check
            };
        } else {
            return {
                label: 'In Review',
                className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                icon: null
            };
        }
    };
    const handleLayoutStatusChange = async (
        layoutId: string,
        newStatus: 'in_review' | 'ready' | 'reviewed'
    ) => {
        setUpdatingLayoutStatus(layoutId);
        try {
            const updates: {
                readyForInstallation?: boolean;
                expertReviewed?: boolean;
            } = {};

            switch (newStatus) {
                case 'in_review':
                    updates.readyForInstallation = false;
                    updates.expertReviewed = false;
                    break;
                case 'ready':
                    updates.readyForInstallation = true;
                    updates.expertReviewed = false;
                    break;
                case 'reviewed':
                    updates.readyForInstallation = true;
                    updates.expertReviewed = true;
                    break;
            }

            await updateLayoutStatus({
                layoutId: layoutId as Id<"finalizedLayouts">,
                ...updates
            });

            // Optional: Show success message
            console.log('Status updated successfully');
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status. Please try again.');
        } finally {
            setUpdatingLayoutStatus(null);
        }
    };
    // Update the handleViewProjectDetails function
    const handleViewProjectDetails = (projectId: string, projectType: 'saved' | 'finalized') => {
        // Find the project
        let project = null;
        if (projectType === 'finalized') {
            project = finalizedLayouts.find(l => l._id === projectId);
        } else {
            project = savedProjects.find(p => p._id === projectId);
        }

        if (project) {
            setSelectedProjectForModal(project);
            setModalProjectType(projectType);
            setIsModalOpen(true);
        }
    };

    // Add this function
    const handleComparePlans = async () => {
        if (savedProjects.length === 0 && finalizedLayouts.length === 0) {
            alert('Please create at least one project first!');
            return;
        }

        setComparingPlans(true);
        setSolarPlans(null);

        try {
            const response = await fetch('/api/compare-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    savedProjects,
                    finalizedLayouts,
                    userLocation: finalizedLayouts[0]?.location || savedProjects[0]?.location
                })
            });

            const data = await response.json();

            if (data.success) {
                setSolarPlans(data);
            } else {
                alert('Failed to compare plans: ' + data.error);
            }
        } catch (error) {
            console.error('Error comparing plans:', error);
            alert('Failed to fetch plan comparisons');
        } finally {
            setComparingPlans(false);
        }
    };
    const handleGenerateRecommendations = (projectId: string, projectType: 'saved' | 'finalized') => {
        setGeneratingForProjectId(projectId);
        setSelectedProjectId(projectId);
        setSelectedProjectType(projectType);
        setShowRecommendationsGenerator(true);
    };

    const handleRecommendationsGenerated = (recommendations: GeneratedRecommendations) => {
        setGeneratedRecommendations(recommendations);
        setShowRecommendationsGenerator(false);
    };
    // Add this function after handleComparePlans (around line 270)
    const handleFindInstallers = async () => {
        // Get user's location from projects
        const userLocation = finalizedLayouts[0]?.location || savedProjects[0]?.location;

        if (!userLocation) {
            alert('Please create a project first to determine your location!');
            return;
        }

        setFindingInstallers(true);
        setInstallers(null);
        // Clear solar plans when finding installers
        setSolarPlans(null);

        try {
            // Calculate system size for better recommendations
            const totalSystemSize = finalizedLayouts.reduce((sum, l) => sum + (l.systemSpecs?.systemSizeKw || 0), 0) +
                savedProjects.reduce((sum, p) => sum + (p.analysis?.totalPowerKw || 0), 0);

            const response = await fetch('/api/find-installers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location: userLocation,
                    systemSize: totalSystemSize || undefined,
                    budget: undefined // You can add budget input later
                })
            });

            const data = await response.json();

            if (data.success) {
                setInstallers(data);
            } else {
                alert('Failed to find installers: ' + data.error);
            }
        } catch (error) {
            console.error('Error finding installers:', error);
            alert('Failed to fetch installers');
        } finally {
            setFindingInstallers(false);
        }
    };
    const calculateStats = () => {
        const selectedProject = getSelectedProject();

        // Use AI ROI data if available, otherwise use defaults
        const roiYears = aiRoiData?.roiYears || 7.2;
        const roiProgress = aiRoiData?.roiProgress || 0;

        // If a specific project is selected, show only its stats
        if (selectedProject && selectedProjectType === 'finalized') {
            const layout = selectedProject as FinalizedLayout;
            return {
                monthlyEnergy: Math.round(layout.systemSpecs.estimatedAnnualProductionKwh / 12),
                monthlySavings: layout.systemSpecs.estimatedMonthlySavings,
                co2Avoided: Math.round(layout.systemSpecs.co2OffsetKgPerYear / 12),
                roiYears: roiYears,
                roiProgress: roiProgress,
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
                    roiYears: roiYears,
                    roiProgress: roiProgress,
                    energyGrowth: 0,
                    savingsGrowth: 0,
                    hasData: true,
                    projectName: project.name,
                    projectLocation: `${project.location.city}, ${project.location.country}`,
                };
            }
        }

        // Otherwise show aggregated stats
        let totalAnnualEnergy = 0;
        let totalMonthlySavings = 0;
        let totalAnnualCO2 = 0;

        finalizedLayouts.forEach((layout: FinalizedLayout) => {
            if (layout.systemSpecs) {
                totalAnnualEnergy += layout.systemSpecs.estimatedAnnualProductionKwh;
                totalMonthlySavings += layout.systemSpecs.estimatedMonthlySavings;
                totalAnnualCO2 += layout.systemSpecs.co2OffsetKgPerYear;
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
                }
            }
        });

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
            roiYears: roiYears,
            roiProgress: roiProgress,
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



    // Update aiRoiData when calculateROIData changes





    // Tab transition animation
    // Mock data for charts (you can replace with real time-series data)
    const energyData = predictions?.energyData || [
        { month: "Jan", production: 0, consumption: 0, savings: 0 },
        { month: "Feb", production: 0, consumption: 0, savings: 0 },
        { month: "Mar", production: 0, consumption: 0, savings: 0 },
        { month: "Apr", production: 0, consumption: 0, savings: 0 },
        { month: "May", production: 0, consumption: 0, savings: 0 },
        { month: "Jun", production: 0, consumption: 0, savings: 0 },
        { month: "Jul", production: 0, consumption: 0, savings: 0 },
        { month: "Aug", production: 0, consumption: 0, savings: 0 },
        { month: "Sep", production: 0, consumption: 0, savings: 0 },
        { month: "Oct", production: 0, consumption: 0, savings: 0 },
        { month: "Nov", production: 0, consumption: 0, savings: 0 },
        { month: "Dec", production: 0, consumption: 0, savings: 0 },
    ];

    const roiData = predictions?.roiData || [
        { year: "Year 1", cost: 0, savings: 0, netPosition: 0 },
        { year: "Year 2", cost: 0, savings: 0, netPosition: 0 },
        { year: "Year 3", cost: 0, savings: 0, netPosition: 0 },
        { year: "Year 4", cost: 0, savings: 0, netPosition: 0 },
        { year: "Year 5", cost: 0, savings: 0, netPosition: 0 },
        { year: "Year 6", cost: 0, savings: 0, netPosition: 0 },
        { year: "Year 7", cost: 0, savings: 0, netPosition: 0 },
        { year: "Year 8", cost: 0, savings: 0, netPosition: 0 },
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
    useEffect(() => {
        console.log('🔍 Debug User Info:', debugInfo);
    }, [debugInfo]);
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
    // Calculate AI-powered ROI when data changes



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

    // AI-powered ROI calculation - runs AFTER component is mounted
    useEffect(() => {
        const calculateROI = async () => {
            if (savedProjects.length === 0 && finalizedLayouts.length === 0) {
                setAiRoiData(null);
                return;
            }

            setRoiLoading(true);
            try {
                const selectedProject = selectedProjectId && selectedProjectType
                    ? (selectedProjectType === 'finalized'
                        ? finalizedLayouts.find(l => l._id === selectedProjectId)
                        : savedProjects.find(p => p._id === selectedProjectId))
                    : null;

                const metrics = extractProjectMetrics(
                    selectedProject ?? null,
                    selectedProjectType,
                    finalizedLayouts,
                    savedProjects,
                    userSolutions
                );

                const roiResult = await calculateAIROI(metrics);
                setAiRoiData(roiResult);
            } catch (error) {
                console.error('ROI calculation error:', error);
                setAiRoiData({
                    roiYears: 7.2,
                    roiProgress: 0,
                    monthlyPayback: 0,
                    insights: []
                });
            } finally {
                setRoiLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            calculateROI();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [
        savedProjects.length,
        finalizedLayouts.length,
        userSolutions.length,
        selectedProjectId,
        selectedProjectType
    ]);
    // Add useEffect to fetch predictions when data changes (around line 730, after ROI useEffect)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchPredictions();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [
        savedProjects.length,
        finalizedLayouts.length,
        selectedProjectId,
        selectedProjectType
    ]);
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
                            {/* Project Selector Dropdown - New Line */}
                            <div className="flex items-center gap-3 mt-3">
                                <p className="text-muted-foreground hidden md:block">
                                    Your solar energy dashboard awaits. Let&apos;s optimize your renewable future.
                                </p>

                                {/* Show loading state while data is being fetched */}
                                {(savedProjects === undefined || finalizedLayouts === undefined) ? (
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-orange-500/30 bg-orange-500/10">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
                                        <span className="text-sm text-orange-400">Loading projects...</span>
                                    </div>
                                ) : (savedProjects.length > 0 || finalizedLayouts.length > 0) && (
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
                                            {/* Rest of your dropdown content stays the same */}
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

                                            {/* Keep all your existing dropdown content here */}
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
                                                    {aiRoiData?.monthlyPayback && (
                                                        <p className="text-xs text-amber-200 mt-1">
                                                            ${aiRoiData.monthlyPayback}/mo toward payback
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            {!stats.hasData && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Upload a rooftop to see ROI
                                                </p>
                                            )}
                                            {roiLoading && (
                                                <p className="text-xs text-blue-400 mt-2 animate-pulse">
                                                    Calculating with AI...
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
                                                            {/*<Button className="w-full" onClick={() => handleTabChange("projects")}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </Button>*/}
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
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handleComparePlans}
                                                disabled={comparingPlans || (savedProjects.length === 0 && finalizedLayouts.length === 0)}
                                            >
                                                {comparingPlans ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Analyzing Plans...
                                                    </>
                                                ) : (
                                                    <>
                                                        <BarChart3 className="w-4 h-4 mr-2" />
                                                        Compare Solar Plans
                                                    </>
                                                )}
                                            </Button>

                                            {/* Display Plans Below */}
                                            {solarPlans && (
                                                <div className="mt-4 space-y-3">
                                                    <h4 className="font-semibold text-sm">AI-Generated Plan Comparison</h4>

                                                    {solarPlans.plans.map((plan: SolarPlan, idx: number) => (
                                                        <div key={idx} className="p-3 bg-secondary/50 rounded-lg border border-border">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-semibold text-sm">{plan.name}</h5>
                                                                <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-400 rounded">
                                                                    {plan.tier}
                                                                </span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                                <div>
                                                                    <p className="text-muted-foreground">System Size</p>
                                                                    <p className="font-medium">{plan.systemSize} kW</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted-foreground">Est. Cost</p>
                                                                    <p className="font-medium text-green-400">${plan.estimatedCost.toLocaleString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted-foreground">Annual Production</p>
                                                                    <p className="font-medium">{plan.annualProduction.toLocaleString()} kWh</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-muted-foreground">ROI</p>
                                                                    <p className="font-medium">{plan.roiYears} years</p>
                                                                </div>
                                                            </div>

                                                            <p className="text-xs text-muted-foreground mb-2">{plan.recommendation}</p>

                                                            <div className="flex flex-wrap gap-1">
                                                                {plan.highlights.slice(0, 2).map((h: string, i: number) => (
                                                                    <span key={i} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                                                                        {h}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {solarPlans.comparison && (
                                                        <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                                            <p className="text-xs font-semibold text-orange-400 mb-1">💡 Our Recommendation:</p>
                                                            <p className="text-xs text-orange-300">{solarPlans.comparison.recommendation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={handleFindInstallers}
                                                disabled={findingInstallers || (savedProjects.length === 0 && finalizedLayouts.length === 0)}
                                            >
                                                {findingInstallers ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Finding Installers...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        Find Installers Nearby
                                                    </>
                                                )}
                                            </Button>

                                            {/* Display Installers Below - Add this after the button */}
                                            {installers && (
                                                <div className="mt-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-sm">Installers in {installers.locationInfo.city}</h4>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setInstallers(null)}
                                                            className="h-8 text-xs"
                                                        >
                                                            Clear
                                                        </Button>
                                                    </div>

                                                    {/* Location Info Summary */}
                                                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                        <p className="text-xs font-semibold text-blue-400 mb-1">📍 Local Market Info:</p>
                                                        <div className="text-xs text-blue-300 space-y-1">
                                                            <p>Avg. Cost: ${installers.locationInfo.averageCostPerWatt}/watt</p>
                                                            <p>Typical Install: {installers.locationInfo.typicalInstallationTime}</p>
                                                            {installers.locationInfo.localIncentives.length > 0 && (
                                                                <p className="font-medium text-green-400">
                                                                    💰 Incentives: {installers.locationInfo.localIncentives.join(', ')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Installers List */}
                                                    <div className="max-h-96 overflow-y-auto space-y-3">
                                                        {installers.installers.map((installer) => (
                                                            <div key={installer.id} className="p-3 bg-secondary/50 rounded-lg border border-border hover:border-orange-500/50 transition-all">
                                                                <div className="flex items-start justify-between mb-2">
                                                                    <div className="flex-1">
                                                                        <h5 className="font-semibold text-sm">{installer.companyName}</h5>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <div className="flex items-center">
                                                                                {[...Array(5)].map((_, i) => (
                                                                                    <span key={i} className={i < installer.rating ? "text-yellow-400" : "text-gray-600"}>
                                                                                        ★
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                ({installer.reviewsCount} reviews)
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <span className={`text-xs px-2 py-1 rounded ${installer.availability === 'immediate'
                                                                        ? 'bg-green-500/20 text-green-400'
                                                                        : installer.availability.includes('weeks')
                                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                                            : 'bg-orange-500/20 text-orange-400'
                                                                        }`}>
                                                                        {installer.availability}
                                                                    </span>
                                                                </div>

                                                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                                                    {installer.description}
                                                                </p>

                                                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                                    <div>
                                                                        <p className="text-muted-foreground">Experience</p>
                                                                        <p className="font-medium">{installer.yearsInBusiness} years</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-muted-foreground">Est. Cost</p>
                                                                        <p className="font-medium text-green-400">
                                                                            ${installer.estimatedCost.min.toLocaleString()} - ${installer.estimatedCost.max.toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-muted-foreground">Install Time</p>
                                                                        <p className="font-medium">{installer.installationTime}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-muted-foreground">Warranty</p>
                                                                        <p className="font-medium">{installer.warrantyYears} years</p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap gap-1 mb-2">
                                                                    {installer.specialties.slice(0, 2).map((spec, i) => (
                                                                        <span key={i} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                                                            {spec}
                                                                        </span>
                                                                    ))}
                                                                    {installer.financingAvailable && (
                                                                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                                                                            💳 Financing
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Contact Info - Collapsible */}
                                                                <details className="text-xs">
                                                                    <summary className="cursor-pointer text-orange-400 hover:text-orange-300 font-medium">
                                                                        View Contact Info
                                                                    </summary>
                                                                    <div className="mt-2 p-2 bg-background/50 rounded space-y-1">
                                                                        <p><span className="text-muted-foreground">Phone:</span> {installer.contact.phone}</p>
                                                                        <p><span className="text-muted-foreground">Email:</span> {installer.contact.email}</p>
                                                                        <p><span className="text-muted-foreground">Address:</span> {installer.contact.address}</p>
                                                                        {installer.contact.website && (
                                                                            <p><span className="text-muted-foreground">Website:</span> {installer.contact.website}</p>
                                                                        )}
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {installer.certifications.map((cert, i) => (
                                                                                <span key={i} className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                                                                                    ✓ {cert}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </details>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
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
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-foreground">Energy Production Forecast</CardTitle>
                                                    <CardDescription className="text-muted-foreground">
                                                        {predictions?.metadata.fallback
                                                            ? "Estimated projection"
                                                            : predictions
                                                                ? `AI prediction for ${predictions.metadata.location}`
                                                                : "12-month projection"
                                                        }
                                                    </CardDescription>
                                                </div>
                                                {loadingPredictions && (
                                                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                                                )}
                                            </div>
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
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-foreground">Cost vs Savings Analysis</CardTitle>
                                                <CardDescription className="text-muted-foreground">
                                                    {predictions?.metadata.fallback
                                                        ? "Estimated projection"
                                                        : predictions
                                                            ? `ROI prediction (${predictions.metadata.projectCount} project${predictions.metadata.projectCount > 1 ? 's' : ''})`
                                                            : "Return on investment over time"
                                                    }
                                                </CardDescription>
                                            </div>
                                            {loadingPredictions && (
                                                <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                                            )}
                                        </div>
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
                                                <div className="text-3xl font-bold text-foreground">{finalizedLayouts.length + savedProjects.length}</div>
                                                <div className="text-sm text-muted-foreground">Total Solutions</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}

                        {activeTab === "projects" && (
                            <Card>
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
                                            <p className="text-sm text-muted-foreground mb-4">
                                                No projects yet. Start by uploading a rooftop image!
                                            </p>
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
                                            {/* Finalized Layouts section */}
                                            {finalizedLayouts.length > 0 && (
                                                <>
                                                    <h3 className="text-lg font-semibold text-foreground mb-3">
                                                        Finalized Layouts
                                                    </h3>
                                                    {finalizedLayouts.map((layout) => {
                                                        const statusInfo = getStatusInfo(layout);
                                                        return (
                                                            <div
                                                                key={layout._id}
                                                                className="p-4 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all"
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div>
                                                                        <h4 className="font-semibold text-foreground">
                                                                            {layout.name}
                                                                        </h4>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {layout.location.city}, {layout.location.country}
                                                                        </p>
                                                                    </div>

                                                                    {/* Status Dropdown */}
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className={`${statusInfo.className} h-8 px-3 hover:opacity-80 cursor-pointer`}
                                                                                disabled={updatingLayoutStatus === layout._id}
                                                                            >
                                                                                {updatingLayoutStatus === layout._id ? (
                                                                                    <>
                                                                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                                                        Updating...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        {statusInfo.icon && (
                                                                                            <statusInfo.icon className="w-3 h-3 mr-1" />
                                                                                        )}
                                                                                        {statusInfo.label}
                                                                                        <ChevronDown className="w-3 h-3 ml-1" />
                                                                                    </>
                                                                                )}
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                                            <DropdownMenuSeparator />

                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleLayoutStatusChange(layout._id, "in_review")
                                                                                }
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2" />
                                                                                    <div>
                                                                                        <p className="font-medium">In Review</p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Pending review
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleLayoutStatusChange(layout._id, "ready")
                                                                                }
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                                                                                    <div>
                                                                                        <p className="font-medium">Ready</p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Ready for installation
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </DropdownMenuItem>

                                                                            <DropdownMenuItem
                                                                                onClick={() =>
                                                                                    handleLayoutStatusChange(layout._id, "reviewed")
                                                                                }
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center">
                                                                                    <div className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                                                                                    <div>
                                                                                        <p className="font-medium">Reviewed</p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Expert reviewed & approved
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>

                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                                                                    <div>
                                                                        <p className="text-orange-400">Panels</p>
                                                                        <p className="font-semibold text-foreground">
                                                                            {layout.systemSpecs.totalPanels}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-orange-400">System Size</p>
                                                                        <p className="font-semibold text-foreground">
                                                                            {layout.systemSpecs.systemSizeKw} kW
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-orange-400">Annual Production</p>
                                                                        <p className="font-semibold text-foreground">
                                                                            {layout.systemSpecs.estimatedAnnualProductionKwh.toLocaleString()}{" "}
                                                                            kWh
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-orange-400">Monthly Savings</p>
                                                                        <p className="font-semibold text-green-400">
                                                                            ${layout.systemSpecs.estimatedMonthlySavings}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* View Details Button */}
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full"
                                                                    onClick={() => handleViewProjectDetails(layout._id, 'finalized')}
                                                                >
                                                                    <Eye className="w-4 h-4 mr-2" />
                                                                    View Full Details
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            )}

                                            {/* Saved Projects - with ProjectCard component */}
                                            {savedProjects.length > 0 && (
                                                <>
                                                    <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                                                        Draft Projects
                                                    </h3>
                                                    {savedProjects.map((project) => (
                                                        <div key={project._id} className="space-y-3">
                                                            <ProjectCard
                                                                project={project}
                                                                onDelete={handleDeleteSavedProject}
                                                            />
                                                            {/* Add View Details Button for Draft Projects too */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => handleViewProjectDetails(project._id, 'saved')}
                                                            >
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Project Details
                                                            </Button>
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
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-foreground">Solar Recommendations</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        {selectedProjectId
                                            ? `AI-generated recommendations for ${selectedProjectType === 'finalized'
                                                ? finalizedLayouts.find(l => l._id === selectedProjectId)?.name
                                                : savedProjects.find(p => p._id === selectedProjectId)?.name
                                            }`
                                            : "AI-generated recommendations based on all your projects"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const filteredRecommendations = selectedProjectId
                                            ? savedRecommendations.filter(rec => {
                                                if (selectedProjectType === 'finalized') {
                                                    return rec.finalizedLayoutId === selectedProjectId;
                                                } else {
                                                    return rec.savedProjectId === selectedProjectId;
                                                }
                                            })
                                            : savedRecommendations;

                                        const panelRecommendations = filteredRecommendations.filter(r => r.recommendationType === 'panel');
                                        const installerRecommendations = filteredRecommendations.filter(r => r.recommendationType === 'installer');
                                        const hasProjects = savedProjects.length > 0 || finalizedLayouts.length > 0;

                                        // If no projects exist
                                        if (!hasProjects) {
                                            return (
                                                <div className="text-center py-12">
                                                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-orange-400 opacity-50" />
                                                    <p className="text-sm text-muted-foreground mb-4">
                                                        Complete a rooftop analysis to get personalized recommendations
                                                    </p>
                                                    <Button
                                                        onClick={() => handleTabChange("upload")}
                                                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                                                    >
                                                        Get Started
                                                    </Button>
                                                </div>
                                            );
                                        }

                                        // If project selected but no recommendations
                                        // If project selected but no recommendations - SHOW GENERATE BUTTON
                                        if (selectedProjectId && filteredRecommendations.length === 0) {
                                            return (
                                                <div className="text-center py-12">
                                                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-orange-400 opacity-50" />
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        No recommendations for this project yet.
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mb-4">
                                                        Generate AI-powered recommendations for solar panels and installers based on your project requirements.
                                                    </p>
                                                    <Button
                                                        onClick={() => {
                                                            if (selectedProjectId && selectedProjectType) {
                                                                handleGenerateRecommendations(selectedProjectId, selectedProjectType);
                                                            }
                                                        }}
                                                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                                                    >
                                                        <Zap className="w-4 h-4 mr-2" />
                                                        Generate Recommendations
                                                    </Button>
                                                </div>
                                            );
                                        }

                                        // If no recommendations at all
                                        if (filteredRecommendations.length === 0) {
                                            return (
                                                <div className="text-center py-12">
                                                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-orange-400 opacity-50" />
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        No recommendations saved yet.
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mb-4">
                                                        Select a project from the dropdown above to generate AI-powered recommendations.
                                                    </p>
                                                    <Button
                                                        onClick={() => handleTabChange("projects")}
                                                        className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                                                    >
                                                        View My Projects
                                                    </Button>
                                                </div>
                                            );
                                        }

                                        // Display recommendations
                                        return (
                                            <div className="space-y-6">
                                                {selectedProjectId && (
                                                    <Alert className="bg-blue-500/10 border-blue-500/30">
                                                        <AlertDescription className="text-sm text-blue-400">
                                                            Showing recommendations for: <strong>
                                                                {selectedProjectType === 'finalized'
                                                                    ? finalizedLayouts.find(l => l._id === selectedProjectId)?.name
                                                                    : savedProjects.find(p => p._id === selectedProjectId)?.name}
                                                            </strong>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="p-0 h-auto text-blue-600 hover:text-blue-500 ml-2"
                                                                onClick={handleClearSelection}
                                                            >
                                                                View all recommendations
                                                            </Button>
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                {/* Panel Recommendations */}
                                                {panelRecommendations.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                                                            <Sun className="w-5 h-5 mr-2 text-orange-400" />
                                                            Solar Panel Recommendations ({panelRecommendations.length})
                                                        </h3>

                                                        {panelRecommendations.map((rec) => {
                                                            const panel = rec.panelData!;
                                                            const projectName = rec.finalizedLayoutId
                                                                ? finalizedLayouts.find(l => l._id === rec.finalizedLayoutId)?.name
                                                                : rec.savedProjectId
                                                                    ? savedProjects.find(p => p._id === rec.savedProjectId)?.name
                                                                    : "Unknown Project";

                                                            const projectType = rec.finalizedLayoutId ? 'finalized' : 'saved';

                                                            return (
                                                                <div key={rec._id} className="p-4 rounded-lg border border-orange-500/20 hover:border-orange-500/40 transition-all">
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <h4 className="font-semibold text-lg text-foreground">{panel.name}</h4>
                                                                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                                                    {panel.efficiency}% Efficient
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-sm text-muted-foreground">{panel.manufacturer} • {panel.type}</p>

                                                                            {/* Project Badge - Only show when viewing all projects */}
                                                                            {!selectedProjectId && (
                                                                                <div className="flex items-center gap-2 mt-2">
                                                                                    <FolderOpen className="w-3 h-3 text-blue-400" />
                                                                                    <Badge
                                                                                        className={`text-xs cursor-pointer ${projectType === 'finalized'
                                                                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                                                            }`}
                                                                                        onClick={() => {
                                                                                            const projectId = rec.finalizedLayoutId || rec.savedProjectId;
                                                                                            if (projectId) {
                                                                                                handleProjectSelect(projectId, projectType);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {projectName}
                                                                                    </Badge>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-sm text-muted-foreground mb-3">{panel.description}</p>

                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Power Rating</p>
                                                                            <p className="font-semibold text-foreground">{panel.powerRating}W</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Warranty</p>
                                                                            <p className="font-semibold text-foreground">{panel.warranty} years</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Price Range</p>
                                                                            <p className="font-semibold text-green-400">
                                                                                ${panel.pricePerPanel.min}-${panel.pricePerPanel.max}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Total Cost</p>
                                                                            <p className="font-semibold text-green-400">
                                                                                ${panel.totalCost.toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                        <div className="p-2 bg-green-500/10 rounded">
                                                                            <p className="text-xs font-semibold text-green-400 mb-1">Pros:</p>
                                                                            <ul className="text-xs text-green-300 space-y-0.5">
                                                                                {panel.pros.map((pro, i) => (
                                                                                    <li key={i}>• {pro}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                        <div className="p-2 bg-red-500/10 rounded">
                                                                            <p className="text-xs font-semibold text-red-400 mb-1">Cons:</p>
                                                                            <ul className="text-xs text-red-300 space-y-0.5">
                                                                                {panel.cons.map((con, i) => (
                                                                                    <li key={i}>• {con}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>

                                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                                        <p className="text-xs font-semibold text-foreground mb-1">Why Recommended:</p>
                                                                        <p className="text-xs text-muted-foreground">{panel.reasoning}</p>
                                                                    </div>

                                                                    {rec.userNotes && (
                                                                        <div className="mt-2 p-2 bg-blue-500/10 rounded">
                                                                            <p className="text-xs font-semibold text-blue-400">Your Notes:</p>
                                                                            <p className="text-xs text-blue-300">{rec.userNotes}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Installer Recommendations */}
                                                {installerRecommendations.length > 0 && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-lg font-semibold text-foreground flex items-center">
                                                            <Home className="w-5 h-5 mr-2 text-blue-400" />
                                                            Installer Recommendations ({installerRecommendations.length})
                                                        </h3>

                                                        {installerRecommendations.map((rec) => {
                                                            const installer = rec.installerData!;
                                                            const projectName = rec.finalizedLayoutId
                                                                ? finalizedLayouts.find(l => l._id === rec.finalizedLayoutId)?.name
                                                                : rec.savedProjectId
                                                                    ? savedProjects.find(p => p._id === rec.savedProjectId)?.name
                                                                    : "Unknown Project";

                                                            const projectType = rec.finalizedLayoutId ? 'finalized' : 'saved';

                                                            return (
                                                                <div key={rec._id} className="p-4 rounded-lg border border-blue-500/20 hover:border-blue-500/40 transition-all">
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <h4 className="font-semibold text-lg text-foreground">{installer.company}</h4>
                                                                                {installer.isLocal && (
                                                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                                                                        Local
                                                                                    </Badge>
                                                                                )}
                                                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                                                                    {installer.rating} ★
                                                                                </Badge>
                                                                            </div>
                                                                            <p className="text-sm text-muted-foreground">Contact: {installer.name}</p>

                                                                            {/* Project Badge - Only show when viewing all projects */}
                                                                            {!selectedProjectId && (
                                                                                <div className="flex items-center gap-2 mt-2">
                                                                                    <FolderOpen className="w-3 h-3 text-blue-400" />
                                                                                    <Badge
                                                                                        className={`text-xs cursor-pointer ${projectType === 'finalized'
                                                                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                                                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                                                            }`}
                                                                                        onClick={() => {
                                                                                            const projectId = rec.finalizedLayoutId || rec.savedProjectId;
                                                                                            if (projectId) {
                                                                                                handleProjectSelect(projectId, projectType);
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        {projectName}
                                                                                    </Badge>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <p className="text-sm text-muted-foreground mb-3">{installer.description}</p>

                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Experience</p>
                                                                            <p className="font-semibold text-foreground">{installer.yearsInBusiness} years</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Projects</p>
                                                                            <p className="font-semibold text-foreground">{installer.projectsCompleted.toLocaleString()}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Budget Range</p>
                                                                            <p className="font-semibold text-green-400">
                                                                                ${installer.budgetRange.min.toLocaleString()}-${installer.budgetRange.max.toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Est. Cost</p>
                                                                            <p className="font-semibold text-green-400">
                                                                                ${installer.estimatedCost.toLocaleString()}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mb-3">
                                                                        <p className="text-xs font-semibold text-foreground mb-1">Contact:</p>
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                                                            <p className="text-muted-foreground">📧 {installer.email}</p>
                                                                            <p className="text-muted-foreground">📞 {installer.phone}</p>
                                                                            {installer.website && (
                                                                                <p className="text-muted-foreground">🌐 {installer.website}</p>
                                                                            )}
                                                                            <p className="text-muted-foreground">📍 {installer.serviceArea}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                                        {installer.certifications.map((cert, i) => (
                                                                            <Badge key={i} variant="outline" className="text-xs">
                                                                                {cert}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>

                                                                    <div className="p-3 bg-muted/50 rounded-lg">
                                                                        <p className="text-xs font-semibold text-foreground mb-1">Why Recommended:</p>
                                                                        <p className="text-xs text-muted-foreground">{installer.reasoning}</p>
                                                                    </div>

                                                                    {rec.userNotes && (
                                                                        <div className="mt-2 p-2 bg-blue-500/10 rounded">
                                                                            <p className="text-xs font-semibold text-blue-400">Your Notes:</p>
                                                                            <p className="text-xs text-blue-300">{rec.userNotes}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
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
                                            {savedProjects.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Solutions Selected</span>
                                        <span className="font-bold text-foreground">
                                            {finalizedLayouts.length}
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
                            <NotificationPanel />

                            {/* AI Assistant */}
                            <AISolarAssistant
                                userContext={{
                                    hasProjects: savedProjects.length > 0 || finalizedLayouts.length > 0,
                                    projectCount: savedProjects.length + finalizedLayouts.length,
                                    totalSystemSize: finalizedLayouts.reduce((sum, l) => sum + (l.systemSpecs?.systemSizeKw || 0), 0) +
                                        savedProjects.reduce((sum, p) => sum + (p.analysis?.totalPowerKw || 0), 0),
                                    location: finalizedLayouts[0]?.location
                                        ? `${finalizedLayouts[0].location.city}, ${finalizedLayouts[0].location.country}`
                                        : savedProjects[0]?.location
                                            ? `${savedProjects[0].location.city}, ${savedProjects[0].location.country}`
                                            : undefined
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Project Detail Modal */}
            {isModalOpen && selectedProjectForModal && modalProjectType && (
                <ProjectDetailModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedProjectForModal(null);
                        setModalProjectType(null);
                    }}
                    project={selectedProjectForModal}
                    projectType={modalProjectType}
                />
            )}
            {/* Recommendations Generator Modal */}
            {showRecommendationsGenerator && selectedProjectId && selectedProjectType && (
                <RecommendationsGenerator
                    isOpen={showRecommendationsGenerator}
                    onClose={() => {
                        setShowRecommendationsGenerator(false);
                        setGeneratingForProjectId(null);
                    }}
                    project={
                        selectedProjectType === 'finalized'
                            ? finalizedLayouts.find(l => l._id === selectedProjectId)!
                            : savedProjects.find(p => p._id === selectedProjectId)!
                    }
                    projectType={selectedProjectType}
                    onRecommendationsGenerated={handleRecommendationsGenerated}
                />
            )}

            {/* Display Generated Recommendations (if any) */}
            {generatedRecommendations && selectedProjectId && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-slate-900 rounded-2xl max-w-6xl w-full border border-orange-500/30 shadow-2xl my-8">
                        <div className="relative bg-gradient-to-r from-orange-500 to-yellow-500 p-6 rounded-t-2xl">
                            <button
                                aria-label="just a label"
                                onClick={() => setGeneratedRecommendations(null)}
                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <h2 className="text-2xl font-bold text-white">Generated Recommendations</h2>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <SolarRecommendations
                                finalizedLayoutId={selectedProjectType === 'finalized' ? selectedProjectId as Id<'finalizedLayouts'> : null}
                                savedProjectId={selectedProjectType === 'saved' ? selectedProjectId as Id<'savedProjects'> : null}
                                location={
                                    selectedProjectType === 'finalized'
                                        ? finalizedLayouts.find(l => l._id === selectedProjectId)!.location
                                        : savedProjects.find(p => p._id === selectedProjectId)!.location
                                }
                                systemSpecs={
                                    selectedProjectType === 'finalized'
                                        ? finalizedLayouts.find(l => l._id === selectedProjectId)!.systemSpecs
                                        : {
                                            totalPanels: savedProjects.find(p => p._id === selectedProjectId)!.analysis?.totalPanels || 0,
                                            systemSizeKw: savedProjects.find(p => p._id === selectedProjectId)!.analysis?.totalPowerKw || 0,
                                            estimatedAnnualProductionKwh: savedProjects.find(p => p._id === selectedProjectId)!.analysis?.annualProduction || 0,
                                        }
                                }
                                analysis={
                                    selectedProjectType === 'finalized'
                                        ? finalizedLayouts.find(l => l._id === selectedProjectId)!.analysis
                                        : savedProjects.find(p => p._id === selectedProjectId)!.analysis
                                }
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;