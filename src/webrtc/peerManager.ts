/**
 * WebRTC Multi-Peer Connection Manager for ShareIt
 * Manages RTCPeerConnection instances, ICE candidate queueing,
 * dynamic track replacement for screen-sharing & cameras, and WebRTC DataChannels.
 */

import { getDefaultIceConfiguration, IceConfigOptions } from './iceConfig';

export interface PeerConnectionState {
  peerId: string;
  pc: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  remoteStream: MediaStream;
  pendingCandidates: RTCIceCandidateInit[];
  connectionStatus: RTCPeerConnectionState;
  iceStatus: RTCIceConnectionState;
}

export interface PeerManagerCallbacks {
  onSignalOffer: (targetPeerId: string, offer: RTCSessionDescriptionInit) => void;
  onSignalAnswer: (targetPeerId: string, answer: RTCSessionDescriptionInit) => void;
  onSignalCandidate: (targetPeerId: string, candidate: RTCIceCandidateInit) => void;
  onRemoteStreamUpdate: (peerId: string, stream: MediaStream) => void;
  onDataChannelMessage: (peerId: string, data: any) => void;
  onPeerConnectionStateChange: (peerId: string, state: RTCPeerConnectionState) => void;
}

export class PeerManager {
  private peers: Map<string, PeerConnectionState> = new Map();
  private localStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private iceConfig: RTCConfiguration;
  private callbacks: PeerManagerCallbacks;

  constructor(callbacks: PeerManagerCallbacks, iceOptions?: IceConfigOptions) {
    this.callbacks = callbacks;
    this.iceConfig = getDefaultIceConfiguration(iceOptions);
  }

  public setLocalStream(stream: MediaStream | null): void {
    this.localStream = stream;
  }

  public setScreenStream(stream: MediaStream | null): void {
    this.localScreenStream = stream;
  }

