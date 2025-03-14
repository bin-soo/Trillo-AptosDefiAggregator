'use client';

import { useState, useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/solid';

interface FloatingSuggestionsProps {
  onActionClick: (query: string) => void;
  currentQuery: string;
  setInputText?: (text: string) => void;
}

export default function FloatingSuggestions({ 
  onActionClick, 
  currentQuery, 
  setInputText 
}: FloatingSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Generate contextual suggestions based on current query
  useEffect(() => {
    if (!isMounted) return;
    
    if (currentQuery.trim().length > 0) {
      // Generate suggestions based on the current query
      if (currentQuery.toLowerCase().includes('swap')) {
        setSuggestions([
          'Swap 5 APT to USDC',
          'What\'s the best DEX for swapping APT?',
          'Compare swap rates across DEXes'
        ]);
      } else if (currentQuery.toLowerCase().includes('yield') || currentQuery.toLowerCase().includes('apy')) {
        setSuggestions([
          'Best yield for stablecoins',
          'Compare lending rates for APT',
          'Risks of high APY protocols'
        ]);
      } else if (currentQuery.toLowerCase().includes('price') || currentQuery.toLowerCase().includes('market')) {
        setSuggestions([
          'APT price prediction next week',
          'Market sentiment analysis for Aptos',
          'Top performing Aptos protocols'
        ]);
      } else {
        // Default suggestions
        setSuggestions([
          'How to stake APT for rewards?',
          'Explain impermanent loss',
          'Best DeFi strategies for beginners'
        ]);
      }
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [currentQuery, isMounted]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    // First update the input text if the setter is provided
    if (setInputText) {
      setInputText(suggestion);
    }
    
    // Then trigger the action with the suggestion text
    onActionClick(suggestion);
  };

  // Don't render anything during SSR
  if (!isMounted) return null;
  
  // Don't render if not visible or no suggestions
  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center space-x-2 mb-2">
        <LightBulbIcon className="h-4 w-4 text-yellow-400" />
        <span className="text-xs text-gray-400 font-mono">SUGGESTIONS</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 rounded-full text-sm text-gray-300 transition-colors flex items-center space-x-1 group"
          >
            <span className="text-xs text-blue-400 group-hover:text-blue-300">&gt;</span>
            <span>{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
} 