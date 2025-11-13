// app/api/find-installers/route.ts
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_DASHBOARD;

interface InstallerRequest {
  location: {
    city: string;
    country: string;
    lat?: number;
    lon?: number;
  };
  systemSize?: number;
  budget?: number;
}

export async function POST(request: Request) {
  try {
    const { location, systemSize, budget }: InstallerRequest = await request.json();

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_DASHBOARD API key not configured');
    }

    const prompt = `You are a solar installation expert. Find and recommend solar installers for this location:

**Location Details:**
- City: ${location.city}
- Country: ${location.country}
${location.lat ? `- Latitude: ${location.lat}` : ''}
${location.lon ? `- Longitude: ${location.lon}` : ''}
${systemSize ? `- System Size: ${systemSize} kW` : ''}
${budget ? `- Budget: $${budget}` : ''}

Generate a realistic list of 5-8 solar installers in or near ${location.city}, ${location.country}.

For each installer, provide:
- Company name (realistic local business names)
- Contact (phone number in local format)
- Email (professional format)
- Address (specific street address in the city)
- Rating (out of 5)
- Years in business
- Specialties (e.g., "Residential Solar", "Commercial", "Battery Storage")
- Estimated cost range for the project
- Typical installation time
- Certifications (e.g., "NABCEP Certified", "Local Permit Expert")
- Customer reviews count
- A brief description of their services

Return ONLY a JSON object with no markdown formatting:
{
  "installers": [
    {
      "id": "<unique_id>",
      "companyName": "<name>",
      "contact": {
        "phone": "<phone>",
        "email": "<email>",
        "address": "<full address>",
        "website": "<optional>"
      },
      "rating": <1-5>,
      "reviewsCount": <number>,
      "yearsInBusiness": <number>,
      "specialties": ["<specialty1>", "<specialty2>"],
      "certifications": ["<cert1>", "<cert2>"],
      "estimatedCost": {
        "min": <usd>,
        "max": <usd>
      },
      "installationTime": "<timeframe>",
      "description": "<brief description>",
      "availability": "<immediate/2-4 weeks/1-2 months>",
      "warrantyYears": <number>,
      "financingAvailable": <boolean>
    }
  ],
  "locationInfo": {
    "city": "${location.city}",
    "country": "${location.country}",
    "averageCostPerWatt": <number>,
    "typicalInstallationTime": "<timeframe>",
    "localIncentives": ["<incentive1>", "<incentive2>"]
  }
}

Make the installers realistic for ${location.city}, ${location.country}. Consider local business naming conventions and realistic pricing for that region.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 3072,
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
      installers: result.installers,
      locationInfo: result.locationInfo
    });

  } catch (error) {
    console.error('Find installers failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find installers'
    }, { status: 500 });
  }
}