  /**
   * Create or retrieve peer connection
   */
  public getOrCreatePeer(peerId: string, isInitiator: boolean = false): PeerConnectionState {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId)!;
    }

    const pc = new RTCPeerConnection(this.iceConfig);
    const remoteStream = new MediaStream();

    const peerState: PeerConnectionState = {
      peerId,
      pc,
      dataChannel: null,
      remoteStream,
      pendingCandidates: [],
      connectionStatus: 'new',
      iceStatus: 'new',
    };

    this.peers.set(peerId, peerState);

    // Add local media tracks to peer connection
    // If screen stream is active, send screen video track; otherwise camera video track
    const tracksToSend: MediaStreamTrack[] = [];
    if (this.localScreenStream && this.localScreenStream.getVideoTracks().length > 0) {
      tracksToSend.push(this.localScreenStream.getVideoTracks()[0]);
    } else if (this.localStream && this.localStream.getVideoTracks().length > 0) {
      tracksToSend.push(this.localStream.getVideoTracks()[0]);
    }

    if (this.localStream && this.localStream.getAudioTracks().length > 0) {
      tracksToSend.push(this.localStream.getAudioTracks()[0]);
    }

    tracksToSend.forEach(track => {
      try {
        const stream = this.localStream || new MediaStream([track]);
        pc.addTrack(track, stream);
      } catch (err) {
        console.error(`Failed to add track ${track.kind} to peer ${peerId}`, err);
      }
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onSignalCandidate(peerId, event.candidate.toJSON());
      }
    };

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track (${event.track.kind}) from peer: ${peerId}`);
      if (event.streams && event.streams[0]) {
        peerState.remoteStream = event.streams[0];
      } else {
        peerState.remoteStream.addTrack(event.track);
      }
      this.callbacks.onRemoteStreamUpdate(peerId, peerState.remoteStream);
    };

    // Connection state listeners
    pc.onconnectionstatechange = () => {
      peerState.connectionStatus = pc.connectionState;
      this.callbacks.onPeerConnectionStateChange(peerId, pc.connectionState);
      console.log(`[WebRTC] Peer ${peerId} connection state: ${pc.connectionState}`);
    };

    pc.oniceconnectionstatechange = () => {
      peerState.iceStatus = pc.iceConnectionState;
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[WebRTC] ICE connection failed for peer ${peerId}, attempting ICE restart`);
        pc.restartIce();
      }
    };

    // Setup DataChannel
    if (isInitiator) {
      try {
        const dc = pc.createDataChannel('shareit-data', { ordered: true });
        this.setupDataChannel(peerId, peerState, dc);
      } catch (err) {
        console.warn('Could not create data channel', err);
      }
    } else {
      pc.ondatachannel = (event) => {
        this.setupDataChannel(peerId, peerState, event.channel);
      };
    }

    // If initiator, generate offer
    if (isInitiator) {
      this.initiateOffer(peerId, pc);
    }

    return peerState;
  }

  private setupDataChannel(peerId: string, peerState: PeerConnectionState, dc: RTCDataChannel) {
    peerState.dataChannel = dc;
    dc.binaryType = 'arraybuffer';

    dc.onopen = () => {
      console.log(`[DataChannel] Opened with peer ${peerId}`);
    };

    dc.onmessage = (event) => {
      this.callbacks.onDataChannelMessage(peerId, event.data);
    };

    dc.onclose = () => {
      console.log(`[DataChannel] Closed with peer ${peerId}`);
    };

    dc.onerror = (err) => {
      console.warn(`[DataChannel] Error on peer ${peerId}:`, err);
    };
  }

  private async initiateOffer(peerId: string, pc: RTCPeerConnection) {
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      this.callbacks.onSignalOffer(peerId, offer);
    } catch (err) {
      console.error(`Failed to create offer for peer ${peerId}`, err);
    }
  }

  /**
   * Handle incoming SDP offer
   */
  public async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.getOrCreatePeer(peerId, false);
    const { pc } = peer;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await this.flushPendingCandidates(peer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.callbacks.onSignalAnswer(peerId, answer);
    } catch (err) {
      console.error(`Error handling offer from peer ${peerId}:`, err);
    }
  }

  /**
   * Handle incoming SDP answer
   */
  public async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    try {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.flushPendingCandidates(peer);
    } catch (err) {
      console.error(`Error handling answer from peer ${peerId}:`, err);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  public async handleCandidate(peerId: string, candidateInit: RTCIceCandidateInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    const candidate = new RTCIceCandidate(candidateInit);

    // If remote description is already set, add candidate immediately
    if (peer.pc.remoteDescription && peer.pc.remoteDescription.type) {
      try {
        await peer.pc.addIceCandidate(candidate);
      } catch (err) {
        console.error(`Failed to add ICE candidate for peer ${peerId}`, err);
      }
    } else {
      // Otherwise queue it until remote description is applied
      peer.pendingCandidates.push(candidateInit);
    }
  }

  private async flushPendingCandidates(peer: PeerConnectionState) {
    if (peer.pendingCandidates.length > 0) {
      for (const candidateInit of peer.pendingCandidates) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } catch (err) {
          console.error('Error applying pending candidate', err);
        }
      }
      peer.pendingCandidates = [];
    }
  }

  /**
   * Hot-swap video track across all active peers (for screen share start/stop or camera swap)
   */
  public async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    for (const [peerId, peer] of this.peers.entries()) {
      const senders = peer.pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');

      if (videoSender) {
        try {
          await videoSender.replaceTrack(newTrack);
          console.log(`[WebRTC] Replaced video track for peer ${peerId}`);
        } catch (err) {
          console.error(`Failed to replace video track for peer ${peerId}`, err);
        }
      } else if (newTrack) {
        try {
          peer.pc.addTrack(newTrack, this.localStream || new MediaStream([newTrack]));
        } catch (err) {
          console.error(`Failed to add new video track for peer ${peerId}`, err);
        }
      }
    }
  }

  /**
   * Hot-swap audio track across all active peers
   */
  public async replaceAudioTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    for (const [peerId, peer] of this.peers.entries()) {
      const senders = peer.pc.getSenders();
      const audioSender = senders.find(s => s.track && s.track.kind === 'audio');

      if (audioSender) {
        try {
          await audioSender.replaceTrack(newTrack);
        } catch (err) {
          console.error(`Failed to replace audio track for peer ${peerId}`, err);
        }
      } else if (newTrack) {
        try {
          peer.pc.addTrack(newTrack, this.localStream || new MediaStream([newTrack]));
        } catch (err) {
          console.error(`Failed to add new audio track for peer ${peerId}`, err);
        }
      }
    }
  }

  /**
   * Send data through WebRTC DataChannel to a specific peer or all peers
   */
  public sendData(data: string | ArrayBuffer, targetPeerId?: string): boolean {
    if (targetPeerId) {
      const peer = this.peers.get(targetPeerId);
      if (peer?.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(data as any);
        return true;
      }
      return false;
    }

    let sent = false;
    for (const peer of this.peers.values()) {
      if (peer.dataChannel?.readyState === 'open') {
        peer.dataChannel.send(data as any);
        sent = true;
      }
    }
    return sent;
  }

  public removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      try {
        peer.dataChannel?.close();
        peer.pc.close();
      } catch (_) {}
      this.peers.delete(peerId);
    }
  }

  public closeAll(): void {
    for (const peer of this.peers.values()) {
      try {
        peer.dataChannel?.close();
        peer.pc.close();
      } catch (_) {}
    }
    this.peers.clear();
  }
}
