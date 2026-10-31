import React, { useState } from 'react';
import { useRoom } from '../hooks/useRoom';
import { GreenRoom } from '../components/prejoin/GreenRoom';
import { MeetingHeader } from '../components/meeting/MeetingHeader';
import { VideoGrid } from '../components/meeting/VideoGrid';
import { ScreenShareView } from '../components/meeting/ScreenShareView';
import { ControlBar } from '../components/meeting/ControlBar';
import { ChatPanel } from '../components/panels/ChatPanel';
import { ParticipantsPanel } from '../components/panels/ParticipantsPanel';
import { FileSharePanel } from '../components/panels/FileSharePanel';
import { SettingsModal } from '../components/panels/SettingsModal';
import { AlertCircle, X } from 'lucide-react';

export interface MeetingRoomPageProps {
  roomId: string;
  onLeave: () => void;
}

export const MeetingRoomPage: React.FC<MeetingRoomPageProps> = ({ roomId, onLeave }) => {
  const {
    peerId,
    displayName,
    isJoined,
    isHost,
    isLocked,
    signalingStatus,
    localStream,
    screenStream,
    isScreenSharing,
    isAudioMuted,
    isVideoOff,
    isAudioOnly,
    activePresenter,
    participants,
    chatMessages,
    unreadChatCount,
    fileTransfers,
    error,
    joinRoom,
    leaveRoom,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    sendChatMessage,
    clearUnreadCount,
    sendFile,
    acceptFileTransfer,
    rejectFileTransfer,
    cancelFileTransfer,
    hostMutePeer,
    hostKickPeer,
    hostToggleLock,
    switchCamera,
    switchMicrophone,
    clearError,
  } = useRoom();

  // Side drawers & modals state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isFileShareOpen, setIsFileShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleJoin = (options: {
    displayName: string;
    isAudioOnly: boolean;
    audioDeviceId?: string;
    videoDeviceId?: string;
  }) => {
    joinRoom({
      roomId,
      ...options,
    });
  };

  const handleLeave = () => {
    leaveRoom();
    onLeave();
  };

  // Pre-join Green Room
  if (!isJoined) {
    return (
      <GreenRoom
        roomId={roomId}
        onJoin={handleJoin}
        onCancel={onLeave}
      />
    );
  }

  // Active presenter stream details
  const isLocalPresenting = activePresenter === 'local';
  const remotePresenter = participants.find(p => p.peerId === activePresenter);
  const currentPresenterName = isLocalPresenting
    ? displayName
    : (remotePresenter?.name || 'Participant');
  const activeScreenStream = isLocalPresenting ? screenStream : (remotePresenter?.stream || null);
  const presenterCameraStream = isLocalPresenting ? localStream : (remotePresenter?.stream || null);

  return (
    <div className="h-screen w-screen bg-surface-950 text-surface-100 flex flex-col overflow-hidden relative select-none">
      {/* Top Header */}
      <MeetingHeader
        roomId={roomId}
        isHost={isHost}
        isLocked={isLocked}
        signalingStatus={signalingStatus}
        onToggleLock={hostToggleLock}
      />

      {/* Error alert toast */}
      {error && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-rose-500/90 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-rose-400 backdrop-blur-md animate-slide-up">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-2 hover:bg-rose-600/50 p-1 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
        {activePresenter && activeScreenStream ? (
          /* Presentation Mode */
          <ScreenShareView
            screenStream={activeScreenStream}
            webcamStream={presenterCameraStream}
            presenterName={currentPresenterName}
            isLocal={isLocalPresenting}
            onStopSharing={isLocalPresenting ? stopScreenShare : undefined}
          />
        ) : (
          /* Responsive Multi-Participant Video Grid */
          <VideoGrid
            localStream={localStream}
            localName={displayName}
            isHost={isHost}
            isAudioMuted={isAudioMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            participants={participants}
            onMuteParticipant={hostMutePeer}
            onKickParticipant={hostKickPeer}
          />
        )}
      </main>

      {/* Bottom Docked Controls */}
      <ControlBar
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isAudioOnly={isAudioOnly}
        isScreenSharing={isScreenSharing}
        unreadChatCount={unreadChatCount}
        participantsCount={1 + participants.length}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        isFileShareOpen={isFileShareOpen}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (!isChatOpen) clearUnreadCount();
        }}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onToggleFileShare={() => setIsFileShareOpen(!isFileShareOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLeaveMeeting={handleLeave}
      />

      {/* Side Panels */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        localPeerId={peerId}
      />

      <ParticipantsPanel
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        localName={displayName}
        isHost={isHost}
        isAudioMuted={isAudioMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        isLocked={isLocked}
        participants={participants}
        onToggleLock={hostToggleLock}
        onMuteParticipant={hostMutePeer}
        onKickParticipant={hostKickPeer}
      />

      <FileSharePanel
        isOpen={isFileShareOpen}
        onClose={() => setIsFileShareOpen(false)}
        transfers={fileTransfers}
        onSendFile={sendFile}
        onAcceptTransfer={acceptFileTransfer}
        onRejectTransfer={rejectFileTransfer}
        onCancelTransfer={cancelFileTransfer}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onCameraChange={switchCamera}
        onMicChange={switchMicrophone}
      />
    </div>
  );
};
