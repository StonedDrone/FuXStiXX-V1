
import React, { useState, useEffect } from 'react';
import { HeartIcon } from './icons/HeartIcon';
import { MusicIcon } from './icons/MusicIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { CogIcon } from './icons/CogIcon';
import { StreamIcon } from './icons/StreamIcon';
import { BroadcastIcon } from './icons/BroadcastIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { useUIState } from '../contexts/UIStateContext';

interface HeaderProps {
  onCodexToggle: () => void;
  onPlaylistToggle: () => void;
  onSettingsToggle: () => void;
  onClearChat: () => void;
  onTerminalToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCodexToggle, onPlaylistToggle, onSettingsToggle, onClearChat, onTerminalToggle }) => {
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [micPermission, setMicPermission] = useState('prompt');
  const { setIsStudioMode } = useUIState();

  useEffect(() => {
    const checkPermissions = async () => {
      if (navigator.permissions) {
        try {
          const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          setCameraPermission(camStatus.state);
          camStatus.onchange = () => setCameraPermission(camStatus.state);

          const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setMicPermission(micStatus.state);
          micStatus.onchange = () => setMicPermission(micStatus.state);
        } catch (error) {
          console.warn("Permission API query failed, may not be fully supported:", error);
        }
      }
    };

    checkPermissions();
  }, []);

  const getStatus = () => {
    const title = `Sensor Status\nCamera: ${cameraPermission}\nMicrophone: ${micPermission}`;
    if (cameraPermission === 'denied' || micPermission === 'denied') {
      return { color: 'text-danger', title };
    }
    if (cameraPermission === 'granted' && micPermission === 'granted') {
      return { color: 'text-primary animate-pulse', title };
    }
    return { color: 'text-secondary', title };
  };

  const sensorStatus = getStatus();

  return (
    <header className="flex-shrink-0 bg-base border-b border-layer-3 p-4 flex justify-between items-center z-10 relative">
      <div>
        <h1 className="text-xl font-bold text-gray-200 font-mono">
          FuXStiXX
        </h1>
        <p className="text-sm text-secondary">Stoned Drones Chaos Engine</p>
      </div>
      <div className="flex items-center space-x-2">
        <button 
            onClick={onTerminalToggle}
            className="p-2 rounded-full text-secondary hover:text-primary hover:bg-layer-2 transition-all duration-200"
            aria-label="Toggle Terminal Uplink"
            title="CLI Uplink (Remote Terminal)"
        >
            <TerminalIcon />
        </button>
        <button 
          onClick={() => setIsStudioMode(true)}
          className="p-2 rounded-full text-secondary hover:text-primary hover:bg-layer-2 transition-all duration-200"
          aria-label="Enter Studio Mode"
          title="Studio Mode (Live Output)"
        >
          <BroadcastIcon />
        </button>
        <div className="w-px h-6 bg-layer-3 mx-1"></div>
        <div 
          className="p-2 rounded-full"
          title={sensorStatus.title}
        >
          <StreamIcon size={24} className={sensorStatus.color} />
        </div>
        <div className="w-px h-6 bg-layer-3 mx-1"></div>
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
