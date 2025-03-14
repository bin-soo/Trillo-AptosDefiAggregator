'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import WalletConnect from '@/components/WalletConnect';
import Sidebar from '@/components/Sidebar';
import QuickActions from '@/components/QuickActions';
import { Bars3Icon, ArrowPathIcon } from '@heroicons/react/24/outline';
import FloatingSuggestions from '@/components/FloatingSuggestions';
import { APTOS_COLORS, APTOS_BRAND } from '@/constants/brand';
import AptosLogo from '@/components/AptosLogo';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useNetwork } from './providers';
import { SwapRoute, DeFiAction } from '@/types/defi';
import defiService from '@/services/defiService';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, setInput, setMessages } = useChat();
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const { connected, account } = useWallet();
  const { isTestnet, setNetwork } = useNetwork();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set up DeFi service
  useEffect(() => {
    defiService.setTestnetMode(isTestnet);
  }, [isTestnet]);

  useEffect(() => {
    // Update chat history when messages change
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => ({
        id: Math.random().toString(36).substr(2, 9),
        question: m.content,
        timestamp: new Date()
      }));
    setChatHistory(userMessages);
    
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update connection status when wallet connection changes
  useEffect(() => {
    setIsConnected(connected);
  }, [connected]);

  // Function to toggle between testnet and mainnet
  const toggleNetwork = () => {
    const newNetwork = isTestnet ? 'mainnet' : 'testnet';
    setNetwork(newNetwork);
    
    // Add a system message about network change
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Network changed to ${newNetwork.toUpperCase()}. 
        
${newNetwork === 'testnet' 
  ? '⚠️ You are now on Testnet. Token prices and swap rates will differ from real-world values.' 
  : '🔒 You are now on Mainnet. Real-world token prices and swap rates will apply.'}`
      }
    ]);
  };

  // Function to detect swap intent in user message
  const detectSwapIntent = async (message: string) => {
    // Match patterns like "swap 5 APT to USDC" or "exchange 10 USDC for APT"
    const swapMatch = message.match(/(?:swap|exchange|trade|convert)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for|into)\s+(\w+)/i);
    if (swapMatch) {
      const [_, amount, tokenIn, tokenOut] = swapMatch;
      return {
        amount,
        tokenIn: tokenIn.toUpperCase(),
        tokenOut: tokenOut.toUpperCase()
      };
    }
    
    // Match patterns like "I want to swap 2 APT for USDC" or "I need to exchange 5 USDC to APT"
    const intentMatch = message.match(/(?:want|need|like|can you|could you|please|help me)\s+(?:to\s+)?(?:swap|exchange|trade|convert)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for|into)\s+(\w+)/i);
    if (intentMatch) {
      const [_, amount, tokenIn, tokenOut] = intentMatch;
      return {
        amount,
        tokenIn: tokenIn.toUpperCase(),
        tokenOut: tokenOut.toUpperCase()
      };
    }
    
    // Match patterns like "What's the best rate for swapping 1 APT to USDC?"
    const rateMatch = message.match(/(?:rate|price|value|worth).*(?:swap|exchang|trad|convert).*?(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for|into)\s+(\w+)/i);
    if (rateMatch) {
      const [_, amount, tokenIn, tokenOut] = rateMatch;
      return {
        amount,
        tokenIn: tokenIn.toUpperCase(),
        tokenOut: tokenOut.toUpperCase()
      };
    }
    
    return null;
  };

  // Handle swap intent directly in the client
  const handleSwapIntent = async (userMessage: string) => {
    const swapParams = await detectSwapIntent(userMessage);
    
    if (swapParams && connected) {
      const { amount, tokenIn, tokenOut } = swapParams;
      
      // Add a temporary message from the assistant
      const tempMessageId = Date.now().toString();
      setMessages([
        ...messages,
        {
          id: tempMessageId,
          role: 'assistant',
          content: `I'm analyzing the market for swapping ${amount} ${tokenIn} to ${tokenOut}...`,
        }
      ]);
      
      try {
        // Get token prices for market insights
        const [tokenInPrice, tokenOutPrice] = await Promise.all([
          defiService.getTokenPrice(tokenIn),
          defiService.getTokenPrice(tokenOut)
        ]);
        
        // Get the best swap route
        const route = await defiService.getBestSwapRoute(
          tokenIn as any,
          tokenOut as any,
          amount
        );
        
        // Calculate market insights
        const marketValue = parseFloat(amount) * tokenInPrice;
        const expectedValue = parseFloat(route.expectedOutput) * tokenOutPrice;
        const valueChange = ((expectedValue - marketValue) / marketValue) * 100;
        const valueChangeText = valueChange > 0 ? `+${valueChange.toFixed(2)}%` : `${valueChange.toFixed(2)}%`;
        
        // Get alternative routes for comparison
        const alternativeRoutesText = route.alternativeRoutes && route.alternativeRoutes.length > 0 
          ? `\n\n**Alternative Routes:**\n${route.alternativeRoutes.map(alt => 
              `• ${alt.protocol}: ${alt.expectedOutput} ${tokenOut} (${alt.priceImpact}% impact)`
            ).join('\n')}`
          : '';
        
        // Add testnet-specific information if we're on testnet
        let testnetInfoText = '';
        if (isTestnet) {
          // Query the actual testnet rate
          const testnetRate = await defiService.getTestnetExchangeRate(
            tokenIn as any,
            tokenOut as any
          );
          
          const testnetExpectedOutput = (parseFloat(amount) * testnetRate).toFixed(6);
          
          testnetInfoText = `\n\n## ⚠️ Testnet Mode Detected

**Note:** You are currently on Aptos Testnet where token prices differ from real-world values.

**Testnet Expected Output:** ${testnetExpectedOutput} ${tokenOut}
**Testnet Exchange Rate:** 1 ${tokenIn} ≈ ${testnetRate.toFixed(6)} ${tokenOut}

The above market analysis is based on real-world prices for reference only. Your actual transaction on testnet will use testnet rates.`;
        }
        
        // Format the response with market insights
        const responseContent = `## Market Analysis for ${amount} ${tokenIn} to ${tokenOut}

💰 **Current Market Value**: $${(marketValue).toFixed(2)} (${tokenIn}: $${tokenInPrice.toFixed(2)})
💱 **Expected Output**: ${route.expectedOutput} ${tokenOut} ($${(expectedValue).toFixed(2)})
📊 **Value Change**: ${valueChangeText}
🔄 **Best DEX**: ${route.protocol || route.dex}
📈 **Price Impact**: ${route.priceImpact.toString()}%
⛽ **Estimated Gas**: ${route.estimatedGas} APT

${alternativeRoutesText}

${parseFloat(route.priceImpact.toString()) > 3 ? "⚠️ **Warning**: High price impact detected. Consider reducing your swap amount to minimize slippage." : ""}
${valueChange < -2 ? "⚠️ **Note**: You're losing value in this swap. Consider waiting for better market conditions." : ""}
${testnetInfoText}

Would you like me to execute this swap for you? Click the "Execute Swap" button below or reply with "yes" to proceed.`;
        
        // Create a swap action
        const swapAction: DeFiAction = {
          type: 'swap',
          data: route,
          actionable: true,
          actionText: 'Execute Swap'
        };
        
        // Update the temporary message with the actual response
        setMessages(messages => 
          messages.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: responseContent, action: swapAction } 
              : msg
          )
        );
      } catch (error) {
        console.error('Error getting swap route:', error);
        
        // Update the temporary message with an error
        setMessages(messages => 
          messages.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: `Sorry, I couldn't find a swap route for ${amount} ${tokenIn} to ${tokenOut}. Please try again with different tokens or amount.` } 
              : msg
          )
        );
      }
      
      return true; // Indicate that we handled the swap intent
    }
    
    return false; // Indicate that we didn't handle the message
  };

  // Handle swap confirmation
  const handleSwapConfirmation = async (userMessage: string) => {
    if (userMessage.toLowerCase().match(/^(yes|confirm|execute|proceed|swap it|do it|go ahead|sure|ok|okay)$/)) {
      // Find the last swap action in the messages
      const lastSwapAction = [...messages]
        .reverse()
        .find(msg => msg.role === 'assistant' && msg.action?.type === 'swap');
      
      if (lastSwapAction && lastSwapAction.action) {
        const route = lastSwapAction.action.data as SwapRoute;
        
        // Add a confirmation message
        const confirmationId = Date.now().toString();
        setMessages([
          ...messages,
          {
            id: confirmationId,
            role: 'assistant',
            content: `I'll execute this swap for you. Please confirm the transaction in your wallet when prompted.

I'll update you on the status once it's complete.`
          }
        ]);
        
        // Execute the swap
        try {
          if (!account) {
            throw new Error('Wallet not connected');
          }
          
          const result = await defiService.executeSwap(
            account.address,
            route.fromToken as any,
            route.toToken as any,
            route.fromAmount,
            0.5 // Default slippage
          );
          
          if (!result.success || !result.payload) {
            throw new Error(result.error || 'Failed to prepare transaction');
          }
          
          // Update with transaction pending message
          setMessages(messages => [
            ...messages,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Transaction prepared and ready to sign. Please check your wallet for confirmation.`
            }
          ]);
          
        } catch (error) {
          console.error('Error executing swap:', error);
          
          // Update with error message
          setMessages(messages => [
            ...messages,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Sorry, there was an error executing the swap: ${error instanceof Error ? error.message : 'Unknown error'}.
              
Please try again or adjust your swap parameters.`
            }
          ]);
        }
        
        return true; // Indicate that we handled the confirmation
      }
    }
    
    return false; // Indicate that we didn't handle the message
  };

  // Function to detect portfolio analysis intent
  const detectPortfolioIntent = async (message: string) => {
    const portfolioRegex = /(?:analyze|check|review|evaluate|assess|look at|examine|show|what('s| is) in|how('s| is)) my (?:portfolio|wallet|holdings|assets|tokens|coins|balance)/i;
    return portfolioRegex.test(message);
  };

  // Handle portfolio analysis intent
  const handlePortfolioIntent = async (userMessage: string) => {
    const isPortfolioIntent = await detectPortfolioIntent(userMessage);
    
    if (isPortfolioIntent && connected && account) {
      // Add a temporary message from the assistant
      const tempMessageId = Date.now().toString();
      setMessages([
        ...messages,
        {
          id: tempMessageId,
          role: 'assistant',
          content: `I'm analyzing your wallet holdings...`,
        }
      ]);
      
      try {
        // In a real implementation, you would fetch the user's token balances here
        // For demo purposes, we'll simulate some holdings
        const mockHoldings = [
          { token: 'APT', balance: '10.5', value: 70.88 },
          { token: 'USDC', balance: '25.0', value: 25.0 },
          { token: 'USDT', balance: '15.0', value: 15.0 }
        ];
        
        const totalValue = mockHoldings.reduce((sum, holding) => sum + holding.value, 0);
        
        // Format the response with portfolio insights
        const responseContent = `## Your Portfolio Analysis

💼 **Total Portfolio Value**: $${totalValue.toFixed(2)}

**Holdings:**
${mockHoldings.map(holding => 
  `• ${holding.balance} ${holding.token} ($${holding.value.toFixed(2)} - ${((holding.value / totalValue) * 100).toFixed(1)}% of portfolio)`
).join('\n')}

**Insights:**
• Your portfolio is ${mockHoldings[0].token}-heavy (${((mockHoldings[0].value / totalValue) * 100).toFixed(1)}% allocation)
• Consider diversifying into more yield-generating assets
• Current APT staking APY is around 3.5-4.2%

**Recommended Actions:**
1. Convert some APT to stablecoins for yield farming
2. Explore liquid staking options for your APT
3. Consider adding exposure to Aptos ecosystem tokens

Would you like me to suggest specific yield optimization strategies for your portfolio?`;
        
        // Update the temporary message with the actual response
        setMessages(messages => 
          messages.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: responseContent } 
              : msg
          )
        );
      } catch (error) {
        console.error('Error analyzing portfolio:', error);
        
        // Update the temporary message with an error
        setMessages(messages => 
          messages.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: `Sorry, I couldn't analyze your portfolio at this time. Please try again later.` } 
              : msg
          )
        );
      }
      
      return true; // Indicate that we handled the portfolio intent
    }
    
    return false; // Indicate that we didn't handle the message
  };

  // Function to detect yield optimization intent
  const detectYieldIntent = async (message: string) => {
    const yieldRegex = /(?:best|highest|top|good|better|optimal|maximize|find|suggest|recommend|what('s| is)) (?:yield|apy|interest|returns|rates|opportunities|strategy|strategies) (?:for|on|with) (\d+(?:\.\d+)?) (\w+)/i;
    const match = message.match(yieldRegex);
    
    if (match) {
      const [_, amount, token] = match;
      return { amount, token: token.toUpperCase() };
    }
    
    // Also match general yield questions without specific amount
    const generalYieldRegex = /(?:best|highest|top|good|better|optimal|maximize|find|suggest|recommend|what('s| is)) (?:yield|apy|interest|returns|rates|opportunities|strategy|strategies) (?:for|on|with) (\w+)/i;
    const generalMatch = message.match(generalYieldRegex);
    
    if (generalMatch) {
      const [_, token] = generalMatch;
      return { amount: '1000', token: token.toUpperCase() };
    }
    
    return null;
  };

  // Handle yield optimization intent
  const handleYieldIntent = async (userMessage: string) => {
    const yieldParams = await detectYieldIntent(userMessage);
    
    if (yieldParams) {
      const { amount, token } = yieldParams;
      
      // Add a temporary message from the assistant
      const tempMessageId = Date.now().toString();
      setMessages([
        ...messages,
        {
          id: tempMessageId,
          role: 'assistant',
          content: `I'm finding the best yield opportunities for ${amount} ${token}...`,
        }
      ]);
      
      try {
        // In a real implementation, you would fetch actual yield data
        // For demo purposes, we'll simulate some yield opportunities
        const mockYieldOpportunities = {
          lending: [
            { protocol: 'Abel Finance', apy: '4.2%', risk: 'Medium', lockup: 'None' },
            { protocol: 'Aries Markets', apy: '3.8%', risk: 'Low', lockup: 'None' },
            { protocol: 'Thala CDP', apy: '3.5%', risk: 'Low-Medium', lockup: 'None' }
          ],
          liquidity: [
            { protocol: 'PancakeSwap', pair: `${token}-USDC`, apy: '8.5%', risk: 'Medium-High', impermanentLoss: 'Yes' },
            { protocol: 'Liquidswap', pair: `${token}-USDT`, apy: '7.2%', risk: 'Medium-High', impermanentLoss: 'Yes' }
          ],
          staking: [
            { protocol: 'Amnis Finance', apy: '5.1%', risk: 'Low', lockup: '7 days' },
            { protocol: 'Echo Protocol', apy: '4.8%', risk: 'Low', lockup: 'None' }
          ]
        };
        
        // Calculate potential earnings
        const parseAmount = parseFloat(amount);
        const bestLendingApy = parseFloat(mockYieldOpportunities.lending[0].apy);
        const bestLpApy = parseFloat(mockYieldOpportunities.liquidity[0].apy);
        const bestStakingApy = parseFloat(mockYieldOpportunities.staking[0].apy);
        
        const lendingYearly = (parseAmount * bestLendingApy / 100).toFixed(2);
        const lpYearly = (parseAmount * bestLpApy / 100).toFixed(2);
        const stakingYearly = (parseAmount * bestStakingApy / 100).toFixed(2);
        
        // Format the response with yield insights
        const responseContent = `## Best Yield Opportunities for ${amount} ${token}

### Lending Protocols
${mockYieldOpportunities.lending.map((opp, i) => 
  `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} **${opp.protocol}**: ${opp.apy} APY (Risk: ${opp.risk})`
).join('\n')}

### Liquidity Provision
${mockYieldOpportunities.liquidity.map((opp, i) => 
  `${i === 0 ? '🥇' : '🥈'} **${opp.protocol}** (${opp.pair}): ${opp.apy} APY (Risk: ${opp.risk}, IL: ${opp.impermanentLoss})`
).join('\n')}

### Staking Options
${mockYieldOpportunities.staking.map((opp, i) => 
  `${i === 0 ? '🥇' : '🥈'} **${opp.protocol}**: ${opp.apy} APY (Risk: ${opp.risk}, Lockup: ${opp.lockup})`
).join('\n')}

### Potential Yearly Earnings
• Lending: $${lendingYearly} with ${mockYieldOpportunities.lending[0].protocol}
• Liquidity: $${lpYearly} with ${mockYieldOpportunities.liquidity[0].protocol}
• Staking: $${stakingYearly} with ${mockYieldOpportunities.staking[0].protocol}

### Recommendation
For ${amount} ${token}, I recommend a balanced approach:
• 50% in ${mockYieldOpportunities.staking[0].protocol} for stable returns
• 30% in ${mockYieldOpportunities.lending[0].protocol} for moderate yield
• 20% in ${mockYieldOpportunities.liquidity[0].protocol} for higher returns with managed risk

Would you like me to help you execute any of these strategies?`;
        
        // Update the temporary message with the actual response
        setMessages(messages => 
          messages.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: responseContent } 
              : msg
          )
        );
      } catch (error) {
        console.error('Error finding yield opportunities:', error);
        
        // Update the temporary message with an error
        setMessages(messages => 
          messages.map(msg => 
            msg.id === tempMessageId 
              ? { ...msg, content: `Sorry, I couldn't find yield opportunities for ${amount} ${token} at this time. Please try again later.` } 
              : msg
          )
        );
      }
      
      return true; // Indicate that we handled the yield intent
    }
    
    return false; // Indicate that we didn't handle the message
  };

  const handleQuickAction = async (query: string) => {
    // Create a synthetic form event
    const event = new Event('submit') as any;
    event.preventDefault = () => {};
    
    // Set input and submit immediately
    setInput(query);
    await handleSubmit(event);
  };

  // Override the default handleSubmit to check for various intents
  const handleSubmitWithIntentDetection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Store the current input before it gets cleared by handleSubmit
    const currentInput = input;
    
    // Check for different intents in order of priority
    
    // First, check if this is a swap confirmation
    const isConfirmation = await handleSwapConfirmation(currentInput);
    if (isConfirmation) {
      // If we handled it as a confirmation, call the original handleSubmit
      await handleSubmit(e);
      return;
    }
    
    // Then, check if this is a swap intent
    const isSwapIntent = await handleSwapIntent(currentInput);
    if (isSwapIntent) {
      // If we handled it as a swap intent, just clear the input
      setInput('');
      return;
    }
    
    // Check if this is a portfolio analysis intent
    const isPortfolioIntent = await handlePortfolioIntent(currentInput);
    if (isPortfolioIntent) {
      // If we handled it as a portfolio intent, just clear the input
      setInput('');
      return;
    }
    
    // Check if this is a yield optimization intent
    const isYieldIntent = await handleYieldIntent(currentInput);
    if (isYieldIntent) {
      // If we handled it as a yield intent, just clear the input
      setInput('');
      return;
    }
    
    // Otherwise, proceed with the normal chat flow
    await handleSubmit(e);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-aptos-light-blue via-white to-aptos-light-purple">
      {/* Sidebar */}
      <Sidebar
        chatHistory={chatHistory}
        onHistoryClick={handleQuickAction}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-aptos-light-blue rounded-lg transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <AptosLogo variant="mark" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-aptos bg-clip-text text-transparent">
              {APTOS_BRAND.name}
            </h1>
            <div className="flex items-center space-x-4">
              {/* Network Indicator with Toggle */}
              <button 
                onClick={toggleNetwork}
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  isTestnet 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200' 
                    : 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                }`}
              >
                <span>{isTestnet ? '⚠️ Testnet' : '🔒 Mainnet'}</span>
                <ArrowPathIcon className="h-4 w-4 ml-1" />
              </button>
              <nav className="hidden md:flex space-x-4">
                <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link href="/swap" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  AI Swap
                </Link>
              </nav>
              <WalletConnect onConnect={() => setIsConnected(true)} />
            </div>
          </div>
        </header>

        {/* Main Content with padding for suggestions */}
        <main className="flex-1 w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mt-24 mb-40">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-3xl font-semibold text-gray-900 mb-6">
                  Welcome to Aptos DeFi Assistant
                </h2>
                <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
                  Your AI-powered guide to the Aptos DeFi ecosystem. Get real-time lending rates,
                  compare protocols, and discover the best opportunities.
                </p>
                <div className="mb-8">
                  <Link 
                    href="/swap" 
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Try AI-Powered Swap
                  </Link>
                </div>
                <QuickActions onActionClick={handleQuickAction} />
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, i) => (
                  <ChatMessage key={i} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Fixed bottom section with suggestions and input */}
        <div className="fixed bottom-0 left-0 right-0">
          {/* Floating Suggestions */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
            <FloatingSuggestions 
              onActionClick={handleQuickAction}
              currentQuery={input}
            />
          </div>
          
          {/* Chat Input with gradient background */}
          <div className="bg-gradient-to-t from-white via-white/90 to-transparent pt-4 pb-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <ChatInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmitWithIntentDetection}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
