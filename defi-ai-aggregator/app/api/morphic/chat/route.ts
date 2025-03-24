import { StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { cookies } from 'next/headers';

// You'll need to create these files if they don't exist after cloning Morphic
import { createManualToolStreamResponse } from '@/lib/streaming/create-manual-tool-stream';
import { createToolCallingStreamResponse } from '@/lib/streaming/create-tool-calling-stream';
import { Model } from '@/lib/types/models';
import { isProviderEnabled } from '@/lib/utils/registry';

export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const DEFAULT_MODEL: Model = {
  id: 'gpt-4o-mini',
  name: 'GPT-4o mini',
  provider: 'OpenAI',
  providerId: 'openai',
  enabled: true,
  toolCallType: 'native'
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Get the search mode from cookies
    const cookieStore = cookies();
    const searchMode = cookieStore.get('search-mode')?.value === 'true';
    
    // For research requests, use more advanced model with higher token limit
    const model = searchMode ? "gpt-4-turbo" : "gpt-4o"; 
    
    // Create an OpenAI stream - this is the key part
    const stream = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: searchMode ? 4000 : 2000, // More tokens for research
      stream: true
    });
    
    // Use StreamingTextResponse to handle proper streaming
    return new StreamingTextResponse(stream.toReadableStream());
    
  } catch (error) {
    console.error('API route error:', error);
    return new Response('Error processing your request: ' + (error instanceof Error ? error.message : 'Unknown error'), {
      status: 500,
      statusText: 'Internal Server Error'
    });
  }
}
