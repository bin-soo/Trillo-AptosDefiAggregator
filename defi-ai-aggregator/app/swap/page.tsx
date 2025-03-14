'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArrowsUpDownIcon, ArrowPathIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import WalletConnect from '@/components/WalletConnect';
import SwapAgent from '@/components/SwapAgent';
import { SwapRoute } from '@/types/defi';
import { APTOS_COINS, APTOS_TESTNET_COINS } from '@/services/constants';
import { useNetwork } from '../providers';
import Link from 'next/link';
import Image from 'next/image';

export default function SwapPage() {
  const { connected } = useWallet();
  const { network, setNetwork, isTestnet } = useNetwork();
  const [tokenIn, setTokenIn] = useState('APT');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [amount, setAmount] = useState('1');
  const [currentRoute, setCurrentRoute] = useState<SwapRoute | null>(null);
  const [marketData, setMarketData] = useState({
    aptPrice: 6.75,
    aptChange24h: -2.5,
    volume24h: 125000000,
    lastUpdated: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState<boolean | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [isMounted, setIsMounted] = useState(true);

  // Available tokens
  const availableTokens = isTestnet 
    ? Object.keys(APTOS_TESTNET_COINS) 
    : Object.keys(APTOS_COINS);

  // Fetch market data on load and set up refresh interval
  useEffect(() => {
    // Fetch data immediately
    fetchMarketData();
    
    // Set up interval to refresh data every 5 minutes (300000 ms)
    const intervalId = setInterval(fetchMarketData, 300000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Update formatted time on client side only
  useEffect(() => {
    setFormattedTime(marketData.lastUpdated.toLocaleTimeString());
    
    // Update time every second
    const interval = setInterval(() => {
      setFormattedTime(marketData.lastUpdated.toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [marketData.lastUpdated]);

  // Fetch market data
  const fetchMarketData = async () => {
    setIsLoading(true);
    try {
      // Fetch real APT price data from CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/aptos?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      const data = await response.json();
      
      // Extract the relevant data
      const aptPrice = data.market_data.current_price.usd;
      const aptChange24h = data.market_data.price_change_percentage_24h;
      const volume24h = data.market_data.total_volume.usd;
      console.log('Market data:', { aptPrice, aptChange24h, volume24h });
      setMarketData({
        aptPrice,
        aptChange24h,
        volume24h,
        lastUpdated: new Date()
      });
      
      console.log('Market data updated:', { aptPrice, aptChange24h, volume24h });
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Fallback to reasonable values if the API call fails
      setMarketData({
        aptPrice: 6.75,
        aptChange24h: -2.5,
        volume24h: 125000000,
        lastUpdated: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle token swap
  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
  };

  // Handle route change
  const handleRouteChange = (route: SwapRoute) => {
    setCurrentRoute(route);
  };

  // Handle swap completion
  const handleSwapComplete = (success: boolean, txHash?: string) => {
    setSwapSuccess(success);
    if (txHash) {
      setTxHash(txHash);
    }
  };

  // Calculate current rate
  const calculateCurrentRate = () => {
    if (!currentRoute) {
      // Fallback calculations based on real market data
      if (tokenIn === 'APT' && tokenOut === 'USDC') {
        return marketData.aptPrice.toFixed(6);
      } else if (tokenIn === 'USDC' && tokenOut === 'APT') {
        return (1 / marketData.aptPrice).toFixed(6);
      } else if (['USDC', 'USDT', 'DAI'].includes(tokenIn) && ['USDC', 'USDT', 'DAI'].includes(tokenOut)) {
        return '1.000000'; // Stablecoin to stablecoin
      } else if (tokenIn === 'APT') {
        return marketData.aptPrice.toFixed(6); // APT to any other token (assuming stablecoin)
      } else if (tokenOut === 'APT') {
        return (1 / marketData.aptPrice).toFixed(6); // Any token to APT (assuming stablecoin)
      } else {
        return '0.000000';
      }
    }

    const inputAmount = parseFloat(currentRoute.fromAmount);
    const outputAmount = parseFloat(currentRoute.expectedOutput);
    
    if (inputAmount <= 0 || outputAmount <= 0) return '0.000000';
    
    return (outputAmount / inputAmount).toFixed(6);
  };

  // Toggle network
  const toggleNetwork = () => {
    setNetwork(isTestnet ? 'mainnet' : 'testnet');
  };

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              <Image 
                src="/static/Aptos_mark_BLK.svg" 
                alt="Aptos" 
                width={32} 
                height={32} 
              />
            </Link>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            AI-Powered Swap
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleNetwork}
              className={`px-3 py-1 rounded-full text-sm ${
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

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Swap Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Swap Tokens</h2>
              </div>

              {/* Swap Form */}
              <div className="space-y-4">
                {/* From Token */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      From
                    </label>
                    <div className="text-sm text-gray-500">
                      Balance: {isTestnet ? '1000' : '0.00'}
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="flex-1 bg-transparent border-0 focus:ring-0 text-2xl font-medium text-gray-900"
                      placeholder="0.0"
                      min="0"
                    />
                    <div className="relative">
                      <select
                        value={tokenIn}
                        onChange={(e) => setTokenIn(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {availableTokens.map((token) => (
                          <option key={token} value={token}>
                            {token}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSwapTokens}
                    className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ArrowsUpDownIcon className="h-6 w-6 text-gray-600" />
                  </button>
                </div>

                {/* To Token */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      To
                    </label>
                    <div className="text-sm text-gray-500">
                      Balance: {isTestnet ? '1000' : '0.00'}
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="flex-1 text-2xl font-medium text-gray-900">
                      {currentRoute ? parseFloat(currentRoute.expectedOutput).toFixed(6) : '0.0'}
                    </div>
                    <div className="relative">
                      <select
                        value={tokenOut}
                        onChange={(e) => setTokenOut(e.target.value)}
                        className="appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        {availableTokens.map((token) => (
                          <option key={token} value={token} disabled={token === tokenIn}>
                            {token}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Insights */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Market Insights</h3>
                  <div className="text-xs text-gray-500">
                    Last updated: {isMounted ? formattedTime : ''}
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">APT Price</p>
                        <p className="text-xl font-semibold">${marketData.aptPrice.toFixed(2)}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-sm ${
                        marketData.aptChange24h >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {marketData.aptChange24h >= 0 ? '+' : ''}{marketData.aptChange24h.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">24h Volume</p>
                        <p className="font-medium">${(marketData.volume24h / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Rate</p>
                        <p className="font-medium">{calculateCurrentRate()}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 text-xs text-gray-500">
                      Powered by Aptos DeFi Assistant
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - AI Agent */}
          <div className="lg:col-span-1">
            {connected ? (
              <SwapAgent
                tokenIn={tokenIn}
                tokenOut={tokenOut}
                amount={amount}
                onSwapComplete={handleSwapComplete}
                onRouteChange={handleRouteChange}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">AI Swap Agent</h3>
                <p className="text-gray-600 mb-6">
                  Connect your wallet to access the AI-powered swap agent that will find the best routes and execute trades for you.
                </p>
                <WalletConnect onConnect={() => {}} />
              </div>
            )}

            {/* Transaction Status */}
            {swapSuccess !== null && (
              <div className={`mt-4 p-4 rounded-xl ${swapSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`text-sm font-medium ${swapSuccess ? 'text-green-800' : 'text-red-800'} mb-2`}>
                  {swapSuccess ? 'Transaction Successful' : 'Transaction Failed'}
                </h3>
                {txHash && (
                  <a
                    href={`https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on Explorer
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">
                © 2024 Aptos DeFi Assistant. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a
                href="https://github.com/aptos-foundation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-900"
              >
                GitHub
              </a>
              <a
                href="https://aptoslabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-900"
              >
                Aptos Labs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 