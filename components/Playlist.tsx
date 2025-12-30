
import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import { MOCK_PLAYLIST } from '../constants';
import { useUIState } from '../contexts/UIStateContext';
import { XIcon } from './icons/XIcon';
import PlaybackControls from './PlaybackControls';
import Visualizer from './Visualizer';

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
    const [themeColor, setThemeColor] = useState('#32CD32');
    const [visMode, setVisMode] = useState<'standard' | 'vortex'>('standard');
    const [customMilk, setCustomMilk] = useState<string | undefined>(undefined);
    const [customMilkName, setCustomMilkName] = useState<string | null>(null);
    const { theme, setGlobalAnalyser, globalAnalyser } = useUIState();

    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const milkInputRef = useRef<HTMLInputElement>(null);

    // Load saved playlist on initial mount
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

    // Synchronize UI theme color with visualizer
    useEffect(() => {
        if (isOpen) {
            const color = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
            setThemeColor(color || '#32CD32');
        }
    }, [theme, isOpen]);

    const savePlaylist = (updatedPlaylist: Track[]) => {
        setPlaylist(updatedPlaylist);
        localStorage.setItem('fuxstixx-playlist', JSON.stringify(updatedPlaylist));
    };

    const handleImportPlaylist = () => {
        savePlaylist(MOCK_PLAYLIST);
    };

    // Initialize Web Audio API components for visualization
    const setupAudioContext = () => {
        if (!audioRef.current || audioContextRef.current) return;
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = context.createAnalyser();
        analyser.fftSize = 1024;
        
        if (!sourceRef.current) {
            const source = context.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(context.destination);
            sourceRef.current = source;
        }

        audioContextRef.current = context;
        setGlobalAnalyser(analyser);
    };

    const handlePlayTrack = (track: Track) => {
        setupAudioContext();
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

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
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % playlist.length;
        handlePlayTrack(playlist[nextIndex]);
    };
    
    const handlePrev = () => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        handlePlayTrack(playlist[prevIndex]);
    };

    // Update audio source when currentTrack changes
    useEffect(() => {
        if (audioRef.current && currentTrack) {
            audioRef.current.src = currentTrack.audioSrc;
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                console.error("Audio playback failed:", e);
                setIsPlaying(false);
            });
            audioRef.current.onended = handleNext;
        }
    }, [currentTrack]);

    const handleMilkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setCustomMilk(event.target?.result as string);
                setCustomMilkName(file.name);
                setVisMode('vortex');
            };
            reader.readAsText(file);
        }
    };

    const handleEjectMilk = () => {
        setCustomMilk(undefined);
        setCustomMilkName(null);
        if (milkInputRef.current) milkInputRef.current.value = '';
    };
    
    const TrackItem: React.FC<{ track: Track }> = ({ track }) => (
         <button 
            onClick={() => handlePlayTrack(track)}
            className={`w-full text-left p-3 flex items-center space-x-4 rounded-lg transition-all duration-200 ${currentTrack?.id === track.id ? 'bg-primary/20' : 'hover:bg-layer-2'}`}
        >
            <img src={track.albumArtUrl} alt={track.title} className="w-12 h-12 rounded-md object-cover" />
            <div className="flex-1 overflow-hidden">
                <p className={`font-semibold truncate ${currentTrack?.id === track.id ? 'text-primary' : 'text-secondary'}`}>{track.title}</p>
                <p className="text-sm text-gray-400 truncate">{track.artist}</p>
            </div>
            <div className="text-right text-sm text-gray-400 font-mono flex-shrink-0">
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
                    <div className="flex items-center space-x-4">
                        <h2 className="text-2xl font-mono text-primary uppercase tracking-widest">Mission Jams</h2>
                        <div className="flex bg-layer-2 rounded-full p-1 text-[10px] font-mono">
                            <button 
                                onClick={() => setVisMode('standard')}
                                className={`px-3 py-1 rounded-full transition-all ${visMode === 'standard' ? 'bg-primary text-black' : 'text-secondary hover:text-white'}`}
                            >Signal</button>
                            <button 
                                onClick={() => setVisMode('vortex')}
                                className={`px-3 py-1 rounded-full transition-all ${visMode === 'vortex' ? 'bg-primary text-black' : 'text-secondary hover:text-white'}`}
                            >Vortex</button>
                        </div>
                        {visMode === 'vortex' && (
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => milkInputRef.current?.click()}
                                    className={`text-[10px] font-mono transition-colors border px-2 py-1 rounded-md ${customMilk ? 'text-success border-success/40 bg-success/10' : 'text-primary/60 border-primary/20 hover:text-primary'}`}
                                >
                                    {customMilkName ? `Using: ${customMilkName}` : 'Inject .milk'}
                                </button>
                                <input type="file" ref={milkInputRef} className="hidden" accept=".milk" onChange={handleMilkUpload} />
                                {customMilk && (
                                    <button 
                                        onClick={handleEjectMilk}
                                        className="text-[10px] font-mono text-danger/60 hover:text-danger p-1"
                                        title="Eject custom preset"
                                    >
                                        <XIcon />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 text-secondary hover:text-danger">
                        <XIcon />
                    </button>
                </header>

                <div className="flex-1 p-4 overflow-y-auto">
                   {playlist.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full text-center">
                           <p className="text-lg text-secondary mb-4 font-mono">NO DATA STREAM DETECTED</p>
                           <button
                               onClick={handleImportPlaylist}
                               className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:scale-105 transition-transform"
                           >
                               IMPORT MISSION JAMS
                           </button>
                       </div>
                   ) : (
                       <div className="space-y-2">
                           {playlist.map(track => <TrackItem key={track.id} track={track} />)}
                       </div>
                   )}
                </div>

                <div className="p-4 bg-layer-1 border-t border-layer-3 flex-shrink-0">
                    <Visualizer 
                        analyser={globalAnalyser} 
                        isPlaying={isPlaying} 
                        themeColor={themeColor} 
                        mode={visMode} 
                        customPreset={customMilk}
                    />
                    {currentTrack && (
                        <div className="mt-4">
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
                <audio ref={audioRef} className="hidden" />
            </div>
        </div>
    );
};

export default Playlist;
