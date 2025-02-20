import { Message } from 'ai';
import { DeFiAction } from '@/types/defi';

interface ChatMessageProps {
  message: Message & { action?: DeFiAction };
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`
          rounded-2xl px-4 py-2 max-w-[85%] shadow-sm
          ${isAssistant 
            ? 'bg-white text-gray-900 border border-gray-200' 
            : 'bg-blue-600 text-white'}
        `}
      >
        <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
        {message.action && (
          <div
            className={`
              mt-3 p-3 rounded-lg
              ${isAssistant 
                ? 'bg-gray-50 border border-gray-200' 
                : 'bg-blue-700'}
            `}
          >
            <p className="text-sm font-medium mb-1">
              Suggested Action: {message.action.type}
            </p>
            <div className="text-xs opacity-90">
              {/* Add action details here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 