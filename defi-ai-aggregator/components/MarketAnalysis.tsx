'use client';

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

interface MarketAnalysisProps {
  onQuerySubmit: (query: string) => void;
}

export default function MarketAnalysis({ onQuerySubmit }: MarketAnalysisProps) {
  const [customQuery, setCustomQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const predefinedQueries = [
    {
      title: "APT Price Prediction",
      query: "What's your price prediction for APT in the next month?",
      icon: "📈",
      color: "bg-blue-900/30 border-blue-800 hover:bg-blue-800/30"
    },
    {
      title: "Market Sentiment Analysis",
      query: "Analyze the current market sentiment for Aptos ecosystem",
      icon: "🔍",
      color: "bg-purple-900/30 border-purple-800 hover:bg-purple-800/30"
    },
    {
      title: "Top Yield Opportunities",
      query: "What are the top 3 yield opportunities on Aptos right now?",
      icon: "💰",
      color: "bg-green-900/30 border-green-800 hover:bg-green-800/30"
    },
    {
      title: "Risk Assessment",
      query: "Assess the risk levels of the top Aptos DeFi protocols",
      icon: "⚠️",
      color: "bg-yellow-900/30 border-yellow-800 hover:bg-yellow-800/30"
    },
    {
      title: "Liquidity Analysis",
      query: "Analyze liquidity distribution across Aptos DEXes",
      icon: "💧",
      color: "bg-cyan-900/30 border-cyan-800 hover:bg-cyan-800/30"
    },
    {
      title: "Upcoming Events",
      query: "What are the upcoming events that might impact Aptos prices?",
      icon: "📅",
      color: "bg-red-900/30 border-red-800 hover:bg-red-800/30"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      handleQuerySubmit(customQuery);
      setCustomQuery('');
    }
  };
  
  const handleQuerySubmit = (query: string) => {
    // Call the onQuerySubmit prop which will handle navigation
    onQuerySubmit(query);
  };

  // Return a placeholder while not mounted to prevent hydration issues
  if (!isMounted) {
    return <div className="animate-pulse bg-gray-800/50 rounded-xl h-[400px]"></div>;
  }

  return (
    <div className="space-y-6 relative">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Glowing elements */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-blue-500/5 blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 rounded-full bg-purple-500/5 blur-xl"></div>
      </div>

      {/* Code-like background elements */}
      <div className="absolute left-4 bottom-1/4 text-gray-800/10 font-mono text-xs -z-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="my-1">fn analyze_market::{i + 1}() {'{'} ... {'}'}</div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-300 font-mono">MARKET_ANALYSIS</h2>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-purple-400 font-mono">AI_POWERED</span>
        </div>
      </div>
      
      {/* Custom query input */}
      <div className="bg-gray-900/70 backdrop-blur-md rounded-xl border border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-blue-300 mb-3 font-mono">ASK_AI_ANALYST</h3>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                text-gray-200 placeholder-gray-500"
              placeholder="Ask about market trends, price predictions, or investment strategies..."
            />
          </div>
          <button
            type="submit"
            disabled={!customQuery.trim()}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
              hover:from-blue-500 hover:to-purple-500
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Analyze
          </button>
        </form>
      </div>
      
      {/* Predefined queries */}
      <div>
        <h3 className="text-lg font-semibold text-blue-300 mb-3 font-mono">QUICK_ANALYSIS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedQueries.map((item, index) => (
            <button
              key={index}
              onClick={() => handleQuerySubmit(item.query)}
              className={`p-4 rounded-xl border border-gray-700 text-left transition-all backdrop-blur-md ${item.color} relative overflow-hidden group`}
            >
              {/* Tech pattern background */}
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <div className="w-16 h-16 border border-dashed rounded-full"></div>
                <div className="w-10 h-10 border border-dashed rounded-full absolute top-3 left-3"></div>
              </div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex space-x-3">
                  <span className="text-2xl filter drop-shadow-glow">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-blue-300 font-mono">{item.title}</h4>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{item.query}</p>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Market insights */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-800/50 relative overflow-hidden">
        {/* Animated circuit-like lines */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 left-1/4 w-px h-full bg-blue-400"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-blue-400"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-blue-400"></div>
          <div className="absolute top-1/4 left-0 w-full h-px bg-blue-400"></div>
          <div className="absolute top-2/4 left-0 w-full h-px bg-blue-400"></div>
          <div className="absolute top-3/4 left-0 w-full h-px bg-blue-400"></div>
        </div>
        
        <div className="flex items-start space-x-4 relative z-10">
          <div className="bg-gray-900/70 p-3 rounded-full shadow-glow-sm">
            <SparklesIcon className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-300 font-mono">AI_MARKET_INSIGHT</h3>
            <p className="text-gray-300 mt-2">
              Based on recent data, Aptos ecosystem is showing strong growth in TVL and user adoption. 
              The top performing protocols are currently in the DeFi sector, with lending and DEX 
              platforms leading the way. Consider exploring yield opportunities in stablecoin pools 
              for lower risk exposure.
            </p>
            <button
              onClick={() => handleQuerySubmit("Tell me more about the current Aptos ecosystem growth and opportunities")}
              className="mt-3 text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center group"
            >
              <span className="font-mono">LEARN_MORE</span>
              <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Data source attribution */}
      <div className="text-xs text-gray-500 text-right font-mono">
        POWERED_BY: APTOS_AI_ENGINE | UPDATED: {new Date().toLocaleDateString()}
      </div>
    </div>
  );
} 