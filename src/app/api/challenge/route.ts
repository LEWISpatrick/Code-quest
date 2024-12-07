import { NextResponse } from 'next/server';
import { generateCodeChallenge } from '@/lib/openai';

export async function POST(request: Request) {
  try {
    const { level } = await request.json();
    const challenge = await generateCodeChallenge(level);
    return NextResponse.json(challenge);
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
} 