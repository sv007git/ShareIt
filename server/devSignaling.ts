/**
 * ShareIt - Local Development WebSocket Signaling Server
 * Run with: npm run signaling
 */

import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = parseInt(process.env.PORT || '8080', 10);

interface PeerSession {
  socket: WebSocket;
  peerId: string;
  roomId: string;
  name: string;
  isHost: boolean;
  isAudioOnly?: boolean;
  isScreenSharing?: boolean;
  joinedAt: number;
}

// Map of roomId -> Map of peerId -> PeerSession
const rooms = new Map<string, Map<string, PeerSession>>();
const roomLocks = new Map<string, boolean>();

const server = http.createServer((req, res) => {
  // Simple health check and CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'ShareIt Dev Signaling Server',
      activeRooms: rooms.size,
      uptime: process.uptime()
    }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomId = url.searchParams.get('roomId') || 'default-room';
  const peerId = url.searchParams.get('peerId');
  const name = url.searchParams.get('name') || 'Guest';
  const isAudioOnly = url.searchParams.get('isAudioOnly') === 'true';

  if (!peerId) {
    ws.close(1008, 'Missing peerId parameter');
    return;
  }

  if (roomLocks.get(roomId)) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'ROOM_LOCKED',
      message: 'Room is locked by the host'
    }));
    ws.close(1008, 'Room is locked');
    return;
  }

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }

  const room = rooms.get(roomId)!;
  const isHost = room.size === 0;

  const session: PeerSession = {
    socket: ws,
    peerId,
    roomId,
    name,
    isHost,
    isAudioOnly,
    isScreenSharing: false,
    joinedAt: Date.now()
  };

  room.set(peerId, session);
  console.log(`[+] Peer joined: ${name} (${peerId}) in room: ${roomId}. Total: ${room.size}`);

  // Send initial join confirmation and list of existing peers
  const existingPeers = Array.from(room.values())
    .filter(s => s.peerId !== peerId)
    .map(s => ({
      peerId: s.peerId,
      name: s.name,
      isHost: s.isHost,
      isAudioOnly: s.isAudioOnly,
      isScreenSharing: s.isScreenSharing
    }));

  ws.send(JSON.stringify({
    type: 'joined-room',
    peerId,
    isHost,
    isLocked: roomLocks.get(roomId) || false,
    existingPeers
  }));

  // Notify other peers in this room
  broadcastToRoom(roomId, {
    type: 'peer-joined',
    peerId,
    name,
    isHost,
    isAudioOnly
  }, peerId);

  // Handle messages
  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());
      handleMessage(session, data);
    } catch (err) {
      console.error('Error handling message from peer:', peerId, err);
    }
  });

  // Handle disconnect
  const handleDisconnect = () => {
    if (room.has(peerId)) {
      room.delete(peerId);
      console.log(`[-] Peer disconnected: ${peerId} from room: ${roomId}. Remaining: ${room.size}`);

      if (room.size === 0) {
        rooms.delete(roomId);
        roomLocks.delete(roomId);
        console.log(`Room destroyed: ${roomId}`);
      } else {
        // If host disconnected, promote first remaining peer
        if (session.isHost) {
          const nextPeer = room.values().next().value;
          if (nextPeer) {
            nextPeer.isHost = true;
            console.log(`[Host] Promoted ${nextPeer.name} (${nextPeer.peerId}) to host in room: ${roomId}`);
            broadcastToRoom(roomId, {
              type: 'host-changed',
              newHostPeerId: nextPeer.peerId
            });
          }
        }

        broadcastToRoom(roomId, {
          type: 'peer-left',
          peerId
        });
      }
    }
  };

  ws.on('close', handleDisconnect);
  ws.on('error', handleDisconnect);
});

function handleMessage(session: PeerSession, data: any) {
  const { type, targetPeerId } = data;
  const room = rooms.get(session.roomId);
  if (!room) return;

  switch (type) {
    case 'offer':
    case 'answer':
    case 'ice-candidate': {
      if (targetPeerId && room.has(targetPeerId)) {
        const target = room.get(targetPeerId);
        target?.socket.send(JSON.stringify({
          ...data,
          senderPeerId: session.peerId
        }));
      }
      break;
    }

    case 'screen-state': {
      session.isScreenSharing = !!data.isSharing;
      broadcastToRoom(session.roomId, {
        type: 'peer-screen-state',
        peerId: session.peerId,
        isSharing: session.isScreenSharing
      });
      break;
    }

    case 'chat': {
      broadcastToRoom(session.roomId, {
        type: 'chat-message',
        id: data.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderPeerId: session.peerId,
        senderName: session.name,
        text: data.text,
        timestamp: Date.now()
      });
      break;
    }

    case 'file-offer':
    case 'file-response':
    case 'file-chunk-ack': {
      if (targetPeerId && room.has(targetPeerId)) {
        room.get(targetPeerId)?.socket.send(JSON.stringify({
          ...data,
          senderPeerId: session.peerId,
          senderName: session.name
        }));
      } else {
        broadcastToRoom(session.roomId, {
          ...data,
          senderPeerId: session.peerId,
          senderName: session.name
        }, session.peerId);
      }
      break;
    }

    case 'host-mute-peer': {
      if (session.isHost && targetPeerId && room.has(targetPeerId)) {
        room.get(targetPeerId)?.socket.send(JSON.stringify({
          type: 'force-mute',
          byHost: session.name
        }));
      }
      break;
    }

    case 'host-kick-peer': {
      if (session.isHost && targetPeerId && room.has(targetPeerId)) {
        const target = room.get(targetPeerId);
        target?.socket.send(JSON.stringify({
          type: 'kicked',
          reason: 'Removed by meeting host'
        }));
        target?.socket.close(1000, 'Kicked by host');
      }
      break;
    }

    case 'host-toggle-lock': {
      if (session.isHost) {
        roomLocks.set(session.roomId, !!data.isLocked);
        broadcastToRoom(session.roomId, {
          type: 'room-lock-changed',
          isLocked: !!data.isLocked
        });
      }
      break;
    }

    case 'ping': {
      session.socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }

    default:
      console.warn('Unknown message type received:', type);
  }
}

function broadcastToRoom(roomId: string, message: object, excludePeerId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  const raw = JSON.stringify(message);
  for (const [peerId, session] of room.entries()) {
    if (peerId !== excludePeerId && session.socket.readyState === WebSocket.OPEN) {
      try {
        session.socket.send(raw);
      } catch (err) {
        console.error(`Failed to broadcast to peer ${peerId}:`, err);
      }
    }
  }
}

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 ShareIt Dev Signaling Server`);
  console.log(`📡 WebSocket URL: ws://localhost:${PORT}/ws`);
  console.log(`🌐 HTTP Health:   http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
