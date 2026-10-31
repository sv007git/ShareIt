/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_PATH?: string;
  readonly VITE_SIGNALING_SERVER?: string;
  readonly VITE_STUN_SERVERS?: string;
  readonly VITE_TURN_SERVERS?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
  readonly VITE_ROOM_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
