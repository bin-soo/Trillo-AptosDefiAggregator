import { APTOS_COLORS } from '@/constants/brand';
import Link from 'next/link';

interface QuickActionsProps {
  onActionClick: (query: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const suggestions = [
    {
      title: "Swap APT to USDC",
      query: "Swap 1 APT to USDC",
      icon: "💱"
    },
    {
      title: "Analyze My Portfolio",
      query: "Analyze my portfolio and suggest optimizations",
      icon: "📊"
    },
    {
      title: "Best Yield for USDC",
      query: "What's the best yield for 100 USDC?",
      icon: "💰"
    },
    {
      title: "Compare Staking Options",
      query: "Compare APT staking options",
      icon: "🔄"
    }
  ];

  const features = [
    {
      title: "AI Portfolio Manager",
      description: "Get personalized portfolio analysis and optimization",
      icon: "🤖",
      href: "#",
      action: "Analyze my portfolio"
    },
    {
      title: "Yield Optimizer",
      description: "Find the best yield opportunities across Aptos DeFi",
      icon: "📈",
      href: "#",
      action: "What are the best yield opportunities right now?"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {features.map((feature, i) => (
          <button
            key={i}
            onClick={() => onActionClick(feature.action)}
            className="p-6 rounded-xl bg-white shadow-md hover:shadow-lg 
              transition-all group text-left border border-gray-200"
          >
            <div className="flex items-start space-x-4">
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {feature.icon}
              </span>
              <div>
                <h3 className="font-medium text-lg text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onActionClick(suggestion.query)}
            className="p-4 rounded-xl bg-gradient-to-r from-aptos-light-blue to-aptos-light-purple 
              hover:from-aptos-blue/10 hover:to-aptos-purple/10 backdrop-blur-sm
              transition-all group text-left"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl group-hover:scale-110 transition-transform">
                {suggestion.icon}
              </span>
              <div>
                <h3 className="font-medium text-gray-900">{suggestion.title}</h3>
                <p className="text-sm text-gray-500 truncate">{suggestion.query}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 