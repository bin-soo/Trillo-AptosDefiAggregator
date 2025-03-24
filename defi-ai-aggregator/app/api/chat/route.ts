import { StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { Configuration, OpenAIApi } from 'openai-edge';
import defiService from '@/services/defiService';
import { LendingInfo, SwapRoute } from '@/types/defi';
import { APTOS_COINS, APTOS_TESTNET_COINS } from '@/services/constants';
import { OpenAIStream } from 'ai';
import copyTradingService from '@/services/copyTradingService';

// Initialize OpenAI Edge client
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  // Skip extraction if this is clearly a price prediction or market analysis query
  if (message.includes('price prediction') || 
      message.includes('market analysis') || 
      message.includes('sentiment') ||
      message.includes('forecast')) {
    return null;
  }
  
  // More strict swap regex that requires the word "swap" explicitly
  const swapRegex = /\b(?:swap|exchange|trade|convert)\b\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for|into)\s+(\w+)/i;
  const match = message.match(swapRegex);
  
  if (match) {
    const [_, amount, tokenIn, tokenOut] = match;
    console.log(`Detected swap intent: ${amount} ${tokenIn} to ${tokenOut}`);
    return { amount, tokenIn: tokenIn.toUpperCase(), tokenOut: tokenOut.toUpperCase() };
  }
  
  // Try more flexible pattern matching, but only if "swap" is mentioned
  if (message.toLowerCase().includes('swap')) {
    const tokenRegex = /(\w+)\s+(?:to|for|into)\s+(\w+)/i;
    const amountRegex = /(\d+(?:\.\d+)?)\s+(\w+)/i;
    
    const tokenMatch = message.match(tokenRegex);
    const amountMatch = message.match(amountRegex);
    
    if (tokenMatch && amountMatch) {
      const [_, tokenInFromAmount, tokenInFromToken] = amountMatch;
      const [__, tokenInFromPair, tokenOutFromPair] = tokenMatch;
      
      // Determine which token is which
      let finalTokenIn, finalTokenOut, finalAmount;
      
      if (tokenInFromToken.toUpperCase() === tokenInFromPair.toUpperCase()) {
        finalTokenIn = tokenInFromToken.toUpperCase();
        finalTokenOut = tokenOutFromPair.toUpperCase();
        finalAmount = tokenInFromAmount;
      } else {
        finalTokenIn = tokenInFromPair.toUpperCase();
        finalTokenOut = tokenOutFromPair.toUpperCase();
        finalAmount = tokenInFromAmount;
      }
      
      console.log(`Detected flexible swap intent: ${finalAmount} ${finalTokenIn} to ${finalTokenOut}`);
      return { amount: finalAmount, tokenIn: finalTokenIn, tokenOut: finalTokenOut };
    }
  }
  
  return null;
}

