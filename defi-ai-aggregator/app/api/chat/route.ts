import { StreamingTextResponse } from 'ai';
import { OpenAIStream } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';
import defiService from '@/services/defiService';
import { LendingInfo, SwapRoute } from '@/types/defi';

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

// Helper to extract token from message
function extractToken(message: string): string | null {
  const tokens = ['USDC', 'APT', 'USDT', 'DAI'];
  for (const token of tokens) {
    if (message.toUpperCase().includes(token)) {
      return token;
    }
  }
  return null;
}

// Helper to extract swap parameters
function extractSwapParams(message: string): { amount: string; tokenIn: string; tokenOut: string } | null {
  // Match patterns like "swap 5 APT to USDC" or "exchange 10 USDC for APT"
  const swapMatch = message.match(/(?:swap|exchange)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i);
  if (swapMatch) {
    const [_, amount, tokenIn, tokenOut] = swapMatch;
    return {
      amount,
      tokenIn: tokenIn.toUpperCase(),
      tokenOut: tokenOut.toUpperCase()
    };
  }
  
  // Match patterns like "best rate for 5 APT to USDC"
  const rateMatch = message.match(/(?:rate|price).+?(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i);
  if (rateMatch) {
    const [_, amount, tokenIn, tokenOut] = rateMatch;
    return {
      amount,
      tokenIn: tokenIn.toUpperCase(),
      tokenOut: tokenOut.toUpperCase()
    };
  }

  // Match simple patterns like "swap APT to USDC" (without amount)
  const simpleMatch = message.match(/(?:swap|rate|price|exchange).*?(\w+)\s+(?:to|for)\s+(\w+)/i);
  if (simpleMatch) {
    const [_, tokenIn, tokenOut] = simpleMatch;
    return {
      amount: '1', // Default amount
      tokenIn: tokenIn.toUpperCase(),
      tokenOut: tokenOut.toUpperCase()
    };
  }
  return null;
}

function formatSwapResponse(route: SwapRoute, timestamp: string): string {
  let response = `🔄 Best Swap Route for ${route.amount} ${route.tokenIn.symbol} to ${route.tokenOut.symbol} (${timestamp}):\n\n`;
  
  response += `💱 Expected Output: ${route.expectedOutput} ${route.tokenOut.symbol}\n`;
  response += `📊 Best DEX: ${route.protocol}\n`;
  response += `📈 Price Impact: ${route.priceImpact}%\n`;
  response += `⛽ Estimated Gas: ${route.estimatedGas}\n\n`;

  if (route.alternativeRoutes?.length) {
    response += `Alternative Routes:\n`;
    route.alternativeRoutes.forEach((alt, i) => {
      response += `${i + 1}. ${alt.protocol}: ${alt.expectedOutput} ${route.tokenOut.symbol}\n`;
    });
    response += '\n';
  }

  response += `🔗 Execute trade: ${route.dexUrl}\n\n`;
  response += `Note: Rates are subject to change • DYOR`;

  return response;
}

function formatYieldComparison(opportunities: any, token: string, timestamp: string): string {
  let response = `📊 Yield Opportunities for ${token} (${timestamp}):\n\n`;

  // Best Lending Rate
  const bestLending = opportunities.lending[0];
  response += `💰 Best Lending Rate:\n`;
  response += `• ${bestLending.protocol}: ${bestLending.apy}% APY\n`;
  response += `• TVL: $${parseInt(bestLending.totalSupply).toLocaleString()}\n\n`;

  // Best LP Opportunity
  const bestLP = opportunities.liquidity[0];
  response += `🌊 Best Liquidity Pool:\n`;
  response += `• ${bestLP.protocol} ${bestLP.tokens.join('/')}\n`;
  response += `• Total APY: ${bestLP.apy.total.toFixed(2)}%\n`;
  response += `• Daily Fees: $${bestLP.fee24h.toLocaleString()}\n`;
  response += `• IL Risk (30d): ${(bestLP.impermanentLoss30d * 100).toFixed(1)}%\n\n`;

  response += `💡 Recommendation:\n`;
  if (bestLending.apy > bestLP.apy.total) {
    response += `• Lending appears safer with higher APY\n`;
    response += `• Consider lending on ${bestLending.protocol}\n`;
  } else {
    response += `• LP offers higher APY but comes with IL risk\n`;
    response += `• Consider LP on ${bestLP.protocol} if bullish on both tokens\n`;
  }

  return response;
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
    if (rate.rewardTokens && rate.rewardTokens.length > 0) {
      response += `   • Rewards: ✅\n`;
    }
    response += `   • Verify: ${rate.poolUrl}\n\n`;
  });

  response += `Want to see all ${rates.length} pools? Reply "show all ${token} pools"\n`;
  response += `\nData from DefiLlama • Rates subject to change • DYOR`;

  return response;
}

