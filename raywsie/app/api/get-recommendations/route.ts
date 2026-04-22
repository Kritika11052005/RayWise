// app/api/get-recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_RECOMMENDATIONS_API_KEY || process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface RecommendationRequest {
  location: {
    city: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  systemSpecs: {
    totalPanels: number;
    systemSizeKw: number;
    estimatedAnnualProductionKwh: number;
  };
  analysis?: {
    orientation: number | string;
    layout: string;
    sunAnalysis?: string;
    shadowAnalysis?: string;
  };
}

interface PanelRecommendation {
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
}

interface InstallerRecommendation {
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
}

interface RecommendationResponse {
  panels: PanelRecommendation[];
  localInstallers: InstallerRecommendation[];
  globalInstallers: InstallerRecommendation[];
  budgetAnalysis: {
    isRealistic: boolean;
    notes: string;
    recommendations: string;
  };
}

// Retry utility
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  throw lastError || new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    const { location, budget, systemSpecs, analysis } = body;

    if (!location || !budget || !systemSpecs) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a solar energy expert providing personalized recommendations for solar panel installations.

LOCATION & PROJECT DETAILS:
- Location: ${location.city}, ${location.country}
${location.lat && location.lon ? `- Coordinates: ${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°` : ''}
- Budget Range: $${budget.min.toLocaleString()} - $${budget.max.toLocaleString()} ${budget.currency}
- System Size: ${systemSpecs.totalPanels} panels, ${systemSpecs.systemSizeKw} kW
- Expected Annual Production: ${systemSpecs.estimatedAnnualProductionKwh.toLocaleString()} kWh

${analysis ? `SITE ANALYSIS:
- Optimal Orientation: ${analysis.orientation}°
- Layout Type: ${analysis.layout}
${analysis.sunAnalysis ? `- Sun Analysis: ${analysis.sunAnalysis}` : ''}
${analysis.shadowAnalysis ? `- Shadow Analysis: ${analysis.shadowAnalysis}` : ''}` : ''}

TASK 1 - SOLAR PANEL RECOMMENDATIONS:
Recommend 3 solar panel types that:
1. Fit the budget (considering ${systemSpecs.totalPanels} panels needed)
2. Are suitable for ${location.country}'s climate
3. Match the system requirements
4. Provide best value at different price points (budget, mid-range, premium)

For each panel type, provide:
- Actual real brand names and models (e.g., "LG NeON 2", "SunPower Maxeon", "Trina Solar Vertex")
- Type: monocrystalline, polycrystalline, or thin-film
- Realistic efficiency (18-22%)
- Power rating per panel (350-450W typical)
- Warranty period (20-25 years typical)
- Price per panel range
- Total cost for ${systemSpecs.totalPanels} panels
- 3 pros and 3 cons
- Why it's recommended for this specific installation

TASK 2 - LOCAL INSTALLER RECOMMENDATIONS:
Recommend 3 LOCAL solar installers in ${location.city}, ${location.country}:
- Must be actual companies that likely operate in ${location.country}
- Provide realistic company names based on the region
- Include contact details (use realistic formats for ${location.country})
- Service area should be local/regional
- Budget range should overlap with user's budget
- Include certifications relevant to ${location.country}

TASK 3 - GLOBAL INSTALLER RECOMMENDATIONS:
Recommend 3 GLOBAL solar installation companies that:
- Operate internationally including in ${location.country}
- Have established presence worldwide
- Can handle projects in this budget range
- Include major international solar companies

TASK 4 - BUDGET ANALYSIS:
Analyze if the budget (${budget.min}-${budget.max} ${budget.currency}) is realistic for:
- ${systemSpecs.totalPanels} solar panels
- Complete installation in ${location.country}
- Any additional costs to consider

Provide specific recommendations if budget adjustments are needed.

