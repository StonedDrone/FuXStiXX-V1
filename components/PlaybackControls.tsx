import React from 'react';
import { Track } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { NextIcon } from './icons/NextIcon';
import { PrevIcon } from './icons/PrevIcon';

interface PlaybackControlsProps {
  track: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  track,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
}) => {
  return (
    <div className="bg-layer-2 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4 min-w-0">
        <img
          src={track.albumArtUrl}
          alt={track.title}
          className="w-14 h-14 rounded-md object-cover flex-shrink-0"
        />
        <div className="overflow-hidden">
          <p className="font-semibold text-primary truncate">{track.title}</p>
          <p className="text-sm text-gray-400 truncate">{track.artist}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={onPrev}
          className="p-2 rounded-full text-secondary hover:text-primary transition-colors duration-200"
          aria-label="Previous track"
        >
          <PrevIcon />
        </button>
        <button
          onClick={onPlayPause}
          className="p-3 rounded-full bg-primary text-black hover:scale-105 transition-transform duration-200"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={onNext}
          className="p-2 rounded-full text-secondary hover:text-primary transition-colors duration-200"
          aria-label="Next track"
        >
          <NextIcon />
        </button>
      </div>
    </div>
  );
};

export default PlaybackControls;
