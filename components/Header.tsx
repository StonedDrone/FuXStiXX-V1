import React, { useState, useEffect } from 'react';
import { HeartIcon } from './icons/HeartIcon';
import { MusicIcon } from './icons/MusicIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { CogIcon } from './icons/CogIcon';
import { StreamIcon } from './icons/StreamIcon';

interface HeaderProps {
  onCodexToggle: () => void;
  onPlaylistToggle: () => void;
  onSettingsToggle: () => void;
  onClearChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCodexToggle, onPlaylistToggle, onSettingsToggle, onClearChat }) => {
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [micPermission, setMicPermission] = useState('prompt');

  useEffect(() => {
    const checkPermissions = async () => {
      if (navigator.permissions) {
        try {
          // Type assertion is needed as lib.dom.ts may not have all modern permission names
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
    <header className="flex-shrink-0 bg-base border-b border-layer-3 p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-200 font-mono">
          FuXStiXX
        </h1>
        <p className="text-sm text-secondary">Stoned Drones Chaos Engine</p>
      </div>
      <div className="flex items-center space-x-2">
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