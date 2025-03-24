'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ClockIcon, BookOpenIcon, CircleStackIcon, ArrowRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import AptosLogo from '@/components/AptosLogo';

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

// Add interface for user social content
interface UserSocialItem {
  id: string;
  title: string;
  url: string;
  platform: 'twitter' | 'youtube' | 'other';
  description?: string;
  handle?: string;
}

export default function Sidebar({ chatHistory, onHistoryClick, isOpen, onToggle }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'social' | 'ecosystem'>('history');
  const [isMounted, setIsMounted] = useState(false);
  
  // Add state for user-added social content
  const [userSocialItems, setUserSocialItems] = useState<UserSocialItem[]>([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState<{
    title: string;
    url: string;
    platform: 'twitter' | 'youtube' | 'other';
    description: string;
    handle: string;
  }>({
    title: '',
    url: '',
    platform: 'twitter',
    description: '',
    handle: '',
  });
  
  // Ref for the add form
  const addFormRef = useRef<HTMLDivElement>(null);

  // Load user social items from localStorage on component mount
  useEffect(() => {
    setIsMounted(true);
    const savedItems = localStorage.getItem('userSocialItems');
    if (savedItems) {
      try {
        setUserSocialItems(JSON.parse(savedItems));
      } catch (e) {
        console.error('Failed to parse saved social items:', e);
      }
    }
  }, []);

  // Save user social items to localStorage whenever they change
  useEffect(() => {
    if (isMounted && userSocialItems.length > 0) {
      localStorage.setItem('userSocialItems', JSON.stringify(userSocialItems));
    }
  }, [userSocialItems, isMounted]);

  // Close the add form when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addFormRef.current && !addFormRef.current.contains(event.target as Node)) {
        setIsAddingItem(false);
      }
    };

    if (isAddingItem) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddingItem]);

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItemForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new social item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newItemForm.title.trim() || !newItemForm.url.trim()) {
      return;
    }
    
    // Ensure URL has http/https prefix
    let url = newItemForm.url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const newItem: UserSocialItem = {
      id: Date.now().toString(),
      title: newItemForm.title,
      url,
      platform: newItemForm.platform,
      description: newItemForm.description || undefined,
      handle: newItemForm.handle || undefined
    };
    
    setUserSocialItems(prev => [...prev, newItem]);
    
    // Reset form and close it
    setNewItemForm({
      title: '',
      url: '',
      platform: 'twitter',
      description: '',
      handle: '',
    });
    setIsAddingItem(false);
  };

  // Delete a social item
  const handleDeleteItem = (id: string) => {
    setUserSocialItems(prev => prev.filter(item => item.id !== id));
  };

  const socialItems = [
    {
      category: "Aptos Official",
      items: [
        {
          title: "Aptos Labs",
          handle: "@AptosLabs",
          url: "https://twitter.com/AptosLabs",
          followers: "280K+",
          avatar: "https://pbs.twimg.com/profile_images/1556801889271939072/w6X1s9H1_400x400.jpg",
          platform: "twitter"
        },
        {
          title: "Aptos Foundation",
          handle: "@AptosFndn",
          url: "https://twitter.com/AptosFndn",
          followers: "110K+",
          avatar: "https://pbs.twimg.com/profile_images/1582162941379325952/9OdvqwwW_400x400.jpg",
          platform: "twitter"
        },
        {
          title: "Aptos",
          handle: "@Aptos",
          url: "https://twitter.com/Aptos",
          followers: "250K+",
          avatar: "https://pbs.twimg.com/profile_images/1556801889271939072/w6X1s9H1_400x400.jpg",
          platform: "twitter"
        },
        {
          title: "Aptos YouTube",
          description: "Official tutorials and updates",
          url: "https://www.youtube.com/@AptosLabs",
          subscribers: "10K+",
          platform: "youtube"
        }
      ]
    },
    {
      category: "Top Influencers",
      items: [
        {
          title: "Mo Shaikh",
          handle: "@moshaikhs",
          description: "Co-founder & CEO of Aptos Labs",
          url: "https://twitter.com/moshaikhs",
          followers: "80K+",
          avatar: "https://pbs.twimg.com/profile_images/1544109357324120065/21uBGEpH_400x400.jpg",
          platform: "twitter"
        },
        {
          title: "Avery Ching",
          handle: "@averycching",
          description: "Co-founder & CTO of Aptos Labs",
          url: "https://twitter.com/averycching",
          followers: "30K+",
          platform: "twitter"
        }
      ]
    },
    {
      category: "Trending Now",
      items: [
        {
          title: "Aptos Moves into AI Integration",
          date: "2 days ago",
          description: "Aptos exploring on-chain AI capabilities for Move-based dApps",
          url: "https://twitter.com/AptosLabs/status/1769382042875273658",
          platform: "trending"
        },
        {
          title: "Merkle Trade Doubles TVL in 3 Days",
          date: "5 days ago",
          description: "Gamified perpetual DEX sees massive influx of users",
          url: "https://twitter.com/MerkleTrade/status/1768245931824824601",
          platform: "trending"
        },
        {
          title: "LayerZero Protocol Now Live on Aptos",
          date: "1 week ago",
          description: "Enhanced cross-chain capabilities now available",
          url: "https://twitter.com/LayerZero_Labs/status/1766487953772433827",
          platform: "trending"
        }
      ]
    },
    {
      category: "YouTube Channels",
      items: [
        {
          title: "Aptos Explained",
          description: "Deep dives into Move programming and Aptos architecture",
          url: "https://www.youtube.com/@AptosExplained",
          subscribers: "25K+",
          platform: "youtube"
        },
        {
          title: "Move Bytes",
          description: "Technical tutorials for Move development",
          url: "https://www.youtube.com/channel/UCXwc_DU3AUU8qq-CQHs97BA",
          subscribers: "15K+",
          platform: "youtube"
        },
        {
          title: "DeFi Daily",
          description: "Regular updates on Aptos DeFi ecosystem",
          url: "https://www.youtube.com/@DeFiDaily",
          subscribers: "50K+",
          platform: "youtube"
        },
        {
          title: "AptosBuilder",
          description: "Developer-focused content and interviews",
          url: "https://www.youtube.com/@AptosBuilder",
          subscribers: "8K+",
          platform: "youtube"
        }
      ]
    },
    {
      category: "Community & Forums",
      items: [
        {
          title: "Aptos Discord",
          description: "Official community with 150K+ members",
          url: "https://discord.gg/aptoslabs",
          members: "150K+",
          platform: "community"
        },
        {
          title: "Aptos Forum",
          description: "Technical discussions and governance",
          url: "https://forum.aptoslabs.com/",
          platform: "community"
        },
        {
          title: "r/AptosFoundation",
          description: "Reddit community for Aptos",
          url: "https://www.reddit.com/r/AptosFoundation/",
          members: "20K+",
          platform: "community"
        }
      ]
    }
  ];

  const ecosystemDapps = [
    // DeFi - DEXes
    {
      category: "DEX Platforms",
      items: [
        {
          name: "Pancake Swap",
          description: "Leading DEX with high liquidity and multi-chain support",
          url: "https://pancakeswap.finance/home",
          tags: ["DEX", "AMM", "Top Volume"]
        },
        {
          name: "Liquidswap",
          description: "First DEX on Aptos with concentrated liquidity",
          url: "https://liquidswap.com",
          tags: ["DEX", "AMM"]
        },
        {
          name: "Econia",
          description: "High-performance on-chain order book DEX",
          url: "https://econia.dev",
          tags: ["Order Book", "High Performance"]
        },
        {
          name: "Cellana Finance",
          description: "Zero fee DEX focused on capital efficiency",
          url: "https://cellana.finance",
          tags: ["DEX", "Zero Fee"]
        },
        {
          name: "Tsunami Finance",
          description: "Concentrated liquidity market maker with boosted yields",
          url: "https://tsunami.finance",
          tags: ["DEX", "CLMM"]
        }
      ]
    },
    
    // DeFi - Lending & Borrowing
    {
      category: "Lending & Money Markets",
      items: [
        {
          name: "Joule Finance",
          description: "The liquidity hub of Aptos: Lend,Borrow & Access Leveraged Yield Strategies with Liquidity Anchors.",
          url: "https://www.joule.finance/",
          tags: ["Lending", "Borrowing", "Yield"]
    },
    {
      name: "Aries Markets",
          description: "Lending/borrowing protocol with multiple asset support",
          url: "https://ariesmarkets.xyz",
          tags: ["Lending", "Borrowing"]
        },
        {
          name: "Meso Finance",
          description: "Money market protocol with efficient capital utilization",
          url: "https://meso.finance",
          tags: ["Money Market", "Borrowing"]
        },
        {
          name: "Abel Finance",
          description: "Isolated lending pools with customizable risk parameters",
          url: "https://abel.finance",
          tags: ["Lending", "Risk Management"]
        },
        {
          name: "Thala Labs",
          description: "DeFi hyperapp with multiple financial products",
          url: "https://thala.fi",
          tags: ["DeFi Suite", "Lending"]
        }
      ]
    },
    
    // DeFi - Liquid Staking
    {
      category: "Liquid Staking",
      items: [
        {
          name: "Ditto Staking",
          description: "Liquid staking derivatives for Aptos",
          url: "https://dittofinance.io",
          tags: ["Staking", "LSD"]
        },
        {
          name: "Amnis Finance",
          description: "Liquid staking with multiple validator support",
          url: "https://amnis.finance",
          tags: ["Staking", "Validators"]
        },
        {
          name: "Echo Protocol",
          description: "Decentralized liquid staking for APT",
          url: "https://echo.liquidstaking",
          tags: ["Staking", "Decentralized"]
        },
        {
          name: "Tortuga Finance",
          description: "Pioneering liquid staking solution on Aptos",
          url: "https://tortuga.finance",
          tags: ["Staking", "APT"]
        }
      ]
    },
    
    // DeFi - Derivatives & Perps
    {
      category: "Derivatives & Perpetuals",
      items: [
        {
          name: "Merkle Trade",
          description: "Gamified perpetual DEX with up to 100x leverage",
          url: "https://app.merkle.trade/trade/APT_USD",
          tags: ["Perpetuals", "Leverage", "Gamified"]
        },
        {
          name: "Thala Perps",
          description: "Perpetual futures with dynamic funding rates",
          url: "https://thala.fi/trade",
          tags: ["Perpetuals", "Trading"]
        },
        {
          name: "Petra Exchange",
          description: "Multi-collateral perpetual futures exchange",
          url: "https://petra.exchange",
          tags: ["Perpetuals", "Options"]
        }
      ]
    },
    
    // NFT & Gaming
    {
      category: "NFT & Gaming",
      items: [
        {
          name: "Topaz Marketplace",
          description: "Premier NFT marketplace on Aptos",
          url: "https://topaz.so",
          tags: ["NFT", "Marketplace"]
        },
        {
          name: "BlueMove",
          description: "Cross-chain NFT marketplace",
          url: "https://bluemove.net",
          tags: ["NFT", "Cross-chain"]
        },
        {
          name: "Souffl3",
          description: "NFT trading platform with social features",
          url: "https://souffl3.com",
          tags: ["NFT", "Social"]
        },
        {
          name: "Aptoads",
          description: "Gamified NFT experience on Aptos",
          url: "https://www.aptoads.io",
          tags: ["NFT", "Gaming"]
        },
        {
          name: "Aptomingos",
          description: "Popular NFT collection on Aptos",
          url: "https://www.aptomingos.io",
          tags: ["NFT", "Collection"]
        }
      ]
    },
    
    // Infrastructure & Tools
    {
      category: "Infrastructure & Tools",
      items: [
        {
          name: "Pontem Network",
          description: "Development platform and wallet for Aptos",
          url: "https://pontem.network",
          tags: ["Wallet", "Development"]
        },
        {
          name: "Hippo Aggregator",
          description: "DEX aggregator for best swap rates",
          url: "https://hippo.space",
          tags: ["Aggregator", "Swaps"]
        },
        {
          name: "Petra Wallet",
          description: "Official wallet by Aptos Labs",
          url: "https://petra.app",
          tags: ["Wallet", "Official"]
        },
        {
          name: "Martian Wallet",
          description: "Feature-rich wallet for Aptos",
          url: "https://martianwallet.xyz",
          tags: ["Wallet", "Multi-chain"]
        },
        {
          name: "Blocto",
          description: "Web3 wallet with social login",
          url: "https://blocto.io",
          tags: ["Wallet", "Social"]
        }
      ]
    },
    
    // Bridges & Interoperability
    {
      category: "Bridges & Cross-Chain",
      items: [
        {
          name: "LayerZero",
          description: "Omnichain interoperability protocol",
          url: "https://layerzero.network",
          tags: ["Bridge", "Cross-chain"]
        },
        {
          name: "Wormhole",
          description: "Cross-chain messaging and token bridge",
          url: "https://wormhole.com",
          tags: ["Bridge", "Messaging"]
        },
        {
          name: "Celer cBridge",
          description: "Fast and secure cross-chain bridge",
          url: "https://cbridge.celer.network",
          tags: ["Bridge", "Low Fee"]
        },
        {
          name: "Satellite",
          description: "Cross-chain bridge for Aptos",
          url: "https://satellite.money",
          tags: ["Bridge", "Aptos-native"]
        }
      ]
    },
    
    // DAO & Governance
    {
      category: "DAO & Governance",
      items: [
        {
          name: "Move DAO",
          description: "DAO framework for the Aptos ecosystem",
          url: "https://movedao.io",
          tags: ["DAO", "Governance"]
        },
        {
          name: "Solcen",
          description: "Permissionless governance protocol",
          url: "https://solcen.xyz",
          tags: ["Governance", "Community"]
        }
      ]
    }
  ];

  const tabIcons = {
    history: <ClockIcon className="h-5 w-5" />,
    social: <BookOpenIcon className="h-5 w-5" />,
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
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-teal-700/80 to-amber-700/80">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-blue-400" />
            </div>
            <h2 className="text-teal-300 font-mono font-semibold">Aptos DeFi Hub</h2>
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

          {activeTab === 'social' && (
            <div className="space-y-6 p-4">
              {/* Add My Content button and form */}
              <div className="mb-4">
                {!isAddingItem ? (
                  <button 
                    onClick={() => setIsAddingItem(true)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-teal-700/50 bg-teal-900/10 text-teal-400 hover:bg-teal-900/20 transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add My Content</span>
                  </button>
                ) : (
                  <div 
                    ref={addFormRef}
                    className="p-4 rounded-lg border border-teal-700/50 bg-gray-800 text-gray-300"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-medium text-teal-400">Add Custom Content</h3>
                      <button 
                        onClick={() => setIsAddingItem(false)}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddItem} className="space-y-3">
                      <div>
                        <label className="block text-xs mb-1 text-gray-400">Title*</label>
                        <input
                          type="text"
                          name="title"
                          value={newItemForm.title}
                          onChange={handleFormChange}
                          placeholder="e.g., Favorite Crypto Analyst"
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs mb-1 text-gray-400">URL*</label>
                        <input
                          type="text"
                          name="url"
                          value={newItemForm.url}
                          onChange={handleFormChange}
                          placeholder="e.g., https://twitter.com/username"
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs mb-1 text-gray-400">Platform</label>
                        <select
                          name="platform"
                          value={newItemForm.platform}
                          onChange={handleFormChange}
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                        >
                          <option value="twitter">Twitter</option>
                          <option value="youtube">YouTube</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      {newItemForm.platform === 'twitter' && (
                        <div>
                          <label className="block text-xs mb-1 text-gray-400">Twitter Handle</label>
                          <input
                            type="text"
                            name="handle"
                            value={newItemForm.handle}
                            onChange={handleFormChange}
                            placeholder="e.g., @username"
                            className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs mb-1 text-gray-400">Description</label>
                        <textarea
                          name="description"
                          value={newItemForm.description}
                          onChange={handleFormChange}
                          placeholder="Brief description..."
                          className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingItem(false)}
                          className="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-teal-500 to-amber-500 hover:from-teal-600 hover:to-amber-600 rounded text-sm text-black font-medium"
                        >
                          Add Content
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
              
              {/* User-added content section */}
              {userSocialItems.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h3 className="font-semibold text-teal-400 text-lg flex items-center">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-teal-400 to-amber-500 rounded mr-2"></div>
                    My Content
                  </h3>
                  <div className="space-y-2">
                    {userSocialItems.map((item) => (
                      <div
                        key={item.id}
                        className="block p-3 rounded-lg bg-gray-800/50 border border-gray-700 group"
                      >
                        <div className="flex gap-3 items-start">
                          {/* Icon based on platform */}
                          {item.platform === 'twitter' && (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-900/30 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.191 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z"/>
                              </svg>
                            </div>
                          )}
                          {item.platform === 'youtube' && (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-red-900/30 flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            </div>
                          )}
                          {item.platform === 'other' && (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gray-700/50 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-300 group-hover:text-teal-300 transition-colors">
                                  {item.title}
                                </p>
                                {item.handle && (
                                  <p className="text-xs text-teal-400 mt-0.5">{item.handle}</p>
                                )}
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-500 hover:text-teal-400"
                                >
                                  <ArrowRightIcon className="h-4 w-4" />
                                </a>
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="text-gray-500 hover:text-red-400"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Existing social items */}
              {socialItems.map((section, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="font-semibold text-teal-400 text-lg flex items-center">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-teal-400 to-amber-500 rounded mr-2"></div>
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, j) => (
                      <a
                        key={j}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-gray-800/50 border border-gray-700 
                          hover:border-teal-700/50 hover:bg-gray-800 transition-all group"
                      >
                        <div className="flex gap-3 items-start">
                          {/* Icon based on platform */}
                          {item.platform === 'twitter' && (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-900/30 flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.162 5.656a8.384 8.384 0 0 1-2.402.658A4.196 4.196 0 0 0 21.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 0 0-7.126 3.814 11.874 11.874 0 0 1-8.62-4.37 4.168 4.168 0 0 0-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 0 1-1.894-.523v.052a4.185 4.185 0 0 0 3.355 4.101 4.21 4.21 0 0 1-1.89.072A4.185 4.185 0 0 0 7.97 16.65a8.394 8.394 0 0 1-6.191 1.732 11.83 11.83 0 0 0 6.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 0 0 2.087-2.165z"/>
                              </svg>
                            </div>
                          )}
                          {item.platform === 'youtube' && (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-red-900/30 flex items-center justify-center">
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            </div>
                          )}
                          {item.platform === 'trending' && (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-amber-900/30 flex items-center justify-center">
                              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                          )}
                          {item.platform === 'community' && (
                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-purple-900/30 flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                        </div>
                          )}
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-300 group-hover:text-teal-300 transition-colors">
                                  {item.title}
                                </p>
                                {'handle' in item && (
                                  <p className="text-xs text-teal-400 mt-0.5">{item.handle}</p>
                                )}
                        {'description' in item && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        {'date' in item && (
                                  <p className="text-xs text-amber-500/70 mt-1">{item.date}</p>
                                )}
                              </div>
                              <ArrowRightIcon className="h-4 w-4 text-gray-500 group-hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-all mt-1" />
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {'followers' in item && (
                                <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded text-xs">
                                  {item.followers} followers
                                </span>
                              )}
                              {'subscribers' in item && (
                                <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded text-xs">
                                  {item.subscribers} subs
                                </span>
                              )}
                              {'members' in item && (
                                <span className="px-1.5 py-0.5 bg-purple-900/30 text-purple-400 rounded text-xs">
                                  {item.members} members
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ecosystem' && (
            <div className="space-y-8 p-4">
              {ecosystemDapps.map((category, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="font-semibold text-teal-400 text-lg flex items-center">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-teal-400 to-amber-500 rounded mr-2"></div>
                    {category.category}
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {category.items.map((dapp, j) => (
                      <a
                        key={j}
                  href={dapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-gray-800/50 border border-gray-700 
                          hover:border-teal-700/50 hover:bg-gray-800 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-300 group-hover:text-teal-300 transition-colors">
                              {dapp.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dapp.description}</p>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 text-gray-500 group-hover:text-teal-400 opacity-0 group-hover:opacity-100 transition-all mt-1" />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {dapp.tags.map((tag, k) => (
                            <span key={k} className="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
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