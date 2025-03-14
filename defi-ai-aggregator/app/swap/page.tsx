'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArrowsUpDownIcon, ArrowPathIcon, ChevronDownIcon, CommandLineIcon, HomeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import WalletConnect from '@/components/WalletConnect';
import SwapAgent from '@/components/SwapAgent';
import { SwapRoute } from '@/types/defi';
import { APTOS_COINS, APTOS_TESTNET_COINS } from '@/services/constants';
import { useNetwork } from '../providers';
import Link from 'next/link';
import AptosLogo from '@/components/AptosLogo';

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
  const [isMounted, setIsMounted] = useState(false);
  
  // Available tokens
  const availableTokens = isTestnet 
    ? Object.keys(APTOS_TESTNET_COINS) 
    : Object.keys(APTOS_COINS);

  // Fetch market data on load and set up refresh interval
  useEffect(() => {
    setIsMounted(true);
    // Fetch data immediately
    fetchMarketData();
    
    // Set up interval to refresh data every 5 minutes (300000 ms)
    const intervalId = setInterval(fetchMarketData, 300000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Update formatted time on client side only
  useEffect(() => {
    if (!isMounted) return;
    
    setFormattedTime(marketData.lastUpdated.toLocaleTimeString());
    
    // Update time every second
    const interval = setInterval(() => {
      setFormattedTime(marketData.lastUpdated.toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [marketData.lastUpdated, isMounted]);

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

  // Show loading state during SSR
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
            <ArrowPathIcon className="h-8 w-8 text-blue-400 animate-spin" />
          </div>
          <div className="h-6 w-48 bg-gray-700 rounded mb-4"></div>
          <div className="h-4 w-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#8B5CF680_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF680_1px,transparent_1px)]" 
               style={{ backgroundSize: '40px 40px' }}>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full border border-blue-500/20 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full border border-purple-500/20 animate-pulse-slow" 
             style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full border border-blue-500/20 animate-pulse-slow"
             style={{ animationDelay: '2s' }}></div>
             
        {/* Tech circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500/5"></div>
        <div className="absolute -bottom-40 -right-20 w-96 h-96 rounded-full bg-purple-500/5"></div>
        
        {/* Code-like elements */}
        <div className="absolute top-1/4 left-8 text-blue-500/10 text-xs font-mono">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="my-1">{'{'}aptos::swap::module{'}'}::{i + 1}</div>
          ))}
        </div>
        <div className="absolute bottom-1/4 right-8 text-purple-500/10 text-xs font-mono">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="my-1">fn swap_tokens::{i + 1}() {'{'} ... {'}'}</div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md border-b border-gray-700 bg-black/30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
              <HomeIcon className="h-6 w-6" />
            </Link>
            <div className="flex items-center space-x-2">
              <AptosLogo />
              <span className="font-mono text-xl text-blue-400">DeFi.AI</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link 
              href="/"
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 flex items-center space-x-1"
              title="Chat"
            >
              <CommandLineIcon className="h-5 w-5" />
              <span className="hidden md:inline text-sm">Chat</span>
            </Link>
            <Link 
              href="/market"
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 flex items-center space-x-1"
              title="Market Dashboard"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span className="hidden md:inline text-sm">Markets</span>
            </Link>
            <button
              onClick={toggleNetwork}
              className={`px-3 py-1 rounded-lg text-sm font-mono ${
                isTestnet 
                  ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700' 
                  : 'bg-green-900/50 text-green-400 border border-green-700'
              }`}
            >
              {isTestnet ? 'TESTNET' : 'MAINNET'}
            </button>
            <WalletConnect onConnect={() => {}} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto pt-8 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-300 mb-6 text-center">AI-Powered Token Swap</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Swap Interface */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg border border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-blue-300">Swap Tokens</h2>
                  <div className="text-sm text-gray-400 flex items-center">
                    <ArrowPathIcon className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>{isMounted ? formattedTime : ''}</span>
                  </div>
                </div>

                {/* Swap Form */}
                <div className="space-y-4">
                  {/* From Token */}
                  <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-400">
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
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-2xl font-medium text-white"
                        placeholder="0.0"
                        min="0"
                      />
                      <div className="relative">
                        <select
                          value={tokenIn}
                          onChange={(e) => setTokenIn(e.target.value)}
                          className="appearance-none bg-gray-800 border border-gray-600 rounded-lg py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
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
                      className="bg-gray-800/80 p-3 rounded-full hover:bg-gray-700 transition-colors border border-gray-700"
                    >
                      <ArrowsUpDownIcon className="h-6 w-6 text-blue-400" />
                    </button>
                  </div>

                  {/* To Token */}
                  <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-400">
                        To
                      </label>
                      <div className="text-sm text-gray-500">
                        Balance: {isTestnet ? '1000' : '0.00'}
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="flex-1 text-2xl font-medium text-white">
                        {currentRoute ? parseFloat(currentRoute.expectedOutput).toFixed(6) : '0.0'}
                      </div>
                      <div className="relative">
                        <select
                          value={tokenOut}
                          onChange={(e) => setTokenOut(e.target.value)}
                          className="appearance-none bg-gray-800 border border-gray-600 rounded-lg py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
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
                <div className="mt-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-blue-300">Market Insights</h3>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex justify-center py-4">
                      <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-400">APT Price</p>
                          <p className="text-xl font-semibold text-white">${marketData.aptPrice.toFixed(2)}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-sm ${
                          marketData.aptChange24h >= 0 ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-red-900/50 text-red-400 border border-red-700'
                        }`}>
                          {marketData.aptChange24h >= 0 ? '+' : ''}{marketData.aptChange24h.toFixed(2)}%
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">24h Volume</p>
                          <p className="font-medium text-white">${(marketData.volume24h / 1000000).toFixed(1)}M</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Current Rate</p>
                          <p className="font-medium text-white">{calculateCurrentRate()}</p>
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
                <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-medium text-blue-300 mb-4">AI Swap Agent</h3>
                  <SwapAgent
                    tokenIn={tokenIn}
                    tokenOut={tokenOut}
                    amount={amount}
                    onSwapComplete={handleSwapComplete}
                    onRouteChange={handleRouteChange}
                  />
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg border border-gray-700 p-6 text-center">
                  <h3 className="text-lg font-medium text-blue-300 mb-4">AI Swap Agent</h3>
                  <p className="text-gray-400 mb-6">
                    Connect your wallet to access the AI-powered swap agent that will find the best routes and execute trades for you.
                  </p>
                  <WalletConnect onConnect={() => {}} />
                </div>
              )}

              {/* Transaction Status */}
              {swapSuccess !== null && (
                <div className={`mt-4 p-4 rounded-xl ${
                  swapSuccess 
                    ? 'bg-green-900/30 border border-green-700' 
                    : 'bg-red-900/30 border border-red-700'
                }`}>
                  <h3 className={`text-sm font-medium ${swapSuccess ? 'text-green-400' : 'text-red-400'} mb-2`}>
                    {swapSuccess ? 'Transaction Successful' : 'Transaction Failed'}
                  </h3>
                  {txHash && (
                    <a
                      href={`https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      View on Explorer
                    </a>
                  )}
                </div>
              )}
              
              {/* Additional Info Card */}
              <div className="mt-4 bg-gray-800/50 backdrop-blur-md rounded-xl shadow-lg border border-gray-700 p-6">
                <h3 className="text-lg font-medium text-blue-300 mb-4">Swap Features</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>Best rates across multiple DEXes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>AI-powered route optimization</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>Minimal slippage protection</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    <span>Real-time market data</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <Link 
                    href="/"
                    className="text-blue-400 hover:text-blue-300 flex items-center"
                  >
                    <CommandLineIcon className="h-4 w-4 mr-1" />
                    <span>Ask AI assistant for help</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 py-6 bg-black/30 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-400">
                © 2024 Aptos DeFi Assistant. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a
                href="https://github.com/aptos-foundation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                GitHub
              </a>
              <a
                href="https://aptoslabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                Aptos Labs
              </a>
              <Link
                href="/"
                className="text-gray-400 hover:text-white"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 