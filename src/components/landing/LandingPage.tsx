import React, { useState } from 'react';
import {
  Monitor,
  Video,
  Mic,
  Share2,
  Shield,
  Zap,
  Globe,
  Lock,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Play
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ThemeToggle } from '../common/ThemeToggle';
import { generateRoomId, sanitizeRoomId } from '../../utils/idGenerator';

export interface LandingPageProps {
  onCreateRoom: (roomId: string) => void;
  onJoinRoom: (roomId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [joinInput, setJoinInput] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(() => generateRoomId());
  const [isCopied, setIsCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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

  const faqs = [
    {
      q: 'Do participants need to create an account or install any software?',
      a: 'No. ShareIt is 100% web-based and runs entirely in your browser using modern WebRTC technology. Anyone can join with a single click on an invitation link without installing plugins or software.'
    },
    {
      q: 'Can I share my screen with computer audio?',
      a: 'Yes. When sharing an entire screen or a browser tab on supported desktop browsers (Chrome, Edge, Firefox), you can check the "Share tab/system audio" option to stream pristine audio alongside your video.'
    },
    {
      q: 'Can I share both my webcam and screen at the same time?',
      a: 'Yes! ShareIt features simultaneous screen and webcam sharing. The shared screen is rendered in full HD presentation mode, while your webcam is overlaid in a movable Picture-in-Picture window.'
    },
    {
      q: 'Is ShareIt secure and private?',
      a: 'All audio, video, and screen streams are peer-to-peer encrypted using standardized WebRTC DTLS-SRTP protocols. No calls or screen sessions are recorded or stored on any central server.'
    },
    {
      q: 'Does it work on mobile phones and tablets?',
      a: 'Yes. ShareIt is fully mobile-responsive across Android and iOS Safari. While mobile OS policies (especially iOS) restrict native screen capture, mobile users can participate with camera, microphone, in-meeting chat, file sharing, and view shared screens in full screen.'
    }
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="w-full border-b border-surface-800/80 bg-surface-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="./logo.svg" alt="ShareIt Logo" className="w-9 h-9" />
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-brand-400 to-indigo-400 bg-clip-text text-transparent">
              ShareIt
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-surface-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#devices" className="hover:text-white transition-colors">Devices</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartSharing}
              className="shadow-brand-500/25 shadow-md"
            >
              Start Sharing
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Glow backdrop circles */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold animate-pulse-subtle">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen WebRTC Screen Sharing & Conferencing</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Share your screen instantly.{' '}
            <span className="block mt-2 bg-gradient-to-r from-sky-400 via-brand-400 to-indigo-400 bg-clip-text text-transparent">
              Connect with anyone, anywhere.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-surface-400 leading-relaxed">
            Ultra-fast, peer-to-peer screen sharing, crystal clear audio, and HD video conferencing directly from your browser. Zero downloads, zero accounts, completely encrypted.
          </p>

          {/* Meeting Creation Card */}
          <div className="max-w-xl mx-auto bg-surface-900/90 border border-surface-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Start Room */}
              <div className="flex flex-col gap-2 p-3 bg-surface-950/60 rounded-2xl border border-surface-800 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-300">New Meeting</span>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-brand-400 bg-surface-900 px-3 py-2 rounded-xl border border-surface-750">
                  <span>{createdRoomId}</span>
                  <button
                    type="button"
                    onClick={handleCopyNewRoomLink}
                    className="p-1 hover:text-white transition-colors"
                    title="Copy invite URL"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full mt-1"
                  leftIcon={<Play className="w-4 h-4 fill-current" />}
                  onClick={handleStartSharing}
                >
                  Start Sharing
                </Button>
              </div>

              {/* Join Existing Room */}
              <form onSubmit={handleJoinSubmit} className="flex flex-col gap-2 p-3 bg-surface-950/60 rounded-2xl border border-surface-800 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-surface-300">Join With Code</span>
                <input
                  type="text"
                  placeholder="e.g. share-xyz-123"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  className="w-full bg-surface-900 border border-surface-750 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-surface-500 focus:outline-none focus:border-brand-500"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  className="w-full mt-1"
                  disabled={!joinInput.trim()}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Join Meeting
                </Button>
              </form>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-surface-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No install needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> End-to-end encrypted
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 100% Free
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="py-20 border-t border-surface-800/80 bg-surface-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Features Built For Speed</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything you need for seamless collaboration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 space-y-3 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Full Screen & Tab Capture</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Stream entire monitors, specific application windows, or browser tabs with 60 FPS clarity and optional system/tab audio.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 space-y-3 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Simultaneous Webcam & Screen</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Present your slides while maintaining personal engagement with a floating, draggable Picture-in-Picture webcam tile.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 space-y-3 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Crystal-Clear Audio & Visualizer</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Opus audio codec with echo cancellation and noise suppression. Dynamic volume meters and active speaker highlighting.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 space-y-3 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Share2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">P2P Chunked File Sharing</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Transfer documents, images, and archives directly between peers over encrypted WebRTC DataChannels with explicit Accept/Reject safeguards.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 space-y-3 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Host Controls & Room Locking</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Meeting hosts can lock the room to prevent uninvited guests, mute noisy participants, or remove disruptive users instantly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-surface-900/60 border border-surface-800 rounded-3xl p-6 space-y-3 hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Private & Encrypted</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Direct browser-to-browser media transmission. No call recordings, no analytics trackers, and zero persistent backend tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-t border-surface-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Three Simple Steps</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How ShareIt Works
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-xl shadow-brand-500/25">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Create a Room</h3>
              <p className="text-sm text-surface-400">
                Click "Start Sharing" to create a meeting room with a unique link in less than a second.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-xl shadow-brand-500/25">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Share the Link</h3>
              <p className="text-sm text-surface-400">
                Send your unique URL to coworkers, friends, or clients. No registration or apps required.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white font-extrabold text-xl flex items-center justify-center mx-auto shadow-xl shadow-brand-500/25">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Present & Collaborate</h3>
              <p className="text-sm text-surface-400">
                Share screens, speak in HD audio, chat in real time, and transfer files smoothly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Device Support Section */}
      <section id="devices" className="py-20 border-t border-surface-800/80 bg-surface-950/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Cross-Platform Compatibility</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Supported Across All Modern Devices
            </p>
            <p className="text-sm text-surface-400 max-w-xl mx-auto">
              ShareIt leverages WebRTC standards supported natively by major modern browsers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
            <div className="p-4 bg-surface-900 border border-surface-800 rounded-2xl space-y-2">
              <Laptop className="w-8 h-8 text-brand-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">Windows & Mac</h4>
              <p className="text-[11px] text-surface-400">Chrome, Edge, Firefox, Safari</p>
            </div>
            <div className="p-4 bg-surface-900 border border-surface-800 rounded-2xl space-y-2">
              <Smartphone className="w-8 h-8 text-sky-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">Android</h4>
              <p className="text-[11px] text-surface-400">Chrome, Edge, Firefox</p>
            </div>
            <div className="p-4 bg-surface-900 border border-surface-800 rounded-2xl space-y-2">
              <Smartphone className="w-8 h-8 text-indigo-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">iPhone & iPad</h4>
              <p className="text-[11px] text-surface-400">Mobile Safari (Viewing & Calling)</p>
            </div>
            <div className="p-4 bg-surface-900 border border-surface-800 rounded-2xl space-y-2">
              <Globe className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-xs font-bold text-white">Linux & Chromebooks</h4>
              <p className="text-[11px] text-surface-400">Chromium, Firefox</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-surface-800/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400">Answers to Common Questions</h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-white hover:text-brand-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-brand-400' : 'text-surface-400'}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-surface-400 leading-relaxed border-t border-surface-800/50 pt-3 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surface-800/80 bg-surface-950 py-8 text-center text-xs text-surface-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="./logo.svg" alt="ShareIt Logo" className="w-5 h-5" />
            <span className="font-bold text-surface-300">ShareIt</span>
            <span>&bull; Real-Time Screen Sharing & Video Conferencing</span>
          </div>
          <div>
            Hosted securely on <a href="https://github.com/sv007git/ShareIt" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">GitHub Pages</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
