/**
 * ShareIt - Cloudflare Worker with Durable Objects
 * High-performance, low-latency room-based WebSocket signaling coordinator
 */

export interface Env {
  ROOMS: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'ShareIt Signaling Worker', time: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // WebSocket upgrade endpoint: /ws?roomId=...&peerId=...&name=...
    if (url.pathname === '/ws') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket upgrade', { status: 426 });
      }

      const roomId = url.searchParams.get('roomId') || 'default-room';
      // Route request to the Durable Object for this roomId
      const id = env.ROOMS.idFromName(roomId);
      const roomObject = env.ROOMS.get(id);
      return roomObject.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};

interface PeerSession {
  peerId: string;
  name: string;
  isHost: boolean;
  isAudioOnly?: boolean;
  isScreenSharing?: boolean;
  joinedAt: number;
}

export class RoomDurableObject {
  state: DurableObjectState;
  sessions: Map<WebSocket, PeerSession>;
  isLocked: boolean = false;
  hostPeerId: string | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const peerId = url.searchParams.get('peerId');
    const name = url.searchParams.get('name') || 'Guest';
    const isAudioOnly = url.searchParams.get('isAudioOnly') === 'true';

    if (!peerId) {
      return new Response('Missing peerId parameter', { status: 400 });
    }

    if (this.isLocked) {
      return new Response(JSON.stringify({ error: 'ROOM_LOCKED', message: 'Room is locked by the host' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept WebSocket connection on server side
    server.accept();

    // Determine host status
    const isHost = this.sessions.size === 0 || !this.hostPeerId;
    if (isHost) {
      this.hostPeerId = peerId;
    }

    const session: PeerSession = {
      peerId,
      name,
      isHost,
      isAudioOnly,
      isScreenSharing: false,
      joinedAt: Date.now()
    };

    this.sessions.set(server, session);

    // Send initial join confirmation and list of existing peers to the new client
    const existingPeers = Array.from(this.sessions.values())
      .filter(s => s.peerId !== peerId)
      .map(s => ({
        peerId: s.peerId,
        name: s.name,
        isHost: s.isHost,
        isAudioOnly: s.isAudioOnly,
        isScreenSharing: s.isScreenSharing
      }));

    server.send(JSON.stringify({
      type: 'joined-room',
      peerId,
      isHost,
      isLocked: this.isLocked,
      existingPeers
    }));

    // Broadcast new peer join to existing participants
    this.broadcast({
      type: 'peer-joined',
      peerId,
      name,
      isHost,
      isAudioOnly
    }, server);

    // Setup event listeners
    server.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string);
        this.handleMessage(server, session, data);
      } catch (err) {
        console.error('Failed to parse WebSocket message', err);
      }
    });

    const cleanup = () => {
      this.sessions.delete(server);

      // Reassign host if host left
      if (this.hostPeerId === peerId && this.sessions.size > 0) {
        const nextSession = this.sessions.values().next().value;
        if (nextSession) {
          nextSession.isHost = true;
          this.hostPeerId = nextSession.peerId;
          this.broadcast({
            type: 'host-changed',
            newHostPeerId: nextSession.peerId
          });
        }
      } else if (this.sessions.size === 0) {
        this.hostPeerId = null;
        this.isLocked = false;
      }

      this.broadcast({
        type: 'peer-left',
        peerId
      });
    };

    server.addEventListener('close', cleanup);
    server.addEventListener('error', cleanup);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  handleMessage(senderSocket: WebSocket, session: PeerSession, data: any) {
    const { type, targetPeerId } = data;

    switch (type) {
      // 1-to-1 WebRTC Signaling & Remote Control
      case 'offer':
      case 'answer':
      case 'ice-candidate':
      case 'remote-control-request':
      case 'remote-control-response':
      case 'remote-control-event':
      case 'remote-control-revoke':
      case 'remote-control-release': {
        if (targetPeerId) {
          this.sendToPeer(targetPeerId, {
            ...data,
            senderPeerId: session.peerId,
            senderName: session.name
          });
        }
        break;
      }

      // Screen sharing state broadcast
      case 'screen-state': {
        session.isScreenSharing = !!data.isSharing;
        this.broadcast({
          type: 'peer-screen-state',
          peerId: session.peerId,
          isSharing: session.isScreenSharing
        });
        break;
      }

      // Room-wide text chat
      case 'chat': {
        this.broadcast({
          type: 'chat-message',
          id: data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          senderPeerId: session.peerId,
          senderName: session.name,
          text: data.text,
          timestamp: Date.now()
        });
        break;
      }

      // File transfer request and notifications
      case 'file-offer':
      case 'file-response':
      case 'file-chunk-ack': {
        if (targetPeerId) {
          this.sendToPeer(targetPeerId, {
            ...data,
            senderPeerId: session.peerId,
            senderName: session.name
          });
        } else {
          this.broadcast({
            ...data,
            senderPeerId: session.peerId,
            senderName: session.name
          }, senderSocket);
        }
        break;
      }

      // Host controls
      case 'host-mute-peer': {
        if (session.isHost && targetPeerId) {
          this.sendToPeer(targetPeerId, {
            type: 'force-mute',
            byHost: session.name
          });
        }
        break;
      }

      case 'host-kick-peer': {
        if (session.isHost && targetPeerId) {
          this.sendToPeer(targetPeerId, {
            type: 'kicked',
            reason: 'Removed by meeting host'
          });
        }
        break;
      }

      case 'host-toggle-lock': {
        if (session.isHost) {
          this.isLocked = !!data.isLocked;
          this.broadcast({
            type: 'room-lock-changed',
            isLocked: this.isLocked
          });
        }
        break;
      }

      case 'ping': {
        try {
          senderSocket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } catch (_) {}
        break;
      }

      default:
        console.warn('Unknown message type:', type);
    }
  }

  broadcast(message: object, excludeSocket?: WebSocket) {
    const raw = JSON.stringify(message);
    for (const socket of this.sessions.keys()) {
      if (socket !== excludeSocket) {
        try {
          socket.send(raw);
        } catch (e) {
          console.error('Failed to send broadcast message', e);
        }
      }
    }
  }

  sendToPeer(targetPeerId: string, message: object) {
    const raw = JSON.stringify(message);
    for (const [socket, session] of this.sessions.entries()) {
      if (session.peerId === targetPeerId) {
        try {
          socket.send(raw);
        } catch (e) {
          console.error(`Failed to send message to peer ${targetPeerId}`, e);
        }
        break;
      }
    }
  }
}