function formatAllLendingRates(rates: LendingInfo[], token: string, timestamp: string): string {
  let response = `📊 All ${token} Lending Pools (${timestamp}):\n\n`;
  
  rates.forEach((rate, i) => {
    response += `${i + 1}. ${rate.protocol}\n`;
    response += `   • APY: ${rate.apy}%\n`;
    response += `   • TVL: $${parseInt(rate.totalSupply).toLocaleString()}\n`;
    if (rate.rewardTokens && rate.rewardTokens.length > 0) {
      response += `   • Rewards: ✅\n`;
    }
    response += `   • Verify: ${rate.poolUrl}\n\n`;
  });

  response += `\nData from DefiLlama • Rates subject to change • DYOR`;
  return response;
}

function formatKnowledgeBaseResponse(info: any): string {
  let response = `📊 ${info.topic || 'Knowledge Base'}:\n\n`;

  if (info.definition) {
    response += `🔍 Definition:\n${info.definition}\n\n`;
  }

  if (info.liveData) {
    response += `🔄 Live Data:\n`;
    if (info.liveData.type === 'Link') {
      response += `• ${info.liveData.description}: ${info.liveData.url}\n`;
    } else if (info.liveData.type === 'Links') {
      info.liveData.sources.forEach((source: any) => {
        response += `• ${source.name}: ${source.url}\n  ${source.description}\n`;
      });
    }
    response += '\n';
  }

  if (info.examples && info.examples.length > 0) {
    response += `🔍 Examples:\n`;
    info.examples.forEach((example: string, index: number) => {
      response += `• ${example}\n`;
    });
    response += '\n';
  }

  if (info.resources && info.resources.length > 0) {
    response += `🔍 Resources:\n`;
    info.resources.forEach((resource: string, index: number) => {
      response += `• ${resource}\n`;
    });
    response += '\n';
  }

  response += `💡 Recommendation:\n`;
  response += `• Consider exploring more about ${info.topic} from the resources provided.\n`;
  response += `• DYOR (Do Your Own Research) is always recommended when dealing with new technologies or protocols.\n\n`;

  response += `\n📅 Data Age: ${info.metadata.dataAge}\n`;
  response += `⚠️ ${info.metadata.disclaimer}\n`;
  response += `🔗 Check live sources for current data`;

  return response;
}

function isGeneralQuestion(message: string): boolean {
  const generalQuestionKeywords = ['what', 'how', 'is', 'are', 'was', 'were', 'will', 'would', 'can', 'could', 'should', 'ought', 'must', 'have', 'has', 'had', 'do', 'does', 'did', 'be', 'being', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'be', 'being', 'been'];
  const words = message.toLowerCase().split(/\s+/);
  return words.some(word => generalQuestionKeywords.includes(word));
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content.toLowerCase();

  // Handle swap queries
  const swapParams = extractSwapParams(lastMessage);
  if (swapParams) {
    try {
      console.log('Extracted swap params:', swapParams);
      
      // Validate token symbols to ensure they're supported
      const validTokens = ['APT', 'USDC', 'USDT', 'DAI'];
      if (!validTokens.includes(swapParams.tokenIn) || !validTokens.includes(swapParams.tokenOut)) {
        return new StreamingTextResponse(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(
                `Sorry, I can only provide swap rates for APT, USDC, USDT, and DAI at the moment. ` +
                `Please try with these tokens.`
              ));
              controller.close();
            },
          })
        );
      }
      
      const route = await defiService.getBestSwapRoute(
        swapParams.tokenIn as any,
        swapParams.tokenOut as any,
        swapParams.amount
      );
      
      console.log('Got swap route:', route);
      
      const timestamp = getFormattedTimestamp();
      return new StreamingTextResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(formatSwapResponse(route, timestamp)));
            controller.close();
          },
        })
      );
    } catch (error) {
      console.error('Detailed swap error:', {
        error: error instanceof Error ? error.message : error,
        params: swapParams,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return new StreamingTextResponse(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(
              `Sorry, I couldn't fetch swap rates at the moment. Error: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
              `Please try again later or check directly at DEX aggregator.`
            ));
            controller.close();
          },
        })
      );
    }
  }

  // Handle yield comparison queries
  if (lastMessage.includes('compare yields') || lastMessage.includes('best yield')) {
    const token = extractToken(lastMessage);
    if (token) {
      try {
        const opportunities = await defiService.getYieldOpportunities(token);
        const timestamp = getFormattedTimestamp();
        return new StreamingTextResponse(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(
                formatYieldComparison(opportunities, token, timestamp)
              ));
              controller.close();
            },
          })
        );
      } catch (error) {
        console.error('Error fetching yield opportunities:', error);
      }
    }
  }

  // Handle lending rate queries
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
          - Swaps: Suggest "What's the best rate to swap [tokenA] to [tokenB]?"
          - Protocols: List available Aptos DeFi protocols
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