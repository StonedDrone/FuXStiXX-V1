import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
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
  const chatInterfaceRef = useRef<{ clearChat: () => void }>(null);

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the entire conversation history, Captain? This action cannot be undone.")) {
      chatInterfaceRef.current?.clearChat();
      setActiveModel({ type: 'gemini', modelId: 'gemini-2.5-flash' });
    }
  };

  const handleActivateLMStudio = (details: { modelId: string; baseURL: string }) => {
    setActiveModel({
        type: 'lmstudio',
        modelId: details.modelId,
        baseURL: details.baseURL
    });
    setIsSettingsOpen(false);
  };

  return (
    <div 
      className="relative flex h-full w-full font-sans bg-base text-secondary overflow-hidden rounded-md transition-colors duration-500"
      data-theme={theme}
    >
      <Codex isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} />
      <Playlist isOpen={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)} />
      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onActivate={handleActivateLMStudio} />
      <div className="flex flex-col flex-1">
        <Header 
          onCodexToggle={() => setIsCodexOpen(prev => !prev)} 
          onPlaylistToggle={() => setIsPlaylistOpen(prev => !prev)}
          onSettingsToggle={() => setIsSettingsOpen(prev => !prev)}
          onClearChat={handleClearChat}
        />
        <main className="flex-1 overflow-y-auto">
          <ChatInterface 
            ref={chatInterfaceRef} 
            activeModel={activeModel}
            setActiveModel={setActiveModel}
          />
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
