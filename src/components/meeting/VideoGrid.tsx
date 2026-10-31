import React from 'react';
import { VideoTile } from './VideoTile';
import { Participant } from '../../hooks/useRoom';
import { useSettings } from '../../contexts/SettingsContext';

export interface VideoGridProps {
  localStream: MediaStream | null;
  localName: string;
  isHost: boolean;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  participants: Participant[];
  onMuteParticipant?: (peerId: string) => void;
  onKickParticipant?: (peerId: string) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  localStream,
  localName,
  isHost,
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  participants,
  onMuteParticipant,
  onKickParticipant,
}) => {
  const { settings } = useSettings();
  const totalTiles = 1 + participants.length;

  // Compute CSS grid columns based on count
  let gridLayout = 'grid-cols-1';
  if (totalTiles === 2) {
    gridLayout = 'grid-cols-1 md:grid-cols-2';
  } else if (totalTiles >= 3 && totalTiles <= 4) {
    gridLayout = 'grid-cols-1 sm:grid-cols-2';
  } else if (totalTiles >= 5 && totalTiles <= 6) {
    gridLayout = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  } else if (totalTiles > 6) {
    gridLayout = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  }

  return (
    <div className="w-full h-full p-3 sm:p-4 flex items-center justify-center overflow-y-auto">
      <div className={`grid ${gridLayout} gap-3 sm:gap-4 w-full h-full max-h-[calc(100vh-140px)] auto-rows-fr`}>

        {/* Local Participant Tile */}
        <VideoTile
          stream={localStream}
          name={localName}
          isLocal={true}
          isHost={isHost}
          isAudioMuted={isAudioMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          mirror={settings.mirrorSelfVideo}
        />

        {/* Remote Participant Tiles */}
        {participants.map((peer) => (
          <VideoTile
            key={peer.peerId}
            stream={peer.stream || null}
            name={peer.name}
            isLocal={false}
            isHost={peer.isHost}
            isAudioMuted={peer.isAudioMuted}
            isVideoOff={peer.isVideoOff || peer.isAudioOnly}
            isScreenSharing={peer.isScreenSharing}
            canHostControl={isHost}
            onMuteParticipant={() => onMuteParticipant?.(peer.peerId)}
            onKickParticipant={() => onKickParticipant?.(peer.peerId)}
          />
        ))}

      </div>
    </div>
  );
};
