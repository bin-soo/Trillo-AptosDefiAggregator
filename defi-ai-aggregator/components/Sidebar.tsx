'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon, BookOpenIcon, CircleStackIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface ChatHistory {
  id: string;
  question: string;
  timestamp: Date;
}

interface SidebarProps {
  chatHistory: ChatHistory[];
  onHistoryClick: (question: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ chatHistory, onHistoryClick, isOpen, onToggle }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'resource' | 'ecosystem'>('history');
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resourceItems = [
    {
      category: "Latest Updates",
      items: [
        {
          title: "Merkle Trade Launches Gamified Perpetual DEX on Aptos",
          date: "2024-02",
          url: "https://app.merkle.trade/trade/APT_USD"
        },
        {
          title: "Amnis Finance Introduces Liquid Staking Protocol",
          date: "2024-02",
          url: "https://amnis.finance"
        }
      ]
    },
    {
      category: "Learning Resources",
      items: [
        {
          title: "MoveSpiders: Start your web3 journey with Move",
          description: "Learn Move programming from scratch",
          url: "https://www.movespiders.com/"
        },
        {
          title: "Understanding DeFi on Aptos",
          description: "Basic concepts and terminology",
          url: "https://aptosfoundation.org/ecosystem/projects/defi"
        },
        {
          title: "Move Language Basics",
          description: "Core concepts of Move programming",
          url: "https://aptos.dev/move/move-on-aptos"
        }
      ]
    }
  ];

  const ecosystemDapps = [
    {
      name: "Merkle Trade",
      category: "Perpetual DEX",
      url: "https://app.merkle.trade/trade/APT_USD"
    },
    {
      name: "Amnis Finance",
      category: "Liquid Staking",
      url: "https://amnis.finance"
    },
    {
      name: "Aries Markets",
      category: "Money Markets",
      url: "https://ariesmarkets.xyz"
    },
    {
      name: "Cellana Finance",
      category: "DEX",
      url: "https://cellana.finance"
    },
    {
      name: "Echo Protocol",
      category: "Liquid Staking",
      url: "https://echo.liquidstaking"
    },
    {
      name: "Econia",
      category: "Order Book DEX",
      url: "https://econia.dev"
    },
    {
      name: "PancakeSwap",
      category: "DEX",
      url: "https://pancakeswap.finance/aptos"
    },
    {
      name: "Liquidswap",
      category: "DEX",
      url: "https://liquidswap.com"
    },
    {
      name: "Meso Finance",
      category: "Money Market",
      url: "https://meso.finance"
    },
    {
      name: "Thala Labs",
      category: "DeFi HyperApp",
      url: "https://thala.fi"
    }
  ];

  const tabIcons = {
    history: <ClockIcon className="h-5 w-5" />,
    resource: <BookOpenIcon className="h-5 w-5" />,
    ecosystem: <CircleStackIcon className="h-5 w-5" />
  };

  // Don't render anything during SSR
  if (!isMounted) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 h-full bg-gray-900/95 backdrop-blur-lg shadow-xl transition-all duration-300 z-20 border-r border-gray-700
      ${isOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-900/50 to-purple-900/50">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-blue-300 font-mono font-semibold">Aptos DeFi Hub</h2>
          </div>
          <button onClick={onToggle} className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg p-2 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {Object.entries(tabIcons).map(([tab, icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 p-3 ${activeTab === tab 
                ? 'bg-gray-800 border-b-2 border-blue-500 text-blue-400' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'} transition-colors`}
            >
              <div className="flex flex-col items-center space-y-1">
                {icon}
                <span className="text-xs capitalize">{tab}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-900/50">
          {activeTab === 'history' && (
            <div className="space-y-2 p-4">
              {chatHistory.length > 0 ? (
                chatHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onHistoryClick(item.question)}
                    className="w-full text-left p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 border border-gray-700 transition-colors group"
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-gray-300 truncate group-hover:text-blue-300 transition-colors">{item.question}</p>
                      <ArrowRightIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8 bg-gray-800/30 rounded-lg border border-gray-700">
                  <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <p>No chat history yet</p>
                  <p className="text-sm mt-2">Your conversations will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resource' && (
            <div className="space-y-6 p-4">
              {resourceItems.map((section, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="font-semibold text-blue-400 text-lg">{section.category}</h3>
                  <div className="space-y-3">
                    {section.items.map((item, j) => (
                      <a
                        key={j}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg bg-gradient-to-r from-gray-800/80 to-gray-800/50 
                          border border-gray-700 hover:border-blue-700/50 hover:from-blue-900/20 hover:to-purple-900/20 transition-all group"
                      >
                        <div className="flex justify-between">
                          <p className="font-medium text-gray-300 group-hover:text-blue-300 transition-colors">{item.title}</p>
                          <ArrowRightIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                        {'description' in item && (
                          <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">{item.description}</p>
                        )}
                        {'date' in item && (
                          <p className="text-xs text-gray-600 mt-1">{item.date}</p>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ecosystem' && (
            <div className="space-y-4 p-4">
              {ecosystemDapps.map((dapp, i) => (
                <a
                  key={i}
                  href={dapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg bg-gray-800/50 border border-gray-700 
                    hover:border-blue-700/50 hover:bg-gray-800 transition-all group"
                >
                  <div className="flex justify-between">
                    <p className="font-medium text-gray-300 group-hover:text-blue-300 transition-colors">{dapp.name}</p>
                    <ArrowRightIcon className="h-4 w-4 text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <p className="text-sm text-blue-500 mt-1">{dapp.category}</p>
                </a>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/80">
          <div className="text-xs text-gray-500 text-center">
            <p>Aptos DeFi Assistant</p>
            <p className="mt-1">Powered by AI</p>
          </div>
        </div>
      </div>
    </div>
  );
} 