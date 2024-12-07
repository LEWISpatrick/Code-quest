"use server";

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CodeChallenge {
  title: string;
  code: string;
  solution: string;
  explanation: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  hints: Array<{
    text: string;
    pointsDeduction: number;
  }>;
}

export async function generateCodeChallenge(level: number): Promise<CodeChallenge> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a coding challenge generator. Generate challenges that test debugging skills.
            Format your response as a JSON object with the following structure:
            {
              "title": "Challenge Title",
              "code": "buggy code here (no newlines at start/end)",
              "solution": "correct code here (no newlines at start/end)",
              "explanation": "explanation of the bug and solution",
              "category": "Algorithm/DataStructure/etc",
              "hints": [
                {
                  "text": "hint text",
                  "pointsDeduction": number
                }
              ]
            }`
        },
        {
          role: "user",
          content: `Generate a level ${level} coding challenge. Make it ${
            level === 1 ? 'easy' : level === 2 ? 'medium' : 'hard'
          }.`
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }

    // Clean up the response before parsing
    const cleanedContent = content
      .replace(/\n\s*/g, ' ')  // Replace newlines and following spaces with a single space
      .replace(/\\n/g, '\\n')  // Escape any literal \n
      .trim();

    try {
      return JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse cleaned content:', cleanedContent);
      throw parseError;
    }
  } catch (error: any) {
    console.error('Failed to generate challenge:', error);
    throw new Error(`Failed to generate challenge: ${error.message}`);
  }
} 