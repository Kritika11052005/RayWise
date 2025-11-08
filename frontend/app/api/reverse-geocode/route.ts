// app/api/reverse-geocode/route.ts
// Create this in a separate file: app/api/reverse-geocode/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
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

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components;
      
      // Extract city and country
      let city = 'Unknown';
      let country = 'Unknown';
      
      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_2') && city === 'Unknown') {
          city = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      }
      
      return NextResponse.json({
        success: true,
        address: {
          city,
          country,
          formatted: result.formatted_address
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Reverse geocoding failed: ${data.status}`
      }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Reverse geocoding error:', error);
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