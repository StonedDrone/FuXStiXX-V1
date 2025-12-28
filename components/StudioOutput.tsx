
import React, { useState, useEffect, useRef } from 'react';
import { useUIState } from '../contexts/UIStateContext';
import { Message } from '../types';
import MagicMirrorBox from './MagicMirrorBox';
import Visualizer from './Visualizer';
import HUDOverlay from './HUDOverlay';
import { XIcon } from './icons/XIcon';
import { useEmotionDetection } from '../hooks/useEmotionDetection';

interface StudioOutputProps {
    messages: Message[];
}

const HEX_CHARS = '0123456789ABCDEF';

const StudioOutput: React.FC<StudioOutputProps> = ({ messages }) => {
    const { globalAnalyser, setIsStudioMode, theme } = useUIState();
    const { currentEmotion, isSyncing: isBioSyncing } = useEmotionDetection();
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#32CD32';
    
    // Filter out init message and limit history for the stream chat overlay
    const displayMessages = messages.filter(m => m.id !== 'init').slice(-6);
    const lastMessage = displayMessages[displayMessages.length - 1];
    const isLoading = lastMessage?.status === 'generating';

    // Simulate high-speed OSINT/Terminal feed logs
    useEffect(() => {
        const interval = setInterval(() => {
            const hex = Array.from({ length: 12 }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join('');
            const actions = ['FETCH_INTEL', 'SCRAPE_OSINT', 'SYNC_VORTEX', 'gRPC_PING', 'DECRYPT_CORE', 'FLUX_STABILIZE'];
            const log = `[${new Date().toLocaleTimeString()}] ${actions[Math.floor(Math.random() * actions.length)]} >> 0x${hex}`;
            setTerminalLogs(prev => [log, ...prev].slice(0, 15));
        }, 200);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden animate-in fade-in duration-1000">
            {/* Control Overlay - Top Right (Visible on hover for manual override) */}
            <div className="absolute top-6 right-6 z-[150] opacity-0 hover:opacity-100 transition-opacity duration-300">
                <button 
                    onClick={() => setIsStudioMode(false)}
                    className="flex items-center space-x-2 px-4 py-2 bg-danger/20 hover:bg-danger text-white rounded-full border border-danger/40 transition-all text-xs font-mono font-bold"
                >
                    <XIcon />
                    <span>ABORT_BROADCAST</span>
                </button>
            </div>

            {/* Broadcast Metadata Overlays (NDI Simulation) */}
            <div className="absolute top-6 left-8 z-[110] pointer-events-none">
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 bg-danger rounded-full animate-pulse shadow-[0_0_10px_#f85149]"></div>
                        <span className="text-xs font-mono text-white font-bold tracking-[0.3em] uppercase">ON AIR // MISSION_LIVE</span>
                    </div>
                    <div className="text-[10px] font-mono text-primary/60 tracking-widest uppercase">
                        Source: Chaos_Engine_V4 // Mode: Vortex_Synapse
                    </div>
                </div>
            </div>

            <div className="absolute top-6 right-8 z-[110] text-right pointer-events-none opacity-60">
                <div className="text-xs font-mono text-white tracking-widest uppercase">60.0 FPS // 1080p</div>
                <div className="text-[10px] font-mono text-primary/80 mt-1">LATENCY: 18ms // LOSS: 0.0%</div>
            </div>

            {/* FULL SCREEN VORTEX VISUALIZER */}
            <div className="absolute inset-0 z-0">
                <Visualizer 
                    analyser={globalAnalyser} 
                    isPlaying={true} 
                    themeColor={primaryColor} 
                    mode="vortex" 
                />
                {/* Vignette & Glitch Texture Overlays */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_100%)]"></div>
                {isLoading && (
                   <div className="absolute inset-0 bg-primary/5 mix-blend-overlay animate-glitch pointer-events-none"></div>
                )}
            </div>

            {/* HUD OVERLAY LAYER */}
            <HUDOverlay 
                isLoading={isLoading} 
                activeForge={false} 
                currentEmotion={currentEmotion} 
                isBioSyncing={isBioSyncing}
                activeDataTransfer={isLoading}
                activeChaosEngine={true}
            />

            {/* CENTER PIECE: THE MIRROR SPIRIT */}
            <div className="flex-1 flex items-center justify-center relative z-10 pointer-events-none">
                <div className={`transition-transform duration-1000 ${isLoading ? 'scale-150' : 'scale-110'}`}>
                    <MagicMirrorBox 
                        analyser={globalAnalyser} 
                        color={primaryColor} 
                        intensity={isLoading ? 1.0 : 0.7} 
                        isActive={true} 
                    />
                </div>
            </div>

            {/* LEFT SIDE: MISSION FEED (CHAT) */}
            <div className="absolute left-8 bottom-32 w-[400px] flex flex-col justify-end space-y-3 pointer-events-none z-20">
                <div className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.4em] mb-2 px-2 border-l-2 border-primary/20">Mission_Communication_Log</div>
                {displayMessages.map((msg, idx) => (
                    <div 
                        key={msg.id} 
                        className={`p-4 rounded-xl border backdrop-blur-xl transition-all duration-700 animate-in slide-in-from-left-8 fade-in ${
                            msg.sender === 'ai' 
                            ? 'bg-primary/5 border-primary/30 text-secondary' 
                            : 'bg-white/5 border-white/10 text-white/90 shadow-2xl'
                        }`}
                        style={{ 
                            opacity: 0.2 + (idx / displayMessages.length) * 0.8,
                            transform: `translateX(${(idx - displayMessages.length + 1) * 4}px)`
                        }}
                    >
                        <div className="text-[9px] font-mono uppercase tracking-widest mb-1.5 flex justify-between">
                            <span className={msg.sender === 'ai' ? 'text-primary font-bold' : 'text-secondary/60'}>
                                {msg.sender === 'ai' ? '◆ CORE_INTEL' : '◇ CAPTAIN_CMD'}
                            </span>
                            <span className="opacity-40">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[13px] font-sans leading-relaxed line-clamp-4">
                            {msg.text}
                        </p>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center space-x-3 text-primary font-mono text-[10px] animate-pulse pl-2 mt-4">
                        <div className="flex space-x-1">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        <span className="tracking-[0.2em]">DECONSTRUCTING_CHAOS_PARAMETERS...</span>
                    </div>
                )}
            </div>

            {/* RIGHT SIDE: LIVE TERMINAL OSINT FEED */}
            <div className="absolute right-8 bottom-32 w-72 h-64 overflow-hidden z-20 pointer-events-none opacity-40">
                <div className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.4em] mb-2 text-right">System_Scrape_Feed</div>
                <div className="flex flex-col space-y-1 text-right">
                    {terminalLogs.map((log, i) => (
                        <div key={i} className="text-[9px] font-mono text-primary truncate tracking-tighter" style={{ opacity: 1 - (i * 0.06) }}>
                            {log}
                        </div>
                    ))}
                </div>
            </div>

            {/* BOTTOM BAR: OPERATIONAL STATS */}
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black to-transparent z-[110] pointer-events-none flex justify-between items-end border-t border-primary/10 backdrop-blur-[1px]">
                <div className="flex items-end space-x-12">
                    <div className="space-y-1">
                        <div className="text-[10px] font-mono text-primary/50 uppercase tracking-[0.2em]">Broadcast_Uplink</div>
                        <div className="flex space-x-6">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 uppercase">Frequencies</span>
                                <span className="text-[11px] font-mono text-primary">2.4 / 5.8 GHz</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 uppercase">Encryption</span>
                                <span className="text-[11px] font-mono text-primary">AES-256-XCG</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 uppercase">Vortex_Res</span>
                                <span className="text-[11px] font-mono text-primary">8192Hz</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-[9px] font-mono text-primary/40 uppercase mb-2 tracking-[0.3em]">Signature // Chaos_Engine_Studio</div>
                    <div className="px-5 py-2 bg-primary/10 border border-primary/30 rounded-lg text-[11px] font-mono text-primary font-bold shadow-[0_0_15px_rgba(50,205,50,0.2)]">
                        FUXX_SYNC_ENGAGED
                    </div>
                </div>
            </div>

            {/* DECORATIVE BROADCAST ELEMENTS */}
            <div className="absolute top-10 left-10 w-24 h-24 border-t border-l border-primary/30 rounded-tl-3xl pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 border-b border-r border-primary/30 rounded-br-3xl pointer-events-none"></div>
        </div>
    );
};

export default StudioOutput;
