import React, { useState, useEffect } from 'react';

interface HUDOverlayProps {
    isLoading: boolean;
    activeForge: boolean;
}

const HEX_CHARS = '0123456789ABCDEF';

const HUDOverlay: React.FC<HUDOverlayProps> = ({ isLoading, activeForge }) => {
    const [hexLogs, setHexLogs] = useState<string[]>([]);
    const [engineLoad, setEngineLoad] = useState(12);

    useEffect(() => {
        const interval = setInterval(() => {
            const newHex = Array.from({ length: 8 }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join('');
            setHexLogs(prev => [newHex, ...prev].slice(0, 20));
            setEngineLoad(prev => {
                const target = isLoading ? 70 : 12;
                return prev + (target - prev) * 0.1 + (Math.random() * 5 - 2.5);
            });
        }, 150);
        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <div className={`fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${activeForge ? 'opacity-30' : 'opacity-100'}`}>
            {/* Top Engine Status */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-primary/5 border-b border-x border-primary/20 rounded-b-xl flex items-center justify-around px-8 backdrop-blur-[2px]">
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Chaos Load</span>
                    <div className="w-24 h-1 bg-layer-3 mt-1 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-all duration-300"
                            style={{ width: `${Math.min(engineLoad, 100)}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Core Status</span>
                    <span className={`text-[10px] font-mono ${isLoading ? 'text-primary animate-pulse' : 'text-primary/80'}`}>
                        {isLoading ? 'EXECUTING CYCLE' : 'STANDBY'}
                    </span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-mono text-primary/60 uppercase tracking-widest">Sync Sync</span>
                    <span className="text-[10px] font-mono text-primary/80">99.8%</span>
                </div>
            </div>

            {/* Left Log Stream */}
            <div className="absolute left-4 top-24 bottom-24 w-16 overflow-hidden flex flex-col items-start space-y-1 opacity-40">
                {hexLogs.map((log, i) => (
                    <span key={i} className="text-[8px] font-mono text-primary tracking-tighter transition-all duration-500" style={{ opacity: 1 - (i * 0.05) }}>
                        0x{log}
                    </span>
                ))}
            </div>

            {/* Corner Bracket Borders */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/40 rounded-tl-lg"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/40 rounded-tr-lg"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/40 rounded-bl-lg"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/40 rounded-br-lg"></div>

            {/* Liquid Background Pulse */}
            <div className={`absolute inset-0 bg-primary/2 transition-opacity duration-500 ${isLoading ? 'opacity-10' : 'opacity-0'}`}></div>
            
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
        </div>
    );
};

export default HUDOverlay;