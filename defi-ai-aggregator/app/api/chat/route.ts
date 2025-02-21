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

function formatLendingRatesResponse(rates: LendingInfo[], token: string, timestamp: string): string {
  // Sort by APY descending
  const sortedRates = rates.sort((a, b) => parseFloat(b.apy) - parseFloat(a.apy));
  
  // Get top 3 rates for summary
  const topRates = sortedRates.slice(0, 3);
  
  // Calculate average APY of active pools (excluding 0% APY)
  const activeRates = sortedRates.filter(r => parseFloat(r.apy) > 0);
  const avgApy = activeRates.reduce((sum, r) => sum + parseFloat(r.apy), 0) / activeRates.length;

  let response = `📊 Best ${token} Lending Rates Summary (${timestamp}):\n\n`;
  
  // Add quick summary
  response += `🏆 Top Rate: ${topRates[0].protocol} (${topRates[0].apy}% APY)\n`;
  response += `💰 Largest Pool: ${rates[0].protocol} ($${parseInt(rates[0].totalSupply).toLocaleString()})\n`;
  response += `📈 Average APY: ${avgApy.toFixed(2)}%\n\n`;
  
  // Add recommendation
  response += `💡 Recommendation:\n`;
  response += `Best for yield: ${topRates[0].protocol} (${topRates[0].apy}% APY)\n`;
  response += `Best for safety: ${rates[0].protocol} (highest liquidity)\n\n`;

  // Add top 3 options
  response += `🔝 Top 3 Options:\n`;
  topRates.forEach((rate, i) => {
    response += `${i + 1}. ${rate.protocol}\n`;
    response += `   • APY: ${rate.apy}%\n`;
    response += `   • TVL: $${parseInt(rate.totalSupply).toLocaleString()}\n`;
    if (rate.rewardTokens?.length > 0) {
      response += `   • Rewards: ${rate.rewardTokens.length > 0 ? '✅' : '❌'}\n`;
    }
    response += `   • Verify: ${rate.poolUrl}\n\n`;
  });

  response += `Want to see all ${rates.length} pools? Reply "show all ${token} pools"\n`;
  response += `\nData from DefiLlama • Rates subject to change • DYOR`;

  return response;
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content.toLowerCase();

  if (lastMessage.includes('lending rate') || lastMessage.includes('apy')) {
    const token = lastMessage.includes('usdc') ? 'USDC' : 
                  lastMessage.includes('apt') ? 'APT' :
                  lastMessage.includes('usdt') ? 'USDT' :
                  lastMessage.includes('dai') ? 'DAI' : null;
    
    if (token) {
      try {
        const lendingRates = await defiService.getLendingRates(token);
        const timestamp = getFormattedTimestamp();

        if (lendingRates.length === 0) {
          return new StreamingTextResponse(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(
                  `No active lending pools found for ${token} on Aptos at ${timestamp}. ` +
                  `This might be because:\n` +
                  `• The pools have low liquidity (< $1000 TVL)\n` +
                  `• The protocol might be temporarily inactive\n` +
                  `• The token might not be supported yet\n\n` +
                  `You can verify at https://defillama.com/chain/Aptos`
                ));
                controller.close();
              },
            })
          );
        }

        const ratesMessage = lastMessage.includes('all pools') ?
          formatAllLendingRates(lendingRates, token, timestamp) :
          formatLendingRatesResponse(lendingRates, token, timestamp);

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
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(
                `Error fetching lending rates at ${getFormattedTimestamp()}. ` +
                `Please check https://defillama.com/chain/Aptos directly.`
              ));
              controller.close();
            },
          })
        );
      }
    }
  }

  // For other queries, use GPT with context
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a DeFi assistant for Aptos blockchain. When users ask about:
          - Lending rates: Suggest "show lending rates for [token]"
          - Protocols: List available Aptos DeFi protocols
          - Swaps: Explain available DEXes
          Keep responses focused on Aptos DeFi ecosystem.
          Don't say you can't access real-time data.`
      },
      ...getLastMessages(messages)
    ],
    stream: true,
    max_tokens: 500
  });

  return new StreamingTextResponse(OpenAIStream(response));
} 