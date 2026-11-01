import React, { createContext, useContext, useEffect, useState } from 'react';

export interface UserSettings {
  displayName: string;
  audioInputId: string;
  videoInputId: string;
  audioOutputId: string;
  isAudioOnlyDefault: boolean;
  mirrorSelfVideo: boolean;
  videoQuality: 'sd' | 'hd' | 'fhd';
  signalingUrl: string;
  customStunServers: string;
  customTurnServers: string;
  turnUsername: string;
  turnCredential: string;
  soundNotifications: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  audioInputId: '',
  videoInputId: '',
  audioOutputId: '',
  isAudioOnlyDefault: false,
  mirrorSelfVideo: true,
  videoQuality: 'hd',
  signalingUrl: import.meta.env.VITE_SIGNALING_SERVER || '',
  customStunServers: import.meta.env.VITE_STUN_SERVERS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302',
  customTurnServers: import.meta.env.VITE_TURN_SERVERS || '',
  turnUsername: import.meta.env.VITE_TURN_USERNAME || '',
  turnCredential: import.meta.env.VITE_TURN_CREDENTIAL || '',
  soundNotifications: true,
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem('shareit_user_settings');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (_) {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('shareit_user_settings', JSON.stringify(settings));
    } catch (_) {}
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettingsState(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettingsState(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
