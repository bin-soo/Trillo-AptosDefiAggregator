'use client';

import { useState, useEffect } from 'react';
import { Message } from 'ai';
import ReactMarkdown from 'react-markdown';
import { UserIcon, CodeBracketIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import AptosLogo from './AptosLogo';

interface ChatMessageProps {
  message: Message & { action?: any };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [timestamp, setTimestamp] = useState<string>('');
  const isUser = message.role === 'user';
  
  // Set timestamp on client-side only to avoid hydration mismatch
  useEffect(() => {
    setTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);
  
  // Copy message content to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle action button click
  const handleActionClick = () => {
    if (message.action?.type === 'swap') {
      console.log('Executing swap action:', message.action);
      
      // For swap actions, we'll simulate typing "yes" in the chat input
      const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
      if (inputElement) {
        // Set the input value to "yes"
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, "value"
        )?.set;
        
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputElement, "yes");
          
          // Dispatch input event
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(inputEvent);
          
          // Focus the input
          inputElement.focus();
          
          // Submit the form
          const form = inputElement.closest('form');
          if (form) {
            setTimeout(() => {
              form.dispatchEvent(new Event('submit', { cancelable: true }));
            }, 100); // Small delay to ensure the input is processed
          }
        }
      }
    }
  };
  
  // Handle code blocks in markdown
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <div className="relative group">
          <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => copyToClipboard()}
              className="p-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
              title="Copy code"
            >
              {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
            </button>
          </div>
          <pre className={`${match ? `language-${match[1]}` : ''} rounded-md bg-gray-800 p-4 overflow-x-auto text-sm font-mono text-gray-200`}>
            <code {...props}>{children}</code>
          </pre>
        </div>
      ) : (
        <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200 font-mono text-sm" {...props}>
          {children}
        </code>
      );
    },
    // Style tables
    table({ children }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full divide-y divide-gray-700 border border-gray-700 rounded-md">
            {children}
          </table>
        </div>
      );
    },
    thead({ children }: any) {
      return <thead className="bg-gray-800">{children}</thead>;
    },
    th({ children }: any) {
      return <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{children}</th>;
    },
    td({ children }: any) {
      return <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 border-t border-gray-700">{children}</td>;
    },
    // Style links
    a({ children, href }: any) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:text-blue-300 underline"
        >
          {children}
        </a>
      );
    },
    // Style headings
    h1({ children }: any) {
      return <h1 className="text-xl font-bold text-blue-300 mt-4 mb-2">{children}</h1>;
    },
    h2({ children }: any) {
      return <h2 className="text-lg font-bold text-blue-300 mt-4 mb-2">{children}</h2>;
    },
    h3({ children }: any) {
      return <h3 className="text-md font-bold text-blue-300 mt-3 mb-1">{children}</h3>;
    },
    // Style lists
    ul({ children }: any) {
      return <ul className="list-disc pl-5 space-y-1 my-2 text-gray-300">{children}</ul>;
    },
    ol({ children }: any) {
      return <ol className="list-decimal pl-5 space-y-1 my-2 text-gray-300">{children}</ol>;
    },
    // Style paragraphs
    p({ children }: any) {
      return <p className="my-2 text-gray-300">{children}</p>;
    },
  };

  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[85%] md:max-w-[75%] flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`}>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-blue-900/50 text-blue-400 border border-blue-700' 
              : 'bg-purple-900/50 text-purple-400 border border-purple-700'
          }`}>
            {isUser ? (
              <UserIcon className="h-5 w-5" />
            ) : (
              <SparklesIcon className="h-5 w-5" />
            )}
                </div>
            </div>
            
        {/* Message content */}
        <div className={`relative ${
          isUser 
            ? 'bg-blue-900/30 border border-blue-800/50' 
            : 'bg-gray-800/70 border border-gray-700/50'
        } rounded-xl px-4 py-3 shadow-md`}>
          {/* Message actions */}
          {showActions && (
            <div className={`absolute ${isUser ? 'left-0' : 'right-0'} -top-4 opacity-70 hover:opacity-100`}>
                  <button
                onClick={copyToClipboard}
                className="p-1 rounded-md bg-gray-800 text-gray-400 hover:text-gray-200"
                title="Copy message"
              >
                {copied ? <CheckIcon className="h-3 w-3" /> : <ClipboardIcon className="h-3 w-3" />}
                  </button>
                  </div>
                )}
                
          {/* Message text */}
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown components={components}>
              {message.content}
            </ReactMarkdown>
                  </div>
          
          {/* Action buttons (for swap, etc.) */}
          {message.action && message.action.actionable && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <button
                onClick={handleActionClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center w-full md:w-auto"
              >
                <span className="mr-2">{message.action.actionText || 'Execute Action'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
                  </div>
                )}
                
          {/* Message timestamp - only rendered client-side */}
          {timestamp && (
            <div className={`text-xs text-gray-500 mt-1 text-right`}>
              {timestamp}
              </div>
            )}
          </div>
      </div>
    </div>
  );
} 