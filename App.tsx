import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import Codex from './components/Codex';
import Playlist from './components/Playlist';
import { UIStateProvider, useUIState } from './contexts/UIStateContext';

const ThemedApp: React.FC = () => {
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [initialInput, setInitialInput] = useState<string | null>(null);
  const { theme } = useUIState();

  const handleInitialInputUsed = useCallback(() => {
    setInitialInput(null);
  }, []);

  return (
    <div 
      className="relative flex h-full w-full font-sans bg-base text-secondary overflow-hidden rounded-md transition-colors duration-500"
      data-theme={theme}
    >
      <Codex isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} />
      <Playlist isOpen={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)} />
      <Sidebar onPowerClick={setInitialInput} />
      <div className="flex flex-col flex-1">
        <Header 
          onCodexToggle={() => setIsCodexOpen(prev => !prev)} 
          onPlaylistToggle={() => setIsPlaylistOpen(prev => !prev)}
        />
        <main className="flex-1 overflow-y-auto">
          <ChatInterface initialInput={initialInput} onInitialInputUsed={handleInitialInputUsed} />
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <UIStateProvider>
      <ThemedApp />
    </UIStateProvider>
  );
};

export default App;