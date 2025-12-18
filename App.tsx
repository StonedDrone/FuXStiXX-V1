
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface, { ChatInterfaceHandle } from './components/ChatInterface';
import Codex from './components/Codex';
import Playlist from './components/Playlist';
import Settings from './components/Settings';
import StudioOutput from './components/StudioOutput';
import { UIStateProvider, useUIState } from './contexts/UIStateContext';
import { ActiveModel } from './types';

// Since tf is loaded from a script tag in index.html, we declare it as a global
declare const tf: any;

const ThemedApp: React.FC = () => {
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<ActiveModel>({ type: 'gemini', modelId: 'gemini-3-flash-preview' });
  const [isTfReady, setIsTfReady] = useState(false);
  
  const { theme, isStreamMode, isStudioMode } = useUIState();
  const chatInterfaceRef = useRef<ChatInterfaceHandle>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const initializeTfBackend = async () => {
      try {
        if (typeof tf !== 'undefined' && tf.ready) {
          await tf.ready();
          setIsTfReady(true);
        }
      } catch (error) {
        console.error("Error initializing TensorFlow.js backend:", error);
      }
    };
    initializeTfBackend();
  }, []);

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

  // If in Studio Mode, render the clean output source only
  if (isStudioMode) {
    return <StudioOutput />;
  }

  return (
    <div id="app-container" className="h-screen w-screen bg-base text-secondary flex flex-col font-sans antialiased overflow-hidden">
      {!isStreamMode && (
        <Header
          onCodexToggle={handleCodexToggle}
          onPlaylistToggle={handlePlaylistToggle}
          onSettingsToggle={handleSettingsToggle}
          onClearChat={handleClearChat}
        />
      )}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 flex flex-col">
          <ChatInterface 
            ref={chatInterfaceRef}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            isTfReady={isTfReady}
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
