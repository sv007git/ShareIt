/**
 * Global Cloud Signaling Provider for ShareIt
 * Connects over public secure WebSockets (WSS) to enable instant, zero-setup WebRTC
 * peer-to-peer connectivity across different devices, phones, and networks on GitHub Pages.
 */

import mqtt, { MqttClient } from 'mqtt';
import { SignalingMessage, PeerInfo } from './types';

export class MqttSignalingProvider {
  private client: MqttClient | null = null;
  private roomId: string;
  private peerId: string;
  private name: string;
  private isAudioOnly: boolean;
  private topic: string;
  private isHost: boolean = false;
  private onMessageCallback: ((msg: SignalingMessage) => void) | null = null;
  private onStatusCallback: ((status: 'connected' | 'connecting' | 'disconnected' | 'error') => void) | null = null;
  private discoveredPeers: Map<string, PeerInfo> = new Map();
  private isDestroyed: boolean = false;

  constructor(
    roomId: string,
    peerId: string,
    name: string,
    isAudioOnly: boolean = false,
    onStatus?: (status: 'connected' | 'connecting' | 'disconnected' | 'error') => void
  ) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.name = name;
    this.isAudioOnly = isAudioOnly;
    this.topic = `shareit/v2/rooms/${roomId}`;
    this.onStatusCallback = onStatus || null;
  }

  public connect(onMessage: (msg: SignalingMessage) => void): Promise<{ isHost: boolean; existingPeers: PeerInfo[] }> {
    return new Promise((resolve) => {
      this.onMessageCallback = onMessage;
      this.onStatusCallback?.('connecting');

      const clientId = `shareit_${this.peerId.replace(/[^a-zA-Z0-9]/g, '')}_${Math.random().toString(16).slice(2, 6)}`;

      // Connect to global secure public broker (EMQX WebSocket)
      const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';

      try {
        this.client = mqtt.connect(brokerUrl, {
          clientId,
          keepalive: 30,
          clean: true,
          reconnectPeriod: 2000,
          connectTimeout: 5000,
        });

        this.client.on('connect', () => {
          if (this.isDestroyed) return;
          console.log(`[Cloud Signaling] Connected to global relay on room ${this.roomId}`);
          this.onStatusCallback?.('connected');

          // Subscribe to room topic
          this.client?.subscribe(this.topic, { qos: 0 }, (err) => {
            if (err) {
              console.error('[Cloud Signaling] Subscribe error:', err);
              return;
            }

            // Probe existing peers in this room
            this.send({
              type: ('discover-peers' as any),
              senderPeerId: this.peerId,
              senderName: this.name,
            });

            // Gather responses for 400ms to determine host and existing peers
            setTimeout(() => {
              if (this.isDestroyed) return;
              const isHost = this.discoveredPeers.size === 0;
              this.isHost = isHost;

              // Announce join to peers
              this.send({
                type: 'peer-joined',
                peerId: this.peerId,
                name: this.name,
                isHost,
                isAudioOnly: this.isAudioOnly,
              });

              resolve({
                isHost,
                existingPeers: Array.from(this.discoveredPeers.values()),
              });
            }, 450);
          });
        });

        this.client.on('message', (_t, payload) => {
          try {
            const msg: SignalingMessage = JSON.parse(payload.toString());
            if (!msg || msg.senderPeerId === this.peerId) return;

            // If targeted to another specific peer, ignore
            if (msg.targetPeerId && msg.targetPeerId !== this.peerId) return;

            // Handle peer discovery probe
            if (msg.type === ('discover-peers' as any)) {
              this.send({
                type: ('announce-presence' as any),
                targetPeerId: msg.senderPeerId,
                peerId: this.peerId,
                name: this.name,
                isHost: this.isHost,
                isAudioOnly: this.isAudioOnly,
              });
              return;
            }

            // Handle presence announcement from existing peer
            if (msg.type === ('announce-presence' as any)) {
              this.discoveredPeers.set(msg.peerId, {
                peerId: msg.peerId,
                name: msg.name,
                isHost: msg.isHost,
                isAudioOnly: msg.isAudioOnly,
              });
              return;
            }

            this.onMessageCallback?.(msg);
          } catch (err) {
            console.warn('[Cloud Signaling] Failed to parse message', err);
          }
        });

        this.client.on('error', (err) => {
          console.warn('[Cloud Signaling] Broker error:', err);
          this.onStatusCallback?.('error');
        });

        this.client.on('offline', () => {
          this.onStatusCallback?.('disconnected');
        });
      } catch (err) {
        console.error('[Cloud Signaling] Connection failure:', err);
        this.onStatusCallback?.('error');
        resolve({ isHost: true, existingPeers: [] });
      }
    });
  }

  public send(message: SignalingMessage): void {
    if (!this.client || !this.client.connected) return;
    try {
      const payload = JSON.stringify({
        ...message,
        senderPeerId: this.peerId,
        senderName: this.name,
      });
      this.client.publish(this.topic, payload, { qos: 0 });
    } catch (err) {
      console.error('[Cloud Signaling] Failed to publish message', err);
    }
  }

  public close(): void {
    this.isDestroyed = true;
    if (this.client) {
      // Send leave notification
      this.send({
        type: 'peer-left',
        peerId: this.peerId,
      });
      try {
        this.client.end(true);
      } catch (_) {}
      this.client = null;
    }
    this.onStatusCallback?.('disconnected');
  }
}
