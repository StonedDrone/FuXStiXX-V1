
import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatInterface, { ChatInterfaceHandle } from './components/ChatInterface';
import Codex from './components/Codex';
import Playlist from './components/Playlist';
import Settings from './components/Settings';
import { UIStateProvider, useUIState } from './contexts/UIStateContext';
import { ActiveModel } from './types';

const ThemedApp: React.FC = () => {
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<ActiveModel>({ type: 'gemini', modelId: 'gemini-2.5-flash' });
  
  const { theme } = useUIState();
  const chatInterfaceRef = useRef<ChatInterfaceHandle>(null);

  const handleCodexToggle = useCallback(() => setIsCodexOpen(prev => !prev), []);
  const handlePlaylistToggle = useCallback(() => setIsPlaylistOpen(prev => !prev), []);
  const handleSettingsToggle = useCallback(() => setIsSettingsOpen(prev => !prev), []);

  const handleClearChat = useCallback(() => {
    chatInterfaceRef.current?.clearChat();
  }, []);

  const handleActivateLMStudio = useCallback(({ baseURL, modelId }: { baseURL: string, modelId: string }) => {
    setActiveModel({ type: 'lmstudio', modelId, baseURL });
    setIsSettingsOpen(false);
  }, []);

  return (
    <div id="app-container" className={`theme-${theme} h-screen w-screen bg-base text-secondary flex flex-col font-sans antialiased overflow-hidden`}>
      <Header
        onCodexToggle={handleCodexToggle}
        onPlaylistToggle={handlePlaylistToggle}
        onSettingsToggle={handleSettingsToggle}
        onClearChat={handleClearChat}
      />
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col">
          <ChatInterface 
            ref={chatInterfaceRef}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
          />
        </main>
      </div>

      <Codex isOpen={isCodexOpen} onClose={handleCodexToggle} />
      <Playlist isOpen={isPlaylistOpen} onClose={handlePlaylistToggle} />
      <Settings 
        isOpen={isSettingsOpen} 
        onClose={handleSettingsToggle} 
        onActivate={handleActivateLMStudio} 
      />
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
