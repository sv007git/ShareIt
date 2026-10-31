import { useState, useEffect, useRef, useCallback } from 'react';
import { MediaManager } from '../webrtc/mediaManager';
import { PeerManager } from '../webrtc/peerManager';
import { SignalingClient, SignalingConnectionStatus } from '../signaling/signalingClient';
import { FileTransferService } from '../services/fileTransferService';
import { PeerInfo, ChatMessage, FileTransferState, RemoteControlEvent, RemoteControlState } from '../signaling/types';
import { generatePeerId } from '../utils/idGenerator';
import { useSettings } from '../contexts/SettingsContext';

export interface Participant {
  peerId: string;
  name: string;
  isHost: boolean;
  isAudioOnly?: boolean;
  isScreenSharing?: boolean;
  stream?: MediaStream;
  connectionStatus?: RTCPeerConnectionState;
  isSpeaking?: boolean;
  isAudioMuted?: boolean;
  isVideoOff?: boolean;
}

export interface JoinRoomOptions {
  roomId: string;
  displayName: string;
  isAudioOnly?: boolean;
  audioDeviceId?: string;
  videoDeviceId?: string;
}

export function useRoom() {
  const { settings } = useSettings();

  const [roomId, setRoomId] = useState<string>('');
  const [peerId] = useState<string>(() => generatePeerId());
  const [displayName, setDisplayName] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [signalingStatus, setSignalingStatus] = useState<SignalingConnectionStatus>('idle');

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);
  const [activePresenter, setActivePresenter] = useState<string | null>(null);

  // Participants & Collaboration
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [fileTransfers, setFileTransfers] = useState<FileTransferState[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Remote Control State
  const [remoteControlState, setRemoteControlState] = useState<RemoteControlState>({
    isControlling: false,
    isBeingControlled: false,
    activeControllerId: null,
    activeControllerName: null,
    pendingRequest: null,
    controlMode: 'pointer',
  });
  const [incomingRemoteControlEvent, setIncomingRemoteControlEvent] = useState<RemoteControlEvent | null>(null);

  // References
  const mediaManagerRef = useRef<MediaManager | null>(null);
  const peerManagerRef = useRef<PeerManager | null>(null);
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const fileTransferServiceRef = useRef<FileTransferService | null>(null);

  // Clean shutdown
  const leaveRoom = useCallback(() => {
    try {
      mediaManagerRef.current?.destroy();
      peerManagerRef.current?.closeAll();
      signalingClientRef.current?.disconnect();
    } catch (e) {
      console.warn('Error during room cleanup', e);
    }

    setLocalStream(null);
    setScreenStream(null);
    setIsScreenSharing(false);
    setIsJoined(false);
    setActivePresenter(null);
    setParticipants(new Map());
  }, []);

  // Join Room
  const joinRoom = useCallback(async (options: JoinRoomOptions) => {
    const {
      roomId: targetRoomId,
      displayName: rawName,
      isAudioOnly: reqAudioOnly = false,
      audioDeviceId,
      videoDeviceId
    } = options;

    const finalName = rawName.trim() || settings.displayName || `Guest-${peerId.slice(-4)}`;
    setRoomId(targetRoomId);
    setDisplayName(finalName);
    setIsAudioOnly(reqAudioOnly);
    setIsVideoOff(reqAudioOnly);
    setError(null);

    try {
      // 1. Initialize Media Manager and capture local media
      const mediaManager = new MediaManager();
      mediaManagerRef.current = mediaManager;

      const stream = await mediaManager.getLocalMedia({
        audioDeviceId: audioDeviceId || settings.audioInputId || undefined,
        videoDeviceId: videoDeviceId || settings.videoInputId || undefined,
        isAudioOnly: reqAudioOnly,
        videoQuality: settings.videoQuality
      });
      setLocalStream(stream);

      // 2. Initialize PeerManager
      const peerManager = new PeerManager({
        onSignalOffer: (targetPeerId, offer) => {
          signalingClientRef.current?.sendOffer(targetPeerId, offer);
        },
        onSignalAnswer: (targetPeerId, answer) => {
          signalingClientRef.current?.sendAnswer(targetPeerId, answer);
        },
        onSignalCandidate: (targetPeerId, candidate) => {
          signalingClientRef.current?.sendIceCandidate(targetPeerId, candidate);
        },
        onRemoteStreamUpdate: (remotePeerId, remoteStream) => {
          setParticipants(prev => {
            const next = new Map(prev);
            const existing = next.get(remotePeerId) || {
              peerId: remotePeerId,
              name: 'Participant',
              isHost: false
            };
            next.set(remotePeerId, { ...existing, stream: remoteStream });
            return next;
          });
        },
        onDataChannelMessage: (_remotePeerId, data) => {
          fileTransferServiceRef.current?.handleIncomingMessage(data);
        },
        onPeerConnectionStateChange: (remotePeerId, state) => {
          setParticipants(prev => {
            const next = new Map(prev);
            const p = next.get(remotePeerId);
            if (p) {
              next.set(remotePeerId, { ...p, connectionStatus: state });
            }
            return next;
          });
        }
      }, {
        stunServers: settings.customStunServers ? settings.customStunServers.split(',').map(s => s.trim()) : undefined,
        turnServers: settings.customTurnServers ? settings.customTurnServers.split(',').map(s => s.trim()) : undefined,
        turnUsername: settings.turnUsername || undefined,
        turnCredential: settings.turnCredential || undefined
      });

      peerManager.setLocalStream(stream);
      peerManagerRef.current = peerManager;

      // 3. Initialize File Transfer Service
      const fileService = new FileTransferService(
        (data, targetPeerId) => {
          // Attempt DataChannel first; fallback to signaling
          const sent = peerManager.sendData(data, targetPeerId);
          if (!sent && typeof data === 'string') {
            try {
              const parsed = JSON.parse(data);
              signalingClientRef.current?.send({ ...parsed, targetPeerId });
              return true;
            } catch (_) {}
          }
          return sent;
        },
        (transfers) => {
          setFileTransfers(transfers);
        }
      );
      fileTransferServiceRef.current = fileService;

      // 4. Initialize Signaling Client
      const signaling = new SignalingClient(
        targetRoomId,
        peerId,
        finalName,
        reqAudioOnly,
        settings.signalingUrl,
        {
          onStatusChange: (status) => {
            setSignalingStatus(status);
          },
          onJoinedRoom: ({ isHost: hostFlag, existingPeers, isLocked: roomLocked }) => {
            setIsJoined(true);
            setIsHost(hostFlag);
            setIsLocked(roomLocked);

            // Connect to each existing peer (we are initiator since we just joined)
            setParticipants(prev => {
              const next = new Map(prev);
              existingPeers.forEach(p => {
                next.set(p.peerId, {
                  peerId: p.peerId,
                  name: p.name,
                  isHost: p.isHost,
                  isAudioOnly: p.isAudioOnly,
                  isScreenSharing: p.isScreenSharing
                });
                // Create WebRTC connection as initiator
                peerManager.getOrCreatePeer(p.peerId, true);
                if (p.isScreenSharing) {
                  setActivePresenter(p.peerId);
                }
              });
              return next;
            });

            // Add system welcome message
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys-${Date.now()}`,
                senderPeerId: 'system',
                senderName: 'ShareIt System',
                text: `Welcome to room ${targetRoomId}! ${hostFlag ? 'You are the host.' : ''}`,
                timestamp: Date.now(),
                isSystem: true
              }
            ]);
          },
          onPeerJoined: (peer) => {
            setParticipants(prev => {
              const next = new Map(prev);
              next.set(peer.peerId, {
                peerId: peer.peerId,
                name: peer.name,
                isHost: peer.isHost,
                isAudioOnly: peer.isAudioOnly
              });
              return next;
            });

            // Add system join message
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys-${Date.now()}`,
                senderPeerId: 'system',
                senderName: 'ShareIt System',
                text: `${peer.name} joined the meeting.`,
                timestamp: Date.now(),
                isSystem: true
              }
            ]);
          },
          onPeerLeft: (leftPeerId) => {
            setParticipants(prev => {
              const next = new Map(prev);
              const leavingPeer = next.get(leftPeerId);
              if (leavingPeer) {
                setChatMessages(c => [
                  ...c,
                  {
                    id: `sys-${Date.now()}`,
                    senderPeerId: 'system',
                    senderName: 'ShareIt System',
                    text: `${leavingPeer.name} left the meeting.`,
                    timestamp: Date.now(),
                    isSystem: true
                  }
                ]);
              }
              next.delete(leftPeerId);
              return next;
            });

            peerManager.removePeer(leftPeerId);
            setActivePresenter(curr => (curr === leftPeerId ? null : curr));
          },
          onOffer: async (offer, senderPeerId) => {
            await peerManager.handleOffer(senderPeerId, offer);
          },
          onAnswer: async (answer, senderPeerId) => {
            await peerManager.handleAnswer(senderPeerId, answer);
          },
          onIceCandidate: async (candidate, senderPeerId) => {
            await peerManager.handleCandidate(senderPeerId, candidate);
          },
          onScreenState: (screenPeerId, isSharing) => {
            setParticipants(prev => {
              const next = new Map(prev);
              const p = next.get(screenPeerId);
              if (p) {
                next.set(screenPeerId, { ...p, isScreenSharing: isSharing });
              }
              return next;
            });
            setActivePresenter(isSharing ? screenPeerId : null);
          },
          onChatMessage: (msg) => {
            setChatMessages(prev => [...prev, msg]);
            setUnreadChatCount(prev => prev + 1);
          },
          onFileMessage: (data) => {
            fileService.handleIncomingMessage(data);
          },
          onRemoteControlRequest: (requesterPeerId, requesterName) => {
            setRemoteControlState(prev => ({
              ...prev,
              pendingRequest: { requesterPeerId, requesterName }
            }));
          },
          onRemoteControlResponse: (accepted, presenterPeerId, presenterName) => {
            if (accepted) {
              setRemoteControlState(prev => ({
                ...prev,
                isControlling: true,
                activeControllerId: presenterPeerId,
                activeControllerName: presenterName
              }));
              setChatMessages(prev => [
                ...prev,
                {
                  id: `sys-${Date.now()}`,
                  senderPeerId: 'system',
                  senderName: 'ShareIt System',
                  text: `Remote control granted by ${presenterName}. Click and drag on the screen to control.`,
                  timestamp: Date.now(),
                  isSystem: true
                }
              ]);
            } else {
              setChatMessages(prev => [
                ...prev,
                {
                  id: `sys-${Date.now()}`,
                  senderPeerId: 'system',
                  senderName: 'ShareIt System',
                  text: `Remote control request was declined by ${presenterName}.`,
                  timestamp: Date.now(),
                  isSystem: true
                }
              ]);
            }
          },
          onRemoteControlEvent: (evt, _senderPeerId) => {
            setIncomingRemoteControlEvent(evt);
          },
          onRemoteControlRevoked: () => {
            setRemoteControlState(prev => ({
              ...prev,
              isControlling: false,
              activeControllerId: null,
              activeControllerName: null
            }));
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys-${Date.now()}`,
                senderPeerId: 'system',
                senderName: 'ShareIt System',
                text: 'Remote control access was revoked by the presenter.',
                timestamp: Date.now(),
                isSystem: true
              }
            ]);
          },
          onRemoteControlReleased: () => {
            setRemoteControlState(prev => ({
              ...prev,
              isBeingControlled: false,
              activeControllerId: null,
              activeControllerName: null
            }));
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys-${Date.now()}`,
                senderPeerId: 'system',
                senderName: 'ShareIt System',
                text: 'Remote control was released by the remote participant.',
                timestamp: Date.now(),
                isSystem: true
              }
            ]);
          },
          onForceMute: () => {
            mediaManager.toggleAudio(false);
            setIsAudioMuted(true);
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys-${Date.now()}`,
                senderPeerId: 'system',
                senderName: 'ShareIt System',
                text: 'You were muted by the meeting host.',
                timestamp: Date.now(),
                isSystem: true
              }
            ]);
          },
          onKicked: (reason) => {
            leaveRoom();
            setError(`You were removed from the room: ${reason}`);
          },
          onRoomLockChanged: (lockedState) => {
            setIsLocked(lockedState);
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys-${Date.now()}`,
                senderPeerId: 'system',
                senderName: 'ShareIt System',
                text: `Meeting room was ${lockedState ? 'locked' : 'unlocked'} by the host.`,
                timestamp: Date.now(),
                isSystem: true
              }
            ]);
          },
          onHostChanged: (newHostPeerId) => {
            const amIHost = newHostPeerId === peerId;
            setIsHost(amIHost);
            setParticipants(prev => {
              const next = new Map(prev);
              next.forEach((p, id) => {
                next.set(id, { ...p, isHost: id === newHostPeerId });
              });
              return next;
            });
          },
          onError: (errMsg) => {
            setError(errMsg);
          }
        }
      );

      signalingClientRef.current = signaling;
      signaling.connect();

      // Listen for screen share termination (e.g. user stops sharing via browser bar)
      mediaManager.onScreenShareEnded(async () => {
        setIsScreenSharing(false);
        setActivePresenter(null);
        signaling.broadcastScreenState(false);

        // Restore camera video track to peer connections
        const camTrack = mediaManager.getLocalStream()?.getVideoTracks()[0] || null;
        await peerManager.replaceVideoTrack(camTrack);
      });

    } catch (err: any) {
      console.error('Failed to join room', err);
      setError(err.message || 'Failed to access camera/mic or connect to room.');
      leaveRoom();
      throw err;
    }
  }, [peerId, settings, leaveRoom]);

  // Media Controls
  const toggleAudio = useCallback(() => {
    if (!mediaManagerRef.current) return;
    const isNowEnabled = mediaManagerRef.current.toggleAudio();
    setIsAudioMuted(!isNowEnabled);
  }, []);

  const toggleVideo = useCallback(() => {
    if (!mediaManagerRef.current || isAudioOnly) return;
    const isNowEnabled = mediaManagerRef.current.toggleVideo();
    setIsVideoOff(!isNowEnabled);
  }, [isAudioOnly]);

  // Screen Sharing
  const startScreenShare = useCallback(async () => {
    if (!mediaManagerRef.current || !peerManagerRef.current || !signalingClientRef.current) return;

    try {
      const { screenStream: scrStream } = await mediaManagerRef.current.startScreenShare(true);
      setScreenStream(scrStream);
      setIsScreenSharing(true);
      setActivePresenter('local');

      // Replace video track in all active peer connections with the screen share track
      const screenVideoTrack = scrStream.getVideoTracks()[0];
      await peerManagerRef.current.replaceVideoTrack(screenVideoTrack);

      // Broadcast screen state to room
      signalingClientRef.current.broadcastScreenState(true);
    } catch (err: any) {
      console.error('Failed to start screen share', err);
      throw err;
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (!mediaManagerRef.current || !peerManagerRef.current || !signalingClientRef.current) return;

    mediaManagerRef.current.stopScreenShare();
    setScreenStream(null);
    setIsScreenSharing(false);
    setActivePresenter(null);
    signalingClientRef.current.broadcastScreenState(false);

    // Restore camera video track
    const camTrack = mediaManagerRef.current.getLocalStream()?.getVideoTracks()[0] || null;
    await peerManagerRef.current.replaceVideoTrack(camTrack);
  }, []);

  // Text Chat
  const sendChatMessage = useCallback((text: string) => {
    if (!text.trim() || !signalingClientRef.current) return;
    signalingClientRef.current.sendChatMessage(text.trim());
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadChatCount(0);
  }, []);

  // File Sharing
  const sendFile = useCallback(async (file: File, targetPeerId?: string) => {
    if (!fileTransferServiceRef.current) return;
    return await fileTransferServiceRef.current.prepareAndSendFile(
      file,
      peerId,
      displayName,
      targetPeerId
    );
  }, [peerId, displayName]);

  const acceptFileTransfer = useCallback((fileId: string) => {
    fileTransferServiceRef.current?.acceptTransfer(fileId);
  }, []);

  const rejectFileTransfer = useCallback((fileId: string) => {
    fileTransferServiceRef.current?.rejectTransfer(fileId);
  }, []);

  const cancelFileTransfer = useCallback((fileId: string) => {
    fileTransferServiceRef.current?.cancelTransfer(fileId);
  }, []);

  // Remote Control Handlers
  const requestRemoteControl = useCallback((targetPresenterPeerId: string) => {
    signalingClientRef.current?.sendRemoteControlRequest(targetPresenterPeerId);
    setChatMessages(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        senderPeerId: 'system',
        senderName: 'ShareIt System',
        text: 'Requested remote control from the presenter. Waiting for approval...',
        timestamp: Date.now(),
        isSystem: true
      }
    ]);
  }, []);

  const respondRemoteControl = useCallback((accepted: boolean) => {
    const pending = remoteControlState.pendingRequest;
    if (!pending) return;

    signalingClientRef.current?.sendRemoteControlResponse(pending.requesterPeerId, accepted);

    if (accepted) {
      setRemoteControlState(prev => ({
        ...prev,
        isBeingControlled: true,
        activeControllerId: pending.requesterPeerId,
        activeControllerName: pending.requesterName,
        pendingRequest: null
      }));
      setChatMessages(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          senderPeerId: 'system',
          senderName: 'ShareIt System',
          text: `You granted remote control to ${pending.requesterName}.`,
          timestamp: Date.now(),
          isSystem: true
        }
      ]);
    } else {
      setRemoteControlState(prev => ({ ...prev, pendingRequest: null }));
    }
  }, [remoteControlState.pendingRequest]);

  const sendRemoteControlEvent = useCallback((evt: RemoteControlEvent) => {
    if (!remoteControlState.isControlling || !remoteControlState.activeControllerId) return;

    // Send through WebRTC DataChannel (fastest) or signaling fallback
    const targetPeerId = remoteControlState.activeControllerId;
    const msg = JSON.stringify({
      type: 'remote-control-event',
      event: evt,
      targetPeerId
    });

    const sent = peerManagerRef.current?.sendData(msg, targetPeerId);
    if (!sent) {
      signalingClientRef.current?.sendRemoteControlEvent(targetPeerId, evt);
    }
  }, [remoteControlState.isControlling, remoteControlState.activeControllerId]);

  const revokeRemoteControl = useCallback(() => {
    if (remoteControlState.activeControllerId) {
      signalingClientRef.current?.sendRemoteControlRevoke(remoteControlState.activeControllerId);
    }
    setRemoteControlState(prev => ({
      ...prev,
      isBeingControlled: false,
      activeControllerId: null,
      activeControllerName: null
    }));
  }, [remoteControlState.activeControllerId]);

  const releaseRemoteControl = useCallback(() => {
    if (remoteControlState.activeControllerId) {
      signalingClientRef.current?.sendRemoteControlRelease(remoteControlState.activeControllerId);
    }
    setRemoteControlState(prev => ({
      ...prev,
      isControlling: false,
      activeControllerId: null,
      activeControllerName: null
    }));
  }, [remoteControlState.activeControllerId]);

  // Host Controls
  const hostMutePeer = useCallback((targetPeerId: string) => {
    if (isHost) {
      signalingClientRef.current?.hostMutePeer(targetPeerId);
    }
  }, [isHost]);

  const hostKickPeer = useCallback((targetPeerId: string) => {
    if (isHost) {
      signalingClientRef.current?.hostKickPeer(targetPeerId);
      // Remove peer locally
      peerManagerRef.current?.removePeer(targetPeerId);
      setParticipants(prev => {
        const next = new Map(prev);
        next.delete(targetPeerId);
        return next;
      });
    }
  }, [isHost]);

  const hostToggleLock = useCallback(() => {
    if (isHost) {
      const nextLocked = !isLocked;
      setIsLocked(nextLocked);
      signalingClientRef.current?.hostToggleLock(nextLocked);
    }
  }, [isHost, isLocked]);

  // Device switching
  const switchCamera = useCallback(async (deviceId: string) => {
    if (!mediaManagerRef.current || !peerManagerRef.current) return;
    const newTrack = await mediaManagerRef.current.switchVideoDevice(deviceId);
    if (newTrack && !isScreenSharing) {
      await peerManagerRef.current.replaceVideoTrack(newTrack);
    }
  }, [isScreenSharing]);

  const switchMicrophone = useCallback(async (deviceId: string) => {
    if (!mediaManagerRef.current || !peerManagerRef.current) return;
    const newTrack = await mediaManagerRef.current.switchAudioDevice(deviceId);
    if (newTrack) {
      await peerManagerRef.current.replaceAudioTrack(newTrack);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  return {
    roomId,
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
    participants: Array.from(participants.values()),
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
    clearError: () => setError(null)
  };
}
