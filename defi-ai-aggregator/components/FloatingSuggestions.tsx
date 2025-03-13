import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FloatingSuggestionsProps {
  onActionClick: (query: string) => void;
  currentQuery: string;
}

export default function FloatingSuggestions({ onActionClick, currentQuery }: FloatingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Array<{title: string; query: string; isLink?: boolean; href?: string}>>([]);

  useEffect(() => {
    // Dynamic suggestions based on current query
    if (currentQuery.toLowerCase().includes('swap') || currentQuery.toLowerCase().includes('trade')) {
      setSuggestions([
        { title: "Try AI Swap", isLink: true, href: "/swap" },
        { title: "Best APT to USDC rate", query: "What's the best rate to swap APT to USDC?" },
        { title: "Compare DEXes", query: "Compare DEX rates on Aptos" }
      ]);
    } else if (currentQuery.toLowerCase().includes('usdc')) {
      setSuggestions([
        { title: "Compare with USDT", query: "Compare USDC and USDT lending rates" },
        { title: "Show all pools", query: "Show all USDC pools" },
        { title: "Swap USDC to APT", isLink: true, href: "/swap" }
      ]);
    } else if (currentQuery.toLowerCase().includes('apt')) {
      setSuggestions([
        { title: "Staking options", query: "What are the APT staking options?" },
        { title: "Compare yields", query: "Compare APT lending vs staking yields" },
        { title: "Swap APT", isLink: true, href: "/swap" }
      ]);
    } else {
      setSuggestions([
        { title: "USDC Lending", query: "What is the best USDC lending rate?" },
        { title: "APT Lending", query: "Show APT lending rates" },
        { title: "AI-Powered Swap", isLink: true, href: "/swap" }
      ]);
    }
  }, [currentQuery]);

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {suggestions.map((suggestion, i) => (
        suggestion.isLink ? (
          <Link
            key={i}
            href={suggestion.href || "#"}
            className="flex-none px-4 py-2 rounded-full bg-white hover:bg-gray-50 
              border border-gray-200 shadow-sm hover:shadow
              text-sm text-gray-700 hover:text-gray-900 transition-all
              whitespace-nowrap"
          >
            {suggestion.title}
          </Link>
        ) : (
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
        )
      ))}
    </div>
  );
} 