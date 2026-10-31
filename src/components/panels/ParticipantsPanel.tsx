import React from 'react';
import { X, Shield, Mic, MicOff, Video, VideoOff, Monitor, Lock, Unlock, VolumeX, UserX } from 'lucide-react';
import { Participant } from '../../hooks/useRoom';
import { Button } from '../common/Button';

export interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  localName: string;
  isHost: boolean;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isLocked: boolean;
  participants: Participant[];
  onToggleLock: () => void;
  onMuteParticipant: (peerId: string) => void;
  onKickParticipant: (peerId: string) => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  isOpen,
  onClose,
  localName,
  isHost,
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  isLocked,
  participants,
  onToggleLock,
  onMuteParticipant,
  onKickParticipant,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 md:w-96 bg-surface-900 border-l border-surface-800 shadow-2xl flex flex-col z-40 animate-slide-up sm:animate-fade-in text-surface-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-800">
        <div>
          <h3 className="font-bold text-white text-base">
            Participants ({1 + participants.length})
          </h3>
          <p className="text-xs text-surface-400">Manage attendees and room security</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
          aria-label="Close participants panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Host Quick Controls */}
      {isHost && (
        <div className="p-3 bg-surface-950/70 border-b border-surface-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-surface-300">Room Privacy</span>
          <Button
            size="sm"
            variant={isLocked ? 'danger' : 'secondary'}
            leftIcon={isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            onClick={onToggleLock}
          >
            {isLocked ? 'Unlock Room' : 'Lock Room'}
          </Button>
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Local User */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-950/50 border border-surface-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center font-bold text-xs text-brand-300 shrink-0">
              {localName.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white truncate">{localName}</span>
                <span className="text-[10px] text-surface-400">(You)</span>
              </div>
              {isHost && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-400">
                  <Shield className="w-2.5 h-2.5" /> Host
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-surface-400">
            {isScreenSharing && (
              <span title="Sharing screen">
                <Monitor className="w-3.5 h-3.5 text-brand-400" />
              </span>
            )}
            {isAudioMuted ? <MicOff className="w-3.5 h-3.5 text-accent-rose" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            {isVideoOff ? <VideoOff className="w-3.5 h-3.5 text-surface-500" /> : <Video className="w-3.5 h-3.5 text-emerald-400" />}
          </div>
        </div>

        {/* Remote Participants */}
        {participants.map((peer) => (
          <div
            key={peer.peerId}
            className="flex items-center justify-between p-3 rounded-xl bg-surface-950/30 border border-surface-800/80 hover:border-surface-700 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-surface-800 border border-surface-700 flex items-center justify-center font-bold text-xs text-surface-300 shrink-0">
                {peer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-surface-200 truncate">{peer.name}</span>
                </div>
                {peer.isHost && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-400">
                    <Shield className="w-2.5 h-2.5" /> Host
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-surface-400">
                {peer.isScreenSharing && (
                  <span title="Sharing screen">
                    <Monitor className="w-3.5 h-3.5 text-brand-400" />
                  </span>
                )}
                {peer.isAudioMuted ? <MicOff className="w-3.5 h-3.5 text-accent-rose" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                {peer.isVideoOff || peer.isAudioOnly ? <VideoOff className="w-3.5 h-3.5 text-surface-500" /> : <Video className="w-3.5 h-3.5 text-emerald-400" />}
              </div>

              {isHost && (
                <div className="flex items-center gap-1 pl-1 border-l border-surface-800">
                  <button
                    onClick={() => onMuteParticipant(peer.peerId)}
                    className="p-1 rounded-md text-surface-400 hover:text-amber-400 hover:bg-surface-800 transition-colors"
                    title="Mute participant"
                  >
                    <VolumeX className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onKickParticipant(peer.peerId)}
                    className="p-1 rounded-md text-surface-400 hover:text-accent-rose hover:bg-surface-800 transition-colors"
                    title="Remove from meeting"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
