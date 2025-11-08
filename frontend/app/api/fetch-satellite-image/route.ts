// app/api/fetch-satellite-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

interface SatelliteImageRequest {
  latitude: number;
  longitude: number;
  zoom?: number;
  width?: number;
  height?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SatelliteImageRequest = await request.json();
    const { latitude, longitude, zoom = 20, width = 1024, height = 768 } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Construct Google Maps Static API URL for satellite imagery
    const mapUrl = new URL('https://maps.googleapis.com/maps/api/staticmap');
    mapUrl.searchParams.append('center', `${latitude},${longitude}`);
    mapUrl.searchParams.append('zoom', zoom.toString());
    mapUrl.searchParams.append('size', `${width}x${height}`);
    mapUrl.searchParams.append('maptype', 'satellite');
    mapUrl.searchParams.append('scale', '2'); // High resolution
    mapUrl.searchParams.append('key', GOOGLE_MAPS_API_KEY);

    // Fetch the image from Google Maps
    const response = await fetch(mapUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Maps API error:', response.status, errorText);
      
      // Parse error message if possible
      let errorMessage = 'Failed to fetch satellite image from Google Maps';
      
      if (response.status === 403) {
        errorMessage = 'Google Maps API access denied. Please enable billing at: https://console.cloud.google.com/billing';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request parameters. Please check the location coordinates.';
      } else {
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error_message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    // Get the image as a blob
    const imageBuffer = await response.arrayBuffer();
    const blob = new Blob([imageBuffer], { type: 'image/png' });

    // Return the image
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error: unknown) {
    console.error('Satellite image fetch error:', error);
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: string }).message)
        : 'Internal server error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// Optional: Add GET endpoint for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Missing lat or lon parameters' },
      { status: 400 }
    );
  }

  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      }),
    })
  );
}