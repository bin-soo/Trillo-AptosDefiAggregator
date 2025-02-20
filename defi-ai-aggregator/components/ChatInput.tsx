import { FormEvent } from 'react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isConnected: boolean;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isConnected
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="flex space-x-4">
      <textarea
        className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-gray-200 
          p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
          resize-none bg-white/50 backdrop-blur-sm transition-all"
        value={input}
        onChange={handleInputChange}
        placeholder={
          isConnected
            ? "Ask about DeFi (e.g., 'What's the best USDC lending rate?')"
            : 'Please connect your wallet first'
        }
        disabled={!isConnected}
        rows={1}
      />
      <button
        type="submit"
        disabled={!isConnected || !input.trim()}
        className="px-6 py-2 rounded-xl bg-blue-600 text-white font-medium 
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
          focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed 
          transition-colors shadow-sm"
      >
        Send
      </button>
    </form>
  );
} 