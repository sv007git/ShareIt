/**
 * Unified Signaling Client for ShareIt
 * Supports WebSocket (Cloudflare Worker Durable Object / Local Node ws)
 * with transparent fallback to BroadcastChannel for local/multi-tab environments.
 */

import { SignalingMessage, PeerInfo, ChatMessage } from './types';
import { BroadcastSignalingProvider } from './broadcastSignaling';

export type SignalingConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'fallback'
  | 'disconnected'
  | 'error';

export interface SignalingEvents {
  onStatusChange?: (status: SignalingConnectionStatus) => void;
  onJoinedRoom?: (data: { isHost: boolean; existingPeers: PeerInfo[]; isLocked: boolean }) => void;
  onPeerJoined?: (peer: PeerInfo) => void;
  onPeerLeft?: (peerId: string) => void;
  onOffer?: (offer: RTCSessionDescriptionInit, senderPeerId: string) => void;
  onAnswer?: (answer: RTCSessionDescriptionInit, senderPeerId: string) => void;
  onIceCandidate?: (candidate: RTCIceCandidateInit, senderPeerId: string) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onScreenState?: (peerId: string, isSharing: boolean) => void;
  onFileMessage?: (data: any) => void;
  onForceMute?: (byHost: string) => void;
  onKicked?: (reason: string) => void;
  onRoomLockChanged?: (isLocked: boolean) => void;
  onHostChanged?: (newHostPeerId: string) => void;
  onError?: (err: string) => void;
}

export class SignalingClient {
  private socket: WebSocket | null = null;
  private broadcastProvider: BroadcastSignalingProvider | null = null;
  private roomId: string;
  private peerId: string;
  private name: string;
  private isAudioOnly: boolean;
  private serverUrl: string;
  private events: SignalingEvents;
  private status: SignalingConnectionStatus = 'idle';
  private pingInterval: any = null;
  private isDestroyed: boolean = false;
  private useFallbackOnly: boolean = false;

  constructor(
    roomId: string,
    peerId: string,
    name: string,
    isAudioOnly: boolean,
    serverUrl?: string,
    events: SignalingEvents = {}
  ) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.name = name;
    this.isAudioOnly = isAudioOnly;
    this.events = events;

