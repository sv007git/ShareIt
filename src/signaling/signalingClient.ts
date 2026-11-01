/**
 * Unified Signaling Client for ShareIt
 * Connects over:
 * 1. Global Public Cloud Relay (EMQX WSS) - default for zero-config cross-device meetings
 * 2. Custom WebSocket Server (Cloudflare Worker Durable Object or Local Node ws)
 * 3. In-Browser BroadcastChannel (offline / same-machine fallback)
 */

import { SignalingMessage, PeerInfo, ChatMessage, RemoteControlEvent } from './types';
import { BroadcastSignalingProvider } from './broadcastSignaling';
import { MqttSignalingProvider } from './mqttSignaling';

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
  onRemoteControlRequest?: (requesterPeerId: string, requesterName: string) => void;
  onRemoteControlResponse?: (accepted: boolean, presenterPeerId: string, presenterName: string) => void;
  onRemoteControlEvent?: (event: RemoteControlEvent, senderPeerId: string) => void;
  onRemoteControlRevoked?: () => void;
  onRemoteControlReleased?: () => void;
  onForceMute?: (byHost: string) => void;
  onKicked?: (reason: string) => void;
  onRoomLockChanged?: (isLocked: boolean) => void;
  onHostChanged?: (newHostPeerId: string) => void;
  onError?: (err: string) => void;
}

export class SignalingClient {
  private socket: WebSocket | null = null;
  private mqttProvider: MqttSignalingProvider | null = null;
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

    const envServer = import.meta.env.VITE_SIGNALING_SERVER;
    this.serverUrl = (serverUrl || envServer || '').trim();
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

    // If a custom WebSocket server is explicitly specified, try it first
    if (this.serverUrl && (this.serverUrl.startsWith('ws://') || this.serverUrl.startsWith('wss://') || this.serverUrl.startsWith('http'))) {
      this.connectCustomWebSocket();
      return;
    }

    // Otherwise, default to Global Cloud Relay (connects users across any device on GitHub Pages!)
    this.connectCloudRelay();
  }

  private connectCustomWebSocket(): void {
    try {
      const wsUrl = new URL(this.serverUrl);
      if (wsUrl.protocol === 'http:') wsUrl.protocol = 'ws:';
      if (wsUrl.protocol === 'https:') wsUrl.protocol = 'wss:';

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
          console.warn('[Signaling] Custom WebSocket timed out, falling back to Cloud Relay');
          this.socket.close();
          this.connectCloudRelay();
        }
      }, 3500);

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        this.setStatus('connected');
        console.log('[Signaling] Connected to Custom WebSocket Server');

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

      this.socket.onerror = () => {
        clearTimeout(connectionTimeout);
        if (this.status === 'connecting') {
          this.connectCloudRelay();
        }
      };

      this.socket.onclose = () => {
        clearInterval(this.pingInterval);
        if (!this.isDestroyed && this.status === 'connecting') {
          this.connectCloudRelay();
        }
      };
    } catch (err) {
      console.warn('[Signaling] Failed custom WebSocket init, falling back to Cloud Relay:', err);
      this.connectCloudRelay();
    }
  }

  private async connectCloudRelay(): Promise<void> {
    if (this.isDestroyed) return;
    console.log(`[Signaling] Connecting to Global Cloud Relay for room ${this.roomId}...`);

    try {
      this.mqttProvider = new MqttSignalingProvider(
        this.roomId,
        this.peerId,
        this.name,
        this.isAudioOnly,
        (status) => {
          if (status === 'connected') {
            this.setStatus('connected');
          } else if (status === 'error' && this.status === 'connecting') {
            this.connectBroadcastFallback();
          }
        }
      );

      const result = await this.mqttProvider.connect((msg) => {
        this.dispatchMessage(msg);
      });

      this.events.onJoinedRoom?.({
        isHost: result.isHost,
        existingPeers: result.existingPeers,
        isLocked: false,
      });
    } catch (err) {
      console.warn('[Signaling] Cloud relay failed, falling back to local broadcast:', err);
      this.connectBroadcastFallback();
    }
  }

  private async connectBroadcastFallback(): Promise<void> {
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
      isLocked: false,
    });
  }

  private dispatchMessage(data: any) {
    const { type } = data;

    switch (type) {
      case 'joined-room':
        this.events.onJoinedRoom?.({
          isHost: data.isHost,
          existingPeers: data.existingPeers || [],
          isLocked: !!data.isLocked,
        });
        break;

      case 'peer-joined':
        this.events.onPeerJoined?.({
          peerId: data.peerId,
          name: data.name,
          isHost: !!data.isHost,
          isAudioOnly: !!data.isAudioOnly,
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
          timestamp: data.timestamp,
        });
        break;

      case 'file-offer':
      case 'file-response':
      case 'file-chunk-ack':
        this.events.onFileMessage?.(data);
        break;

      case 'remote-control-request':
        this.events.onRemoteControlRequest?.(data.senderPeerId, data.senderName || 'Participant');
        break;

      case 'remote-control-response':
        this.events.onRemoteControlResponse?.(!!data.accepted, data.senderPeerId, data.senderName || 'Presenter');
        break;

      case 'remote-control-event':
        if (data.event) {
          this.events.onRemoteControlEvent?.(data.event, data.senderPeerId);
        }
        break;

      case 'remote-control-revoke':
        this.events.onRemoteControlRevoked?.();
        break;

      case 'remote-control-release':
        this.events.onRemoteControlReleased?.();
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
        break;

      default:
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
    } else if (this.mqttProvider) {
      this.mqttProvider.send(message);
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
    this.send({ type: 'chat-message', text, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() });
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

  // Remote Control methods
  public sendRemoteControlRequest(targetPeerId: string): void {
    this.send({ type: 'remote-control-request', targetPeerId });
  }

  public sendRemoteControlResponse(targetPeerId: string, accepted: boolean): void {
    this.send({ type: 'remote-control-response', targetPeerId, accepted });
  }

  public sendRemoteControlEvent(targetPeerId: string, event: RemoteControlEvent): void {
    this.send({ type: 'remote-control-event', targetPeerId, event });
  }

  public sendRemoteControlRevoke(targetPeerId: string): void {
    this.send({ type: 'remote-control-revoke', targetPeerId });
  }

  public sendRemoteControlRelease(targetPeerId: string): void {
    this.send({ type: 'remote-control-release', targetPeerId });
  }

  public disconnect(): void {
    this.isDestroyed = true;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.mqttProvider) {
      this.mqttProvider.close();
      this.mqttProvider = null;
    }
    if (this.broadcastProvider) {
      this.broadcastProvider.close();
      this.broadcastProvider = null;
    }
    this.setStatus('disconnected');
  }
}
