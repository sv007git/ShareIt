import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { MeetingRoomPage } from './pages/MeetingRoomPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { sanitizeRoomId } from './utils/idGenerator';

export const App: React.FC = () => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  // Parse initial route from URL (supporting hash, path, and query params)
  useEffect(() => {
    const parseRoute = () => {
      // 1. Check hash route: #/room/:roomId or #/room/ROOM123
      const hash = window.location.hash;
      const hashMatch = hash.match(/#\/?room\/([a-zA-Z0-9_-]+)/i);
      if (hashMatch && hashMatch[1]) {
        setCurrentRoomId(sanitizeRoomId(hashMatch[1]));
        return;
      }

      // 2. Check path route: .../room/:roomId
      const path = window.location.pathname;
      const pathMatch = path.match(/\/room\/([a-zA-Z0-9_-]+)/i);
      if (pathMatch && pathMatch[1]) {
        setCurrentRoomId(sanitizeRoomId(pathMatch[1]));
        // Normalize to hash for GitHub Pages consistency
        window.location.hash = `#/room/${pathMatch[1]}`;
        return;
      }

      // 3. Check query param: ?room=ROOM123
      const urlParams = new URLSearchParams(window.location.search);
      const queryRoom = urlParams.get('room');
      if (queryRoom) {
        setCurrentRoomId(sanitizeRoomId(queryRoom));
        window.location.hash = `#/room/${queryRoom}`;
        return;
      }

      // Otherwise, at root/landing page
      setCurrentRoomId(null);
    };

    parseRoute();

    // Listen for hashchange and popstate events (back/forward navigation)
    window.addEventListener('hashchange', parseRoute);
    window.addEventListener('popstate', parseRoute);

    return () => {
      window.removeEventListener('hashchange', parseRoute);
      window.removeEventListener('popstate', parseRoute);
    };
  }, []);

  const navigateToRoom = (roomId: string) => {
    const cleanId = sanitizeRoomId(roomId);
    window.location.hash = `#/room/${cleanId}`;
    setCurrentRoomId(cleanId);
  };

  const navigateToHome = () => {
    window.location.hash = '';
    setCurrentRoomId(null);
  };

  return (
    <ThemeProvider>
      <SettingsProvider>
        {currentRoomId ? (
          <MeetingRoomPage
            roomId={currentRoomId}
            onLeave={navigateToHome}
          />
        ) : (
          <LandingPage
            onCreateRoom={navigateToRoom}
            onJoinRoom={navigateToRoom}
          />
        )}
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