    // Determine default server URL: from argument, or env var, or fallback
    const envServer = import.meta.env.VITE_SIGNALING_SERVER;
    this.serverUrl = serverUrl || envServer || 'ws://localhost:8080';
  }

  public getStatus(): SignalingConnectionStatus {
    return this.status;
  }

  private setStatus(status: SignalingConnectionStatus) {
    this.status = status;
    this.events.onStatusChange?.(status);
  }

  public connect(): void {
    if (this.isDestroyed) return;
    this.setStatus('connecting');

    // If explicit fallback requested or serverUrl is empty / invalid
    if (this.useFallbackOnly || !this.serverUrl) {
      this.connectFallback();
      return;
    }

    try {
      // Build WebSocket URL with query params
      const wsUrl = new URL(this.serverUrl);
      if (wsUrl.protocol === 'http:') wsUrl.protocol = 'ws:';
      if (wsUrl.protocol === 'https:') wsUrl.protocol = 'wss:';

      // Ensure /ws path
      if (!wsUrl.pathname.endsWith('/ws')) {
        wsUrl.pathname = wsUrl.pathname.replace(/\/$/, '') + '/ws';
      }

      wsUrl.searchParams.set('roomId', this.roomId);
      wsUrl.searchParams.set('peerId', this.peerId);
      wsUrl.searchParams.set('name', this.name);
      wsUrl.searchParams.set('isAudioOnly', String(this.isAudioOnly));

      this.socket = new WebSocket(wsUrl.toString());

      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          console.warn('[Signaling] WebSocket connection timed out, switching to local broadcast fallback');
          this.socket.close();
          this.connectFallback();
        }
      }, 4000);

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        this.setStatus('connected');
        console.log('[Signaling] Connected to WebSocket signaling server:', wsUrl.toString());

        // Heartbeat
        this.pingInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.dispatchMessage(data);
        } catch (err) {
          console.error('[Signaling] Error parsing message', err);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[Signaling] WebSocket error, fallback may be activated', err);
        clearTimeout(connectionTimeout);
        if (this.status === 'connecting') {
          this.connectFallback();
        }
      };

      this.socket.onclose = (event) => {
        clearInterval(this.pingInterval);
        if (!this.isDestroyed) {
          if (this.status === 'connecting') {
            this.connectFallback();
          } else if (this.status === 'connected') {
            this.setStatus('disconnected');
            // Try reconnecting or fallback
            setTimeout(() => {
              if (!this.isDestroyed && this.status === 'disconnected') {
                this.connect();
              }
            }, 3000);
          }
        }
      };
    } catch (err) {
      console.warn('[Signaling] Failed to initialize WebSocket, falling back to BroadcastChannel:', err);
      this.connectFallback();
    }
  }

  private async connectFallback() {
    if (this.isDestroyed) return;
    console.log(`[Signaling] Activating local multi-tab BroadcastChannel fallback for room ${this.roomId}`);
    this.setStatus('fallback');

    this.broadcastProvider = new BroadcastSignalingProvider(
      this.roomId,
      this.peerId,
      this.name,
      this.isAudioOnly
    );

    const result = await this.broadcastProvider.connect((msg) => {
      this.dispatchMessage(msg);
    });

    this.events.onJoinedRoom?.({
      isHost: result.isHost,
      existingPeers: result.existingPeers,
      isLocked: false
    });
  }

  private dispatchMessage(data: any) {
    const { type } = data;

    switch (type) {
      case 'joined-room':
        this.events.onJoinedRoom?.({
          isHost: data.isHost,
          existingPeers: data.existingPeers || [],
          isLocked: !!data.isLocked
        });
        break;

      case 'peer-joined':
        this.events.onPeerJoined?.({
          peerId: data.peerId,
          name: data.name,
          isHost: !!data.isHost,
          isAudioOnly: !!data.isAudioOnly
        });
        break;

      case 'peer-left':
        this.events.onPeerLeft?.(data.peerId);
        break;

      case 'offer':
        if (data.offer && data.senderPeerId) {
          this.events.onOffer?.(data.offer, data.senderPeerId);
        }
        break;

      case 'answer':
        if (data.answer && data.senderPeerId) {
          this.events.onAnswer?.(data.answer, data.senderPeerId);
        }
        break;

      case 'ice-candidate':
        if (data.candidate && data.senderPeerId) {
          this.events.onIceCandidate?.(data.candidate, data.senderPeerId);
        }
        break;

      case 'peer-screen-state':
        this.events.onScreenState?.(data.peerId, data.isSharing);
        break;

      case 'chat-message':
        this.events.onChatMessage?.({
          id: data.id,
          senderPeerId: data.senderPeerId,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp
        });
        break;

      case 'file-offer':
      case 'file-response':
      case 'file-chunk-ack':
        this.events.onFileMessage?.(data);
        break;

      case 'force-mute':
        this.events.onForceMute?.(data.byHost || 'Host');
        break;

      case 'kicked':
        this.events.onKicked?.(data.reason || 'Removed by host');
        break;

      case 'room-lock-changed':
        this.events.onRoomLockChanged?.(!!data.isLocked);
        break;

      case 'host-changed':
        this.events.onHostChanged?.(data.newHostPeerId);
        break;

      case 'error':
        this.events.onError?.(data.message || data.code || 'Signaling error');
        break;

      case 'pong':
        // Pong received, connection healthy
        break;

      default:
        // Unknown type
        break;
    }
  }

  public send(message: SignalingMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (err) {
        console.error('[Signaling] Failed to send WebSocket message', err);
      }
    } else if (this.broadcastProvider) {
      this.broadcastProvider.send(message);
    }
  }

  // Helper senders
  public sendOffer(targetPeerId: string, offer: RTCSessionDescriptionInit): void {
    this.send({ type: 'offer', targetPeerId, offer });
  }

  public sendAnswer(targetPeerId: string, answer: RTCSessionDescriptionInit): void {
    this.send({ type: 'answer', targetPeerId, answer });
  }

  public sendIceCandidate(targetPeerId: string, candidate: RTCIceCandidateInit): void {
    this.send({ type: 'ice-candidate', targetPeerId, candidate });
  }

  public broadcastScreenState(isSharing: boolean): void {
    this.send({ type: 'screen-state', isSharing });
  }

  public sendChatMessage(text: string): void {
    this.send({ type: 'chat', text });
  }

  public sendFileOffer(fileMeta: any, targetPeerId?: string): void {
    this.send({ type: 'file-offer', fileMeta, targetPeerId });
  }

  public sendFileResponse(fileId: string, accepted: boolean, targetPeerId: string): void {
    this.send({ type: 'file-response', fileId, accepted, targetPeerId });
  }

  public hostMutePeer(targetPeerId: string): void {
    this.send({ type: 'host-mute-peer', targetPeerId });
  }

  public hostKickPeer(targetPeerId: string): void {
    this.send({ type: 'host-kick-peer', targetPeerId });
  }

  public hostToggleLock(isLocked: boolean): void {
    this.send({ type: 'host-toggle-lock', isLocked });
  }

  public disconnect(): void {
    this.isDestroyed = true;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.broadcastProvider) {
      this.broadcastProvider.close();
      this.broadcastProvider = null;
    }
    this.setStatus('disconnected');
  }
}
