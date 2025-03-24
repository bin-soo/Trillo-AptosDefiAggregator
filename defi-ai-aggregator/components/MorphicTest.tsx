'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, MessageCirclePlusIcon, SquareIcon } from 'lucide-react';
import React from 'react';

interface MorphicTestProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function MorphicTest({ onSuccess, onError }: MorphicTestProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus the input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage = { role: 'user' as const, content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStatus('loading');

    try {
      // Make a test request to verify configuration
      const response = await fetch('/api/morphic/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${await response.text()}`);
      }

      const data = await response.json();
      
      // Add assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      setStatus('success');
      onSuccess?.();
    } catch (error) {
      console.error('Morphic test error:', error);
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
      setStatus('error');
      if (error instanceof Error) {
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto border border-gray-700 rounded-xl p-4 bg-gray-800/50">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-blue-300">Morphic Integration Test</h2>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'idle' ? 'bg-gray-700 text-gray-300' :
          status === 'loading' ? 'bg-yellow-900/50 text-yellow-300' :
          status === 'success' ? 'bg-green-900/50 text-green-300' :
          'bg-red-900/50 text-red-300'
        }`}>
          {status === 'idle' ? 'Ready' : 
           status === 'loading' ? 'Testing...' : 
           status === 'success' ? 'Success' : 'Error'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 max-h-60 min-h-40 p-2 bg-gray-900/30 rounded-lg">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <p>Type a message to test Morphic integration</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-900/30 border border-blue-800/50 ml-auto max-w-[80%]' 
                  : 'bg-gray-800/50 border border-gray-700 mr-auto max-w-[80%]'
              }`}
            >
              <div className="text-sm font-mono text-gray-400 mb-1">
                {message.role === 'user' ? 'User:' : 'Morphic:'}
              </div>
              <div className="text-sm whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative flex flex-col w-full bg-gray-800 rounded-xl border border-gray-700">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="resize-none w-full min-h-12 bg-transparent border-0 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-t-xl"
            placeholder="Test Morphic integration..."
            rows={2}
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-between p-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Using Morphic integration test</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="New chat"
                disabled={messages.length === 0 || isLoading}
              >
                <MessageCirclePlusIcon className="h-4 w-4" />
              </button>
              <button
                type={isLoading ? 'button' : 'submit'}
                className={`p-2 rounded-full ${
                  isLoading ? 'bg-red-800 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-600'
                } text-white transition-colors flex items-center justify-center`}
                disabled={input.trim().length === 0 && !isLoading}
              >
                {isLoading ? <SquareIcon className="h-4 w-4" /> : <ArrowUpIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 