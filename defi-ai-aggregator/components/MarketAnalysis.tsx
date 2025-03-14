'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface MarketAnalysisProps {
  onQuerySubmit: (query: string) => void;
}

export default function MarketAnalysis({ onQuerySubmit }: MarketAnalysisProps) {
  const [customQuery, setCustomQuery] = useState('');

  const predefinedQueries = [
    {
      title: "APT Price Prediction",
      query: "What's your price prediction for APT in the next month?",
      icon: "📈",
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
    },
    {
      title: "Market Sentiment Analysis",
      query: "Analyze the current market sentiment for Aptos ecosystem",
      icon: "🔍",
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100"
    },
    {
      title: "Top Yield Opportunities",
      query: "What are the top 3 yield opportunities on Aptos right now?",
      icon: "💰",
      color: "bg-green-50 border-green-200 hover:bg-green-100"
    },
    {
      title: "Risk Assessment",
      query: "Assess the risk levels of the top Aptos DeFi protocols",
      icon: "⚠️",
      color: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
    },
    {
      title: "Liquidity Analysis",
      query: "Analyze liquidity distribution across Aptos DEXes",
      icon: "💧",
      color: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100"
    },
    {
      title: "Upcoming Events",
      query: "What are the upcoming events that might impact Aptos prices?",
      icon: "📅",
      color: "bg-red-50 border-red-200 hover:bg-red-100"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim()) {
      onQuerySubmit(customQuery);
      setCustomQuery('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Market Analysis</h2>
      </div>
      
      {/* Custom query input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Ask AI Analyst</h3>
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ask about market trends, price predictions, or investment strategies..."
            />
          </div>
          <button
            type="submit"
            disabled={!customQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Analyze
          </button>
        </form>
      </div>
      
      {/* Predefined queries */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedQueries.map((item, index) => (
            <button
              key={index}
              onClick={() => onQuerySubmit(item.query)}
              className={`p-4 rounded-xl border text-left transition-all ${item.color}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.query}</p>
                  </div>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Market insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start space-x-4">
          <div className="bg-white p-3 rounded-full shadow-sm">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Market Insight</h3>
            <p className="text-gray-600 mt-2">
              Based on recent data, Aptos ecosystem is showing strong growth in TVL and user adoption. 
              The top performing protocols are currently in the DeFi sector, with lending and DEX 
              platforms leading the way. Consider exploring yield opportunities in stablecoin pools 
              for lower risk exposure.
            </p>
            <button
              onClick={() => onQuerySubmit("Tell me more about the current Aptos ecosystem growth and opportunities")}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              Learn more
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 