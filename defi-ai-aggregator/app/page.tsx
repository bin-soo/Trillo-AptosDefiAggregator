'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import WalletConnect from '@/components/WalletConnect';
import Sidebar from '@/components/Sidebar';
import QuickActions from '@/components/QuickActions';
import { Bars3Icon } from '@heroicons/react/24/outline';
import FloatingSuggestions from '@/components/FloatingSuggestions';
import { APTOS_COLORS, APTOS_BRAND } from '@/constants/brand';
import AptosLogo from '@/components/AptosLogo';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, setInput } = useChat();
  const [isConnected, setIsConnected] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

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
  }, [messages]);

  const handleQuickAction = async (query: string) => {
    // Create a synthetic form event
    const event = new Event('submit') as any;
    event.preventDefault = () => {};
    
    // Set input and submit immediately
    setInput(query);
    await handleSubmit(event);
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
            <WalletConnect onConnect={() => setIsConnected(true)} />
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
                <QuickActions onActionClick={handleQuickAction} />
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, i) => (
                  <ChatMessage key={i} message={message} />
                ))}
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
                handleSubmit={handleSubmit}
                isConnected={isConnected}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
