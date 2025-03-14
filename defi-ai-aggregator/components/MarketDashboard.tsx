'use client';

import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useNetwork } from '@/app/providers';
import defiService from '@/services/defiService';
import priceService from '@/services/priceService';
import { TokenType } from '@/services/constants';
import axios from 'axios';
import { TokenData, ProtocolData, MarketData } from '@/types/defi';

export default function MarketDashboard() {
  const { isTestnet } = useNetwork();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTime, setRefreshTime] = useState<string>('');

  useEffect(() => {
    fetchMarketData();
    
    // Set up auto-refresh every 3 minutes
    const intervalId = setInterval(fetchMarketData, 3 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isTestnet]);

  const fetchMarketData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[MarketDashboard] Fetching market data...');
      // Use the defiService to get market data
      const data = await defiService.getMarketData();
      console.log('[MarketDashboard] Market data fetched successfully:', data);
      setMarketData(data);
      setRefreshTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('[MarketDashboard] Error fetching market data:', err);
      setError(`Failed to fetch market data: ${err.message || 'Unknown error'}`);
      
      // Try to get minimal data
      try {
        console.log('[MarketDashboard] Attempting to fetch minimal data...');
        const tokenData = await Promise.all(['APT'].map(async (symbol) => {
          const price = await defiService.getTokenPrice(symbol);
          return {
            symbol,
            name: symbol === 'APT' ? 'Aptos' : symbol,
            price,
            change24h: 0,
            volume24h: 0,
            marketCap: 0
          };
        }));
        
        // Create minimal market data
        const minimalData = {
          tokens: tokenData,
          protocols: [],
          ecosystem: {
            totalTVL: 0,
            marketCap: 0,
            volume24h: 0,
            activeUsers: 0,
            transactions24h: 0
          },
          lastUpdated: new Date().toISOString()
        };
        
        console.log('[MarketDashboard] Using minimal data:', minimalData);
        setMarketData(minimalData);
        setRefreshTime(new Date().toLocaleTimeString());
      } catch (fallbackErr) {
        console.error('[MarketDashboard] Failed to fetch minimal data:', fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    } else if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(2)}K`;
    } else {
      return `${value.toFixed(2)}`;
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Aptos Market Dashboard</h2>
          <button 
            onClick={fetchMarketData}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowUpIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">{error}</p>
          <button 
            onClick={fetchMarketData}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !marketData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Aptos Market Dashboard</h2>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Aptos Market Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Last updated: {refreshTime}</span>
          <button 
            onClick={fetchMarketData}
            className="p-2 rounded-full hover:bg-gray-100"
            disabled={isLoading}
          >
            <ArrowUpIcon className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Network indicator */}
      {isTestnet && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
          ⚠️ You are viewing testnet data. Some metrics may be estimated or simulated.
        </div>
      )}
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Aptos Market Cap</h3>
          <p className="text-2xl font-bold text-gray-900">
            {marketData?.ecosystem.marketCap ? formatCurrency(marketData.ecosystem.marketCap) : '-'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Value Locked (TVL)</h3>
          <p className="text-2xl font-bold text-gray-900">
            {marketData?.ecosystem.totalTVL ? formatCurrency(marketData.ecosystem.totalTVL) : '-'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">24h Trading Volume</h3>
          <p className="text-2xl font-bold text-gray-900">
            {marketData?.ecosystem.volume24h ? formatCurrency(marketData.ecosystem.volume24h) : '-'}
          </p>
        </div>
      </div>
      
      {/* Token prices */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Token Prices</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">24h Volume</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marketData?.tokens.map((token) => (
                  <tr key={token.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={`/static/tokens/${token.symbol.toLowerCase()}.svg`} 
                          alt={token.symbol}
                          className="h-6 w-6 mr-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/static/tokens/generic.svg';
                          }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{token.symbol}</div>
                          <div className="text-sm text-gray-500">{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      ${token.price.toFixed(token.symbol === 'APT' ? 2 : 4)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="flex items-center justify-end">
                        {token.change24h >= 0 ? (
                          <ArrowUpIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(token.change24h).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(token.volume24h)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {token.marketCap > 0 ? formatCurrency(token.marketCap) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Top Protocols */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Protocols by TVL</h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Protocol</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">TVL</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">24h Change</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">1h Change</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marketData?.protocols.map((protocol) => (
                  <tr key={protocol.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={`/static/protocols/${protocol.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.svg`} 
                          alt={protocol.name}
                          className="h-6 w-6 mr-2"
                          onError={(e) => {
                            // Try a second format if the first fails
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('generic')) {
                              target.src = `/static/protocols/generic.svg`;
                            }
                          }}
                        />
                        <div className="font-medium text-gray-900">
                          {/* Format protocol name to be more readable */}
                          {protocol.name
                            .replace(/-/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      ${formatCurrency(protocol.tvl)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        protocol.change24h >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {protocol.change24h >= 0 ? '+' : ''}{protocol.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        protocol.change1h >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {protocol.change1h >= 0 ? '+' : ''}{protocol.change1h?.toFixed(2) || '0.00'}%
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
      </div>
      
      {/* Additional Ecosystem Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Ecosystem Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Active Users (24h)</h4>
            <p className="text-xl font-bold text-gray-900">
              {marketData?.ecosystem.activeUsers ? marketData.ecosystem.activeUsers.toLocaleString() : '-'}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-500 mb-1">Transactions (24h)</h4>
            <p className="text-xl font-bold text-gray-900">
              {marketData?.ecosystem.transactions24h ? marketData.ecosystem.transactions24h.toLocaleString() : '-'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Data Sources */}
      <div className="text-xs text-gray-500 text-right">
        Data sources: CoinGecko, DeFiLlama, Aptos Explorer
      </div>
    </div>
  );
} 