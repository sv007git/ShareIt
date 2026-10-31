import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { ChatMessage } from '../../signaling/types';

export interface LiveChatToastProps {
  lastMessage: ChatMessage | null;
  isOpenChat: boolean;
  onOpenChat: () => void;
  onQuickReply: (text: string) => void;
  localPeerId: string;
}

export const LiveChatToast: React.FC<LiveChatToastProps> = ({
  lastMessage,
  isOpenChat,
  onOpenChat,
  onQuickReply,
  localPeerId,
}) => {
  const [visible, setVisible] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);

  useEffect(() => {
    // If chat drawer is already open, or message is from self or system, don't show floating toast
    if (
      !lastMessage ||
      isOpenChat ||
      lastMessage.senderPeerId === localPeerId ||
      lastMessage.isSystem
    ) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setShowReplyInput(false);

    // Auto-dismiss after 6 seconds unless user is typing a reply
    const timer = setTimeout(() => {
      if (!showReplyInput) {
        setVisible(false);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [lastMessage, isOpenChat, localPeerId, showReplyInput]);

  if (!visible || !lastMessage) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onQuickReply(replyText.trim());
    setReplyText('');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-40 max-w-sm w-full bg-surface-900/95 backdrop-blur-xl border border-surface-700/80 rounded-2xl p-3 shadow-2xl animate-slide-up text-surface-100 select-none">
      {/* Toast Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <MessageSquare className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="text-xs font-bold text-white truncate">
            {lastMessage.senderName}
          </span>
          <span className="text-[10px] text-surface-400">just now</span>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="p-1 rounded-md text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Message preview */}
      <p
        onClick={onOpenChat}
        className="text-xs text-surface-200 line-clamp-2 cursor-pointer hover:text-white transition-colors pl-5"
      >
        {lastMessage.text}
      </p>

      {/* Quick reply bar */}
      {showReplyInput ? (
        <form onSubmit={handleSendReply} className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-surface-800">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type quick reply..."
            autoFocus
            className="flex-1 bg-surface-950 border border-surface-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="p-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      ) : (
        <div className="mt-2 flex items-center justify-between text-[11px] text-surface-400 pt-1.5 border-t border-surface-800/60">
          <button
            onClick={() => setShowReplyInput(true)}
            className="text-brand-400 hover:underline font-medium"
          >
            Quick Reply
          </button>
          <button
            onClick={onOpenChat}
            className="text-surface-400 hover:text-white"
          >
            Open Chat
          </button>
        </div>
      )}
    </div>
  );
};
