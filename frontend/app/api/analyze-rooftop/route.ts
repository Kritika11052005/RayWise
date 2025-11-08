// app/api/analyze-rooftop/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface PolygonPoint {
  x: number;
  y: number;
}

interface Location {
  city: string;
  country: string;
  lat?: number;
  lon?: number;
}

interface AnalysisRequest {
  image: string;
  polygon: PolygonPoint[];
  imageWidth: number;
  imageHeight: number;
  location: Location;
}

interface PanelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

// Retry utility with exponential backoff
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

      // If 429 (rate limit) error, retry with exponential backoff
      if (response.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited (429). Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // Return response for all other cases (success or non-retryable errors)
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // If it's a network error and we have retries left, retry
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Network error. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { image, polygon, imageWidth, imageHeight, location } = body;

    if (!image || !polygon || polygon.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const polygonArea = calculatePolygonArea(polygon);
    const polygonBounds = getPolygonBounds(polygon);
    
    // Enhanced prompt with sun and shadow analysis
    const prompt = `You are a solar panel installation expert with expertise in photovoltaic systems and solar geometry. 

LOCATION CONTEXT:
- Installation location: ${location.city}, ${location.country}
${location.lat && location.lon ? `- Coordinates: ${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°` : ''}

IMAGE ANALYSIS REQUIREMENTS:
Carefully analyze this rooftop satellite/aerial image for:

1. **SUN POSITION & LIGHTING ANALYSIS:**
   - Identify sun direction from shadows in the image
   - Assess time of day based on shadow length and intensity
   - Determine optimal panel orientation to maximize sun exposure
   - Consider the location's hemisphere and typical sun path

2. **SHADOW ANALYSIS:**
   - Identify all shadows cast by buildings, trees, chimneys, vents, or other obstructions
   - Assess shadow coverage on the selected rooftop area
   - Determine which parts of the rooftop receive most sunlight
   - Identify potential shading issues throughout the day/year

3. **ROOFTOP CHARACTERISTICS:**
   - Roof pitch/slope (flat, slightly sloped, steep)
   - Surface texture and condition
   - Any obstructions (vents, chimneys, AC units, skylights)
   - Available clear area for panel installation

4. **OPTIMAL PANEL CONFIGURATION:**
   - Best panel orientation angle (0°=horizontal—, 45°=diagonal/, 90°=vertical|, 135°=diagonal\\)
   - Maximum number of panels that can fit in the polygon area
   - Layout pattern that maximizes coverage while avoiding shadows

POLYGON AREA DETAILS:
- Image dimensions: ${imageWidth}x${imageHeight} pixels
- Selected installation area: ${polygon.length} points
- Bounds: x(${polygonBounds.minX.toFixed(0)}-${polygonBounds.maxX.toFixed(0)}), y(${polygonBounds.minY.toFixed(0)}-${polygonBounds.maxY.toFixed(0)})
- Area: ${polygonArea.toFixed(0)} pixels²

IMPORTANT: Your goal is to MAXIMIZE panel coverage - fill as much of the polygon area as possible while avoiding shadowed zones.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "totalPanels": <maximum number that can fit>,
  "orientation": <0, 45, 90, or 135 based on sun analysis>,
  "layout": "<describe pattern, e.g., 'Dense grid layout (8x5)', 'Staggered rows', etc>",
  "totalPowerKw": <totalPanels * 0.4>,
  "annualProduction": <realistic estimate based on location and shading>,
  "sunAnalysis": "<detailed analysis of sun direction, shadows visible, optimal orientation reasoning>",
  "shadowAnalysis": "<analysis of shadows detected, their source, impact on panel placement>",
  "recommendations": "<specific advice for this installation considering sun path, shadows, and location>"
}`;

    const imageData = image.replace(/^data:image\/\w+;base64,/, '');
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

    // Use fetchWithRetry instead of regular fetch
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
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageData
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2000,
          }
        })
      },
      3, // max retries
      1000 // initial delay 1 second
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
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let analysis;
    try {
      const cleanedText = analysisText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', analysisText);
      const estimatedPanels = Math.floor(polygonArea / 3500); // More aggressive coverage
      analysis = {
        totalPanels: estimatedPanels,
        orientation: 0,
        layout: `Grid layout (${estimatedPanels} panels)`,
        totalPowerKw: estimatedPanels * 0.4,
        annualProduction: estimatedPanels * 500,
        sunAnalysis: 'Unable to perform detailed sun analysis. Using default orientation.',
        shadowAnalysis: 'Shadow analysis unavailable.',
        recommendations: 'Consider professional on-site assessment for optimal results.'
      };
    }

    // Normalize orientation
    let orientation = Number(analysis.orientation) || 0;
    const standardAngles = [0, 45, 90, 135];
    orientation = standardAngles.reduce((prev, curr) => 
      Math.abs(curr - orientation) < Math.abs(prev - orientation) ? curr : prev
    );

    // Generate MAXIMUM panel layout
    const panelLayout = generateMaximumPanelLayout(
      polygon,
      polygonBounds,
      orientation
    );

    // Update total panels to actual placed count
    analysis.totalPanels = panelLayout.length;
    analysis.totalPowerKw = parseFloat((panelLayout.length * 0.4).toFixed(2));
    analysis.annualProduction = Math.round(panelLayout.length * 500);

    return NextResponse.json({
      success: true,
      analysis: { ...analysis, orientation },
      panelLayout
    });

  } catch (error: unknown) {
    console.error('Analysis error:', error);
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

function calculatePolygonArea(points: PolygonPoint[]): number {
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
}

function getPolygonBounds(points: PolygonPoint[]) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

function isPointInPolygon(point: PolygonPoint, polygon: PolygonPoint[]): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

function isPanelInsidePolygon(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  rotation: number,
  polygon: PolygonPoint[]
): boolean {
  const angleInRadians = (rotation * Math.PI) / 180;
  const cos = Math.cos(angleInRadians);
  const sin = Math.sin(angleInRadians);
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight }
  ];
  
  const transformedCorners = corners.map(corner => ({
    x: centerX + (corner.x * cos - corner.y * sin),
    y: centerY + (corner.x * sin + corner.y * cos)
  }));
  
  return transformedCorners.every(corner => isPointInPolygon(corner, polygon));
}

