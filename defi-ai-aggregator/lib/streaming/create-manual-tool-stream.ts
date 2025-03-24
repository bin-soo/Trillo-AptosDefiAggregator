import { StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import {
  convertToCoreMessages,
  createDataStreamResponse,
  DataStreamWriter,
  JSONValue,
  streamText
} from 'ai'
import { manualResearcher } from '../agents/manual-researcher'
import { ExtendedCoreMessage } from '../types'
import { getMaxAllowedTokens, truncateMessages } from '../utils/context-window'
import { handleStreamFinish } from './handle-stream-finish'
import { executeToolCall } from './tool-execution'
import { BaseStreamConfig } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function createManualToolStreamResponse({ messages, model, searchMode = false }: { 
  messages: any[],
  model: any, 
  chatId?: string,
  searchMode?: boolean 
}) {
  try {
    // Use a more powerful model for research if in search mode
    const modelId = searchMode ? "gpt-4-turbo" : model.id;
    
    const stream = await openai.chat.completions.create({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: searchMode ? 4000 : 2000, // More tokens for research
      stream: true
    });
    
    return new StreamingTextResponse(stream.toReadableStream());
  } catch (error) {
    console.error('Error in createManualToolStreamResponse:', error);
    return new Response('Error processing your request: ' + (error instanceof Error ? error.message : 'Unknown error'), {
      status: 500
    });
  }
}
