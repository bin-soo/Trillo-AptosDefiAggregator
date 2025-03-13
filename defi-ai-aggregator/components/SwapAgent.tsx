import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  const [autoExecute, setAutoExecute] = useState(false);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentMessage, setAgentMessage] = useState('');
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset state when network changes
  useEffect(() => {
    setRoute(null);
    setLoading(false);
    setError(null);
    setTxStatus('idle');
    setTxHash(null);
  }, [network]);

  // Fetch best route when inputs change
  useEffect(() => {
    if (!isMounted) return;
    
    const fetchRoute = async () => {
      if (!tokenIn || !tokenOut || !amount || parseFloat(amount) <= 0) {
        return;
      }

      setLoading(true);
      setError(null);
      setAgentThinking(true);
      setAgentMessage('Analyzing market conditions...');

      try {
        // Simulate AI thinking with delayed messages
        const messages = [
          'Checking liquidity across DEXes...',
          'Calculating optimal route...',
          'Estimating price impact...',
          'Comparing gas costs...',
          'Finalizing best swap path...'
        ];

        // Display thinking messages with delays
        for (let i = 0; i < messages.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          setAgentMessage(messages[i]);
        }

        // Get the best swap route
        const bestRoute = await defiService.getBestSwapRoute(
          tokenIn as any,
          tokenOut as any,
          amount
        );

        setRoute(bestRoute);
        if (onRouteChange) {
          onRouteChange(bestRoute);
        }

        // Set success message
        setAgentMessage(`Found optimal route via ${bestRoute.protocol || bestRoute.dex} with ${bestRoute.priceImpact}% price impact`);
        
        // Auto-execute if enabled
        if (autoExecute && connected && account) {
          executeSwap();
        }
      } catch (error) {
        console.error('Error fetching swap route:', error);
        setError('Failed to find a viable swap route. Please try again or adjust your inputs.');
        setAgentMessage('I encountered an issue finding a swap route. Please try again.');
      } finally {
        setLoading(false);
        setAgentThinking(false);
      }
    };

    fetchRoute();
  }, [tokenIn, tokenOut, amount, connected, account, autoExecute, network, isMounted]);

  const executeSwap = async () => {
    if (!connected || !account || !route) {
      setError('Please connect your wallet and ensure a route is available.');
      return;
    }

    setTxStatus('pending');
    setError(null);
    setAgentMessage('Preparing transaction...');

    try {
      // Execute the swap
      const result = await defiService.executeSwap(
        account.address,
        tokenIn as any,
        tokenOut as any,
        amount,
        slippage
      );

      if (!result.success || !result.payload) {
        throw new Error(result.error || 'Failed to prepare transaction');
      }

      setAgentMessage('Waiting for wallet confirmation...');

      // Use the Petra wallet API directly
      if (!(window as any).aptos) {
        throw new Error('Petra wallet not found. Please make sure it is installed and connected.');
      }

      console.log('Transaction payload:', JSON.stringify(result.payload, null, 2));
      
      // Sign and submit the transaction using Petra wallet
      try {
        const pendingTransaction = await (window as any).aptos.signAndSubmitTransaction(result.payload);
        
        console.log('Transaction submitted:', pendingTransaction);
        
        if (!pendingTransaction || !pendingTransaction.hash) {
          throw new Error('Transaction rejected or failed');
        }

        setTxHash(pendingTransaction.hash);
        setTxStatus('success');
        setAgentMessage(`Transaction submitted! Swapping ${amount} ${tokenIn} to ${route.expectedOutput} ${tokenOut}`);

        if (onSwapComplete) {
          onSwapComplete(true, pendingTransaction.hash);
        }
      } catch (txError) {
        console.error('Transaction error:', txError);
        throw new Error(`Transaction failed: ${txError instanceof Error ? txError.message : String(txError)}`);
      }
    } catch (error) {
      console.error('Swap execution error:', error);
      setTxStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error executing swap');
      setAgentMessage('There was an error executing the swap. Please try again.');
      
      if (onSwapComplete) {
        onSwapComplete(false);
      }
    }
  };

  // Return a placeholder while not mounted to prevent hydration issues
  if (!isMounted) {
    return <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 h-[400px]"></div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">AI Swap Agent</h3>
        <div className="text-xs text-gray-500">Powered by Aptos</div>
      </div>

      {/* Agent Status */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4 min-h-[80px] flex items-center">
        {agentThinking ? (
          <div className="flex items-center">
            <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin mr-2" />
            <p className="text-blue-700">{agentMessage}</p>
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : route ? (
          <p className="text-blue-700">{agentMessage}</p>
        ) : (
          <p className="text-blue-700">Ready to find the best swap route for you.</p>
        )}
      </div>

      {/* Route Details */}
      {route && (
        <div className="mb-4">
          <div 
            className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
            onClick={() => setShowRouteDetails(!showRouteDetails)}
          >
            <h4 className="font-medium text-gray-900">Route Details</h4>
            {showRouteDetails ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
          
          {showRouteDetails && (
            <div className="mt-2 space-y-2 bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Protocol:</span>
                <span className="font-medium">{route.protocol || route.dex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Output:</span>
                <span className="font-medium">{parseFloat(route.expectedOutput).toFixed(6)} {tokenOut}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price Impact:</span>
                <span className={`font-medium ${
                  parseFloat(route.priceImpact.toString()) > 5 ? 'text-red-600' : 
                  parseFloat(route.priceImpact.toString()) > 1 ? 'text-yellow-600' : 'text-green-600'
                }`}>{route.priceImpact}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gas Estimate:</span>
                <span className="font-medium">{route.estimatedGas} APT</span>
              </div>
              
              {/* Alternative Routes */}
              {route.alternativeRoutes && route.alternativeRoutes.length > 0 && (
                <div className="mt-3">
                  <h5 className="font-medium text-gray-900 mb-2">Alternative Routes:</h5>
                  <div className="space-y-2">
                    {route.alternativeRoutes.slice(0, 2).map((alt, i) => (
                      <div key={i} className="bg-white p-2 rounded border border-gray-200">
                        <div className="flex justify-between text-xs">
                          <span>{alt.protocol}</span>
                          <span>{parseFloat(alt.expectedOutput).toFixed(6)} {tokenOut}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Impact: {alt.priceImpact}%</span>
                          <span>Gas: {alt.estimatedGas} APT</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Settings</h4>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Slippage Tolerance:</span>
            <select
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="text-sm bg-white border border-gray-300 rounded px-2 py-1"
            >
              <option value={0.1}>0.1%</option>
              <option value={0.5}>0.5%</option>
              <option value={1.0}>1.0%</option>
              <option value={2.0}>2.0%</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoExecute"
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="autoExecute" className="text-sm text-gray-600">
              Auto-execute when route is found
            </label>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={executeSwap}
        disabled={!route || txStatus === 'pending' || !connected}
        className={`w-full py-3 px-4 rounded-xl font-medium ${
          !route || txStatus === 'pending' || !connected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {txStatus === 'pending' ? (
          <span className="flex items-center justify-center">
            <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
            Processing...
          </span>
        ) : !connected ? (
          'Connect Wallet to Swap'
        ) : !route ? (
          'Finding Best Route...'
        ) : (
          `Swap ${amount} ${tokenIn} for ~${parseFloat(route.expectedOutput).toFixed(6)} ${tokenOut}`
        )}
      </button>

      {/* Transaction Status */}
      {txStatus === 'success' && txHash && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-700 text-sm mb-1">Transaction submitted successfully!</p>
          <a
            href={`https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
}