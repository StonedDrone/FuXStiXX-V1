import React from 'react';
import { HeartIcon } from './icons/HeartIcon';

interface HeaderProps {
  onCodexToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCodexToggle }) => {
  return (
    <header className="flex-shrink-0 bg-base border-b border-layer-3 p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-200 font-mono">
          FuXStiXX
        </h1>
        <p className="text-sm text-secondary">Stoned Drones Chaos Engine</p>
      </div>
      <button 
        onClick={onCodexToggle}
        className="p-2 rounded-full text-secondary hover:text-primary hover:bg-layer-2 transition-colors duration-200"
        aria-label="Toggle StiXX of FuX Codex"
        title="Toggle StiXX of FuX Codex"
      >
        <HeartIcon />
      </button>
    </header>
  );
};

export default Header;
