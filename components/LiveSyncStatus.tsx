import React from 'react';
import { SyncIcon } from './icons/SyncIcon';

interface LiveSyncStatusProps {
  isActive: boolean;
}

const LiveSyncStatus: React.FC<LiveSyncStatusProps> = ({ isActive }) => {
  if (!isActive) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-layer-1/80 backdrop-blur-sm border border-layer-3 rounded-full px-4 py-1.5 text-xs font-mono shadow-lg text-secondary pointer-events-auto">
      <SyncIcon className="text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
      <span>Live Sync Active</span>
    </div>
  );
};

export default LiveSyncStatus;
