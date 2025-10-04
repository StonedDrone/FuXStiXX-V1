import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { MOCK_PLAYLIST } from '../constants';
import { XIcon } from './icons/XIcon';
import PlaybackControls from './PlaybackControls';

interface PlaylistProps {
    isOpen: boolean;
    onClose: () => void;
}

const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const Playlist: React.FC<PlaylistProps> = ({ isOpen, onClose }) => {
    const [playlist, setPlaylist] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        try {
            const savedPlaylist = localStorage.getItem('fuxstixx-playlist');
            if (savedPlaylist) {
                setPlaylist(JSON.parse(savedPlaylist));
            }
        } catch (error) {
            console.error("Failed to load playlist from localStorage", error);
        }
    }, []);

    const savePlaylist = (updatedPlaylist: Track[]) => {
        setPlaylist(updatedPlaylist);
        localStorage.setItem('fuxstixx-playlist', JSON.stringify(updatedPlaylist));
    };

    const handleImportPlaylist = () => {
        // In a real app, this would involve Spotify OAuth and API calls.
        // Here, we just load the mock data.
        savePlaylist(MOCK_PLAYLIST);
        alert("Mission Jams playlist has been loaded, Captain. This is a simulation of a Spotify data import.");
    };

    const handlePlayTrack = (track: Track) => {
        if (currentTrack?.id === track.id) {
            if (isPlaying) {
                audioRef.current?.pause();
                setIsPlaying(false);
            } else {
                audioRef.current?.play();
                setIsPlaying(true);
            }
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
            
            const updatedPlaylist = playlist.map(t =>
                t.id === track.id ? { ...t, playCount: t.playCount + 1, lastPlayed: new Date().toISOString() } : t
            );
            savePlaylist(updatedPlaylist);
        }
    };
    
    const handleNext = () => {
        if (!currentTrack) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % playlist.length;
        handlePlayTrack(playlist[nextIndex]);
    };
    
    const handlePrev = () => {
        if (!currentTrack) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        handlePlayTrack(playlist[prevIndex]);
    };

    useEffect(() => {
        if (audioRef.current && currentTrack) {
            audioRef.current.src = currentTrack.audioSrc;
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            audioRef.current.onended = handleNext;
        }
    }, [currentTrack]);
    
    const TrackItem: React.FC<{ track: Track }> = ({ track }) => (
         <button 
            onClick={() => handlePlayTrack(track)}
            className={`w-full text-left p-3 flex items-center space-x-4 rounded-lg transition-all duration-200 ${currentTrack?.id === track.id ? 'bg-primary/20' : 'hover:bg-layer-2'}`}
        >
            <img src={track.albumArtUrl} alt={track.title} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-1">
                <p className={`font-semibold ${currentTrack?.id === track.id ? 'text-primary' : 'text-secondary'}`}>{track.title}</p>
                <p className="text-sm text-gray-400">{track.artist}</p>
            </div>
            <div className="text-right text-sm text-gray-400 font-mono">
                <p>Plays: {track.playCount}</p>
                <p>{track.lastPlayed ? formatRelativeTime(track.lastPlayed) : 'Never'}</p>
            </div>
        </button>
    );

    return (
        <div className={`
            absolute top-0 left-0 h-full w-full bg-layer-1/80 backdrop-blur-md z-30 
            transition-opacity duration-300 ease-in-out
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
                <header className="flex justify-between items-center p-4 border-b border-layer-3 flex-shrink-0">
                    <h2 className="text-2xl font-mono text-primary">Mission Jams</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-layer-2">
                        <XIcon />
                    </button>
                </header>
                <div className="flex-1 p-4 overflow-y-auto">
                   {playlist.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-center">
                           <p className="text-lg text-secondary mb-4">No playlist loaded, Captain.</p>
                           <button
                               onClick={handleImportPlaylist}
                               className="p-3 px-6 bg-layer-3 border border-primary/50 rounded-lg text-center text-sm hover:bg-primary hover:text-black transition-colors duration-200"
                           >
                               Download Spotify Playlist
                           </button>
                       </div>
                   ) : (
                        <div className="space-y-2">
                            {playlist.map(track => <TrackItem key={track.id} track={track} />)}
                        </div>
                   )}
                </div>
                {currentTrack && (
                    <div className="flex-shrink-0">
                         <PlaybackControls
                            track={currentTrack}
                            isPlaying={isPlaying}
                            onPlayPause={() => handlePlayTrack(currentTrack)}
                            onNext={handleNext}
                            onPrev={handlePrev}
                        />
                    </div>
                )}
            </div>
             <audio ref={audioRef} />
        </div>
    );
};

export default Playlist;
