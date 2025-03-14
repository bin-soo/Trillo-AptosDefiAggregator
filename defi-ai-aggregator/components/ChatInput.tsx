'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, MicrophoneIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import { CommandLineIcon } from '@heroicons/react/24/outline';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isConnected: boolean;
}

export default function ChatInput({ input, handleInputChange, handleSubmit, isConnected }: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set mounted state on client-side only
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (isMounted && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input, isMounted]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const formEvent = new Event('submit', { cancelable: true }) as any;
        handleSubmit(formEvent);
      }
    }
  };

  // Don't render anything during SSR
  if (!isMounted) {
    return (
      <div className="h-12 bg-gray-800/50 rounded-xl animate-pulse"></div>
    );
  }

  return (
    <div className={`relative rounded-xl transition-all duration-200 ${
      isFocused 
        ? 'shadow-lg shadow-blue-500/20 border-blue-500/50' 
        : 'shadow-md shadow-black/10 border-gray-600'
    } border bg-gray-900/80 backdrop-blur-md`}>
      {/* Command indicator */}
      <div className="absolute left-3 top-3 text-gray-400">
        <CommandLineIcon className="h-5 w-5" />
      </div>
      
      <div className="flex items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isConnected ? "Ask about swaps, yields, market analysis, or anything DeFi..." : "Connect wallet for personalized assistance..."}
          className="flex-1 bg-transparent border-none outline-none resize-none py-3 pl-10 pr-16 text-white placeholder-gray-500 font-mono min-h-[48px] max-h-[120px]"
          rows={1}
        />
        
        <div className="absolute right-2 bottom-2 flex space-x-1">
          {/* Suggestion button */}
          <button
            type="button"
            className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-900/20"
            title="Get suggestions"
          >
            <LightBulbIcon className="h-5 w-5" />
          </button>
          
          {/* Submit button */}
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              if (input.trim()) {
                const formEvent = new Event('submit', { cancelable: true }) as any;
                handleSubmit(formEvent);
              }
            }}
            disabled={!input.trim()}
            className={`p-2 rounded-lg ${
              input.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            } transition-colors`}
            title="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Keyboard shortcut hint */}
      <div className="absolute right-3 bottom-12 text-xs text-gray-500 font-mono">
        Press Enter ↵ to send
      </div>
    </div>
  );
} 