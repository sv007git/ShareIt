import React, { useState, useEffect } from 'react';
import { Copy, Check, Lock, Unlock, ShieldCheck, Wifi } from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';
import { formatDuration } from '../../utils/formatters';
import { SignalingConnectionStatus } from '../../signaling/signalingClient';

export interface MeetingHeaderProps {
  roomId: string;
  isHost: boolean;
  isLocked: boolean;
  signalingStatus: SignalingConnectionStatus;
  onToggleLock?: () => void;
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  roomId,
  isHost,
  isLocked,
  signalingStatus,
  onToggleLock,
}) => {
  const [duration, setDuration] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <header className="w-full bg-surface-950/80 backdrop-blur-xl border-b border-surface-800/80 px-4 py-2.5 flex items-center justify-between select-none z-20">
      {/* Brand & Room Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="./logo.svg" alt="ShareIt Logo" className="w-7 h-7" />
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-sky-400 via-brand-400 to-indigo-400 bg-clip-text text-transparent hidden sm:inline">
            ShareIt
          </span>
        </div>

        <div className="h-4 w-px bg-surface-800 hidden sm:block" />

        {/* Room Code with Copy */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-900 hover:bg-surface-800 border border-surface-750 text-xs font-mono font-semibold text-surface-200 transition-colors group"
          title="Click to copy invitation URL"
        >
          <span className="text-brand-400">{roomId}</span>
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-surface-400 group-hover:text-white" />
          )}
        </button>

        {/* Lock Room Toggle for Host */}
        {isHost ? (
          <button
            onClick={onToggleLock}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-colors ${
              isLocked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-surface-900 text-surface-400 border-surface-800 hover:text-white'
            }`}
            title={isLocked ? 'Room is locked. Click to unlock' : 'Click to lock room'}
          >
            {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
          </button>
        ) : isLocked ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]">
            <Lock className="w-3 h-3" /> Locked
          </span>
        ) : null}
      </div>

      {/* Right Controls: Timer, Security, Signaling, Theme */}
      <div className="flex items-center gap-3">
        {/* Timer */}
        <div className="text-xs font-mono font-medium text-surface-300 bg-surface-900 px-2.5 py-1 rounded-lg border border-surface-800">
          {formatDuration(duration)}
        </div>

        {/* Connection status */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-900 border border-surface-800 text-[11px] font-medium text-surface-400 hidden md:flex"
          title={`Signaling: ${signalingStatus}`}
        >
          <Wifi className={`w-3.5 h-3.5 ${signalingStatus === 'connected' ? 'text-emerald-400' : signalingStatus === 'fallback' ? 'text-sky-400' : 'text-amber-400'}`} />
          <span>{signalingStatus === 'connected' ? 'Cloud Signaling' : signalingStatus === 'fallback' ? 'Local Mesh' : 'Connecting'}</span>
        </div>

        {/* P2P Encryption badge */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400 hidden lg:flex"
          title="Direct DTLS-SRTP end-to-end peer encrypted media"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>P2P Encrypted</span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
};
