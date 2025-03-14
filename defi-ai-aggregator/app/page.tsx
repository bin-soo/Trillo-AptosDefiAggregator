'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useNetwork } from './providers';
import { useSearchParams, useRouter } from 'next/navigation';
import { CommandLineIcon, ChartBarIcon, CodeBracketIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import AptosLogo from '@/components/AptosLogo';
import WalletConnect from '@/components/WalletConnect';
import { SwapRoute, DeFiAction } from '@/types/defi';
import { TokenType } from '@/services/constants';
import defiService from '@/services/defiService';

// Dynamically import components that might cause hydration issues
const ChatMessage = dynamic(() => import('@/components/ChatMessage'), { ssr: false });
const ChatInput = dynamic(() => import('@/components/ChatInput'), { ssr: false });
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });
const QuickActions = dynamic(() => import('@/components/QuickActions'), { ssr: false });
const FloatingSuggestions = dynamic(() => import('@/components/FloatingSuggestions'), { ssr: false });

// Define a custom message type that includes action
interface CustomMessage extends Message {
  action?: DeFiAction;
}

export default function Home() {
  const { messages: aiMessages, input, handleInputChange, handleSubmit, setInput, setMessages: setAiMessages } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; question: string; timestamp: Date }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { connected, account } = useWallet();
  const { network, setNetwork, isTestnet } = useNetwork();
  const [isProcessing, setIsProcessing] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Cast messages to our custom type
  const messages = aiMessages as CustomMessage[];
  
  // Type-safe setter for messages
  const setMessages = (messagesOrUpdater: CustomMessage[] | ((messages: CustomMessage[]) => CustomMessage[])) => {
    if (typeof messagesOrUpdater === 'function') {
      setAiMessages(messagesOrUpdater as any);
    } else {
      setAiMessages(messagesOrUpdater);
    }
  };

  // Check for query parameter on initial load
  useEffect(() => {
    if (!isMounted) return;
    
    const query = searchParams.get('query');
    if (query) {
      // Submit the query automatically
      const event = new Event('submit') as any;
      handleInputChange({ target: { value: query } } as any);
      setTimeout(() => {
        handleSubmit(event);
        // Clear the query parameter from URL to prevent resubmission on refresh
        router.replace('/');
      }, 500);
    }
  }, [searchParams, handleInputChange, handleSubmit, router, isMounted]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (isMounted) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMounted]);

  // Update chat history when new user message is added
  useEffect(() => {
    if (!isMounted) return;
    
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      setChatHistory(prev => [
        ...prev,
        {
          id: lastUserMessage.id,
          question: lastUserMessage.content,
          timestamp: new Date()
        }
      ]);
    }
  }, [messages, isMounted]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Toggle network between mainnet and testnet
  const toggleNetwork = () => {
    const newNetwork = network === 'mainnet' ? 'testnet' : 'mainnet';
    setNetwork(newNetwork);
    
    // Update the defiService with the new network setting
    defiService.setTestnetMode(newNetwork === 'testnet');
    
    // Add a system message about the network change
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Network switched to ${newNetwork}. All operations will now use ${newNetwork} data and connections.`
      }
    ]);
  };

  // Handle clicking on a chat history item
  const handleHistoryClick = (question: string) => {
    setInput(question);
    setIsSidebarOpen(false);
  };

  // Detect swap intent in user message
  const detectSwapIntent = async (message: string) => {
    const swapRegex = /swap\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to|for)\s+(\w+)/i;
    const match = message.match(swapRegex);
    
    if (match) {
      const [_, amount, tokenIn, tokenOut] = match;
      
      // Validate tokens
      const validTokens: TokenType[] = ['APT', 'USDC', 'USDT', 'DAI'];
      const normalizedTokenIn = tokenIn.toUpperCase() as TokenType;
      const normalizedTokenOut = tokenOut.toUpperCase() as TokenType;
      
      if (!validTokens.includes(normalizedTokenIn) || !validTokens.includes(normalizedTokenOut)) {
        return { isSwapIntent: false };
      }
      
      return {
        isSwapIntent: true, 
        tokenIn: normalizedTokenIn, 
        tokenOut: normalizedTokenOut, 
        amount 
      };
    }
    
    return { isSwapIntent: false };
  };

  // Handle swap intent
  const handleSwapIntent = async (userMessage: string) => {
    const { isSwapIntent, tokenIn = 'APT', tokenOut = 'USDC', amount = '1' } = await detectSwapIntent(userMessage);
    
    if (isSwapIntent) {
      // Add a temporary message while fetching the swap route
      const tempMessageId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        {
          id: tempMessageId,
          role: 'assistant',
          content: `Looking for the best swap route for ${amount} ${tokenIn} to ${tokenOut}...`
        }
      ]);
      
      try {
        // Get the best swap route
        const route = await defiService.getBestSwapRoute(
          tokenIn as TokenType,
          tokenOut as TokenType,
          amount
        );
        
        // Create a swap action
        const swapAction: DeFiAction = {
          type: 'swap',
          data: route,
          actionable: true,
          actionText: 'Execute Swap'
        };
        
        // Format the response
        const responseContent = `I found the best route to swap ${amount} ${tokenIn} to ${tokenOut}:

## Best Swap Route
• **Exchange**: ${route.dex || route.protocol}
• **Expected Output**: ${route.expectedOutput} ${tokenOut}
• **Price Impact**: ${route.priceImpact}%
• **Estimated Gas**: ${route.estimatedGas} APT

${route.alternativeRoutes && route.alternativeRoutes.length > 0 ? `
## Alternative Routes
${route.alternativeRoutes.map(alt => 
  `• **${alt.protocol}**: ${alt.expectedOutput} ${tokenOut} (Impact: ${alt.priceImpact})`
).join('\n')}
` : ''}

Would you like me to execute this swap for you? Click the "Execute Swap" button below or reply with "yes" to confirm.`;
        
        // Update the temporary message with the actual response and attach the action
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
    
    return false; // Indicate that this wasn't a swap intent
  };

  // Handle swap confirmation
  const handleSwapConfirmation = async (userMessage: string) => {
    const confirmationRegex = /yes|confirm|execute|proceed|do it|swap it/i;
    if (confirmationRegex.test(userMessage)) {
      // Find the last swap action
      const lastSwapAction = [...messages]
        .reverse()
        .find(msg => msg.role === 'assistant' && msg.action?.type === 'swap');
      
      if (lastSwapAction && lastSwapAction.action) {
        const route = lastSwapAction.action.data as SwapRoute;
        
        // Add a confirmation message
        const confirmationId = Date.now().toString();
        setMessages(prev => [
          ...prev,
          {
            id: confirmationId,
            role: 'assistant',
            content: `I'll execute the swap of ${route.amount || route.fromAmount} ${route.tokenIn?.symbol || route.fromToken} to ${route.tokenOut?.symbol || route.toToken} for you now.`
          }
        ]);
        
        // Check if wallet is connected
        if (!connected || !account) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: 'Please connect your wallet first to execute the swap. Click the "Connect Wallet" button in the top right corner.'
            }
          ]);
          return true;
        }
        
        try {
          setIsProcessing(true);
          
          // Log the route data for debugging
          console.log('Executing swap with route:', route);
          
          // Execute the swap
          const result = await defiService.executeSwap(
            account.address.toString(),
            route.tokenIn?.symbol as TokenType || route.fromToken as TokenType,
            route.tokenOut?.symbol as TokenType || route.toToken as TokenType,
            route.amount || route.fromAmount,
            0.5, // 0.5% slippage
            20 * 60 // 20 minutes deadline
          );
          
          setIsProcessing(false);
          
          if (result.success) {
            // Update with success message
            setMessages(prev => [
              ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
                content: `✅ Swap transaction submitted successfully!

**Transaction Hash**: ${result.txHash}

You can view your transaction on the [Aptos Explorer](https://explorer.aptoslabs.com/txn/${result.txHash}?network=${isTestnet ? 'testnet' : 'mainnet'}).

The swap of ${route.amount || route.fromAmount} ${route.tokenIn?.symbol || route.fromToken} to approximately ${route.expectedOutput} ${route.tokenOut?.symbol || route.toToken} should be completed shortly.`
              }
            ]);
          } else {
            // Update with error message
            setMessages(prev => [
              ...prev,
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: `❌ There was an error executing the swap: ${result.error || 'Unknown error'}.

Please try again or adjust your swap parameters.`
              }
            ]);
          }
        } catch (error) {
          setIsProcessing(false);
          console.error('Error executing swap:', error);
          
          // Update with error message
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: `❌ Sorry, there was an error executing the swap: ${error instanceof Error ? error.message : 'Unknown error'}.
              
Please try again or adjust your swap parameters.`
            }
          ]);
        }
        
        return true; // Indicate that we handled the confirmation
      }
    }
    
    return false; // Indicate that this wasn't a confirmation
  };

  // Detect portfolio analysis intent
  const detectPortfolioIntent = async (message: string) => {
    const portfolioRegex = /portfolio|holdings|assets|balance|analyze my wallet/i;
    return { isPortfolioIntent: portfolioRegex.test(message) };
  };

  // Handle portfolio analysis intent
  const handlePortfolioIntent = async (userMessage: string) => {
    const { isPortfolioIntent } = await detectPortfolioIntent(userMessage);
    
    if (isPortfolioIntent) {
      // Check if wallet is connected
      if (!connected || !account) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Please connect your wallet first so I can analyze your portfolio.'
          }
        ]);
        return true;
      }
      
      // Add a temporary message while analyzing the portfolio
      const tempMessageId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        {
          id: tempMessageId,
          role: 'assistant',
          content: `Analyzing your portfolio at ${account.address}...`
        }
      ]);
      
      try {
        // In a real implementation, you would fetch the user's portfolio data here
        // For now, we'll use a mock response
        
        // Format the response
        const responseContent = `## Portfolio Analysis for ${account.address.slice(0, 6)}...${account.address.slice(-4)}

### Current Holdings
• **APT**: 10.5 ($${(10.5 * 8.75).toFixed(2)})
• **USDC**: 250.00 ($250.00)
• **USDT**: 100.00 ($100.00)

### Total Value: $441.88

### Recommendations
1. **Diversification**: Your portfolio is heavily weighted towards APT (73%). Consider diversifying into other assets.
2. **Yield Opportunities**: Your USDC could earn up to 5.2% APY on Aries Markets.
3. **Risk Management**: Consider setting stop-loss orders for your APT position.

Would you like me to suggest specific actions to optimize your portfolio?`;
        
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
    
    return false; // Indicate that this wasn't a portfolio intent
  };

  // Detect yield opportunities intent
  const detectYieldIntent = async (message: string) => {
    const yieldRegex = /yield|apy|interest|lending|staking|earn/i;
    const tokenRegex = /(APT|USDC|USDT|DAI)/i;
    const amountRegex = /(\d+(?:\.\d+)?)/;
    
    if (yieldRegex.test(message)) {
      let token = 'USDC';
      let amount = '100';
      
      // Extract token if present
      const tokenMatch = message.match(tokenRegex);
      if (tokenMatch) {
        token = tokenMatch[1].toUpperCase();
      }
      
      // Extract amount if present
      const amountMatch = message.match(amountRegex);
      if (amountMatch) {
        amount = amountMatch[1];
      }
      
      return { isYieldIntent: true, token, amount };
    }
    
    return { isYieldIntent: false };
  };

  // Handle yield opportunities intent
  const handleYieldIntent = async (userMessage: string) => {
    const { isYieldIntent, token = 'USDC', amount = '100' } = await detectYieldIntent(userMessage);
    
    if (isYieldIntent) {
      // Add a temporary message while fetching yield opportunities
      const tempMessageId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        {
          id: tempMessageId,
          role: 'assistant',
          content: `Finding the best yield opportunities for ${amount} ${token}...`
        }
      ]);
      
      try {
        // Get yield opportunities
        const opportunities = await defiService.getYieldOpportunities(token);
        
        // Format the response
        const responseContent = `## Best Yield Opportunities for ${amount} ${token}

### Lending Protocols
${opportunities.lending.slice(0, 3).map(lending => 
  `• **${lending.protocol}**: ${lending.apy}% APY (TVL: $${parseInt(lending.totalSupply).toLocaleString()})`
).join('\n')}

### Liquidity Pools
${opportunities.liquidity.slice(0, 3).map(pool => 
  `• **${pool.protocol}** ${pool.tokens.join('-')}: ${pool.apy.total.toFixed(2)}% APY (TVL: $${pool.tvl.total.toLocaleString()})`
).join('\n')}

### Estimated Earnings (Annual)
• Best Lending: $${(parseFloat(amount) * parseFloat(opportunities.lending[0]?.apy || '0') / 100).toFixed(2)}
• Best LP: $${(parseFloat(amount) * opportunities.liquidity[0]?.apy.total / 100).toFixed(2)}

Would you like me to explain more about any specific opportunity?`;
        
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
    
    return false; // Indicate that this wasn't a yield intent
  };

  // Handle quick action
  const handleQuickAction = async (query: string) => {
    // If the query is different from the current input, update the input
    // This handles QuickActions component clicks
    if (query !== input) {
      setInput(query);
    }
    
    // Create a form submit event and pass it to handleSubmitWithIntentDetection
    const event = new Event('submit', { cancelable: true }) as any;
    setTimeout(() => {
      handleSubmitWithIntentDetection(event);
    }, 100); // Small delay to ensure input is updated
  };

  // Handle form submission with intent detection
  const handleSubmitWithIntentDetection = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // First, add the user message to the chat
    const userMessage = input.trim();
    handleSubmit(e);
    
    // Then, detect and handle intents
    const isSwapIntent = await handleSwapIntent(userMessage);
    if (isSwapIntent) return;
    
    const isSwapConfirmation = await handleSwapConfirmation(userMessage);
    if (isSwapConfirmation) return;
    
    const isPortfolioIntent = await handlePortfolioIntent(userMessage);
    if (isPortfolioIntent) return;
    
    const isYieldIntent = await handleYieldIntent(userMessage);
    if (isYieldIntent) return;
    
    // If no specific intent was detected, the default AI response will be used
  };

  // Show a loading state during SSR or before client hydration
  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Tech background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-[linear-gradient(to_right,#8B5CF680_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF680_1px,transparent_1px)]" 
                 style={{ backgroundSize: '40px 40px' }}>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-blue-500/20 animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-purple-500/20 animate-pulse-slow" 
               style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full border border-blue-500/20 animate-pulse-slow"
               style={{ animationDelay: '2s' }}></div>
               
          {/* Tech circles */}
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/5"></div>
          <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-purple-500/5"></div>
          
          {/* Code-like elements */}
          <div className="absolute top-1/4 left-8 text-blue-500/10 text-xs font-mono">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="my-1">{'{'}aptos::move::module{'}'}::{i + 1}</div>
            ))}
          </div>
          <div className="absolute bottom-1/4 right-8 text-purple-500/10 text-xs font-mono">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="my-1">fn defi_aggregator::{i + 1}() {'{'} ... {'}'}</div>
            ))}
          </div>
        </div>

        {/* Sidebar for chat history and resources */}
        <Sidebar
          chatHistory={chatHistory}
          onHistoryClick={handleHistoryClick}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />

        {/* Main content */}
        <div className="flex flex-col h-screen">
          {/* Header */}
          <header className="sticky top-0 z-10 backdrop-blur-md border-b border-gray-700 bg-black/30">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
                  <CommandLineIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-2">
                  <AptosLogo />
                  <span className="font-mono text-xl text-blue-400">DeFi.AI</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Link 
                  href="/swap"
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 flex items-center space-x-1"
                  title="Swap Tokens"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span className="hidden md:inline text-sm">Swap</span>
                </Link>
                <Link 
                  href="/market"
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 flex items-center space-x-1"
                  title="Market Dashboard"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  <span className="hidden md:inline text-sm">Markets</span>
                </Link>
                <button 
                  onClick={toggleNetwork}
                  className={`px-3 py-1 rounded-lg text-sm font-mono ${
                    isTestnet 
                      ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' 
                      : 'bg-green-900/50 text-green-400 border border-green-700'
                  }`}
                >
                  {isTestnet ? 'TESTNET' : 'MAINNET'}
                </button>
                <WalletConnect onConnect={() => {}} />
              </div>
            </div>
          </header>

          {/* Chat container - centered with max-width */}
          <div className="flex-1 overflow-hidden flex flex-col items-center">
            <div className="w-full max-w-4xl px-4 flex-1 flex flex-col">
              {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="max-w-2xl w-full space-y-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-6">
                      <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <SparklesIcon className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                    <h1 className="text-3xl font-bold text-blue-300 mb-2">Aptos DeFi AI Assistant</h1>
                    <p className="text-gray-400 max-w-md mx-auto">
                      Your AI-powered guide to navigating the Aptos DeFi ecosystem. Ask about swaps, yields, market analysis, and more.
                    </p>
                  </div>
                  
                  <QuickActions onActionClick={handleQuickAction} />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                      <h3 className="text-lg font-medium text-blue-300 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Swap Tokens
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        Find the best rates across DEXes and execute trades with minimal slippage.
                      </p>
                      <Link 
                        href="/swap"
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Go to swap page →
                      </Link>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                      <h3 className="text-lg font-medium text-blue-300 mb-2 flex items-center">
                        <CodeBracketIcon className="h-5 w-5 mr-2" />
                        Developer Mode
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        Access technical details, smart contract interactions, and developer resources.
                      </p>
                      <button 
                        onClick={() => handleQuickAction("Show me the technical architecture of Aptos DeFi protocols")}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        Explore technical docs →
                      </button>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                      <h3 className="text-lg font-medium text-blue-300 mb-2 flex items-center">
                        <ChartBarIcon className="h-5 w-5 mr-2" />
                        Market Analysis
                      </h3>
                      <p className="text-gray-400 text-sm mb-3">
                        Get AI-powered insights on market trends, price predictions, and investment strategies.
                      </p>
                      <Link 
                        href="/market"
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        View market dashboard →
                      </Link>
                    </div>
                  </div>
                </div>
                </div>
              ) : (
              <div ref={messagesEndRef} className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                </div>
              )}
            
              {/* Floating suggestions */}
              {messages.length > 0 && (
                <div className="py-2">
                <FloatingSuggestions 
                  onActionClick={handleQuickAction}
                  currentQuery={input}
                  setInputText={setInput}
                />
              </div>
              )}
            </div>
            
            {/* Chat input - full width but content is centered */}
            <div className="w-full p-4 border-t border-gray-700 bg-gray-800/50 backdrop-blur-md">
              <div className="max-w-4xl mx-auto">
                {isMounted && (
                  <form onSubmit={handleSubmitWithIntentDetection}>
                  <ChatInput
                    input={input}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmitWithIntentDetection}
                    isConnected={connected}
                  />
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#8B5CF680_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF680_1px,transparent_1px)]" 
               style={{ backgroundSize: '40px 40px' }}>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-blue-500/20 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-purple-500/20 animate-pulse-slow" 
             style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full border border-blue-500/20 animate-pulse-slow"
             style={{ animationDelay: '2s' }}></div>
             
        {/* Tech circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/5"></div>
        <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-purple-500/5"></div>
        
        {/* Code-like elements */}
        <div className="absolute top-1/4 left-8 text-blue-500/10 text-xs font-mono">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="my-1">{'{'}aptos::move::module{'}'}::{i + 1}</div>
          ))}
        </div>
        <div className="absolute bottom-1/4 right-8 text-purple-500/10 text-xs font-mono">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="my-1">fn defi_aggregator::{i + 1}() {'{'} ... {'}'}</div>
          ))}
        </div>
      </div>

      {/* Sidebar for chat history and resources */}
      <Sidebar
        chatHistory={chatHistory}
        onHistoryClick={handleHistoryClick}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main content */}
      <div className="flex flex-col h-screen">
        {/* Sidebar */}
        <Sidebar
          chatHistory={chatHistory}
          onHistoryClick={handleHistoryClick}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
          <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-md">
            <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-3">
              <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-300"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
                <div className="flex items-center space-x-2">
                  <AptosLogo />
                  <span className="font-mono text-xl text-blue-400">DeFi.AI</span>
                </div>
            </div>
              <div className="flex items-center space-x-3">
              <button 
                onClick={toggleNetwork}
                  className={`px-3 py-1 rounded-lg text-sm font-mono ${
                  isTestnet 
                      ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' 
                      : 'bg-blue-900/50 text-blue-400 border border-blue-700'
                }`}
              >
                  {isTestnet ? 'TESTNET' : 'MAINNET'}
              </button>
                {connected ? (
                  <div className="flex items-center space-x-2 bg-gray-700/50 px-3 py-1 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-300 font-mono">
                      {account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}
                    </span>
                  </div>
                ) : (
                  <WalletConnect onConnect={() => {}} />
                )}
              </div>
            </div>
          </div>
          
          {/* Chat area with fixed height and scrollable content */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 -z-10"></div>
            
            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[url('/static/grid-pattern.svg')] bg-repeat opacity-5 -z-10"></div>
            
            {/* Floating elements */}
            <div className="absolute inset-0 overflow-hidden -z-10">
              <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-blue-900/20 blur-3xl"></div>
              <div className="absolute bottom-1/3 right-1/3 h-64 w-64 rounded-full bg-purple-900/20 blur-3xl"></div>
            </div>
            
            {/* Code-like background elements */}
            <div className="absolute left-4 top-1/4 text-gray-800/20 font-mono text-xs -z-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="my-1">fn process_message::{i + 1}() {'{'} ... {'}'}</div>
              ))}
            </div>
            
            {/* Chat messages - make this scrollable with fixed height */}
            <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: 'thin' }}>
              <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6 max-w-2xl w-full">
                      <h2 className="text-2xl font-bold text-center text-blue-400 mb-4">Welcome to Aptos DeFi Assistant</h2>
                      <p className="text-gray-300 text-center mb-6">
                        Your AI-powered guide to navigating the Aptos DeFi ecosystem. Ask about swaps, yields, market analysis, or anything DeFi related.
                      </p>
                      
                <QuickActions onActionClick={handleQuickAction} />
                    </div>
              </div>
            ) : (
                  <div className="space-y-4">
                {messages.map((message, i) => (
                  <ChatMessage key={i} message={message} />
                ))}
              </div>
            )}
          </div>
            </div>
          
            {/* Floating suggestions */}
            {messages.length > 0 && (
              <div className="py-2">
            <FloatingSuggestions 
              onActionClick={handleQuickAction}
              currentQuery={input}
                setInputText={setInput}
            />
            </div>
            )}
          </div>
          
          {/* Chat input - full width but content is centered */}
          <div className="w-full p-4 border-t border-gray-700 bg-gray-800/50 backdrop-blur-md">
            <div className="max-w-4xl mx-auto">
              {isMounted && (
                <form onSubmit={handleSubmitWithIntentDetection}>
              <ChatInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmitWithIntentDetection}
                  isConnected={connected}
              />
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
