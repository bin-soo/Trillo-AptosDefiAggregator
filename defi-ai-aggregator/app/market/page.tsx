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
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
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
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
              title="AI Chat"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </Link>
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

      {/* Main content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          <MarketDashboard />
          <MarketAnalysis onQuerySubmit={handleQuerySubmit} />
        </div>
      </div>
    </main>
  );
} 