function formatSwapResponse(route: SwapRoute, timestamp: string): string {
  // Handle the case where tokenIn or tokenOut might be undefined
  const tokenInSymbol = route.tokenIn?.symbol || route.fromToken;
  const tokenOutSymbol = route.tokenOut?.symbol || route.toToken;
  
  let response = `🔄 Best Swap Route for ${route.amount || route.fromAmount} ${tokenInSymbol} to ${tokenOutSymbol} (${timestamp}):\n\n`;
  
  response += `💱 Expected Output: ${route.expectedOutput} ${tokenOutSymbol}\n`;
  response += `📊 Best DEX: ${route.protocol || route.dex}\n`;
  response += `📈 Price Impact: ${route.priceImpact}%\n`;
  response += `⛽ Estimated Gas: ${route.estimatedGas}\n\n`;

  if (route.alternativeRoutes?.length) {
    response += `Alternative Routes:\n`;
    route.alternativeRoutes.forEach((alt, i) => {
      response += `${alt.protocol}: ${alt.expectedOutput} ${tokenOutSymbol}\n`;
    });
    response += '\n';
  }

  // Only add the dexUrl if it's defined
  if (route.dexUrl) {
    response += `🔗 Execute trade: ${route.dexUrl}\n\n`;
  }

  response += `To execute this swap directly through our assistant, simply reply with "yes" or "execute swap".`;
  response += `\n\nNote: Rates are subject to change • DYOR`;

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

function isMarketAnalysisQuery(message: string): boolean {
  const marketKeywords = [
    'price prediction', 
    'price forecast',
    'price outlook',
    'price target',
    'predict price',
    'predict the price',
    'price in the next',
    'market analysis',
    'market sentiment',
    'market outlook',
    'market trend',
    'bullish',
    'bearish',
    'forecast',
    'analysis',
    'sentiment'
  ];
  
  const lowercaseMessage = message.toLowerCase();
  
  // Check for specific token + prediction patterns
  if ((lowercaseMessage.includes('apt') || lowercaseMessage.includes('aptos')) && 
      (lowercaseMessage.includes('prediction') || 
       lowercaseMessage.includes('forecast') || 
       lowercaseMessage.includes('outlook'))) {
    return true;
  }
  
  // Check for any of the market keywords
  return marketKeywords.some(keyword => lowercaseMessage.includes(keyword));
}

// Add a new function to detect advanced research queries
function isAdvancedResearchQuery(message: string, metadata?: any): boolean {
  return !!metadata?.isAdvancedResearch;
}

// Add a function to handle advanced research
async function handleAdvancedResearch(message: string, metadata?: any): Promise<any> {
  console.log("Handling advanced research query with metadata:", metadata);
  
  try {
    // Use Morphic search for research when requested
    if (metadata?.useMorphic) {
      // Create structured messages for Morphic chat
      const systemMessage = `You are a specialized research assistant focusing on ${metadata.researchType || 'comprehensive'} research.
      Conduct a ${metadata.depth || 'detailed'} analysis of the user's query.
      Focus on these information sources: ${(metadata.sources || ['web']).join(', ')}.
      ${metadata.customInstructions ? `Additional instructions: ${metadata.customInstructions}` : ''}
      Format your response in markdown with proper citations.`;
      
      const requestMessages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: message }
      ];
      
      try {
        // Stream the response directly
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/morphic/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: requestMessages
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error from Morphic chat: ${response.status}`);
        }
        
        // Return the response directly as a streaming response
        return new StreamingTextResponse(response.body as ReadableStream);
      } catch (error) {
        console.error("Error in Morphic chat:", error);
        throw error; // Let the outer catch block handle it
      }
    } else {
      // Use your existing OpenAI method for standard research
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const prompt = generateResearchPrompt(message, metadata);
      
      const stream = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
        stream: true
      });
      
      return new StreamingTextResponse(stream.toReadableStream());
    }
  } catch (error) {
    console.error("Error in handleAdvancedResearch:", error);
    return new StreamingTextResponse(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(
            `I encountered an error while researching "${message}": ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or modify your query.`
          ));
          controller.close();
        }
      })
    );
  }
}

// Add this helper function
function generateResearchPrompt(query: string, metadata?: any): string {
  const researchType = metadata?.researchType || 'comprehensive';
  const depth = metadata?.depth || 'detailed';
  const sources = metadata?.sources || ['web'];
  const customInstructions = metadata?.customInstructions || '';
  
  let prompt = `Conduct a ${depth} research on "${query}" focusing on ${researchType} information.`;
  
  // Add source preferences
  prompt += `\nFocus on these information sources: ${sources.join(', ')}.`;
  
  // Add depth-specific instructions
  if (depth === 'basic') {
    prompt += '\nProvide a concise overview with key points only.';
  } else if (depth === 'detailed') {
    prompt += '\nProvide a thorough analysis with specific examples and evidence.';
  } else if (depth === 'exhaustive') {
    prompt += '\nProvide an exhaustive analysis with detailed explanations, multiple perspectives, and in-depth examination of nuances.';
  }
  
  // Add research type specific instructions
  if (researchType === 'defi') {
    prompt += '\nFocus on DeFi aspects, financial implications, market trends, tokenomics, and blockchain-specific details.';
  } else if (researchType === 'academic') {
    prompt += '\nApproach this from an academic perspective with emphasis on theories, methodologies, and scholarly research.';
  }
  
  // Add custom instructions if provided
  if (customInstructions) {
    prompt += `\nAdditional instructions: ${customInstructions}`;
  }
  
  prompt += '\nFormat your response in markdown with clear headings, bullet points where appropriate, and cite sources.';
  
  return prompt;
}

// Add this function to detect copy trading requests in the user message
function isCopyTradingRequest(message: string): { isRequest: boolean; address?: string } {
  // Check if this is a request to analyze or copy trade from a specific address
  const copyTradingRegex = /(?:copy\s+trad(?:e|ing)|follow\s+trader|analyze\s+trader|track\s+wallet).*?(0x[0-9a-fA-F]{1,64})/i;
  const match = message.match(copyTradingRegex);
  console.log("[isCopyTradingRequest] match:", match);
  
  if (match && match[1]) {
    const address = match[1];
    return { isRequest: true, address };
  }
  
  return { isRequest: false };
}

// More advanced intent detection system
function detectMessageIntent(message: string): string {
  const lowercaseMsg = message.toLowerCase();
  console.log(`[detectIntent] Analyzing message: ${lowercaseMsg}`);
  
  // Define intents with their keywords and initial scores
  const intents = {
    top_traders: {
      keywords: ['top trader', 'best trader', 'copy trade', 'follow trader', 'successful trader'],
      score: 0
    },
    copy_specific_trader: {
      keywords: ['analyze trader', 'trader profile', 'trader analysis', 'copy specific', 'trader history'],
      score: 0
    },
    swap_tokens: {
      keywords: ['swap', 'exchange', 'trade', 'convert', 'change'],
      score: 0
    },
    lending_rates: {
      keywords: ['lending', 'lend', 'apy', 'interest', 'yield', 'earn'],
      score: 0
    },
    market_analysis: {
      keywords: ['market', 'price', 'trend', 'analysis', 'predict', 'sentiment', 'outlook', 'chart'],
      score: 0
    }
  };
  
  // Score each intent
  Object.keys(intents).forEach(intentKey => {
    const intent = intents[intentKey];
    intent.keywords.forEach(keyword => {
      if (lowercaseMsg.includes(keyword)) {
        // Add additional weight for exact matches or phrases
        if (lowercaseMsg.includes(` ${keyword} `)) {
          intent.score += 2; // Higher score for phrases with spaces around
        } else {
          intent.score += 1;
        }
        console.log(`[detectIntent] Matched keyword '${keyword}' for intent '${intentKey}'`);
      }
    });
  });
  
  // Apply contextual rules to avoid false positives
  
  // Rule 1: Penalize swap_tokens intent when common words like "for" appear without specific swap context
  if (intents.swap_tokens.score === 1 && lowercaseMsg.includes('for') && 
      !lowercaseMsg.includes('swap') && !lowercaseMsg.includes('trade')) {
    intents.swap_tokens.score -= 1;
    console.log(`[detectIntent] Penalized swap_tokens intent (-1) due to weak context`);
  }
  
  // Rule 2: Boost market_analysis score when specific market terms are used
  if (lowercaseMsg.includes('sentiment') || 
      lowercaseMsg.includes('analysis') || 
      lowercaseMsg.includes('market')) {
    intents.market_analysis.score += 1;
    console.log(`[detectIntent] Boosted market_analysis intent (+1) due to strong market context`);
  }
  
  // Find the intent with the highest score
  let highestScore = 0;
  let detectedIntent = 'general';
  
  Object.keys(intents).forEach(intentKey => {
    if (intents[intentKey].score > highestScore) {
      highestScore = intents[intentKey].score;
      detectedIntent = intentKey;
    }
  });
  
  console.log(`[detectIntent] Detected intent: ${detectedIntent} with score ${highestScore}`);
  return detectedIntent;
}

export async function POST(req: Request) {
  const { messages, data } = await req.json();
  const lastMessage = messages[messages.length - 1];
  const userMessage = lastMessage.content;
  const stream = true;
  const encoder = new TextEncoder();
  
  console.log("[API] Chat request received:", userMessage);
  
  // Detect intent from the user's message
  const intent = detectMessageIntent(userMessage);
  console.log("[API] Detected intent:", intent);
  
  // Handle based on intent
  if (intent === "top_traders") {
    console.log("[API] Handling top traders request");
    return new StreamingTextResponse(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(
            `Here are some top-performing traders on the Aptos network that you might want to consider for copy trading:\n\n` +
            `I'm showing you a list of recommended traders based on their historical performance, risk level, and trading style. You can analyze any of these traders to see detailed metrics before deciding to copy their strategies.\n\n` +
            `To view a complete analysis of any trader, simply click "Analyze" next to their profile or type "copy trading from [address]" to analyze a specific trader's address.`
          ));
          controller.close();
        },
      })
    );
  } else if (intent === "copy_specific_trader") {
    const copyTradingCheck = isCopyTradingRequest(userMessage);
    if (copyTradingCheck.isRequest && copyTradingCheck.address) {
      try {
        // Check if the address is valid
        if (!copyTradingService.validateAptosAddress(copyTradingCheck.address)) {
          return new StreamingTextResponse(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode(
                  `The address format appears to be invalid. Aptos addresses should start with 0x followed by 64 hexadecimal characters. Please check the address and try again.`
                ));
                controller.close();
              },
            })
          );
        }
        
        // Format a response about the copy trading analysis
        const address = copyTradingCheck.address;
        return new StreamingTextResponse(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(
                `I'm analyzing the trading profile for address ${address.slice(0, 8)}...${address.slice(-8)}.\n\n` +
                `This might take a moment as I retrieve and analyze on-chain transactions.\n\n` +
                `You'll see a detailed report showing:\n` +
                `• Trading history and performance metrics\n` +
                `• Trading style and risk assessment\n` +
                `• Recommended portfolio allocation\n` +
                `• Recent successful trades to potentially copy\n\n` +
                `The analysis tool will open shortly. Once it loads, you can decide if you want to set up copy trading based on the trader's profile.`
              ));
              controller.close();
            },
          })
        );
    } catch (error) {
        console.error('Error processing copy trading request:', error);
        return new StreamingTextResponse(
          new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(
                `Sorry, I encountered an error while processing your copy trading request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again later.`
              ));
              controller.close();
            },
          })
        );
      }
    }
  } else if (intent === "swap_tokens") {
  // Step 2: Check if this is a swap query
  const swapParams = extractSwapParams(userMessage);
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
  } else if (intent === "lending_rates") {
  // Step 4: Check if this is a lending rate query
  const lendingMatch = userMessage.match(/(?:lending|borrow(?:ing)?|supply|deposit)\s+(?:rates?|apy|interest)\s+(?:for|on)?\s*([a-z]{3,4})/i);
  if (lendingMatch) {
    const token = userMessage.includes('usdc') ? 'USDC' : 
                  userMessage.includes('apt') ? 'APT' :
                  userMessage.includes('usdt') ? 'USDT' :
                  userMessage.includes('dai') ? 'DAI' : null;
    
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

        const ratesMessage = userMessage.includes('all pools') ?
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
  } else if (intent === "market_analysis") {
    // Step 1: Check if this is a market analysis or price prediction query
    if (isMarketAnalysisQuery(userMessage)) {
      const defiService = await import('@/services/defiService').then(mod => mod.default);
      
      try {
        // Extract topic from the message
        let topic = userMessage;
        if (userMessage.includes('price prediction')) {
          topic = 'price prediction';
        } else if (userMessage.includes('sentiment')) {
          topic = 'market sentiment';
        } else if (userMessage.includes('analysis')) {
          topic = 'market analysis';
        }
        
        console.log(`[API] Generating market analysis for topic: ${topic}`);
        const analysis = await defiService.getMarketAnalysis(topic);
        
        return new Response(analysis, {
          headers: { 'Content-Type': 'text/plain' },
        });
      } catch (error) {
        console.error('Error generating market analysis:', error);
        return new Response(
          `I'm sorry, I couldn't generate a market analysis at this time. The error was: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { headers: { 'Content-Type': 'text/plain' } }
        );
      }
    }
  } else if (isAdvancedResearchQuery(userMessage, data)) {
    console.log("[API] Handling advanced research query");
    return await handleAdvancedResearch(userMessage, data);
  } else {
  // Step 5: If none of the specialized handlers matched, use OpenAI with web search
  console.log('[API] No specialized handler matched, using OpenAI web search');
  
  try {
    const userQuery = messages[messages.length - 1].content;
    // Add Aptos context to the search query to get more relevant results
    const searchQuery = `Aptos blockchain DeFi: ${userQuery}`;
    
    console.log(`[OpenAI Web Search] Query: "${searchQuery}"`);
    
    const response = await openaiClient.responses.create({
      model: "gpt-4o",
      tools: [{
        type: "web_search_preview",
        search_context_size: "high", // Use high for more comprehensive results
      }],
      input: searchQuery,
    });
    
    if (!response.output_text) {
      throw new Error('No output text received from OpenAI');
    }
    
    console.log(`[OpenAI Web Search] Response received (${response.output_text.length} chars)`);
    
    // Create a streaming response
    return new StreamingTextResponse(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(new TextEncoder().encode(response.output_text));
          controller.close();
        }
      })
    );
  } catch (error) {
    console.error('Error using OpenAI web search:', error);
    
    // Fallback to a simple response if web search fails
    return new StreamingTextResponse(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(
            `I'm sorry, I couldn't retrieve the latest information about your query at ${getFormattedTimestamp()}. ` +
            `Please try asking a more specific question about Aptos DeFi, or check resources like https://aptoslabs.com or https://defillama.com/chain/Aptos directly.`
          ));
          controller.close();
        },
      })
    );
    }  
  }  
  
  // Add a default fallback response to ensure we always return something
  return new Response(
    encoder.encode(`I'm processing your request about ${userMessage}. Please wait a moment...`),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
  );
} 