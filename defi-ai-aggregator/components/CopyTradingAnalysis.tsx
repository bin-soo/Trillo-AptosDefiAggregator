import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Repeat, TrendingUp, Clock, DollarSign } from 'lucide-react';

interface CopyTradingAnalysisProps {
  address: string;
  onClose: () => void;
}

// Define types for the data structure
interface Trade {
  hash: string;
  timestamp: number;
  type: string;
  protocol: string;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  profitLoss?: number;
  gasFee?: string;
}

interface TraderProfile {
  address: string;
  totalTrades: number;
  successRate: number;
  avgProfitPerTrade: number;
  profitableTrades: number;
  lossTrades: number;
  totalProfitLoss: number;
  topTokens: string[];
  topProtocols: string[];
  tradingStyle: string;
  riskLevel: string;
  activeSince: string;
  recentActivity: Trade[];
}

interface CopyTradingData {
  recommendedTrades: Trade[];
  traderProfile: TraderProfile;
  copyTradingScore: number;
  reasonToCopy: string[];
  potentialRisks: string[];
  suggestedAllocation: number;
}

const CopyTradingAnalysis: React.FC<CopyTradingAnalysisProps> = ({ address, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CopyTradingData | null>(null);

  useEffect(() => {
    const fetchCopyTradingData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching copy trading data for address: ${address}`);
        
        const response = await fetch(`/api/copytrading?address=${address}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Copy trading data received:', data);
        
        if (!data.traderProfile) {
          throw new Error('Invalid response format - missing trader profile');
        }
        
        setData(data);
      } catch (error) {
        console.error('Error fetching copy trading data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCopyTradingData();
  }, [address]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTradeTypeIcon = (type: string) => {
    switch (type) {
      case 'swap': return <Repeat className="h-4 w-4" />;
      case 'lend': return <TrendingUp className="h-4 w-4" />;
      case 'borrow': return <DollarSign className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleCopyTrader = () => {
    // This would connect to your web3 functionality to set up copy trading
    alert('Copy trading setup initiated! This would connect to your smart contract implementation.');
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-white">Analyzing Trading Profile</h2>
              <p className="text-gray-400">Fetching on-chain data for {address.slice(0, 6)}...{address.slice(-4)}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-sm text-gray-400">This may take a few moments as we analyze transactions and trading patterns...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold text-white">Error Analyzing Trader</h2>
                <p className="text-red-400">{error}</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col items-center justify-center p-8">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-sm text-gray-400">Please check the address and try again.</p>
              <div className="flex space-x-4 mt-4">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => fetchCopyTradingData()} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { traderProfile, copyTradingScore, reasonToCopy, potentialRisks, suggestedAllocation } = data;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-white">Trader Analysis & Copy Trading</h2>
              <p className="text-gray-400">
                {traderProfile.address.slice(0, 8)}...{traderProfile.address.slice(-8)}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Score Card */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Copy Trading Score</h3>
                <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white ${getScoreColor(copyTradingScore)}`}>
                    {copyTradingScore}/100
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    {copyTradingScore >= 70 ? 'Recommended' : 
                    copyTradingScore >= 50 ? 'Moderate' : 'High Risk'}
                  </p>
                </div>
              </div>
              
              {/* Profile Summary */}
              <div className="bg-gray-700 p-4 rounded-lg col-span-1 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Trader Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Trading Style</p>
                    <p className="font-medium text-white">{traderProfile.tradingStyle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Risk Level</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(traderProfile.riskLevel)}`}>
                      {traderProfile.riskLevel}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Success Rate</p>
                    <p className="font-medium text-white">{traderProfile.successRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Trades</p>
                    <p className="font-medium text-white">{traderProfile.totalTrades}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Active Since</p>
                    <p className="font-medium text-white">{traderProfile.activeSince}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Suggested Allocation</p>
                    <p className="font-medium text-white">{suggestedAllocation}% of portfolio</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reasons and Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Reasons to Copy
                </h3>
                <ul className="space-y-2">
                  {reasonToCopy.map((reason: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" /> Potential Risks
                </h3>
                <ul className="space-y-2">
                  {potentialRisks.map((risk: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-500 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Recent Trades */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Trading Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Protocol</th>
                      <th className="px-4 py-2">Tokens</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {traderProfile.recentActivity.slice(0, 5).map((trade: Trade, i: number) => (
                      <tr key={i} className="text-gray-300">
                        <td className="px-4 py-3 flex items-center">
                          {getTradeTypeIcon(trade.type)}
                          <span className="ml-2 capitalize">{trade.type}</span>
                        </td>
                        <td className="px-4 py-3">{trade.protocol}</td>
                        <td className="px-4 py-3">
                          {trade.tokenIn && trade.tokenOut ? 
                            `${trade.tokenIn} → ${trade.tokenOut}` : 
                            trade.tokenIn || trade.tokenOut || '-'}
                        </td>
                        <td className="px-4 py-3">{formatDate(trade.timestamp)}</td>
                        <td className="px-4 py-3">
                          {trade.profitLoss && trade.profitLoss > 0 ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Profit
                            </span>
                          ) : trade.profitLoss && trade.profitLoss < 0 ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Loss
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Neutral
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Action Button */}
            <div className="flex justify-center">
              <button 
                onClick={handleCopyTrader}
                className={`px-8 py-3 rounded-lg text-white ${
                  copyTradingScore >= 70 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : copyTradingScore >= 50 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-red-600 hover:bg-red-700 opacity-50 cursor-not-allowed'
                }`}
                disabled={copyTradingScore < 50}
              >
                {copyTradingScore >= 70 ? 'Start Copy Trading' : 
                copyTradingScore >= 50 ? 'Copy Trading (Proceed with Caution)' : 
                'Not Recommended for Copy Trading'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CopyTradingAnalysis; 