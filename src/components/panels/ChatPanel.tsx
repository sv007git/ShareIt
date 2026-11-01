import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Smile, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../../signaling/types';
import { formatTime } from '../../utils/formatters';

export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  localPeerId: string;
  isEmbedded?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  localPeerId,
  isEmbedded = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const quickEmojis = ['👍', '👋', '🎉', '👏', '❤️', '🚀'];

  const containerClasses = isEmbedded
    ? 'h-full w-80 md:w-96 bg-surface-900 border-l border-surface-800 flex flex-col z-30 text-surface-100 shrink-0'
    : 'fixed inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-surface-900 border-l border-surface-800 shadow-2xl flex flex-col z-40 animate-slide-up sm:animate-fade-in text-surface-100';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-surface-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <div>
            <h3 className="font-bold text-surface-100 text-sm sm:text-base">In-Meeting Chat</h3>
            <p className="text-[11px] text-surface-400">Live texting while in call & screenshare</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-surface-500 text-xs px-4">
            <MessageSquare className="w-8 h-8 text-surface-600 mb-2" />
            <p className="font-medium text-surface-300">No messages yet</p>
            <p className="mt-1 text-surface-400">Text other participants while watching the call or screen share.</p>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className="text-center py-1">
                  <span className="text-[10px] sm:text-[11px] font-medium text-surface-400 bg-surface-950/60 px-3 py-1 rounded-full border border-surface-800">
                    {msg.text}
                  </span>
                </div>
              );
            }

            const isSelf = msg.senderPeerId === localPeerId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[11px] font-semibold text-surface-300">
                    {isSelf ? 'You' : msg.senderName}
                  </span>
                  <span className="text-[10px] text-surface-500">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm ${
                    isSelf
                      ? 'bg-brand-500 text-white rounded-tr-sm'
                      : 'bg-surface-800 text-surface-100 rounded-tl-sm border border-surface-700/60'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji shortcuts */}
      <div className="px-3 sm:px-4 py-1.5 border-t border-surface-800 flex items-center gap-2 overflow-x-auto">
        <Smile className="w-3.5 h-3.5 text-surface-400 shrink-0" />
        {quickEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => addEmoji(emoji)}
            className="hover:scale-125 transition-transform text-sm px-1"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-surface-800 bg-surface-950/60 flex items-center gap-2 safe-area-pb">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send message to everyone..."
          className="flex-1 bg-surface-900 border border-surface-700 rounded-xl px-3.5 py-2 text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-all shadow-md shadow-brand-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
