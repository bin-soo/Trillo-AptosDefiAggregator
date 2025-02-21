import { APTOS_COLORS } from '@/constants/brand';

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
  );
} 