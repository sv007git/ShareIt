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
