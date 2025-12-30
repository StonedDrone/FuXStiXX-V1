
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface, { ChatInterfaceHandle } from './components/ChatInterface';
import Codex from './components/Codex';
import Playlist from './components/Playlist';
import Settings from './components/Settings';
import StudioOutput from './components/StudioOutput';
import Sidebar from './components/Sidebar';
import TerminalOverlay from './components/TerminalOverlay';
import { UIStateProvider, useUIState } from './contexts/UIStateContext';
import { ActiveModel, Message, TerminalLine } from './types';

// Since tf is loaded from a script tag in index.html, we declare it as a global
declare const tf: any;

const INITIAL_MESSAGE: Message = {
    id: 'init',
    text: 'FuXStiXX online. I am your co-pilot, Captain. Ready to progress the Mission. CLI Uplink is active and monitoring.',
    sender: 'ai',
};

const ThemedApp: React.FC = () => {
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<ActiveModel>({ type: 'gemini', modelId: 'gemini-3-flash-preview' });
  const [isTfReady, setIsTfReady] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  
  // Shared chat state for streaming output
  const [messages, setMessages] = useState<Message[]>(() => {
      try {
        const savedMessages = localStorage.getItem('fuxstixx-chat-history');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return [INITIAL_MESSAGE];
      } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        return [INITIAL_MESSAGE];
      }
  });

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
  const handleTerminalToggle = useCallback(() => setIsTerminalOpen(prev => !prev), []);

  const handleClearChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE]);
    chatInterfaceRef.current?.clearChat();
  }, []);

  const handleActivateLMStudio = useCallback(({ baseURL, modelId }: { baseURL: string, modelId: string }) => {
    setActiveModel({ type: 'lmstudio', modelId, baseURL });
    setIsSettingsOpen(false);
  }, []);

  const handlePowerSelection = useCallback((prompt: string) => {
    if (prompt.includes("Terminal") || prompt.includes("Uplink")) {
        setIsTerminalOpen(true);
    }
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('fux-power-command', { detail: { prompt } }));
    }
  }, []);

  const handleTerminalCommand = useCallback((cmd: string) => {
      // Logic for user-issued terminal commands
      console.log(`Captain issued CLI command: ${cmd}`);
      // AI could listen to this too
  }, []);

  // Listen for AI-issued terminal commands from ChatInterface events
  useEffect(() => {
    const handleTerminalUpdate = (e: any) => {
        const { text, type } = e.detail;
        const newLine: TerminalLine = {
            id: Date.now().toString() + Math.random(),
            text,
            type: type || 'output',
            timestamp: new Date().toLocaleTimeString()
        };
        setTerminalLines(prev => [...prev, newLine]);
        // Auto-open terminal if AI is typing there
        if (type === 'output' && !isTerminalOpen) setIsTerminalOpen(true);
    };
    window.addEventListener('fux-terminal-relay', handleTerminalUpdate);
    return () => window.removeEventListener('fux-terminal-relay', handleTerminalUpdate);
  }, [isTerminalOpen]);

  if (isStudioMode) {
    return <StudioOutput messages={messages} />;
  }

  return (
    <div id="app-container" className="h-screen w-screen bg-base text-secondary flex flex-col font-sans antialiased overflow-hidden">
      {!isStreamMode && (
        <Header
          onCodexToggle={handleCodexToggle}
          onPlaylistToggle={handlePlaylistToggle}
          onSettingsToggle={handleSettingsToggle}
          onClearChat={handleClearChat}
          onTerminalToggle={handleTerminalToggle}
        />
      )}
      <div className="flex-1 flex overflow-hidden relative">
        {!isStreamMode && <Sidebar onPowerClick={handlePowerSelection} />}
        <main className="flex-1 flex flex-col relative z-10">
          <ChatInterface 
            ref={chatInterfaceRef}
            activeModel={activeModel}
            setActiveModel={setActiveModel}
            isTfReady={isTfReady}
            messages={messages}
            setMessages={setMessages}
          />
        </main>
        
        <TerminalOverlay 
            isOpen={isTerminalOpen} 
            onClose={() => setIsTerminalOpen(false)} 
            onCommand={handleTerminalCommand}
            externalLines={terminalLines}
        />
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
