// app/api/generate-predictions/route.ts
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_DASHBOARD;

interface Location {
  city: string;
  country: string;
  lat?: number;
  lon?: number;
}

interface Analysis {
  totalPanels: number;
  totalPowerKw: number;
  annualProduction: number;
}

interface SystemSpecs {
  totalPanels: number;
  systemSizeKw: number;
  estimatedAnnualProductionKwh: number;
  estimatedMonthlySavings: number;
}

interface SavedProject {
  _id: string;
  name: string;
  location: Location;
  status: string;
  createdAt: number;
  analysis?: Analysis;
}

interface FinalizedLayout {
  _id: string;
  name: string;
  location: Location;
  createdAt: number;
  systemSpecs: SystemSpecs;
}

interface TargetProject {
  name: string;
  totalPanels: number;
  systemSizeKw: number;
  annualProduction: number;
  monthlySavings: number;
  createdAt: number;
}

interface PredictionRequest {
  projectId?: string;
  projectType?: 'saved' | 'finalized';
  savedProjects: SavedProject[];
  finalizedLayouts: FinalizedLayout[];
}

interface EnergyDataPoint {
  month: string;
  production: number;
  consumption: number;
  savings: number;
}

interface ROIDataPoint {
  year: string;
  cost: number;
  savings: number;
  netPosition: number;
}

interface AIResponse {
  energyData: EnergyDataPoint[];
  roiData: ROIDataPoint[];
}

