'use client';

import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useNetwork } from '@/app/providers';
import defiService from '@/services/defiService';
import { MarketData, TokenData, ProtocolData } from '@/types/defi';

export default function MarketDashboard() {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { isTestnet } = useNetwork();
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch market data on component mount and when network changes
  useEffect(() => {
    if (isMounted) {
      fetchMarketData();
    }
  }, [isMounted, isTestnet]);

  // Fetch market data
  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const service = defiService;
      service.setTestnetMode(isTestnet);
      
      const data = await service.getMarketData();
      setMarketData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
      setError('Failed to fetch market data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Return a placeholder while not mounted to prevent hydration issues
  if (!isMounted) {
    return <div className="animate-pulse bg-gray-800/50 rounded-xl h-[500px]"></div>;
  }

  return (
    <div className="relative">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#8B5CF680_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF680_1px,transparent_1px)]" 
               style={{ backgroundSize: '20px 20px' }}>
          </div>
        </div>
        
        {/* Glowing elements */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-blue-500/5 blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-purple-500/5 blur-xl"></div>
      </div>

      {/* Code-like background elements */}
      <div className="absolute right-4 top-1/4 text-gray-800/10 font-mono text-xs -z-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="my-1">fn market_metrics::{i + 1}() {'{'} ... {'}'}</div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-300 font-mono">MARKET_DASHBOARD</h2>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <span className="text-xs text-gray-400 font-mono">
                LAST_UPDATE: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={fetchMarketData} 
              disabled={isLoading}
              className="p-2 rounded-lg bg-gray-800/70 hover:bg-gray-700/70 text-gray-300 border border-gray-700"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-900/30 backdrop-blur-md rounded-xl border border-red-700 p-4">
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !marketData && (
          <div className="space-y-4">
            <div className="h-24 bg-gray-800/50 animate-pulse rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-800/50 animate-pulse rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-800/50 animate-pulse rounded-xl"></div>
          </div>
        )}

        {/* Market data */}
        {marketData && !isLoading && (
          <div className="space-y-6">
            {/* Ecosystem overview */}
            <div className="bg-gradient-to-r from-gray-900/70 to-gray-800/70 backdrop-blur-md rounded-xl border border-gray-700 p-6">
              <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-300 font-mono mb-2 md:mb-0">APTOS_ECOSYSTEM_METRICS</h3>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-mono">LIVE_DATA</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-800">
                  <p className="text-xs text-gray-500 font-mono">TOTAL_TVL</p>
                  <p className="text-xl font-semibold text-white">{formatCurrency(marketData.ecosystem.totalTVL)}</p>
                </div>
                <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-800">
                  <p className="text-xs text-gray-500 font-mono">MARKET_CAP</p>
                  <p className="text-xl font-semibold text-white">{formatCurrency(marketData.ecosystem.marketCap)}</p>
                </div>
                <div className="bg-gray-900/70 rounded-lg p-3 border border-gray-800">
                  <p className="text-xs text-gray-500 font-mono">24H_VOLUME</p>
                  <p className="text-xl font-semibold text-white">{formatCurrency(marketData.ecosystem.volume24h)}</p>
                </div>
              </div>
            </div>

            {/* Token prices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {marketData.tokens.slice(0, 3).map((token, index) => (
                <div 
                  key={index}
                  className="bg-gray-900/70 backdrop-blur-md rounded-xl border border-gray-700 p-4 relative overflow-hidden"
                >
                  {/* Tech pattern background */}
                  <div className="absolute -right-4 -bottom-4 opacity-10">
                    <div className="w-24 h-24 border border-dashed rounded-full"></div>
                    <div className="w-16 h-16 border border-dashed rounded-full absolute top-4 left-4"></div>
                  </div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">{token.symbol}</h4>
                      <p className="text-sm text-gray-400">{token.name}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      token.change24h >= 0 
                        ? 'bg-green-900/50 text-green-400 border border-green-700' 
                        : 'bg-red-900/50 text-red-400 border border-red-700'
                    }`}>
                      <div className="flex items-center space-x-1">
                        {token.change24h >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3" />
                        )}
                        <span>{Math.abs(token.change24h).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 font-mono">PRICE</p>
                      <p className="text-2xl font-semibold text-white">${token.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-mono">VOLUME</p>
                      <p className="text-sm font-medium text-gray-300">{formatCurrency(token.volume24h)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Top protocols table */}
            <div className="bg-gray-900/70 backdrop-blur-md rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-blue-300 font-mono">TOP_PROTOCOLS</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        NAME
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        TVL
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        24H_CHANGE
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        CATEGORY
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900/30 divide-y divide-gray-800">
                    {marketData.protocols.slice(0, 5).map((protocol, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{protocol.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-300">
                          {formatCurrency(protocol.tvl)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            protocol.change24h >= 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {protocol.change24h >= 0 ? '+' : ''}{protocol.change24h?.toFixed(2) || '0.00'}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {protocol.category || 'DeFi'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Data source attribution */}
            <div className="text-xs text-gray-500 text-right font-mono">
              DATA_SOURCE: DEFILLAMA, COINGECKO | TIMESTAMP: {marketData.lastUpdated}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 