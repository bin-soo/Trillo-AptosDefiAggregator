'use client';

import { useState } from 'react';
import { Bars3Icon, ArrowPathIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useNetwork } from '../providers';
import AptosLogo from '@/components/AptosLogo';
import WalletConnect from '@/components/WalletConnect';
import MarketDashboard from '@/components/MarketDashboard';
import MarketAnalysis from '@/components/MarketAnalysis';
import defiService from '@/services/defiService';
import { useRouter } from 'next/navigation';

export default function MarketPage() {
  const { connected, account } = useWallet();
  const { network, setNetwork, isTestnet } = useNetwork();
  const router = useRouter();

  // Toggle network between mainnet and testnet
  const toggleNetwork = () => {
    const newNetwork = network === 'mainnet' ? 'testnet' : 'mainnet';
    setNetwork(newNetwork);
    
    // Update the defiService with the new network setting
    defiService.setTestnetMode(newNetwork === 'testnet');
  };

  // Handle query submission from MarketAnalysis
  const handleQuerySubmit = (query: string) => {
    // Navigate to the chat page with the query
    router.push(`/?query=${encodeURIComponent(query)}`);
  };

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
      </div>
      
      {/* Code-like background elements */}
      <div className="absolute left-4 top-1/4 text-gray-800/20 font-mono text-xs -z-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="my-1">fn market_analysis::{i + 1}() {'{'} ... {'}'}</div>
        ))}
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <AptosLogo />
              <span className="font-semibold text-xl">DeFi AI Advisor</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link 
              href="/"
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300"
              title="AI Chat"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
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

      {/* Main content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Welcome section */}
          <div className="w-full bg-gradient-to-r from-teal-700/80 to-amber-700/80 border border-gray-800 rounded-xl p-6 mb-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Aptos Market Dashboard</h1>
              <p className="text-gray-400 max-w-md mx-auto">
                Real-time market data and AI-powered analysis for the Aptos ecosystem
              </p>
            </div>
          </div>
          
          {/* Dashboard content */}
          <div className="relative">
            {/* Glowing elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-blue-500/5 blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-purple-500/5 blur-3xl -z-10"></div>
            
            <MarketDashboard />
          </div>
          
          {/* Analysis section */}
          <div className="relative mt-8 pt-8 border-t border-gray-800">
            {/* Glowing elements */}
            <div className="absolute -top-10 right-10 w-40 h-40 rounded-full bg-green-500/5 blur-3xl -z-10"></div>
            
            <MarketAnalysis onQuerySubmit={handleQuerySubmit} />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-md py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <AptosLogo variant="mark" className="h-6 w-6" />
              <span className="text-sm text-gray-400">Aptos DeFi AI Assistant</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="https://aptoslabs.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-blue-400">
                Aptos Labs
              </a>
              <a href="https://github.com/aptos-foundation" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-blue-400">
                GitHub
              </a>
              <a href="https://aptosfoundation.org" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-blue-400">
                Aptos Foundation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
} 