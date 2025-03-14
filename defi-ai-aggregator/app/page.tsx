'use client';

import { useChat } from 'ai/react';
import { useState, useEffect, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import WalletConnect from '@/components/WalletConnect';
import Sidebar from '@/components/Sidebar';
import QuickActions from '@/components/QuickActions';
import { Bars3Icon, ArrowPathIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import FloatingSuggestions from '@/components/FloatingSuggestions';
import { APTOS_COLORS, APTOS_BRAND } from '@/constants/brand';
import AptosLogo from '@/components/AptosLogo';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useNetwork } from './providers';
import { SwapRoute, DeFiAction } from '@/types/defi';
import defiService from '@/services/defiService';
import MarketDashboard from '@/components/MarketDashboard';
import MarketAnalysis from '@/components/MarketAnalysis';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, setInput, setMessages } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; question: string; timestamp: Date }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { connected, account } = useWallet();
  const { network, setNetwork, isTestnet } = useNetwork();
  const [activeView, setActiveView] = useState<'chat' | 'dashboard'>('dashboard'); // Default to dashboard view

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update chat history when new user message is added
  useEffect(() => {
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
  }, [messages]);

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
      console.log(`Detected swap intent: ${amount} ${tokenIn} to ${tokenOut}`);
      return { amount, tokenIn, tokenOut };
    }
    
    // Try more flexible pattern matching
    const tokenRegex = /(\w+)\s+(?:to|for)\s+(\w+)/i;
    const amountRegex = /(\d+(?:\.\d+)?)\s+(\w+)/i;
    
    const tokenMatch = message.match(tokenRegex);
    const amountMatch = message.match(amountRegex);
    
    if (tokenMatch && amountMatch && message.toLowerCase().includes('swap')) {
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
    
    return null;
  };

  // Handle swap intent
  const handleSwapIntent = async (userMessage: string) => {
    const swapParams = await detectSwapIntent(userMessage);
    
    if (swapParams) {
      const { amount, tokenIn, tokenOut } = swapParams;
      
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
        const swapRoute = await defiService.getBestSwapRoute(
          tokenIn as any,
          tokenOut as any,
          amount
        );
        
        console.log('Swap route:', swapRoute);
        
        // Create a swap action
        const swapAction: DeFiAction = {
          type: 'swap',
          data: swapRoute,
          actionable: true,
          actionText: 'Execute Swap'
        };
        
        // Format the response
        const responseContent = `I found the best route to swap ${amount} ${tokenIn} to ${tokenOut}:
        
• Expected output: ${swapRoute.expectedOutput} ${tokenOut}
• Best DEX: ${swapRoute.protocol || swapRoute.dex}
• Price impact: ${swapRoute.priceImpact}%
• Estimated gas: ${swapRoute.estimatedGas}

Would you like me to execute this swap for you?`;
        
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
    
    return false; // Indicate that this wasn't a swap intent
  };

  // Handle swap confirmation
  const handleSwapConfirmation = async (userMessage: string) => {
    const confirmationRegex = /yes|confirm|execute|proceed|go ahead|swap it|do it/i;
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
            content: `I'll execute the swap of ${route.fromAmount} ${route.fromToken} to ${route.toToken} for you now.`
          }
        ]);
        
        // Check if wallet is connected
        if (!connected || !account) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: 'Please connect your wallet first to execute the swap.'
            }
          ]);
          return true;
        }
        
        try {
          // Execute the swap
          const result = await defiService.executeSwap(
            account.address,
            route.fromToken as any,
            route.toToken as any,
            route.fromAmount,
            0.5, // Default slippage
            20 * 60 // Default deadline (20 minutes)
          );
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to execute swap');
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
    
    return false; // Indicate that this wasn't a confirmation
  };

  // Detect portfolio analysis intent
  const detectPortfolioIntent = async (message: string) => {
    const portfolioRegex = /portfolio|holdings|assets|balance|analyze my/i;
    return portfolioRegex.test(message);
  };

  // Handle portfolio analysis intent
  const handlePortfolioIntent = async (userMessage: string) => {
    const isPortfolioIntent = await detectPortfolioIntent(userMessage);
    
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
        // For now, we'll simulate a portfolio analysis
        
        // Simulate some delay for the analysis
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Format the response
        const responseContent = `## Portfolio Analysis

Based on your wallet at ${account.address.slice(0, 6)}...${account.address.slice(-4)}, here's my analysis:

### Current Holdings
• 10.5 APT ($63.00)
• 120 USDC ($120.00)
• 0.5 BTC ($25,000.00)

### Recommendations
• Your portfolio is heavily weighted towards BTC (98.5%). Consider diversifying.
• APT has shown strong momentum recently. Consider increasing your position.
• There's a good yield opportunity for your USDC on Aries Markets (5.2% APY).

Would you like more specific recommendations for rebalancing?`;
        
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
    const yieldRegex = /yield|apy|interest|lending|staking|earn|best rate/i;
    const match = message.match(yieldRegex);
    
    if (match) {
      // Try to extract token and amount
      const tokenRegex = /(\w+)\s+(?:yield|apy|interest|lending|staking|earn|rate)/i;
      const amountRegex = /(\d+(?:\.\d+)?)\s+(\w+)/i;
      
      const tokenMatch = message.match(tokenRegex);
      const amountMatch = message.match(amountRegex);
      
      let token = 'USDC'; // Default token
      let amount = '100'; // Default amount
      
      if (tokenMatch && tokenMatch[1]) {
        token = tokenMatch[1].toUpperCase();
      }
      
      if (amountMatch) {
        amount = amountMatch[1];
        if (amountMatch[2]) {
          token = amountMatch[2].toUpperCase();
        }
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

For ${amount} ${token}, the best option is ${opportunities.lending[0]?.protocol || 'Unknown'} with ${opportunities.lending[0]?.apy || '0'}% APY, which would earn you approximately ${(parseFloat(amount) * parseFloat(opportunities.lending[0]?.apy || '0') / 100).toFixed(2)} ${token} per year.

Would you like more details on any specific protocol?`;
        
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
    setInput(query);
    
    // Submit the form programmatically
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
    await handleSubmitWithIntentDetection(fakeEvent);
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

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <AptosLogo />
              <span className="font-semibold text-xl">DeFi AI Advisor</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`p-2 rounded-lg ${activeView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
              title="Market Dashboard"
            >
              <ChartBarIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setActiveView('chat')}
              className={`p-2 rounded-lg ${activeView === 'chat' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
              title="AI Chat"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </button>
            <button
              onClick={toggleNetwork}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                isTestnet 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              {isTestnet ? 'Testnet' : 'Mainnet'}
            </button>
            <WalletConnect onConnect={() => {}} />
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        chatHistory={chatHistory}
        onHistoryClick={handleHistoryClick}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
      />

      {/* Main content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {activeView === 'dashboard' ? (
          <div className="space-y-6">
            <MarketDashboard />
            <MarketAnalysis onQuerySubmit={handleQuickAction} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Chat messages */}
            <div className="space-y-4 mb-6">
            {messages.length === 0 ? (
                <div className="py-8">
                <QuickActions onActionClick={handleQuickAction} />
              </div>
            ) : (
                messages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))
              )}
                <div ref={messagesEndRef} />
              </div>

            {/* Suggestions */}
            {messages.length > 0 && (
              <FloatingSuggestions onActionClick={handleQuickAction} currentQuery={input} />
            )}

            {/* Chat input */}
            <div className="sticky bottom-4 pt-2 pb-4 bg-gradient-to-b from-transparent to-white">
              <ChatInput
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmitWithIntentDetection}
                isConnected={connected}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
