import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { SwapRoute } from '@/types/defi';
import defiService from '@/services/defiService';
import { useNetwork } from '@/app/providers';

interface SwapAgentProps {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  onSwapComplete?: (success: boolean, txHash?: string) => void;
  onRouteChange?: (route: SwapRoute) => void;
}

export default function SwapAgent({ 
  tokenIn, 
  tokenOut, 
  amount, 
  onSwapComplete,
  onRouteChange
}: SwapAgentProps) {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { network, isTestnet } = useNetwork();
  
  const [route, setRoute] = useState<SwapRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  const [autoExecute, setAutoExecute] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentMessage, setAgentMessage] = useState('');
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset state when network changes
  useEffect(() => {
    setRoute(null);
    setIsLoading(true);
    setError(null);
    setTxStatus('idle');
    setTxHash(null);
  }, [network]);

  // Add a log message
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Scroll to bottom of logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Fetch route when inputs change
  useEffect(() => {
    if (tokenIn && tokenOut && amount) {
      fetchRoute();
    }
  }, [tokenIn, tokenOut, amount]);

  // Fetch the best swap route
  const fetchRoute = async () => {
    setIsLoading(true);
    setError(null);
    addLog(`Searching for optimal swap route: ${amount} ${tokenIn} → ${tokenOut}...`);
    
    try {
      const swapService = defiService;
      swapService.setTestnetMode(isTestnet);
      
      const bestRoute = await swapService.getBestSwapRoute(
        tokenIn as any,
        tokenOut as any,
        amount
      );
      
      setRoute(bestRoute);
      addLog(`Found route via ${bestRoute.dex} with expected output of ${bestRoute.expectedOutput} ${tokenOut}`);
      
      // Notify parent component about the route change
      if (onRouteChange) {
        onRouteChange(bestRoute);
      }
    } catch (error) {
      console.error('Error fetching swap route:', error);
      setError('Failed to find a swap route. Please try different tokens or amount.');
      addLog(`Error: ${error instanceof Error ? error.message : 'Failed to find swap route'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute the swap
  const executeSwap = async () => {
    if (!route || !connected || !account) return;
    
    setIsExecuting(true);
    addLog(`Preparing swap transaction...`);
    
    try {
      const swapService = defiService;
      swapService.setTestnetMode(isTestnet);
      
      addLog(`Executing swap of ${amount} ${tokenIn} to ${tokenOut}...`);
      
      const result = await swapService.executeSwap(
        account.address,
        tokenIn as any,
        tokenOut as any,
        amount,
        slippage,
        20 * 60 // 20 minutes deadline
      );
      
      if (result.success) {
        addLog(`✅ Transaction submitted! Hash: ${result.txHash}`);
        if (onSwapComplete) {
          onSwapComplete(true, result.txHash);
        }
      } else {
        addLog(`❌ Transaction failed: ${result.error}`);
        if (onSwapComplete) {
          onSwapComplete(false);
        }
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (onSwapComplete) {
        onSwapComplete(false);
      }
    } finally {
      setIsExecuting(false);
    }
  };

  // Return a placeholder while not mounted to prevent hydration issues
  if (!isMounted) {
    return <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 h-[400px]"></div>;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Tech background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[linear-gradient(to_right,#8B5CF680_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF680_1px,transparent_1px)]" 
               style={{ backgroundSize: '20px 20px' }}>
          </div>
        </div>
        
        {/* Glowing elements */}
        <div className="absolute top-10 left-10 w-16 h-16 rounded-full bg-blue-500/10 blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-purple-500/10 blur-xl"></div>
      </div>

      {/* Code-like background elements */}
      <div className="absolute left-2 top-1/4 text-gray-800/10 font-mono text-xs -z-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="my-1">fn swap_tokens::{i + 1}() {'{'} ... {'}'}</div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Status display */}
        <div className="flex items-center space-x-2 mb-4">
          <div className={`h-3 w-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : (route ? 'bg-green-400' : 'bg-red-400')}`}></div>
          <span className="text-sm font-mono">
            {isLoading ? 'SEARCHING_ROUTES' : (route ? 'ROUTE_FOUND' : 'NO_ROUTE_AVAILABLE')}
          </span>
        </div>

        {/* Route information */}
        {route && !isLoading && (
          <div className="bg-gray-900/70 backdrop-blur-md rounded-xl border border-gray-700 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-blue-400 font-mono text-sm">OPTIMAL_ROUTE</h3>
              <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full border border-blue-800">
                via {route.dex}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-mono">INPUT</p>
                <p className="text-lg font-medium text-white">{amount} {tokenIn}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-mono">OUTPUT</p>
                <p className="text-lg font-medium text-white">{route.expectedOutput} {tokenOut}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-mono">PRICE_IMPACT</p>
                <p className={`text-sm font-medium ${
                  parseFloat(route.priceImpact.toString()) > 5 
                    ? 'text-red-400' 
                    : parseFloat(route.priceImpact.toString()) > 1 
                      ? 'text-yellow-400' 
                      : 'text-green-400'
                }`}>
                  {route.priceImpact}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-mono">EST_GAS</p>
                <p className="text-sm font-medium text-gray-300">{route.estimatedGas || 'N/A'}</p>
              </div>
            </div>
            
            <button
              onClick={executeSwap}
              disabled={isExecuting || !connected}
              className={`w-full mt-4 py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                isExecuting 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
              }`}
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Execute Swap</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error message */}
        {error && !isLoading && (
          <div className="bg-red-900/30 backdrop-blur-md rounded-xl border border-red-700 p-4">
            <p className="text-red-400 font-mono text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-gray-900/70 backdrop-blur-md rounded-xl border border-gray-700 p-6 flex flex-col items-center justify-center">
            <div className="flex space-x-2 justify-center items-center mb-4">
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-blue-400 font-mono text-sm">Finding optimal swap route...</p>
          </div>
        )}

        {/* Terminal-like logs */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-400"></div>
            <h3 className="text-sm font-mono text-green-400">SWAP_AGENT_LOGS</h3>
          </div>
          <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700 p-3 h-32 overflow-y-auto font-mono text-xs">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="text-gray-400 mb-1">
                  <span className="text-green-500">$</span> {log}
                </div>
              ))
            ) : (
              <div className="text-gray-600 italic">Waiting for operations...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}