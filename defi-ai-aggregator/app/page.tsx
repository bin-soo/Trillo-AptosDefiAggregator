'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import WalletConnect from '@/components/WalletConnect';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [isConnected, setIsConnected] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Aptos DeFi Assistant
          </h1>
          <WalletConnect onConnect={() => setIsConnected(true)} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mt-24 mb-32">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Welcome to Aptos DeFi Assistant
                </h2>
                <p className="text-gray-600 mb-8">
                  Connect your wallet to start exploring DeFi opportunities
                </p>
              </div>
            )}
            {messages.map((message, i) => (
              <ChatMessage key={i} message={message} />
            ))}
          </div>
        </div>
      </main>

      {/* Chat Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  );
}
