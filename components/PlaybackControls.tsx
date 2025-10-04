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
    <div className="bg-layer-2 p-4 border-t border-layer-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img
          src={track.albumArtUrl}
          alt={track.title}
          className="w-14 h-14 rounded-md object-cover"
        />
        <div>
          <p className="font-semibold text-primary">{track.title}</p>
          <p className="text-sm text-gray-400">{track.artist}</p>
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
