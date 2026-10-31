/**
 * BroadcastChannel-based Signaling Provider
 * Provides zero-config, low-latency signaling between tabs in the same browser,
 * perfect for instant local testing, demonstrations, and offline WebRTC rooms.
 */

import { SignalingMessage, PeerInfo } from './types';

export class BroadcastSignalingProvider {
  private channel: BroadcastChannel | null = null;
  private roomId: string;
  private peerId: string;
  private name: string;
  private isAudioOnly: boolean;
  private isHost: boolean = false;
  private onMessageCallback: ((msg: SignalingMessage) => void) | null = null;
  private heartbeatInterval: any = null;

  constructor(roomId: string, peerId: string, name: string, isAudioOnly: boolean = false) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.name = name;
    this.isAudioOnly = isAudioOnly;
  }

  public connect(onMessage: (msg: SignalingMessage) => void): Promise<{ isHost: boolean; existingPeers: PeerInfo[] }> {
    return new Promise((resolve) => {
      this.onMessageCallback = onMessage;
      this.channel = new BroadcastChannel(`shareit-room-${this.roomId}`);

      const discoveredPeers: Map<string, PeerInfo> = new Map();

      // Listen for incoming messages
      this.channel.onmessage = (event) => {
        const msg = event.data as SignalingMessage;
        if (!msg || msg.senderPeerId === this.peerId) return;

        // If message is targeted to another peer, ignore
        if (msg.targetPeerId && msg.targetPeerId !== this.peerId) return;

        // Handle discovery query
        if (msg.type === ('discover-peers' as any)) {
          this.send({
            type: 'announce-presence' as any,
            targetPeerId: msg.senderPeerId,
            peerId: this.peerId,
            name: this.name,
            isHost: this.isHost,
            isAudioOnly: this.isAudioOnly
          });
          return;
        }

        // Handle peer presence response
        if (msg.type === ('announce-presence' as any)) {
          discoveredPeers.set(msg.peerId, {
            peerId: msg.peerId,
            name: msg.name,
            isHost: msg.isHost,
            isAudioOnly: msg.isAudioOnly
          });
          return;
        }

        this.onMessageCallback?.(msg);
      };

      // Announce and probe for existing peers in channel
      this.channel.postMessage({
        type: 'discover-peers',
        senderPeerId: this.peerId,
        senderName: this.name
      });

      // Wait 350ms to gather existing peers
      setTimeout(() => {
        // If no one responded, this peer is the room host
        const isHost = discoveredPeers.size === 0;
        this.isHost = isHost;

        // Broadcast join to peers
        this.send({
          type: 'peer-joined',
          peerId: this.peerId,
          name: this.name,
          isHost,
          isAudioOnly: this.isAudioOnly
        });

        resolve({
          isHost,
          existingPeers: Array.from(discoveredPeers.values())
        });
      }, 350);
    });
  }

  public send(message: SignalingMessage): void {
    if (!this.channel) return;
    try {
      this.channel.postMessage({
        ...message,
        senderPeerId: this.peerId,
        senderName: this.name
      });
    } catch (err) {
      console.error('Failed to post message to BroadcastChannel', err);
    }
  }

  public close(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.channel) {
      this.send({
        type: 'peer-left',
        peerId: this.peerId
      });
      this.channel.close();
      this.channel = null;
    }
  }
}
