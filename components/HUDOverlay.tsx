
import React, { useState, useEffect, useRef } from 'react';
import { useUIState } from '../contexts/UIStateContext';
import { Emotion } from '../types';
import { DroneOpIcon } from './icons/DroneOpIcon';
import { DataTransferIcon } from './icons/DataTransferIcon';
import { ChaosIcon } from './icons/ChaosIcon';

interface HUDOverlayProps {
    isLoading: boolean;
    activeForge: boolean;
    currentEmotion?: Emotion | null;
    isBioSyncing?: boolean;
    activeDroneOp?: boolean;
    activeDataTransfer?: boolean;
    activeChaosEngine?: boolean;
}

const HEX_CHARS = '0123456789ABCDEF';

const EMOTION_COLORS: Record<string, string> = {
    happy: '#FFD700', // Gold
    neutral: '#C0C0C0', // Silver
    sad: '#4169E1', // Royal Blue
    angry: '#FF4500', // Orange Red
    fear: '#9400D3', // Dark Violet
    surprise: '#00FF7F', // Spring Green
};

const HUDOverlay: React.FC<HUDOverlayProps> = ({ 
    isLoading, 
    activeForge, 
    currentEmotion, 
    isBioSyncing,
    activeDroneOp,
    activeDataTransfer,
    activeChaosEngine
}) => {
    const [hexLogs, setHexLogs] = useState<string[]>([]);
    const [engineLoad, setEngineLoad] = useState(12);
    const [compassPos, setCompassPos] = useState(0);
    const { isStreamMode, setIsStreamMode, theme } = useUIState();

    useEffect(() => {
        const interval = setInterval(() => {
            const newHex = Array.from({ length: 8 }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join('');
            
            let logEntry = `0x${newHex}`;
            const rand = Math.random();
            if (rand > 0.95 && currentEmotion) {
                logEntry = `BIO_${currentEmotion.emotion.toUpperCase()}`;
            } else if (rand > 0.90) {
                logEntry = `VORTEX_CORE_SYNC`;
            } else if (rand > 0.85) {
                logEntry = `VECTOR_gRPC_BRIDGE`;
            } else if (rand > 0.80) {
                logEntry = `MATH_SCRIPT_LOAD`;
            }
            
            setHexLogs(prev => [logEntry, ...prev].slice(0, 20));
            
            setEngineLoad(prev => {
                const target = isLoading ? 70 : 12;
                const jitter = isLoading ? (Math.random() * 15 - 7.5) : (Math.random() * 4 - 2);
                return Math.max(0, Math.min(100, prev + (target - prev) * 0.05 + jitter));
            });

            setCompassPos(prev => (prev + (isLoading ? 10 : 2)) % 360);
        }, 120);
        return () => clearInterval(interval);
    }, [isLoading, currentEmotion]);

    const activeBioColor = currentEmotion ? EMOTION_COLORS[currentEmotion.emotion.toLowerCase()] || 'var(--color-primary)' : 'var(--color-primary)';

    return (
        <div className={`fixed inset-0 pointer-events-none z-0 transition-all duration-1000 ${activeForge ? 'opacity-20 scale-105' : 'opacity-100 scale-100'}`}>
            {/* Background Grid System */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                <div 
                    className="absolute inset-[-100%] border-primary/20"
                    style={{
                        backgroundImage: `linear-gradient(to right, var(--color-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-primary) 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        transform: `perspective(1000px) rotateX(60deg) translateY(${compassPos % 40}px)`,
                        transition: 'transform 0.1s linear'
                    }}
                ></div>
            </div>

            {/* Neural Compass - Top Center */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-64 h-1 border-b border-primary/20 relative overflow-hidden">
                    <div 
                        className="flex space-x-8 absolute top-0 transition-transform duration-150"
                        style={{ transform: `translateX(-${compassPos}px)` }}
                    >
                        {Array.from({ length: 20 }).map((_, i) => (
                            <span key={i} className="text-[6px] font-mono text-primary/40 whitespace-nowrap">{(i * 10) % 360}°</span>
                        ))}
                    </div>
                </div>
                <div className="w-1 h-3 bg-primary/60 mt-[-1px] z-10"></div>
            </div>

            {/* Emergent State: Focused Tendril Swarm */}
            {theme === 'focused-tendril-swarm' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                    <svg className="w-full h-full animate-pulse" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <path 
                                key={i}
                                d={`M ${10 + i * 8} 0 Q ${20 + i * 2} 50 ${10 + i * 8} 100`}
                                fill="none"
                                stroke="var(--color-primary)"
                                strokeWidth="0.1"
                                className="animate-tendrils"
                                style={{ animationDelay: `${i * 0.3}s` }}
                                filter="url(#glow)"
                            />
                        ))}
                    </svg>
                </div>
            )}

            {/* Emergent State: Chaotic Pulse Omen */}
            {theme === 'chaotic-pulse-omen' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-danger/5 animate-glitch">
                    <div className="text-[200px] font-bold text-danger/10 font-mono select-none">OMEN</div>
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 flex space-x-8 opacity-40">
                        <div className="w-12 h-12 border-4 border-danger rounded-full animate-ping"></div>
                        <div className="w-12 h-12 border-4 border-danger rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-12 h-12 border-4 border-danger rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            )}

            {/* Top Engine Status */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-14 bg-gradient-to-b from-primary/10 to-transparent border-x border-primary/10 rounded-b-3xl flex items-center justify-around px-8 backdrop-blur-[1px]">
                <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-primary/40 uppercase tracking-[0.3em]">Load_Density</span>
                    <div className="w-24 h-0.5 bg-layer-3 mt-1.5 rounded-full overflow-hidden relative">
                        <div 
                            className={`h-full bg-primary shadow-[0_0_10px_var(--color-primary)] transition-all duration-500 ${isLoading ? 'animate-pulse' : ''}`}
                            style={{ width: `${engineLoad}%` }}
                        ></div>
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/20 animate-data-stream"></div>
                        )}
                    </div>
                </div>
                
                {/* Bio-Telemetry Module */}
                <div className="flex flex-col items-center px-6 border-x border-primary/5">
                    <span className="text-[7px] font-mono text-primary/40 uppercase tracking-[0.3em]">Synapse_Gap</span>
                    <div className="flex items-center space-x-2 mt-1">
                         <div className={`w-2 h-2 rounded-full ${isBioSyncing ? 'animate-ping' : ''}`} style={{ backgroundColor: activeBioColor }}></div>
                         <span className="text-[9px] font-mono font-bold tracking-tight" style={{ color: activeBioColor }}>
                            {currentEmotion ? `${currentEmotion.emotion.toUpperCase()}` : isBioSyncing ? 'BUFFERING...' : 'IDLE'}
                         </span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-primary/40 uppercase tracking-[0.3em]">Node_Bridge</span>
                    <div className="flex items-center space-x-1 mt-1">
                        <div className="w-1.5 h-1.5 bg-success rounded-sm animate-pulse"></div>
                        <span className="text-[9px] font-mono text-success/80 uppercase">Established</span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[7px] font-mono text-primary/40 uppercase tracking-[0.3em]">Core_Flux</span>
                    <span className={`text-[9px] font-mono mt-1 ${isLoading ? 'text-primary animate-pulse' : 'text-primary/60'}`}>
                        {isLoading ? '0x' + Math.floor(Math.random() * 1000000).toString(16) : 'STABLE_0x0'}
                    </span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                    <button 
                        onClick={() => setIsStreamMode(!isStreamMode)}
                        className={`pointer-events-auto px-3 py-0.5 rounded-sm border text-[7px] font-mono transition-all duration-500 uppercase tracking-widest ${
                            isStreamMode 
                            ? 'bg-danger text-white border-danger animate-pulse shadow-[0_0_15px_#f85149]' 
                            : 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/20'
                        }`}
                    >
                        {isStreamMode ? 'BROADCAST_ON' : 'STREAM_OFFLINE'}
                    </button>
                </div>
            </div>

            {/* Left Log Stream and Operational Icons */}
            <div className="absolute left-6 top-24 bottom-24 w-28 flex flex-col">
                <div className="flex flex-col items-start space-y-6 mb-12">
                    {activeChaosEngine && (
                        <div className="flex items-center space-x-3 text-primary animate-in fade-in slide-in-from-left-4 duration-700">
                            <ChaosIcon className="w-8 h-8 opacity-70" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-primary/80">Entropy_Eng</span>
                                <span className="text-[6px] font-mono text-primary/40">V.4.2_SYSPER</span>
                            </div>
                        </div>
                    )}
                    {activeDataTransfer && (
                        <div className="flex items-center space-x-3 text-primary animate-in fade-in slide-in-from-left-4 duration-700">
                            <DataTransferIcon className="w-8 h-8 opacity-70" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-primary/80">Packet_Flux</span>
                                <span className="text-[6px] font-mono text-primary/40">UPLINK_82%</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col items-start space-y-1.5 opacity-30 select-none">
                    <div className="text-[6px] text-primary/40 uppercase tracking-widest border-b border-primary/10 w-full mb-1 pb-0.5">Kernel_Log</div>
                    {hexLogs.map((log, i) => (
                        <span key={i} className="text-[7px] font-mono text-primary/90 tracking-tighter transition-all duration-700 whitespace-nowrap" style={{ opacity: 1 - (i * 0.05) }}>
                            {log}
                        </span>
                    ))}
                </div>
            </div>

            {/* Bottom Left: Encryption Ticker */}
            <div className="absolute bottom-12 left-8 opacity-40">
                <div className="text-[6px] font-mono text-primary/40 uppercase tracking-[0.5em] mb-1">Enc_Bridge_Sig</div>
                <div className="text-[9px] font-mono text-primary leading-none">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i}>{Math.random().toString(16).substring(2, 20)}</div>
                    ))}
                </div>
            </div>

            {/* Bottom Right: Vortex Stability Radial */}
            <div className="absolute bottom-12 right-8 flex flex-col items-end">
                <div className="relative w-16 h-16 mb-2">
                    <svg viewBox="0 0 100 100" className={`w-full h-full transform -rotate-90 transition-all duration-500 ${isLoading ? 'opacity-80' : 'opacity-30'}`}>
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/10" />
                        <circle 
                            cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" 
                            className="text-primary"
                            strokeDasharray={`${Math.min(100, engineLoad * 2.8)}, 283`}
                            style={{ transition: 'stroke-dasharray 0.5s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[8px] font-mono text-primary">{Math.round(100 - engineLoad)}%</span>
                    </div>
                </div>
                <span className="text-[7px] font-mono text-primary/40 uppercase tracking-[0.2em]">Stability_Index</span>
            </div>

            {/* Corner Bracket Borders - Dynamic Expansion */}
            <div 
                className={`absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 rounded-tl-xl transition-all duration-700`} 
                style={{ 
                    borderColor: `${activeBioColor}44`,
                    transform: isLoading ? 'translate(-4px, -4px)' : 'translate(0, 0)'
                }}
            ></div>
            <div 
                className={`absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 rounded-tr-xl transition-all duration-700`} 
                style={{ 
                    borderColor: `${activeBioColor}44`,
                    transform: isLoading ? 'translate(4px, -4px)' : 'translate(0, 0)'
                }}
            ></div>
            <div 
                className={`absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 rounded-bl-xl transition-all duration-700`} 
                style={{ 
                    borderColor: `${activeBioColor}44`,
                    transform: isLoading ? 'translate(-4px, 4px)' : 'translate(0, 0)'
                }}
            ></div>
            <div 
                className={`absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 rounded-br-xl transition-all duration-700`} 
                style={{ 
                    borderColor: `${activeBioColor}44`,
                    transform: isLoading ? 'translate(4px, 4px)' : 'translate(0, 0)'
                }}
            ></div>

            {/* Scanline & Grain Overlays */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_2px] pointer-events-none opacity-40"></div>
            {isLoading && (
                <div className="absolute inset-0 bg-primary/2 mix-blend-overlay animate-glitch pointer-events-none opacity-30"></div>
            )}
            
            {/* Syncing Vignette */}
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)] transition-opacity duration-1000 ${isLoading ? 'opacity-100' : 'opacity-0'}`}></div>

            {/* Exit Stream Mode Hint */}
            {isStreamMode && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto group">
                    <button 
                        onClick={() => setIsStreamMode(false)}
                        className="bg-primary/5 hover:bg-primary/10 border border-primary/20 text-[7px] font-mono text-primary/60 px-4 py-1.5 rounded-sm transition-all uppercase tracking-[0.3em] hover:text-primary"
                    >
                        Abort_Stream_Broadcast
                    </button>
                </div>
            )}
        </div>
    );
};

export default HUDOverlay;
