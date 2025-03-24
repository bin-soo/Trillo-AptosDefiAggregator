'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowsRightLeftIcon, 
  BanknotesIcon, 
  ChartBarIcon, 
  WalletIcon,
  BeakerIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { UserPlus } from 'lucide-react';

interface QuickActionsProps {
  onActionClick: (query: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const actions = [
    {
      title: 'Swap Tokens',
      description: 'Find the best rates across DEXes',
      query: 'Swap 1 APT to USDC',
      icon: <ArrowsRightLeftIcon className="h-6 w-6" />,
      color: 'from-blue-600 to-indigo-700',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-800'
    },
    {
      title: 'Yield Opportunities',
      description: 'Discover the highest APYs',
      query: 'What are the best yield opportunities for 100 USDC?',
      icon: <BanknotesIcon className="h-6 w-6" />,
      color: 'from-green-600 to-emerald-700',
      textColor: 'text-green-300',
      borderColor: 'border-green-800'
    },
    {
      title: 'Market Analysis',
      description: 'Get insights on market trends',
      query: 'What\'s your price prediction for APT in the next month?',
      icon: <ChartBarIcon className="h-6 w-6" />,
      color: 'from-purple-600 to-fuchsia-700',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-800'
    },
    {
      title: 'Portfolio Analysis',
      description: 'Analyze your holdings',
      query: 'Analyze my portfolio',
      icon: <WalletIcon className="h-6 w-6" />,
      color: 'from-amber-600 to-orange-700',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-800'
    },
    {
      title: 'Protocol Risks',
      description: 'Assess security and risks',
      query: 'What are the risks of using Liquidswap?',
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      color: 'from-red-600 to-rose-700',
      textColor: 'text-red-300',
      borderColor: 'border-red-800'
    },
    {
      title: 'Developer Tools',
      description: 'Smart contract insights',
      query: 'Explain how Aptos Move smart contracts work',
      icon: <CodeBracketIcon className="h-6 w-6" />,
      color: 'from-cyan-600 to-sky-700',
      textColor: 'text-cyan-300',
      borderColor: 'border-cyan-800'
    },
    {
      title: 'Copy Trading',
      description: 'Follow top traders',
      query: 'Show me top Aptos traders I can copy trade from',
      icon: <UserPlus className="h-6 w-6" />,
      color: 'from-pink-600 to-rose-700',
      textColor: 'text-pink-300',
      borderColor: 'border-pink-800'
    }
  ];

  // Don't render anything during SSR
  if (!isMounted) {
    return <div className="h-40 w-full bg-gray-800/30 animate-pulse rounded-xl"></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center text-blue-300 mb-6">What would you like to do?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.query)}
            className={`relative overflow-hidden group border ${action.borderColor} bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
          >
            {/* Gradient background effect */}
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            {/* Content */}
            <div className="flex items-start space-x-3 relative z-10">
              <div className={`p-2 rounded-lg bg-gray-900/80 ${action.textColor}`}>
                {action.icon}
              </div>
              <div>
                <h3 className={`font-bold ${action.textColor}`}>{action.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{action.description}</p>
              </div>
            </div>
            
            {/* Tech pattern background */}
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <div className="w-24 h-24 border border-dashed rounded-full"></div>
              <div className="w-16 h-16 border border-dashed rounded-full absolute top-4 left-4"></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 