IMPORTANT FORMATTING RULES:
1. Use REAL company names and panel brands
2. All prices must be in ${budget.currency}
3. Phone numbers should match ${location.country} format
4. Email should be professional (e.g., info@company.com, sales@company.com)
5. Websites should be realistic (e.g., www.companyname.com)
6. All data must be realistic and market-accurate

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "panels": [
    {
      "name": "Brand Model Name",
      "type": "monocrystalline|polycrystalline|thin-film",
      "manufacturer": "Brand Name",
      "efficiency": <number 18-22>,
      "powerRating": <number 350-450>,
      "warranty": <number 20-25>,
      "pricePerPanel": {"min": <number>, "max": <number>, "currency": "${budget.currency}"},
      "totalCost": <number for all panels>,
      "description": "<1-2 sentence overview>",
      "pros": ["<specific benefit 1>", "<specific benefit 2>", "<specific benefit 3>"],
      "cons": ["<specific drawback 1>", "<specific drawback 2>", "<specific drawback 3>"],
      "bestFor": ["<use case 1>", "<use case 2>"],
      "reasoning": "<why recommended for this specific installation>"
    }
  ],
  "localInstallers": [
    {
      "name": "Contact Person Name",
      "company": "Local Company Name",
      "email": "realistic@email.com",
      "phone": "+country-code-xxx-xxx-xxxx",
      "website": "www.company.com",
      "isLocal": true,
      "serviceArea": "${location.city} and surrounding areas",
      "rating": <number 3.5-5.0>,
      "yearsInBusiness": <number 5-30>,
      "projectsCompleted": <number 50-5000>,
      "certifications": ["<certification 1>", "<certification 2>"],
      "services": ["installation", "maintenance", "consultation"],
      "budgetRange": {"min": <number>, "max": <number>, "currency": "${budget.currency}"},
      "description": "<2-3 sentence company description>",
      "specializations": ["<specialty 1>", "<specialty 2>"],
      "estimatedCost": <number for this project>,
      "reasoning": "<why recommended for this user>"
    }
  ],
  "globalInstallers": [
    {
      "name": "Contact Person",
      "company": "Global Company Name",
      "email": "international@company.com",
      "phone": "+international-number",
      "website": "www.globalcompany.com",
      "isLocal": false,
      "serviceArea": "Worldwide including ${location.country}",
      "rating": <number 4.0-5.0>,
      "yearsInBusiness": <number 10-50>,
      "projectsCompleted": <number 1000-50000>,
      "certifications": ["<international cert 1>", "<international cert 2>"],
      "services": ["installation", "maintenance", "consultation", "financing"],
      "budgetRange": {"min": <number>, "max": <number>, "currency": "${budget.currency}"},
      "description": "<2-3 sentence company description>",
      "specializations": ["<specialty 1>", "<specialty 2>"],
      "estimatedCost": <number for this project>,
      "reasoning": "<why recommended globally>"
    }
  ],
  "budgetAnalysis": {
    "isRealistic": <true|false>,
    "notes": "<analysis of budget vs requirements>",
    "recommendations": "<specific advice for budget optimization>"
  }
}`;

    const geminiResponse = await fetchWithRetry(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          }
        })
      },
      3,
      1000
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { success: false, error: `Gemini API request failed: ${errorData}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let recommendations: RecommendationResponse;
    try {
      const cleanedText = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      
      // Fallback recommendations
      recommendations = {
        panels: [
          {
            name: "Standard Monocrystalline Panel",
            type: "monocrystalline",
            manufacturer: "Generic Solar",
            efficiency: 20,
            powerRating: 400,
            warranty: 25,
            pricePerPanel: { min: 200, max: 300, currency: budget.currency },
            totalCost: systemSpecs.totalPanels * 250,
            description: "High-efficiency solar panels suitable for residential installations",
            pros: ["Good efficiency", "Long warranty", "Reliable performance"],
            cons: ["Standard pricing", "Limited availability", "Generic brand"],
            bestFor: ["residential", "commercial"],
            reasoning: "Fallback recommendation - contact local installers for accurate quotes"
          }
        ],
        localInstallers: [],
        globalInstallers: [],
        budgetAnalysis: {
          isRealistic: true,
          notes: "Unable to generate detailed analysis. Please contact local installers for accurate quotes.",
          recommendations: "Get multiple quotes from certified installers in your area."
        }
      };
    }

    return NextResponse.json({
      success: true,
      recommendations
    });

  } catch (error: unknown) {
    console.error('Recommendations error:', error);
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: string }).message)
        : 'Internal server error';
    return NextResponse.json(
      { 
        success: false, 
        error: message 
      },
      { status: 500 }
    );
  }
}