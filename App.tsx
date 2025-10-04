import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import Codex from './components/Codex';
import { UIStateProvider, useUIState } from './contexts/UIStateContext';

const ThemedApp: React.FC = () => {
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const { theme } = useUIState();

  return (
    <div 
      className="relative flex h-full w-full font-sans bg-base text-secondary overflow-hidden rounded-md transition-colors duration-500"
      data-theme={theme}
    >
      <Codex isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} />
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header onCodexToggle={() => setIsCodexOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto">
          <ChatInterface />
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
