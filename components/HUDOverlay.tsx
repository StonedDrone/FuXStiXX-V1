import React, { useState, useEffect } from 'react';
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
    const { isStreamMode, setIsStreamMode } = useUIState();

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
                return prev + (target - prev) * 0.1 + (Math.random() * 5 - 2.5);
            });
        }, 150);
        return () => clearInterval(interval);
    }, [isLoading, currentEmotion]);

    const activeBioColor = currentEmotion ? EMOTION_COLORS[currentEmotion.emotion.toLowerCase()] || 'var(--color-primary)' : 'var(--color-primary)';

    return (
        <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${activeForge ? 'opacity-30' : 'opacity-100'}`}>
            {/* Top Engine Status */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-12 bg-primary/5 border-b border-x border-primary/20 rounded-b-xl flex items-center justify-around px-8 backdrop-blur-[2px]">
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Chaos Load</span>
                    <div className="w-20 h-1 bg-layer-3 mt-1 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-all duration-300"
                            style={{ width: `${Math.min(engineLoad, 100)}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* Bio-Telemetry Module */}
                <div className="flex flex-col items-center px-4 border-x border-primary/10">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Bio-Sync</span>
                    <div className="flex items-center space-x-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${isBioSyncing ? 'animate-ping' : ''}`} style={{ backgroundColor: activeBioColor }}></div>
                         <span className="text-[10px] font-mono uppercase tracking-tighter" style={{ color: activeBioColor }}>
                            {currentEmotion ? `${currentEmotion.emotion} [${(currentEmotion.score * 100).toFixed(0)}%]` : isBioSyncing ? 'DECODING...' : 'WAITING'}
                         </span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Drone Link</span>
                    <div className="flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-mono text-success uppercase tracking-tighter">Connected</span>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Core Status</span>
                    <span className={`text-[10px] font-mono ${isLoading ? 'text-primary animate-pulse' : 'text-primary/80'}`}>
                        {isLoading ? 'EXECUTING CYCLE' : 'STANDBY'}
                    </span>
                </div>

                <div className="flex flex-col items-center space-y-1">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Stream Link</span>
                    <button 
                        onClick={() => setIsStreamMode(!isStreamMode)}
                        className={`pointer-events-auto px-2 py-0.5 rounded border text-[8px] font-mono transition-all duration-300 ${
                            isStreamMode 
                            ? 'bg-danger text-white border-danger animate-pulse shadow-[0_0_10px_#f85149]' 
                            : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                        }`}
                    >
                        {isStreamMode ? 'LIVE BROADCAST' : 'GO LIVE'}
                    </button>
                </div>
            </div>

            {/* Left Log Stream and Operational Icons */}
            <div className="absolute left-4 top-24 bottom-24 w-24 flex flex-col">
                {/* Contextual Operational Icons */}
                <div className="flex flex-col items-start space-y-4 mb-8">
                    {activeChaosEngine && (
                        <div className="flex items-center space-x-2 text-primary animate-in fade-in slide-in-from-left-2 duration-500">
                            <ChaosIcon className="w-6 h-6" />
                            <span className="text-[8px] font-mono uppercase tracking-tighter">Chaos_Eng</span>
                        </div>
                    )}
                    {activeDataTransfer && (
                        <div className="flex items-center space-x-2 text-primary animate-in fade-in slide-in-from-left-2 duration-500">
                            <DataTransferIcon className="w-6 h-6" />
                            <span className="text-[8px] font-mono uppercase tracking-tighter">Data_Flux</span>
                        </div>
                    )}
                    {activeDroneOp && (
                        <div className="flex items-center space-x-2 text-primary animate-in fade-in slide-in-from-left-2 duration-500">
                            <DroneOpIcon className="w-6 h-6" />
                            <span className="text-[8px] font-mono uppercase tracking-tighter">Drone_Ops</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col items-start space-y-1 opacity-40">
                    {hexLogs.map((log, i) => (
                        <span key={i} className="text-[8px] font-mono text-primary tracking-tighter transition-all duration-500 whitespace-nowrap" style={{ opacity: 1 - (i * 0.05) }}>
                            {log}
                        </span>
                    ))}
                </div>
            </div>

            {/* Corner Bracket Borders - React to Bio-Signal */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-500" style={{ borderColor: `${activeBioColor}66` }}></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-500" style={{ borderColor: `${activeBioColor}66` }}></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-500" style={{ borderColor: `${activeBioColor}66` }}></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 rounded-br-lg transition-colors duration-500" style={{ borderColor: `${activeBioColor}66` }}></div>

            {/* Liquid Background Pulse */}
            <div className={`absolute inset-0 bg-primary/2 transition-opacity duration-500 ${isLoading ? 'opacity-10' : 'opacity-0'}`}></div>
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>

            {/* Exit Stream Mode Hint */}
            {isStreamMode && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto group">
                    <button 
                        onClick={() => setIsStreamMode(false)}
                        className="bg-black/60 border border-primary/20 text-[8px] font-mono text-primary/40 px-3 py-1 rounded-full hover:text-primary hover:border-primary transition-all uppercase tracking-tighter"
                    >
                        Return to Deck [ESC]
                    </button>
                </div>
            )}
        </div>
    );
};

export default HUDOverlay;