
import React, { useState, useEffect, useRef } from 'react';
import { useUIState } from '../contexts/UIStateContext';
import { Message } from '../types';
import MagicMirrorBox from './MagicMirrorBox';
import Visualizer from './Visualizer';
import HUDOverlay from './HUDOverlay';
import { XIcon } from './icons/XIcon';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { BroadcastIcon } from './icons/BroadcastIcon';
import { SettingsIcon } from './icons/SettingsIcon';

interface StudioOutputProps {
    messages: Message[];
}

const HEX_CHARS = '0123456789ABCDEF';

const StudioOutput: React.FC<StudioOutputProps> = ({ messages }) => {
    const { 
        globalAnalyser, 
        setIsStudioMode, 
        streamScene, 
        setStreamScene, 
        isCleanFeed, 
        setIsCleanFeed 
    } = useUIState();
    
    const { currentEmotion, isSyncing: isBioSyncing } = useEmotionDetection();
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    const [isDirectorOpen, setIsDirectorOpen] = useState(false);
    
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#32CD32';
    const displayMessages = messages.filter(m => m.id !== 'init').slice(-8);
    const lastMessage = displayMessages[displayMessages.length - 1];
    const isLoading = lastMessage?.status === 'generating';

    // Simulated NDI Metadata & OSINT Stream
    useEffect(() => {
        const interval = setInterval(() => {
            const hex = Array.from({ length: 8 }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join('');
            const actions = ['NDI_METADATA_SYNC', 'BEATDROP_FFT_DATA', 'VORTEX_CORE_PULSE', 'OSINT_SCRAPE_LIVE', 'BIO_SIGNAL_ENCODED'];
            const log = `>> ${actions[Math.floor(Math.random() * actions.length)]} [0x${hex}]`;
            setTerminalLogs(prev => [log, ...prev].slice(0, 20));
        }, 150);
        return () => clearInterval(interval);
    }, []);

    // Director's Console Shortcut: 'D' to toggle
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'd') setIsDirectorOpen(prev => !prev);
            if (e.key === 'Escape') setIsDirectorOpen(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col overflow-hidden animate-in fade-in duration-1000 select-none">
            
            {/* BACKGROUND LAYER: BEATDROP VISUALIZER (Vortex) */}
            <div className={`absolute inset-0 z-0 transition-all duration-1000 ${streamScene === 'vortex' ? 'opacity-100 scale-100' : 'opacity-40 scale-110 blur-sm'}`}>
                <Visualizer 
                    analyser={globalAnalyser} 
                    isPlaying={true} 
                    themeColor={primaryColor} 
                    mode="vortex" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
            </div>

            {/* NDI BROADCAST OVERLAY (Always visible unless Clean Feed) */}
            {!isCleanFeed && (
                <div className="absolute top-6 left-8 z-[220] pointer-events-none group">
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-3">
                            <div className="relative flex items-center justify-center">
                                <div className="w-3 h-3 bg-danger rounded-full animate-ping absolute opacity-40"></div>
                                <div className="w-3 h-3 bg-danger rounded-full relative shadow-[0_0_15px_#f85149]"></div>
                            </div>
                            <span className="text-[11px] font-mono text-white font-bold tracking-[0.4em] uppercase">BROADCASTING // SCENE_{streamScene.toUpperCase()}</span>
                        </div>
                        <div className="text-[8px] font-mono text-primary/40 tracking-widest uppercase flex space-x-4">
                            <span>MODE: NDI_VIRTUAL_LINK</span>
                            <span>SOURCE: FUX_SYNAPSE_CORE</span>
                            <span>BITRATE: 12.4 MBPS</span>
                        </div>
                    </div>
                </div>
            )}

            {/* HUD LAYER */}
            {!isCleanFeed && (
                <HUDOverlay 
                    isLoading={isLoading} 
                    activeForge={false} 
                    currentEmotion={currentEmotion} 
                    isBioSyncing={isBioSyncing}
                    activeDataTransfer={isLoading}
                    activeChaosEngine={true}
                />
            )}

            {/* CENTER PIECE: THE MIRROR SPIRIT (SYNAPSE SCENE) */}
            <div className={`flex-1 flex items-center justify-center relative z-10 transition-all duration-1000 ${
                streamScene === 'synapse' ? 'scale-100 opacity-100' : 
                streamScene === 'vortex' ? 'scale-150 opacity-20' : 'scale-75 opacity-40 translate-x-[25%]'
            }`}>
                <MagicMirrorBox 
                    analyser={globalAnalyser} 
                    color={primaryColor} 
                    intensity={isLoading ? 1.0 : 0.6} 
                    isActive={true} 
                />
            </div>

            {/* MISSION LOG SCENE ELEMENT (Chat Focus) */}
            <div className={`absolute left-8 bottom-24 w-[450px] flex flex-col justify-end space-y-4 z-20 transition-all duration-700 ${
                streamScene === 'mission' || streamScene === 'synapse' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
            }`}>
                {!isCleanFeed && <div className="text-[8px] font-mono text-primary/30 uppercase tracking-[0.5em] mb-2">Live_Command_Intercept</div>}
                {displayMessages.map((msg, idx) => (
                    <div 
                        key={msg.id} 
                        className={`p-5 rounded-2xl border backdrop-blur-2xl transition-all duration-700 animate-in slide-in-from-left-8 fade-in ${
                            msg.sender === 'ai' 
                            ? 'bg-primary/5 border-primary/20 text-secondary' 
                            : 'bg-white/5 border-white/5 text-white/80 shadow-2xl'
                        }`}
                        style={{ 
                            opacity: 0.1 + (idx / displayMessages.length) * 0.9,
                            transform: `translateX(${(idx - displayMessages.length + 1) * 6}px)`
                        }}
                    >
                        <div className="text-[8px] font-mono uppercase tracking-[0.2em] mb-2 flex justify-between">
                            <span className={msg.sender === 'ai' ? 'text-primary' : 'text-secondary/40'}>
                                {msg.sender === 'ai' ? '◆ FUX_SYNAPSE' : '◇ CAPTAIN_BRIDGE'}
                            </span>
                        </div>
                        <p className="text-[13px] font-sans leading-relaxed line-clamp-3 antialiased">
                            {msg.text}
                        </p>
                    </div>
                ))}
            </div>

            {/* OSINT / TERMINAL LOG SCENE ELEMENT (Intel Focus) */}
            <div className={`absolute right-8 bottom-24 w-80 h-96 overflow-hidden z-20 pointer-events-none transition-all duration-1000 ${
                streamScene === 'intel' || streamScene === 'mission' ? 'opacity-40 translate-x-0' : 'opacity-0 translate-x-20'
            }`}>
                <div className="text-[9px] font-mono text-primary/40 uppercase tracking-[0.3em] mb-4 text-right">System_Trace_Output</div>
                <div className="flex flex-col space-y-1 text-right">
                    {terminalLogs.map((log, i) => (
                        <div key={i} className="text-[8px] font-mono text-primary truncate tracking-tighter" style={{ opacity: 1 - (i * 0.05) }}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* BROADCAST STATS FOOTER */}
            {!isCleanFeed && (
                <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/40 to-transparent z-[210] pointer-events-none flex justify-between items-end">
                    <div className="flex space-x-12 opacity-40">
                        <div className="flex flex-col">
                            <span className="text-[7px] text-gray-500 uppercase tracking-widest">Uplink_Node</span>
                            <span className="text-[10px] font-mono text-primary">0x7F_GHOST_BRIDGE</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] text-gray-500 uppercase tracking-widest">FPS_Target</span>
                            <span className="text-[10px] font-mono text-primary">60.00_STABLE</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] text-gray-500 uppercase tracking-widest">NDI_Discovery</span>
                            <span className="text-[10px] font-mono text-success animate-pulse font-bold">READY</span>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-[10px] font-mono text-primary/30 uppercase mb-2 tracking-[0.4em]">Chaos_Engine_v4.2 // Studio</div>
                        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                            <BroadcastIcon className="w-3 h-3 text-primary" />
                            <span className="text-[9px] font-mono text-primary font-bold uppercase tracking-widest">Sync_Locked</span>
                        </div>
                    </div>
                </div>
            )}

            {/* DIRECTOR'S CONSOLE (Hidden UI for the Captain) */}
            <div className={`absolute inset-0 z-[300] bg-black/80 backdrop-blur-xl transition-all duration-500 ${isDirectorOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none scale-105'}`}>
                <div className="max-w-2xl mx-auto mt-20 p-8 border border-primary/20 bg-layer-1 rounded-3xl shadow-[0_0_100px_rgba(50,205,50,0.1)]">
                    <header className="flex justify-between items-center mb-8 pb-4 border-b border-primary/10">
                        <div className="flex items-center space-x-3 text-primary">
                            <SettingsIcon className="w-6 h-6" />
                            <h2 className="text-xl font-mono uppercase tracking-[0.3em]">Director's Console</h2>
                        </div>
                        <button onClick={() => setIsDirectorOpen(false)} className="p-2 text-secondary hover:text-danger"><XIcon /></button>
                    </header>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Scene Management */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-mono text-secondary uppercase tracking-widest opacity-60">Scene_Selector</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {(['synapse', 'vortex', 'mission', 'intel'] as const).map(scene => (
                                    <button 
                                        key={scene}
                                        onClick={() => setStreamScene(scene)}
                                        className={`p-4 border rounded-xl font-mono text-[10px] uppercase transition-all ${streamScene === scene ? 'bg-primary text-black border-primary' : 'bg-layer-2 border-primary/10 text-secondary hover:bg-layer-3'}`}
                                    >
                                        {scene}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Capture Settings */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-mono text-secondary uppercase tracking-widest opacity-60">Stream_Parameters</h3>
                            <div className="space-y-2">
                                <button 
                                    onClick={() => setIsCleanFeed(!isCleanFeed)}
                                    className={`w-full p-4 border rounded-xl font-mono text-[10px] uppercase flex justify-between items-center ${isCleanFeed ? 'bg-success/20 border-success text-success' : 'bg-layer-2 border-primary/10 text-secondary'}`}
                                >
                                    <span>Clean_Feed_Capture</span>
                                    <span>{isCleanFeed ? 'ACTIVE' : 'OFF'}</span>
                                </button>
                                <button 
                                    onClick={() => setIsStudioMode(false)}
                                    className="w-full p-4 bg-danger/10 border border-danger/40 text-danger rounded-xl font-mono text-[10px] uppercase hover:bg-danger hover:text-white transition-all"
                                >
                                    Abort_Broadcast
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 p-4 bg-black/40 rounded-xl border border-primary/10">
                        <p className="text-[9px] font-mono text-primary/60 leading-relaxed">
                            CAPTAIN_NOTE: Use 'Clean Feed' if capturing via OBS with a separate HUD layer. 
                            The NDI Virtual Link is simulated visually but optimized for OBS Window/Browser capture at 1080p.
                            Current FPS: 60.00 // Thread: VORTEX_WORKER_01
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Scene Access (Visible only when hovering bottom center) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity z-[250] flex space-x-1 bg-black/40 p-1 rounded-full border border-primary/20 backdrop-blur-sm">
                {(['synapse', 'vortex', 'mission', 'intel'] as const).map(scene => (
                    <button 
                        key={scene}
                        onClick={() => setStreamScene(scene)}
                        className={`px-3 py-1 rounded-full text-[8px] font-mono uppercase tracking-widest transition-all ${streamScene === scene ? 'bg-primary text-black' : 'text-primary/60 hover:text-primary'}`}
                    >
                        {scene}
                    </button>
                ))}
                <button onClick={() => setIsDirectorOpen(true)} className="px-3 py-1 text-primary/60 hover:text-primary"><SettingsIcon size={12} /></button>
            </div>
        </div>
    );
};

export default StudioOutput;
