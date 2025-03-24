import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface Trader {
  address: string;
  name: string;
  description: string;
  tradingStyle: string;
  riskLevel: string;
  score: number;
}

interface TopTradersProps {
  onSelectTrader: (address: string) => void;
}

const TopTraders: React.FC<TopTradersProps> = ({ onSelectTrader }) => {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopTraders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/copytrading/top');
        
        if (!response.ok) {
          throw new Error(`Error fetching top traders: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.traders || !Array.isArray(data.traders)) {
          throw new Error('Invalid response format');
        }
        
        setTraders(data.traders);
      } catch (error) {
        console.error('Error fetching top traders:', error);
        setError('Failed to load top traders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopTraders();
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-200">
        <p>{error}</p>
        <button 
          onClick={() => fetchTopTraders()} 
          className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Top Traders to Follow</h2>
      <p className="text-sm text-gray-400">
        Copy trading allows you to automatically replicate the trading strategies of successful traders.
        Select a trader to view their detailed profile and performance metrics.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {traders.map((trader) => (
          <div key={trader.address} className="bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-md font-medium text-white">{trader.name}</h3>
                  <p className="text-sm text-gray-400">{trader.description}</p>
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(trader.riskLevel)}`}>
                  {trader.riskLevel} Risk
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400">Trading Style</div>
                  <div className="font-medium text-white">{trader.tradingStyle}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Score</div>
                  <div className="font-medium text-white text-right">{trader.score}/100</div>
                </div>
                <button 
                  className="ml-4 flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  onClick={() => onSelectTrader(trader.address)}
                >
                  Analyze <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopTraders; 