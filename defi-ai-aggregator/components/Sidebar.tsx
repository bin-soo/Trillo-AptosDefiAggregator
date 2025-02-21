'use client';

import { useState } from 'react';
import { XMarkIcon, ClockIcon, BookOpenIcon, CircleStackIcon } from '@heroicons/react/24/outline';

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

  return (
    <div className={`fixed top-0 left-0 h-full bg-white/90 backdrop-blur-lg shadow-xl transition-all duration-300 z-20 
      ${isOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-500">
          <h2 className="text-white font-semibold">Aptos DeFi Hub</h2>
          <button onClick={onToggle} className="text-white hover:bg-white/10 rounded-lg p-2">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {Object.entries(tabIcons).map(([tab, icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 p-4 ${activeTab === tab ? 'border-b-2 border-blue-500' : ''}`}
            >
              <div className="flex flex-col items-center space-y-1">
                {icon}
                <span className="text-xs capitalize">{tab}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'history' && (
            <div className="space-y-2 p-4">
              {chatHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onHistoryClick(item.question)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 truncate">{item.question}</p>
                  <p className="text-xs text-gray-500">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'resource' && (
            <div className="space-y-6 p-4">
              {resourceItems.map((section, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-lg">{section.category}</h3>
                  <div className="space-y-3">
                    {section.items.map((item, j) => (
                      <a
                        key={j}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 
                          hover:from-blue-100 hover:to-purple-100 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{item.title}</p>
                        {'description' in item && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {'date' in item && (
                          <p className="text-sm text-gray-500 mt-1">{item.date}</p>
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
                  className="block p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <p className="font-medium text-gray-900">{dapp.name}</p>
                  <p className="text-sm text-blue-500">{dapp.category}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 