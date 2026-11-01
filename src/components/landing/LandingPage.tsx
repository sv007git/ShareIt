import React, { useState } from 'react';
import { Play, Copy, Check, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { ThemeToggle } from '../common/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';
import { generateRoomId, sanitizeRoomId } from '../../utils/idGenerator';

export interface LandingPageProps {
  onCreateRoom: (roomId: string) => void;
  onJoinRoom: (roomId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onCreateRoom, onJoinRoom }) => {
  const { theme } = useTheme();
  const [joinInput, setJoinInput] = useState('');
  const [createdRoomId] = useState(() => generateRoomId());
  const [isCopied, setIsCopied] = useState(false);

  const handleStartSharing = () => {
    onCreateRoom(createdRoomId);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeRoomId(joinInput);
    if (clean) {
      onJoinRoom(clean);
    }
  };

  const handleCopyNewRoomLink = () => {
    const origin = window.location.origin;
    const base = window.location.pathname.replace(/\/$/, '');
    const url = `${origin}${base}/#/room/${createdRoomId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isBw = theme === 'bw';
  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen flex flex-col justify-between selection:bg-brand-500 selection:text-white transition-colors duration-200 ${
        isBw
          ? 'bg-black text-white'
          : isLight
          ? 'bg-slate-50 text-slate-900'
          : 'bg-[#090d16] text-surface-100'
      }`}
    >
      {/* Top Navigation Bar - Matches Screenshot */}
      <nav
        className={`w-full border-b transition-colors ${
          isBw
            ? 'bg-black border-[#262626]'
            : isLight
            ? 'bg-white/80 border-slate-200 backdrop-blur-md'
            : 'bg-[#090d16]/80 border-surface-800/80 backdrop-blur-md'
        } sticky top-0 z-40`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-2.5">
            <img src="./logo.svg" alt="ShareIt Logo" className="w-8 h-8" />
            <span
              className={`text-xl font-bold tracking-tight ${
                isBw ? 'text-white' : isLight ? 'text-slate-900' : 'text-[#38bdf8]'
              }`}
            >
              ShareIt
            </span>
          </div>

          {/* Center Navigation Links */}
          <div
            className={`hidden md:flex items-center gap-8 text-sm font-medium ${
              isBw ? 'text-zinc-400' : isLight ? 'text-slate-600' : 'text-surface-300'
            }`}
          >
            <span className="hover:text-white cursor-default transition-colors">Features</span>
            <span className="hover:text-white cursor-default transition-colors">How It Works</span>
            <span className="hover:text-white cursor-default transition-colors">Devices</span>
            <span className="hover:text-white cursor-default transition-colors">FAQ</span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant={isBw ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleStartSharing}
              className={
                isBw
                  ? 'bg-white hover:bg-zinc-200 text-black font-bold px-4 rounded-xl border-none shadow-none'
                  : 'bg-[#0c87eb] hover:bg-[#026bc9] text-white px-4 rounded-xl shadow-brand-500/25 shadow-md font-semibold'
              }
            >
              Start Sharing
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Exactly as in User's Image */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-16 text-center max-w-4xl mx-auto w-full">
        {/* Main Headline */}
        <h1
          className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 ${
            isBw
              ? 'text-white'
              : isLight
              ? 'text-slate-900'
              : 'text-[#38bdf8]'
          }`}
        >
          Connect with anyone,<br />anywhere.
        </h1>

        {/* Subtitle */}
        <p
          className={`max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-10 ${
            isBw ? 'text-zinc-400' : isLight ? 'text-slate-600' : 'text-surface-400'
          }`}
        >
          Ultra-fast, peer-to-peer screen sharing, crystal clear audio, and HD video
          conferencing directly from your browser. Zero downloads, zero accounts,
          completely encrypted.
        </p>

        {/* Card Component - Pixel-matched to Image */}
        <div
          className={`w-full max-w-xl rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all ${
            isBw
              ? 'bg-[#0a0a0a] border-[#262626] shadow-black'
              : isLight
              ? 'bg-white border-slate-200 shadow-slate-200'
              : 'bg-[#0c1222]/90 border-surface-800 shadow-2xl backdrop-blur-md'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-6">
            {/* Left Column: New Meeting */}
            <div className="flex flex-col gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isBw ? 'text-zinc-400' : isLight ? 'text-slate-500' : 'text-surface-300'
                }`}
              >
                NEW MEETING
              </span>
              <div
                className={`flex items-center justify-between text-xs font-mono font-semibold px-3 py-2.5 rounded-xl border ${
                  isBw
                    ? 'bg-black text-white border-[#2e2e2e]'
                    : isLight
                    ? 'bg-slate-50 text-slate-800 border-slate-300'
                    : 'bg-[#0f172a] text-[#38bdf8] border-surface-700'
                }`}
              >
                <span className="truncate">{createdRoomId}</span>
                <button
                  type="button"
                  onClick={handleCopyNewRoomLink}
                  className="p-1 hover:text-white transition-colors text-surface-400"
                  title="Copy invite link"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={handleStartSharing}
                className={`w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md ${
                  isBw
                    ? 'bg-white hover:bg-zinc-200 text-black shadow-none'
                    : 'bg-[#0c87eb] hover:bg-[#026bc9] text-white shadow-brand-500/30'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Sharing</span>
              </button>
            </div>

            {/* Right Column: Join With Code */}
            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isBw ? 'text-zinc-400' : isLight ? 'text-slate-500' : 'text-surface-300'
                }`}
              >
                JOIN WITH CODE
              </span>
              <input
                type="text"
                placeholder="e.g. share-xyz-123"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                className={`w-full px-3 py-2.5 text-xs rounded-xl border focus:outline-none transition-colors ${
                  isBw
                    ? 'bg-black text-white border-[#2e2e2e] placeholder-zinc-600 focus:border-white'
                    : isLight
                    ? 'bg-slate-50 text-slate-900 border-slate-300 placeholder-slate-400 focus:border-brand-500'
                    : 'bg-[#0f172a] text-white border-surface-700 placeholder-surface-500 focus:border-brand-500'
                }`}
              />
              <button
                type="submit"
                disabled={!joinInput.trim()}
                className={`w-full mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
                  isBw
                    ? 'bg-[#18181b] hover:bg-[#27272a] text-white border-[#27272a] disabled:opacity-40'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 disabled:opacity-40'
                    : 'bg-[#161e31] hover:bg-surface-800 text-surface-200 hover:text-white border-surface-700 disabled:opacity-40'
                }`}
              >
                <span>Join Meeting</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Three Feature Checks inside Card */}
          <div
            className={`flex flex-wrap items-center justify-center gap-5 pt-3 text-xs border-t ${
              isBw
                ? 'border-[#262626] text-zinc-400'
                : isLight
                ? 'border-slate-200 text-slate-500'
                : 'border-surface-800 text-surface-400'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>No install needed</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>End-to-end encrypted</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Free</span>
            </span>
          </div>
        </div>
      </main>

      {/* Minimal Bottom Spacer */}
      <div className="h-6" />
    </div>
  );
};