function generateMaximumPanelLayout(
  polygon: PolygonPoint[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  orientation: number
): PanelLayout[] {
  const panels: PanelLayout[] = [];
  
  // Thin panel dimensions - optimized for maximum coverage
  let panelWidth: number;
  let panelHeight: number;
  
  if (orientation === 0) {
    // Horizontal: —
    panelWidth = 45;
    panelHeight = 6;
  } else if (orientation === 90) {
    // Vertical: |
    panelWidth = 6;
    panelHeight = 45;
  } else if (orientation === 45) {
    // Diagonal: /
    panelWidth = 32;
    panelHeight = 6;
  } else {
    // Diagonal: \
    panelWidth = 32;
    panelHeight = 6;
  }
  
  // Minimal padding for maximum coverage
  const padding = 2;
  
  const availableWidth = bounds.maxX - bounds.minX;
  const availableHeight = bounds.maxY - bounds.minY;
  
  // Calculate effective dimensions
  const effectiveWidth = orientation === 90 ? panelHeight : panelWidth;
  const effectiveHeight = orientation === 90 ? panelWidth : panelHeight;
  
  const panelsPerRow = Math.floor(availableWidth / (effectiveWidth + padding));
  const panelsPerCol = Math.floor(availableHeight / (effectiveHeight + padding));
  
  // Try to place panels in a dense grid
  for (let row = 0; row < panelsPerCol + 5; row++) {
    for (let col = 0; col < panelsPerRow + 5; col++) {
      const x = bounds.minX + col * (effectiveWidth + padding);
      const y = bounds.minY + row * (effectiveHeight + padding);
      
      const centerX = x + panelWidth / 2;
      const centerY = y + panelHeight / 2;
      
      // Check if entire rotated panel is inside polygon
      if (isPanelInsidePolygon(centerX, centerY, panelWidth, panelHeight, orientation, polygon)) {
        panels.push({
          x,
          y,
          width: panelWidth,
          height: panelHeight,
          rotation: orientation
        });
      }
    }
  }
  
  // If we didn't get many panels, try with offset grid (staggered)
  if (panels.length < 10) {
    const offsetPanels: PanelLayout[] = [];
    
    for (let row = 0; row < panelsPerCol + 5; row++) {
      const offset = (row % 2) * (effectiveWidth / 2);
      for (let col = 0; col < panelsPerRow + 5; col++) {
        const x = bounds.minX + col * (effectiveWidth + padding) + offset;
        const y = bounds.minY + row * (effectiveHeight + padding);
        
        const centerX = x + panelWidth / 2;
        const centerY = y + panelHeight / 2;
        
        if (isPanelInsidePolygon(centerX, centerY, panelWidth, panelHeight, orientation, polygon)) {
          offsetPanels.push({
            x,
            y,
            width: panelWidth,
            height: panelHeight,
            rotation: orientation
          });
        }
      }
    }
    
    // Use whichever gives more panels
    if (offsetPanels.length > panels.length) {
      return offsetPanels;
    }
  }
  
  return panels;
}