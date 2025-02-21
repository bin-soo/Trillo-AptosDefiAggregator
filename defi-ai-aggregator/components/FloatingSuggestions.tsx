import { useState, useEffect } from 'react';

interface FloatingSuggestionsProps {
  onActionClick: (query: string) => void;
  currentQuery: string;
}

export default function FloatingSuggestions({ onActionClick, currentQuery }: FloatingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Array<{title: string; query: string}>>([]);

  useEffect(() => {
    // Dynamic suggestions based on current query
    if (currentQuery.toLowerCase().includes('usdc')) {
      setSuggestions([
        { title: "Compare with USDT", query: "Compare USDC and USDT lending rates" },
        { title: "Show all pools", query: "Show all USDC pools" },
        { title: "Best swap rate", query: "Best rate to swap USDC to APT" }
      ]);
    } else if (currentQuery.toLowerCase().includes('apt')) {
      setSuggestions([
        { title: "Staking options", query: "What are the APT staking options?" },
        { title: "Compare yields", query: "Compare APT lending vs staking yields" },
        { title: "Show all pools", query: "Show all APT pools" }
      ]);
    } else {
      setSuggestions([
        { title: "USDC Lending", query: "What is the best USDC lending rate?" },
        { title: "APT Lending", query: "Show APT lending rates" },
        { title: "Compare Stables", query: "Compare stable coin rates" }
      ]);
    }
  }, [currentQuery]);

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onActionClick(suggestion.query)}
          className="flex-none px-4 py-2 rounded-full bg-white hover:bg-gray-50 
            border border-gray-200 shadow-sm hover:shadow
            text-sm text-gray-700 hover:text-gray-900 transition-all
            whitespace-nowrap"
        >
          {suggestion.title}
        </button>
      ))}
    </div>
  );
} 