export async function POST(request: Request) {
  try {
    const { projectId, projectType, savedProjects, finalizedLayouts }: PredictionRequest = await request.json();

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_DASHBOARD API key not configured');
    }

    // Collect target projects
    const targetProjects: TargetProject[] = [];
    let location: Location = { city: 'Unknown', country: 'Unknown', lat: 0, lon: 0 };

    if (projectId && projectType) {
      // Single project
      if (projectType === 'finalized') {
        const project = finalizedLayouts.find(l => l._id === projectId);
        if (project) {
          targetProjects.push({
            name: project.name,
            totalPanels: project.systemSpecs.totalPanels,
            systemSizeKw: project.systemSpecs.systemSizeKw,
            annualProduction: project.systemSpecs.estimatedAnnualProductionKwh,
            monthlySavings: project.systemSpecs.estimatedMonthlySavings,
            createdAt: project.createdAt
          });
          location = project.location;
        }
      } else {
        const project = savedProjects.find(p => p._id === projectId);
        if (project?.analysis) {
          targetProjects.push({
            name: project.name,
            totalPanels: project.analysis.totalPanels,
            systemSizeKw: project.analysis.totalPowerKw,
            annualProduction: project.analysis.annualProduction,
            monthlySavings: (project.analysis.annualProduction / 12) * 0.12,
            createdAt: project.createdAt
          });
          location = project.location;
        }
      }
    } else {
      // Combined analysis
      finalizedLayouts.forEach(layout => {
        targetProjects.push({
          name: layout.name,
          totalPanels: layout.systemSpecs.totalPanels,
          systemSizeKw: layout.systemSpecs.systemSizeKw,
          annualProduction: layout.systemSpecs.estimatedAnnualProductionKwh,
          monthlySavings: layout.systemSpecs.estimatedMonthlySavings,
          createdAt: layout.createdAt
        });
      });

      savedProjects.forEach(project => {
        if (project.status === 'analyzed' && project.analysis) {
          targetProjects.push({
            name: project.name,
            totalPanels: project.analysis.totalPanels,
            systemSizeKw: project.analysis.totalPowerKw,
            annualProduction: project.analysis.annualProduction,
            monthlySavings: (project.analysis.annualProduction / 12) * 0.12,
            createdAt: project.createdAt
          });
        }
      });

      location = finalizedLayouts[0]?.location || savedProjects[0]?.location || location;
    }

    if (targetProjects.length === 0) {
      return NextResponse.json({ error: 'No projects found' }, { status: 400 });
    }

    // Aggregate metrics
    const totalSystemSize = targetProjects.reduce((sum, p) => sum + p.systemSizeKw, 0);
    const totalAnnualProduction = targetProjects.reduce((sum, p) => sum + p.annualProduction, 0);
    const totalMonthlySavings = targetProjects.reduce((sum, p) => sum + p.monthlySavings, 0);
    const avgCostPerKw = 3000;
    const totalSystemCost = totalSystemSize * avgCostPerKw;
    const oldestProject = Math.min(...targetProjects.map(p => p.createdAt));
    const monthsSinceInstall = Math.floor((Date.now() - oldestProject) / (1000 * 60 * 60 * 24 * 30));

    const prompt = `You are a solar energy analyst. Generate realistic 12-month energy production forecasts and 8-year ROI projections based on REAL solar physics and location data.

**System Details:**
Location: ${location.city}, ${location.country} (Lat: ${location.lat || 'N/A'})
Total System Size: ${totalSystemSize.toFixed(2)} kW
Estimated Annual Production: ${totalAnnualProduction.toLocaleString()} kWh/year
Monthly Savings: $${totalMonthlySavings.toFixed(2)}
System Cost: $${totalSystemCost.toLocaleString()}
Months Since Install: ${monthsSinceInstall}

**Critical Requirements:**
1. Account for seasonal solar irradiance in ${location.city}
2. Peak production in summer months (May-Aug in Northern Hemisphere, Nov-Feb in Southern)
3. Lower production in winter (realistic 40-60% drop)
4. Consumption should be relatively stable year-round (slight increase in summer for cooling)
5. ROI should account for: energy inflation (4%/year), system degradation (0.5%/year), maintenance (1% of cost/year)

Return ONLY this JSON structure (no markdown, no explanations):
{
  "energyData": [
    {
      "month": "Jan",
      "production": <kWh integer>,
      "consumption": <kWh integer, stable around 800-900>,
      "savings": <$ integer based on (production-consumption)*0.12>
    }
  ],
  "roiData": [
    {
      "year": "Year 1",
      "cost": ${totalSystemCost},
      "savings": <cumulative $ saved>,
      "netPosition": <cost - savings, should be negative initially>
    }
  ]
}

**Energy Data Rules:**
- 12 months total (Jan-Dec)
- Production varies by season (realistic bell curve)
- Total annual production ~= ${totalAnnualProduction} kWh
- Consumption stable 800-1000 kWh/month
- Savings = (production - consumption if positive) * $0.12/kWh

**ROI Data Rules:**
- 8 years total
- Cost stays constant at ${totalSystemCost}
- Savings cumulate yearly accounting for 4% energy inflation
- netPosition = cost - cumulative savings
- Should break even around year 6-8

Return ONLY the JSON. Make it REALISTIC for ${location.city}.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Parse JSON
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const result: AIResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);

    return NextResponse.json({
      success: true,
      energyData: result.energyData || [],
      roiData: result.roiData || [],
      metadata: {
        location: `${location.city}, ${location.country}`,
        systemSize: totalSystemSize,
        projectCount: targetProjects.length
      }
    });

  } catch (error) {
    console.error('Prediction generation failed:', error);
    
    // Fallback: Generate basic predictions
    const body: PredictionRequest = await request.json();
    const { savedProjects, finalizedLayouts } = body;
    
    const totalProduction = finalizedLayouts.reduce((sum: number, l: FinalizedLayout) => 
      sum + (l.systemSpecs?.estimatedAnnualProductionKwh || 0), 0) +
      savedProjects.reduce((sum: number, p: SavedProject) => 
        sum + (p.analysis?.annualProduction || 0), 0);

    const monthlyBase = totalProduction / 12;
    const location: Location = finalizedLayouts[0]?.location || savedProjects[0]?.location || { city: 'Unknown', country: 'Unknown' };
    
    // Seasonal multipliers (Northern Hemisphere)
    const seasonalFactors = [0.7, 0.75, 0.85, 0.95, 1.1, 1.15, 1.2, 1.15, 1.0, 0.9, 0.75, 0.65];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const energyData: EnergyDataPoint[] = months.map((month, i) => ({
      month,
      production: Math.round(monthlyBase * seasonalFactors[i]),
      consumption: 800 + Math.floor(Math.random() * 100),
      savings: Math.round((monthlyBase * seasonalFactors[i] - 850) * 0.12)
    }));

    const systemCost = 20000;
    const annualSavings = energyData.reduce((sum, m) => sum + m.savings, 0);
    
    const roiData: ROIDataPoint[] = Array.from({ length: 8 }, (_, i) => {
      const year = i + 1;
      const cumulativeSavings = annualSavings * year * Math.pow(1.04, year - 1);
      return {
        year: `Year ${year}`,
        cost: systemCost,
        savings: Math.round(cumulativeSavings),
        netPosition: Math.round(systemCost - cumulativeSavings)
      };
    });

    return NextResponse.json({
      success: true,
      energyData,
      roiData,
      metadata: {
        location: `${location.city}, ${location.country}`,
        systemSize: 0,
        projectCount: savedProjects.length + finalizedLayouts.length,
        fallback: true
      }
    });
  }
}