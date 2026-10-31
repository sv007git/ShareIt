import React, { useState } from 'react';
import { useRoom } from '../hooks/useRoom';
import { GreenRoom } from '../components/prejoin/GreenRoom';
import { MeetingHeader } from '../components/meeting/MeetingHeader';
import { VideoGrid } from '../components/meeting/VideoGrid';
import { ScreenShareView } from '../components/meeting/ScreenShareView';
import { ControlBar } from '../components/meeting/ControlBar';
import { ChatPanel } from '../components/panels/ChatPanel';
import { LiveChatToast } from '../components/panels/LiveChatToast';
import { ParticipantsPanel } from '../components/panels/ParticipantsPanel';
import { FileSharePanel } from '../components/panels/FileSharePanel';
import { SettingsModal } from '../components/panels/SettingsModal';
import { Button } from '../components/common/Button';
import { AlertCircle, X, MousePointer } from 'lucide-react';

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
    remoteControlState,
    incomingRemoteControlEvent,
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
    requestRemoteControl,
    respondRemoteControl,
    sendRemoteControlEvent,
    revokeRemoteControl,
    releaseRemoteControl,
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
  const remotePresenter = participants.find((p) => p.peerId === activePresenter);
  const currentPresenterName = isLocalPresenting
    ? displayName
    : remotePresenter?.name || 'Participant';
  const activeScreenStream = isLocalPresenting ? screenStream : remotePresenter?.stream || null;
  const presenterCameraStream = isLocalPresenting ? localStream : remotePresenter?.stream || null;

  const lastChatMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

  return (
    <div className="h-screen h-[100dvh] w-screen bg-surface-950 text-surface-100 flex flex-col overflow-hidden relative select-none">
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

      {/* Presenter: Incoming Remote Control Permission Prompt */}
      {remoteControlState.pendingRequest && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-surface-900/95 border-2 border-brand-500 rounded-3xl p-5 shadow-2xl max-w-sm w-full animate-slide-up backdrop-blur-xl text-surface-100">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <MousePointer className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Remote Control Request</h4>
              <p className="text-[11px] text-surface-400">Presenter authorization required</p>
            </div>
          </div>
          <p className="text-xs text-surface-300 mb-4 leading-relaxed">
            <strong>{remoteControlState.pendingRequest.requesterName}</strong> has requested permission to take control of your shared screen.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => respondRemoteControl(false)}
            >
              Deny
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => respondRemoteControl(true)}
              className="shadow-brand-500/30 shadow-md font-semibold"
            >
              Grant Control
            </Button>
          </div>
        </div>
      )}

      {/* Main Viewport & Side-by-Side Texting Layout */}
      <div className="flex-1 w-full flex overflow-hidden relative">
        <main className="flex-1 h-full relative flex items-center justify-center overflow-hidden">
          {activePresenter && activeScreenStream ? (
            /* Presentation Mode with Remote Control */
            <ScreenShareView
              screenStream={activeScreenStream}
              webcamStream={presenterCameraStream}
              presenterName={currentPresenterName}
              isLocal={isLocalPresenting}
              onStopSharing={isLocalPresenting ? stopScreenShare : undefined}
              isControlling={remoteControlState.isControlling}
              isBeingControlled={remoteControlState.isBeingControlled}
              activeControllerName={remoteControlState.activeControllerName}
              onRequestRemoteControl={
                !isLocalPresenting && !remoteControlState.isControlling
                  ? () => requestRemoteControl(activePresenter || '')
                  : undefined
              }
              onSendRemoteControlEvent={sendRemoteControlEvent}
              onRevokeRemoteControl={revokeRemoteControl}
              onReleaseRemoteControl={releaseRemoteControl}
              incomingRemoteControlEvent={incomingRemoteControlEvent}
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

        {/* Desktop Side-by-Side Embedded Chat Panel (Texting while in call/screenshare) */}
        {isChatOpen && (
          <div className="hidden md:flex h-full">
            <ChatPanel
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              messages={chatMessages}
              onSendMessage={sendChatMessage}
              localPeerId={peerId}
              isEmbedded={true}
            />
          </div>
        )}
      </div>

      {/* Mobile / Overlay Chat Panel (when on small screens) */}
      {isChatOpen && (
        <div className="md:hidden">
          <ChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={chatMessages}
            onSendMessage={sendChatMessage}
            localPeerId={peerId}
            isEmbedded={false}
          />
        </div>
      )}

      {/* Live Chat Heads-Up Toast (Texting notification with quick-reply) */}
      <LiveChatToast
        lastMessage={lastChatMessage}
        isOpenChat={isChatOpen}
        onOpenChat={() => {
          setIsChatOpen(true);
          clearUnreadCount();
        }}
        onQuickReply={sendChatMessage}
        localPeerId={peerId}
      />

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

      {/* Participants Panel */}
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

      {/* P2P File Sharing Panel */}
      <FileSharePanel
        isOpen={isFileShareOpen}
        onClose={() => setIsFileShareOpen(false)}
        transfers={fileTransfers}
        onSendFile={sendFile}
        onAcceptTransfer={acceptFileTransfer}
        onRejectTransfer={rejectFileTransfer}
        onCancelTransfer={cancelFileTransfer}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onCameraChange={switchCamera}
        onMicChange={switchMicrophone}
      />
    </div>
  );
};
