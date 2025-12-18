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

const StudioOutput: React.FC<StudioOutputProps> = ({ messages }) => {
    const { globalAnalyser, setIsStudioMode, theme } = useUIState();
    const { currentEmotion, isSyncing: isBioSyncing } = useEmotionDetection();
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#32CD32';
    
    // Filter out init message and limit history for stream
    const displayMessages = messages.filter(m => m.id !== 'init').slice(-10);
    const lastMessage = displayMessages[displayMessages.length - 1];
    const isLoading = lastMessage?.status === 'generating';

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden animate-in fade-in duration-700">
            {/* Control Overlay (Auto-hides) */}
            <div className="absolute top-4 right-4 z-[120] opacity-0 hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setIsStudioMode(false)}
                    className="p-3 bg-base/50 text-white rounded-full border border-white/20 hover:bg-danger transition-colors"
                    title="Exit Studio Mode"
                >
                    <XIcon />
                </button>
            </div>

            {/* Broadcast Headers (NDI Metadata) */}
            <div className="absolute top-0 left-0 w-full p-2 flex justify-between pointer-events-none opacity-40 z-[110]">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono text-white uppercase tracking-widest">Live Output // FuXStiXX Core</span>
                </div>
                <div className="text-[10px] font-mono text-white uppercase tracking-widest">
                    60 FPS // Vortex Sync: OK
                </div>
            </div>

            {/* Background Visualizer (Full Screen BeatDrop Style) */}
            <div className="absolute inset-0 z-0">
                <Visualizer 
                    analyser={globalAnalyser} 
                    isPlaying={true} 
                    themeColor={primaryColor} 
                    mode="vortex" 
                />
            </div>

            {/* HUD OVERLAY INTEGRATION */}
            <HUDOverlay 
                isLoading={isLoading} 
                activeForge={false} 
                currentEmotion={currentEmotion} 
                isBioSyncing={isBioSyncing}
                activeDataTransfer={isLoading}
                activeChaosEngine={true}
            />

            {/* Center Visual Spirit Component */}
            <div className="flex-1 flex items-center justify-center relative z-10 pointer-events-none">
                <div className="scale-125 transform">
                    <MagicMirrorBox 
                        analyser={globalAnalyser} 
                        color={primaryColor} 
                        intensity={isLoading ? 0.9 : 0.6} 
                        isActive={true} 
                    />
                </div>
                
                {/* Subtle Scanlines for Texture */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
            </div>

            {/* LIVE MESSAGE OVERLAY (Stream Deck Style) */}
            <div className="absolute left-8 bottom-32 w-80 max-h-[300px] flex flex-col justify-end space-y-2 pointer-events-none z-20">
                <div className="text-[9px] font-mono text-primary/60 uppercase tracking-[0.2em] mb-1">Incoming_Mission_Data:</div>
                {displayMessages.map((msg, idx) => (
                    <div 
                        key={msg.id} 
                        className={`p-3 rounded-lg border backdrop-blur-md transition-all duration-500 animate-in slide-in-from-left-4 fade-in ${
                            msg.sender === 'ai' 
                            ? 'bg-primary/5 border-primary/20 text-secondary' 
                            : 'bg-white/5 border-white/10 text-white/80'
                        }`}
                        style={{ opacity: 0.3 + (idx / displayMessages.length) * 0.7 }}
                    >
                        <div className="text-[8px] font-mono uppercase tracking-tighter mb-1 flex justify-between">
                            <span className={msg.sender === 'ai' ? 'text-primary' : 'text-secondary'}>
                                {msg.sender === 'ai' ? '[SYST_CORE]' : '[CAPTAIN]'}
                            </span>
                        </div>
                        <p className="text-[11px] font-sans leading-snug line-clamp-3 overflow-hidden">
                            {msg.text}
                        </p>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-center space-x-2 text-primary font-mono text-[9px] animate-pulse pl-1 mt-2">
                        <span className="w-1 h-1 bg-primary rounded-full animate-ping"></span>
                        <span>ANALYZING_FREQUENCIES...</span>
                    </div>
                )}
            </div>

            {/* Bottom Output Stats (Simulated OSINT) */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent z-[110] pointer-events-none flex justify-between items-end border-t border-primary/10">
                <div className="space-y-1">
                    <div className="text-[9px] font-mono text-primary/40 uppercase">OSINT_FEED // GLOBAL_CHAOS</div>
                    <div className="flex space-x-4">
                        <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500">LATENCY</span>
                            <span className="text-[10px] font-mono text-primary">24.2ms</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500">PACKET_LOSS</span>
                            <span className="text-[10px] font-mono text-primary">0.00%</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] text-gray-500">BITRATE</span>
                            <span className="text-[10px] font-mono text-primary">12.4 Mbps</span>
                        </div>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="text-[8px] font-mono text-primary/40 uppercase mb-1 tracking-tighter">SIGMA_CHAOS_ENGINE_V4.2.0</div>
                    <div className="px-3 py-1 bg-primary/20 rounded border border-primary/40 text-[10px] font-mono text-primary">
                        BROADCASTING_ACTIVE
                    </div>
                </div>
            </div>

            {/* Decorative Brackets */}
            <div className="absolute top-6 left-6 w-16 h-16 border-t-4 border-l-4 border-primary/20 rounded-tl-2xl pointer-events-none"></div>
            <div className="absolute bottom-6 right-6 w-16 h-16 border-b-4 border-r-4 border-primary/20 rounded-br-2xl pointer-events-none"></div>
        </div>
    );
};

export default StudioOutput;