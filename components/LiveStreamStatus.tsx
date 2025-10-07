import React from 'react';
import { LiveStreamState } from '../types';
import { StreamIcon } from './icons/StreamIcon';

interface LiveStreamStatusProps {
  streamState: LiveStreamState;
}

const LiveStreamStatus: React.FC<LiveStreamStatusProps> = ({ streamState }) => {
  if (streamState.status !== 'active' || !streamState.source) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 bg-layer-1/80 backdrop-blur-sm border border-layer-3 rounded-full px-4 py-1.5 text-xs font-mono shadow-lg text-secondary pointer-events-auto">
      <StreamIcon className="text-green-400 animate-pulse" />
      <span>Monitoring: <span className="text-primary">{streamState.source}</span></span>
    </div>
  );
};

export default LiveStreamStatus;
