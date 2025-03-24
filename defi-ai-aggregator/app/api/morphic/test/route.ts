import { StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function GET() {
  try {
    // Create a simple test stream
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello and explain why you're a test message" }],
      temperature: 0.7,
      stream: true
    });
    
    // This should properly handle streaming
    return new StreamingTextResponse(stream.toReadableStream());
  } catch (error) {
    console.error('Test API error:', error);
    return new Response('Error in test route: ' + (error instanceof Error ? error.message : 'Unknown error'), {
      status: 500
    });
  }
} 