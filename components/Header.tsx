import React from 'react';
import { HeartIcon } from './icons/HeartIcon';
import { MusicIcon } from './icons/MusicIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { CogIcon } from './icons/CogIcon';

interface HeaderProps {
  onCodexToggle: () => void;
  onPlaylistToggle: () => void;
  onSettingsToggle: () => void;
  onClearChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCodexToggle, onPlaylistToggle, onSettingsToggle, onClearChat }) => {
  return (
    <header className="flex-shrink-0 bg-base border-b border-layer-3 p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-200 font-mono">
          FuXStiXX
        </h1>
        <p className="text-sm text-secondary">Stoned Drones Chaos Engine</p>
      </div>
      <div className="flex items-center space-x-2">
         <button 
          onClick={onClearChat}
          className="p-2 rounded-full text-secondary hover:text-danger hover:bg-layer-2 transition-colors duration-200"
          aria-label="Reset Conversation"
          title="Reset Conversation"
        >
          <RefreshIcon />
        </button>
        <button 
          onClick={onPlaylistToggle}
          className="p-2 rounded-full text-secondary hover:text-primary hover:bg-layer-2 transition-colors duration-200"
          aria-label="Toggle Mission Jams"
          title="Toggle Mission Jams"
        >
          <MusicIcon />
        </button>
        <button 
          onClick={onCodexToggle}
          className="p-2 rounded-full text-secondary hover:text-primary hover:bg-layer-2 transition-colors duration-200"
          aria-label="Toggle StiXX of FuX Codex"
          title="Toggle StiXX of FuX Codex"
        >
          <HeartIcon />
        </button>
        <button
          onClick={onSettingsToggle}
          className="p-2 rounded-full text-secondary hover:text-primary hover:bg-layer-2 transition-colors duration-200"
          aria-label="Toggle Settings"
          title="Toggle Settings"
        >
          <CogIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;
