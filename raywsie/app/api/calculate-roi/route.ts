// app/api/calculate-roi/route.ts
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_DASHBOARD;

interface ProjectMetrics {
  totalSystemCost: number;
  annualSavings: number;
  totalAnnualEnergy: number;
  totalMonthlySavings: number;
  monthsElapsed: number;
  location: { city: string; country: string };
  projectCount: number;
}

export async function POST(request: Request) {
  try {
    const metrics: ProjectMetrics = await request.json();

    // Fallback if no data
    if (metrics.totalSystemCost === 0 || metrics.annualSavings === 0) {
      return NextResponse.json({
        roiYears: 7.2,
        roiProgress: 0,
        monthlyPayback: 0,
        insights: ['Upload a project to see personalized ROI calculations']
      });
    }

    const prompt = `You are a solar energy financial analyst. Calculate ROI for this solar installation:

System Cost: $${metrics.totalSystemCost}
Annual Savings: $${metrics.annualSavings}
Annual Energy: ${metrics.totalAnnualEnergy} kWh
Location: ${metrics.location.city}, ${metrics.location.country}
Projects: ${metrics.projectCount}
Months Elapsed: ${metrics.monthsElapsed}

Return ONLY a JSON object with:
{
  "roiYears": <years to break even as decimal>,
  "insights": [
    "<specific insight about payback period>",
    "<insight about current progress>",
    "<insight about value/recommendation>"
  ]
}

Consider:
- Energy price inflation (3-5% annually)
- System degradation (0.5% annually)  
- Maintenance (1% of cost annually)
- ${metrics.location.country} incentives
- Typical rates in ${metrics.location.city}

Return ONLY the JSON, no markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Parse response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
    
    // Calculate progress
    const totalMonthsForROI = result.roiYears * 12;
    const roiProgress = totalMonthsForROI > 0 
      ? Math.min(Math.round((metrics.monthsElapsed / totalMonthsForROI) * 100), 100)
      : 0;

    return NextResponse.json({
      roiYears: result.roiYears,
      roiProgress,
      monthlyPayback: Math.round(metrics.totalMonthlySavings),
      insights: result.insights || []
    });

  } catch (error) {
    console.error('AI ROI calculation failed:', error);
    
    // Fallback calculation
    const metrics: ProjectMetrics = await request.json();
    const roiYears = metrics.totalSystemCost / metrics.annualSavings;
    const totalMonthsForROI = roiYears * 12;
    const roiProgress = totalMonthsForROI > 0
      ? Math.min(Math.round((metrics.monthsElapsed / totalMonthsForROI) * 100), 100)
      : 0;

    return NextResponse.json({
      roiYears: Math.round(roiYears * 10) / 10,
      roiProgress,
      monthlyPayback: Math.round(metrics.totalMonthlySavings),
      insights: [
        `Your system will pay for itself in approximately ${Math.round(roiYears)} years`,
        `You're currently ${roiProgress}% through your payback period`,
        `Monthly savings of $${Math.round(metrics.totalMonthlySavings)} accelerating your ROI`
      ]
    });
  }
}