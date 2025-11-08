// app/api/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return NextResponse.json({
        success: true,
        coordinates: result.geometry.location,
        formatted_address: result.formatted_address
      });
    } else if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({
        success: false,
        error: 'No results found for this address. Please try a more specific location.'
      }, { status: 404 });
    } else if (data.status === 'REQUEST_DENIED') {
      return NextResponse.json({
        success: false,
        error: 'Google Maps API request denied. Please check your API key and billing settings.'
      }, { status: 403 });
    } else {
      return NextResponse.json({
        success: false,
        error: `Geocoding failed: ${data.status}`
      }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Geocoding error:', error);
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

