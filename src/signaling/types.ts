/**
 * Signaling Protocol Types for ShareIt
 */

export interface PeerInfo {
  peerId: string;
  name: string;
  isHost: boolean;
  isAudioOnly?: boolean;
  isScreenSharing?: boolean;
}

export type SignalingMessageType =
  | 'joined-room'
  | 'peer-joined'
  | 'peer-left'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'screen-state'
  | 'peer-screen-state'
  | 'chat'
  | 'chat-message'
  | 'file-offer'
  | 'file-response'
  | 'file-chunk-ack'
  | 'remote-control-request'
  | 'remote-control-response'
  | 'remote-control-event'
  | 'remote-control-revoke'
  | 'remote-control-release'
  | 'host-mute-peer'
  | 'force-mute'
  | 'host-kick-peer'
  | 'kicked'
  | 'host-toggle-lock'
  | 'room-lock-changed'
  | 'host-changed'
  | 'ping'
  | 'pong'
  | 'error';

export interface SignalingMessage {
  type: SignalingMessageType;
  senderPeerId?: string;
  senderName?: string;
  targetPeerId?: string;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  senderPeerId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface FileMetadata {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
  senderPeerId: string;
  senderName: string;
}

export interface FileTransferState {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  progress: number; // 0 to 100
  speed: string; // e.g. "1.2 MB/s"
  status: 'pending' | 'accepted' | 'transferring' | 'completed' | 'rejected' | 'cancelled' | 'error';
  isSender: boolean;
  senderPeerId: string;
  senderName: string;
  blobUrl?: string;
  errorMessage?: string;
}

export interface RemoteControlEvent {
  action: 'move' | 'down' | 'up' | 'click' | 'dblclick' | 'wheel' | 'key' | 'draw' | 'laser';
  x: number; // 0.0 to 1.0 (normalized percentage of presentation width)
  y: number; // 0.0 to 1.0 (normalized percentage of presentation height)
  button?: 'left' | 'right' | 'middle';
  deltaX?: number;
  deltaY?: number;
  key?: string;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  drawPoint?: {
    color: string;
    size: number;
    isEnd?: boolean;
  };
  timestamp: number;
}

export interface RemoteControlState {
  isControlling: boolean; // Am I controlling someone else's screen?
  isBeingControlled: boolean; // Is someone else controlling my screen?
  activeControllerId: string | null;
  activeControllerName: string | null;
  pendingRequest: {
    requesterPeerId: string;
    requesterName: string;
  } | null;
  controlMode: 'pointer' | 'laser' | 'draw';
}
