
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface, { ChatInterfaceHandle } from './components/ChatInterface';
import Codex from './components/Codex';
import Playlist from './components/Playlist';
import Settings from './components/Settings';
import { UIStateProvider, useUIState } from './contexts/UIStateContext';
import { ActiveModel } from './types';

// Since tf is loaded from a script tag in index.html, we declare it as a global
declare const tf: any;

const ThemedApp: React.FC = () => {
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<ActiveModel>({ type: 'gemini', modelId: 'gemini-2.5-flash' });
  const [isTfReady, setIsTfReady] = useState(false);
  
  const { theme } = useUIState();
  const chatInterfaceRef = useRef<ChatInterfaceHandle>(null);

  useEffect(() => {
    // This effect synchronizes the React theme state with the DOM `data-theme` attribute
    // on the body, which drives the CSS variable changes for theming.
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    // This effect runs once on mount to initialize the TensorFlow.js backend.
    // This resolves the "backend not initialized" warning and ensures AI vision
    // features are ready to go without delay when activated.
    const initializeTfBackend = async () => {
      try {
        if (typeof tf !== 'undefined' && tf.ready) {
          await tf.ready();
          console.log('TensorFlow.js backend initialized successfully.');
          setIsTfReady(true);
        } else {
          console.error("TensorFlow.js global object not found. It might not have loaded correctly.");
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

  return (
    <div id="app-container" className="h-screen w-screen bg-base text-secondary flex flex-col font-sans antialiased overflow-hidden">
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
