import { StreamingTextResponse } from 'ai';
import { OpenAIStream } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import defiService from '@/services/defiService';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// Helper function to truncate messages array
function getLastMessages(messages: any[], limit: number = 5) {
  return messages.slice(-limit);
}

// Helper to format timestamp
function getFormattedTimestamp() {
  return new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'long'
  }) + ' UTC';
}

// Helper to validate APY rates
function validateAPY(apy: string): number {
  const apyNum = parseFloat(apy);
  // Cap unrealistic APY rates at 1000%
  return apyNum > 1000 ? 1000 : apyNum;
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content.toLowerCase();

  if (lastMessage.includes('lending rate') || lastMessage.includes('apy')) {
    const token = lastMessage.includes('usdc') ? 'USDC' : 
                  lastMessage.includes('apt') ? 'APT' : null;
    
    if (token) {
      try {
        const lendingRates = await defiService.getLendingRates(token);
        const timestamp = getFormattedTimestamp();

        if (lendingRates.length === 0) {
          return new StreamingTextResponse(
            OpenAIStream(
              await openai.createChatCompletion({
                model: 'gpt-4',
                messages: [
                  {
                    role: 'assistant',
                    content: `No lending rates found for ${token} on Aptos at ${timestamp}. You can verify at https://defillama.com/chain/Aptos`
                  }
                ],
                stream: true
              })
            )
          );
        }

        // Format the lending data
        let ratesMessage = `Current ${token} Lending Rates (${timestamp}):\n\n`;
        
        lendingRates
          .sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy))
          .forEach((rate, index) => {
            const apy = parseFloat(rate.apy).toFixed(2);
            const tvl = parseFloat(rate.totalSupply).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0
            });
            
            ratesMessage += `${index + 1}. ${rate.protocol}\n`;
            ratesMessage += `   • APY: ${apy}%\n`;
            ratesMessage += `   • TVL: ${tvl}\n`;
            ratesMessage += `   • Verify: ${rate.poolUrl}\n`;
            ratesMessage += `   • Last Updated: ${new Date(rate.updated).toLocaleString()}\n\n`;
          });

        // Return the formatted message directly without using GPT
        return new StreamingTextResponse(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(ratesMessage));
              controller.close();
            },
          })
        );

      } catch (error) {
        console.error('Error fetching lending rates:', error);
        return new StreamingTextResponse(
          OpenAIStream(
            await openai.createChatCompletion({
              model: 'gpt-4',
              messages: [
                {
                  role: 'assistant',
                  content: `Error fetching lending rates at ${getFormattedTimestamp()}. Please check https://defillama.com/chain/Aptos directly.`
                }
              ],
              stream: true
            })
          )
        );
      }
    }
  }

  // For non-lending rate queries, use GPT
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a DeFi assistant for Aptos blockchain. Help users with:
          - Finding best lending rates (respond with "show lending rates for [token]")
          - Executing token swaps
          - Providing liquidity
        For lending rates, always ask users to specify which token they want rates for.
        Keep responses focused on actions users can take.`
      },
      ...getLastMessages(messages)
    ],
    stream: true,
    max_tokens: 500
  });

  return new StreamingTextResponse(OpenAIStream(response));
} 