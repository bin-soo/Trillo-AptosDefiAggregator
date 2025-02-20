import { StreamingTextResponse } from 'ai';
import { OpenAIStream } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
// import defiService from '@/services/defiService';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Process the message to detect DeFi intents
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a DeFi assistant for Aptos blockchain. Help users with:
          - Finding best lending rates
          - Executing token swaps
          - Providing liquidity
          Parse user intent and respond with structured data.`
      },
      ...messages
    ],
    stream: true
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
} 