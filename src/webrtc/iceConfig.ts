/**
 * WebRTC ICE Server Configuration
 * Configures STUN servers for NAT traversal and optional TURN servers for relay
 */

export interface IceConfigOptions {
  stunServers?: string[];
  turnServers?: string[];
  turnUsername?: string;
  turnCredential?: string;
}

export function getDefaultIceConfiguration(options?: IceConfigOptions): RTCConfiguration {
  const defaultStuns = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302',
  ];

  // Parse env STUNs if available
  const envStuns = import.meta.env.VITE_STUN_SERVERS
    ? import.meta.env.VITE_STUN_SERVERS.split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  const stuns = options?.stunServers?.length ? options.stunServers : (envStuns.length ? envStuns : defaultStuns);

  const iceServers: RTCIceServer[] = [
    {
      urls: stuns,
    },
  ];

  // Turn configuration
  const envTurn = import.meta.env.VITE_TURN_SERVERS;
  const envUser = import.meta.env.VITE_TURN_USERNAME;
  const envPass = import.meta.env.VITE_TURN_CREDENTIAL;

  const turns = options?.turnServers?.length ? options.turnServers : (envTurn ? envTurn.split(',').map((s: string) => s.trim()) : []);
  const turnUser = options?.turnUsername || envUser;
  const turnPass = options?.turnCredential || envPass;

  if (turns.length > 0) {
    const turnConfig: RTCIceServer = {
      urls: turns,
    };
    if (turnUser) turnConfig.username = turnUser;
    if (turnPass) turnConfig.credential = turnPass;
    iceServers.push(turnConfig);
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };
}
