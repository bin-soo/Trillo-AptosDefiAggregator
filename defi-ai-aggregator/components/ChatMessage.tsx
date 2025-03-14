import { Message } from 'ai';
import { DeFiAction, SwapRoute } from '@/types/defi';
import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import defiService from '@/services/defiService';
import { useNetwork } from '@/app/providers';

interface ChatMessageProps {
  message: Message & { action?: DeFiAction };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  const { connected, account } = useWallet();
  const { isTestnet } = useNetwork();
  const [isExecuting, setIsExecuting] = useState(false);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testnetOutput, setTestnetOutput] = useState<string | null>(null);
  const [isLoadingTestnetRate, setIsLoadingTestnetRate] = useState(false);

  // Fetch testnet rate when component mounts if this is a swap action
  useEffect(() => {
    if (isTestnet && message.action?.type === 'swap') {
      const fetchTestnetRate = async () => {
        setIsLoadingTestnetRate(true);
        try {
          const route = message.action?.data as SwapRoute;
          const testnetRate = await defiService.getTestnetExchangeRate(
            route.fromToken as any,
            route.toToken as any
          );
          const output = (parseFloat(route.fromAmount) * testnetRate).toFixed(6);
          setTestnetOutput(output);
        } catch (error) {
          console.error('Error fetching testnet rate:', error);
        } finally {
          setIsLoadingTestnetRate(false);
        }
      };
      
      fetchTestnetRate();
    }
  }, [isTestnet, message.action]);

  // Function to execute a swap
  const executeSwap = async (route: SwapRoute) => {
    if (!connected || !account) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    setIsExecuting(true);
    setTxStatus('pending');
    setErrorMessage(null);

    try {
      // Execute the swap
      const result = await defiService.executeSwap(
        account.address,
        route.fromToken as any,
        route.toToken as any,
        route.fromAmount,
        0.5 // Default slippage
      );

      if (!result.success || !result.payload) {
        throw new Error(result.error || 'Failed to prepare transaction');
      }

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
      } catch (txError) {
        console.error('Transaction error:', txError);
        throw new Error(`Transaction failed: ${txError instanceof Error ? txError.message : String(txError)}`);
      }
    } catch (error) {
      console.error('Swap execution error:', error);
      setTxStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error executing swap');
    } finally {
      setIsExecuting(false);
    }
  };

  // Function to render markdown-like content
  const renderContent = (content: string) => {
    // Process headers
    let processedContent = content.replace(/## (.*?)$/gm, '<h2 class="text-lg font-bold mt-3 mb-2">$1</h2>');
    processedContent = processedContent.replace(/### (.*?)$/gm, '<h3 class="text-md font-semibold mt-2 mb-1">$1</h3>');
    
    // Process bold text
    processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Process lists
    processedContent = processedContent.replace(/• (.*?)$/gm, '<li class="ml-4">$1</li>');
    processedContent = processedContent.replace(/(\d+)\. (.*?)$/gm, '<li class="ml-4">$1. $2</li>');
    
    // Process line breaks
    processedContent = processedContent.replace(/\n\n/g, '<br/><br/>');
    
    return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
  };

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`
          rounded-2xl px-4 py-3 max-w-[85%] shadow-sm
          ${isAssistant 
            ? 'bg-white text-gray-900 border border-gray-200' 
            : 'bg-blue-600 text-white'}
        `}
      >
        {renderContent(message.content)}
        
        {message.action && message.action.type === 'swap' && (
          <div
            className={`
              mt-3 p-3 rounded-lg
              ${isAssistant 
                ? 'bg-gray-50 border border-gray-200' 
                : 'bg-blue-700'}
            `}
          >
            <p className="text-sm font-medium mb-2">
              Swap Details
            </p>
            <div className="text-xs space-y-1 mb-3">
              <p>From: {(message.action.data as SwapRoute).fromAmount} {(message.action.data as SwapRoute).fromToken}</p>
              <p>To: {(message.action.data as SwapRoute).expectedOutput} {(message.action.data as SwapRoute).toToken}</p>
              <p>Via: {(message.action.data as SwapRoute).protocol || (message.action.data as SwapRoute).dex}</p>
              <p>Price Impact: {(message.action.data as SwapRoute).priceImpact}%</p>
              
              {isTestnet && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="font-medium text-yellow-700">⚠️ Testnet Mode</p>
                  {isLoadingTestnetRate ? (
                    <p className="text-yellow-600">Loading testnet rate...</p>
                  ) : (
                    <p className="text-yellow-600">
                      Expected testnet output: {testnetOutput} {(message.action.data as SwapRoute).toToken}
                    </p>
                  )}
                  <p className="text-xs text-yellow-500 mt-1">
                    Testnet prices differ from real-world values
                  </p>
                </div>
              )}
            </div>
            
            {message.action.actionable && (
              <div className="mt-2">
                {!txStatus && (
                  <button
                    onClick={() => executeSwap(message.action?.data as SwapRoute)}
                    disabled={isExecuting || !connected}
                    className="w-full py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExecuting ? 'Preparing Transaction...' : 'Execute Swap'}
                  </button>
                )}
                
                {txStatus === 'pending' && (
                  <div className="text-center py-2 text-sm">
                    <p className="text-blue-600 animate-pulse">Transaction in progress...</p>
                  </div>
                )}
                
                {txStatus === 'success' && txHash && (
                  <div className="text-center py-2 text-sm">
                    <p className="text-green-600 mb-1">Transaction successful!</p>
                    <a 
                      href={`https://explorer.aptoslabs.com/txn/${txHash}?network=${isTestnet ? 'testnet' : 'mainnet'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View on Explorer
                    </a>
                  </div>
                )}
                
                {txStatus === 'error' && (
                  <div className="text-center py-2 text-sm">
                    <p className="text-red-600 mb-1">Transaction failed</p>
                    {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
                  </div>
                )}
                
                {!connected && !txStatus && (
                  <p className="text-xs text-red-500 mt-1">Please connect your wallet to execute this swap</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 