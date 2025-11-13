// app/api/compare-plans/route.ts
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_DASHBOARD;

interface ComparisonRequest {
  savedProjects: Array<{
    name: string;
    status: string;
    analysis?: {
      totalPanels: number;
      totalPowerKw: number;
      annualProduction: number;
      layout: string;
    };
  }>;
  finalizedLayouts: Array<{
    name: string;
    systemSpecs: {
      totalPanels: number;
      systemSizeKw: number;
      estimatedAnnualProductionKwh: number;
      estimatedMonthlySavings: number;
    };
  }>;
  userLocation?: { city: string; country: string };
}

export async function POST(request: Request) {
  try {
    const { savedProjects, finalizedLayouts, userLocation }: ComparisonRequest = await request.json();

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_DASHBOARD API key not configured');
    }

    // Calculate aggregate data
    const totalProjects = savedProjects.length + finalizedLayouts.length;
    const totalPanels = finalizedLayouts.reduce((sum, l) => sum + (l.systemSpecs?.totalPanels || 0), 0) +
                        savedProjects.reduce((sum, p) => sum + (p.analysis?.totalPanels || 0), 0);
    const totalSystemSize = finalizedLayouts.reduce((sum, l) => sum + (l.systemSpecs?.systemSizeKw || 0), 0) +
                           savedProjects.reduce((sum, p) => sum + (p.analysis?.totalPowerKw || 0), 0);
    const totalAnnualProduction = finalizedLayouts.reduce((sum, l) => sum + (l.systemSpecs?.estimatedAnnualProductionKwh || 0), 0) +
                                 savedProjects.reduce((sum, p) => sum + (p.analysis?.annualProduction || 0), 0);

    const prompt = `You are a solar energy consultant. Analyze and compare solar installation plans:

**User's Current Projects:**
- Total Projects: ${totalProjects}
- Total Panels: ${totalPanels}
- Total System Size: ${totalSystemSize} kW
- Annual Production: ${totalAnnualProduction} kWh
- Location: ${userLocation?.city || 'Unknown'}, ${userLocation?.country || 'Unknown'}

**Finalized Layouts (${finalizedLayouts.length}):**
${finalizedLayouts.map((l, i) => `
${i + 1}. ${l.name}
   - ${l.systemSpecs.totalPanels} panels, ${l.systemSpecs.systemSizeKw} kW
   - ${l.systemSpecs.estimatedAnnualProductionKwh} kWh/year
   - $${l.systemSpecs.estimatedMonthlySavings}/month savings
`).join('')}

**Saved Projects (${savedProjects.length}):**
${savedProjects.filter(p => p.status === 'analyzed').map((p, i) => `
${i + 1}. ${p.name}
   - ${p.analysis?.totalPanels} panels, ${p.analysis?.totalPowerKw} kW
   - ${p.analysis?.annualProduction} kWh/year
   - Layout: ${p.analysis?.layout}
`).join('')}

Generate a comparison with 3 plan options:

**Plan A: Budget-Friendly**
- Lower upfront cost
- Good ROI for small homes
- Moderate efficiency panels

**Plan B: Balanced Performance** 
- Mid-range cost
- Best value for money
- High-efficiency panels

**Plan C: Premium Maximum Output**
- Higher investment
- Fastest payback
- Top-tier technology

Return ONLY a JSON object:
{
  "plans": [
    {
      "name": "Budget-Friendly Solar",
      "tier": "budget",
      "systemSize": <kW>,
      "panelCount": <number>,
      "estimatedCost": <USD>,
      "annualProduction": <kWh>,
      "monthlySavings": <USD>,
      "roiYears": <years>,
      "efficiency": <percentage>,
      "highlights": ["<benefit 1>", "<benefit 2>", "<benefit 3>"],
      "bestFor": ["<use case 1>", "<use case 2>"],
      "recommendation": "<why this plan>"
    }
  ],
  "comparison": {
    "summary": "<overall comparison insight>",
    "costDifference": "<cost analysis across plans>",
    "performanceDifference": "<output/efficiency analysis>",
    "recommendation": "<which plan is best and why>"
  }
}

Consider ${userLocation?.city || 'the user\'s'} climate, energy costs, and typical residential needs. Return ONLY valid JSON, no markdown.`;

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
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Parse JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);

    return NextResponse.json({
      success: true,
      plans: result.plans,
      comparison: result.comparison
    });

  } catch (error) {
    console.error('Plan comparison failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare plans'
    }, { status: 500 });
  }
}