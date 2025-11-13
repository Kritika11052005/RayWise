// app/api/solar-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_AI_ASSISTANT || process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  userContext?: {
    hasProjects: boolean;
    projectCount: number;
    totalSystemSize?: number;
    location?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, userContext } = body;

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI Assistant API key not configured' },
        { status: 500 }
      );
    }

    // Build context for the AI
    let systemContext = `You are a helpful solar energy assistant for RayWise, a solar panel analysis platform. You help users with:
- Understanding their solar analysis results
- Questions about solar panel installation
- Information about solar energy benefits
- Guidance on choosing solar panels and installers
- ROI calculations and savings estimates
- Solar panel maintenance and warranties

Keep responses concise, friendly, and informative. Use emojis occasionally to make conversations engaging.`;

    if (userContext) {
      systemContext += `\n\nUser Context:
- Has ${userContext.projectCount} project(s) on the platform
${userContext.totalSystemSize ? `- Total system size: ${userContext.totalSystemSize} kW` : ''}
${userContext.location ? `- Location: ${userContext.location}` : ''}`;
    }

    // Convert conversation history to Gemini format
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system context as first message
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemContext }]
      },
      {
        role: 'model',
        parts: [{ text: 'I understand. I\'m ready to help users with their solar energy questions!' }]
      },
      ...geminiMessages
    ];

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { success: false, error: 'Failed to get AI response' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';

    return NextResponse.json({
      success: true,
      message: aiResponse
    });

  } catch (error: unknown) {
    console.error('Solar Assistant error:', error);
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