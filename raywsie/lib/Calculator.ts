// lib/roiCalculator.ts
// Utility functions for AI-powered ROI calculation

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_DASHBOARD;

interface ProjectMetrics {
  totalSystemCost: number;
  annualSavings: number;
  totalAnnualEnergy: number;
  totalMonthlySavings: number;
  monthsElapsed: number;
  location: { city: string; country: string };
  projectCount: number;
}

interface ROICalculation {
  roiYears: number;
  roiProgress: number;
  monthlyPayback: number;
  insights: string[];
}

// Define proper types for projects
interface SystemSpecs {
  estimatedAnnualProductionKwh: number;
  estimatedMonthlySavings: number;
}

interface Location {
  city: string;
  country: string;
}

interface Analysis {
  annualProduction: number;
  totalPowerKw: number;
  totalPanels: number;
}

interface FinalizedLayout {
  _id: string;
  systemSpecs: SystemSpecs;
  createdAt: number;
  location: Location;
  savedProjectId?: string;
}

interface SavedProject {
  _id: string;
  status: string;
  analysis?: Analysis;
  createdAt: number;
  location: Location;
}

interface SolutionDetails {
  totalCost?: number;
  estimatedCost?: number;
}

interface UserSolution {
  finalizedLayoutId?: string;
  savedProjectId?: string;
  totalProjectCost?: number;
  panelDetails?: SolutionDetails;
  installerDetails?: SolutionDetails;
}

/**
 * Calculate ROI using Gemini AI via API route
 */
export async function calculateAIROI(
    metrics: ProjectMetrics
  ): Promise<ROICalculation> {
    // Fallback if no data
    if (metrics.totalSystemCost === 0 || metrics.annualSavings === 0) {
      return {
        roiYears: 7.2,
        roiProgress: 0,
        monthlyPayback: 0,
        insights: ['Upload a project to see personalized ROI calculations']
      };
    }
  
    try {
      const response = await fetch('/api/calculate-roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
  
      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }
  
      const result = await response.json();
      return result;
  
    } catch (error) {
      console.error('AI ROI calculation failed:', error);
      
      // Fallback calculation
      const roiYears = metrics.totalSystemCost / metrics.annualSavings;
      const totalMonthsForROI = roiYears * 12;
      const roiProgress = totalMonthsForROI > 0
        ? Math.min(Math.round((metrics.monthsElapsed / totalMonthsForROI) * 100), 100)
        : 0;
  
      return {
        roiYears: Math.round(roiYears * 10) / 10,
        roiProgress,
        monthlyPayback: Math.round(metrics.totalMonthlySavings),
        insights: [
          `Your system will pay for itself in approximately ${Math.round(roiYears)} years`,
          `You're currently ${roiProgress}% through your payback period`,
          `Monthly savings of $${Math.round(metrics.totalMonthlySavings)} accelerating your ROI`
        ]
      };
    }
  }
/**
 * Extract metrics from project data
 */
export function extractProjectMetrics(
  selectedProject: FinalizedLayout | SavedProject | null,
  selectedProjectType: 'saved' | 'finalized' | null,
  finalizedLayouts: FinalizedLayout[],
  savedProjects: SavedProject[],
  userSolutions: UserSolution[]
): ProjectMetrics {
  let totalSystemCost = 0;
  let totalAnnualEnergy = 0;
  let totalMonthlySavings = 0;
  let oldestProjectDate = Date.now();
  let location: Location = { city: 'Delhi', country: 'India' };
  let projectCount = 0;

  // Single project selected
  if (selectedProject && selectedProjectType === 'finalized') {
    const layout = selectedProject as FinalizedLayout;
    totalAnnualEnergy = layout.systemSpecs.estimatedAnnualProductionKwh;
    totalMonthlySavings = layout.systemSpecs.estimatedMonthlySavings;
    oldestProjectDate = layout.createdAt;
    location = layout.location;
    projectCount = 1;
    
    // Find cost for this project
    const solution = userSolutions.find(s => s.finalizedLayoutId === layout._id);
    if (solution?.totalProjectCost) {
      totalSystemCost = solution.totalProjectCost;
    } else if (solution) {
      totalSystemCost = (solution.panelDetails?.totalCost || 0) + 
                       (solution.installerDetails?.estimatedCost || 0);
    }
    
  } else if (selectedProject && selectedProjectType === 'saved') {
    const project = selectedProject as SavedProject;
    if (project.status === 'analyzed' && project.analysis) {
      totalAnnualEnergy = project.analysis.annualProduction;
      totalMonthlySavings = (project.analysis.annualProduction / 12) * 0.12;
      oldestProjectDate = project.createdAt;
      location = project.location;
      projectCount = 1;
      
      const solution = userSolutions.find(s => s.savedProjectId === project._id);
      if (solution?.totalProjectCost) {
        totalSystemCost = solution.totalProjectCost;
      } else if (solution) {
        totalSystemCost = (solution.panelDetails?.totalCost || 0) + 
                         (solution.installerDetails?.estimatedCost || 0);
      }
    }
    
  } else {
    // Aggregated stats
    finalizedLayouts.forEach((layout) => {
      totalAnnualEnergy += layout.systemSpecs.estimatedAnnualProductionKwh;
      totalMonthlySavings += layout.systemSpecs.estimatedMonthlySavings;
      if (layout.createdAt < oldestProjectDate) {
        oldestProjectDate = layout.createdAt;
      }
      projectCount++;
    });

    savedProjects.forEach((project) => {
      if (project.status === "analyzed" && project.analysis) {
        const isFinalized = finalizedLayouts.some(l => l.savedProjectId === project._id);
        if (!isFinalized) {
          totalAnnualEnergy += project.analysis.annualProduction;
          totalMonthlySavings += (project.analysis.annualProduction / 12) * 0.12;
          if (project.createdAt < oldestProjectDate) {
            oldestProjectDate = project.createdAt;
          }
          projectCount++;
        }
      }
    });

    userSolutions.forEach((solution) => {
      if (solution.totalProjectCost) {
        totalSystemCost += solution.totalProjectCost;
      } else {
        totalSystemCost += (solution.panelDetails?.totalCost || 0) + 
                          (solution.installerDetails?.estimatedCost || 0);
      }
    });

    if (finalizedLayouts.length > 0) {
      location = finalizedLayouts[0].location;
    } else if (savedProjects.length > 0) {
      location = savedProjects[0].location;
    }
  }

  // Default system cost if none found
  if (totalSystemCost === 0 && projectCount > 0) {
    totalSystemCost = 20000;
  }

  const annualSavings = totalMonthlySavings * 12;
  const monthsElapsed = projectCount > 0
    ? Math.floor((Date.now() - oldestProjectDate) / (1000 * 60 * 60 * 24 * 30))
    : 0;

  return {
    totalSystemCost,
    annualSavings,
    totalAnnualEnergy,
    totalMonthlySavings,
    monthsElapsed,
    location,
    projectCount
  };
}