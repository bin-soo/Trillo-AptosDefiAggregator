import { APTOS_COLORS } from '@/constants/brand';
import Link from 'next/link';

interface QuickActionsProps {
  onActionClick: (query: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const suggestions = [
    {
      title: "Best USDC Lending Rate",
      query: "What is the best USDC lending rate for now?",
      icon: "💰"
    },
    {
      title: "APT Lending Options",
      query: "Show me APT lending rates",
      icon: "📈"
    },
    {
      title: "Compare Stable Rates",
      query: "Compare USDC and USDT lending rates",
      icon: "🔄"
    },
    {
      title: "Best Swap Rates",
      query: "What's the best rate to swap APT to USDC?",
      icon: "💱"
    }
  ];

  const features = [
    {
      title: "AI-Powered Swap",
      description: "Optimize your trades with AI route finding",
      icon: "🤖",
      href: "/swap"
    },
    {
      title: "Yield Optimizer",
      description: "Coming soon: Automated yield strategies",
      icon: "🔄",
      href: "#",
      disabled: true
    }
  ];

  return (
    <div className="space-y-8">
      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {features.map((feature, i) => (
          <Link
            key={i}
            href={feature.disabled ? "#" : feature.href}
            className={`p-6 rounded-xl bg-white shadow-md hover:shadow-lg 
              transition-all group text-left border border-gray-200 ${
                feature.disabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            onClick={e => feature.disabled && e.preventDefault()}
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
          </Link>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Questions</h3>
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