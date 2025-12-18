
import React from 'react';
import { useUIState } from '../contexts/UIStateContext';
import MagicMirrorBox from './MagicMirrorBox';
import Visualizer from './Visualizer';
import { XIcon } from './icons/XIcon';

const StudioOutput: React.FC = () => {
    const { globalAnalyser, setIsStudioMode, theme } = useUIState();
    
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#32CD32';

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col overflow-hidden animate-in fade-in duration-700">
            {/* Control Overlay (Auto-hides) */}
            <div className="absolute top-4 right-4 z-[110] opacity-0 hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setIsStudioMode(false)}
                    className="p-3 bg-base/50 text-white rounded-full border border-white/20 hover:bg-danger transition-colors"
                    title="Exit Studio Mode"
                >
                    <XIcon />
                </button>
            </div>

            {/* Broadcast Headers (NDI Metadata) */}
            <div className="absolute top-0 left-0 w-full p-2 flex justify-between pointer-events-none opacity-40">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-mono text-white uppercase tracking-widest">Live Output // FuXStiXX Core</span>
                </div>
                <div className="text-[10px] font-mono text-white uppercase tracking-widest">
                    60 FPS // Vortex Sync: OK
                </div>
            </div>

            {/* Main Visual Content */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* Large Background Spirit Box */}
                <div className="scale-150 transform">
                    <MagicMirrorBox 
                        analyser={globalAnalyser} 
                        color={primaryColor} 
                        intensity={0.8} 
                        isActive={true} 
                    />
                </div>
                
                {/* Subtle Scanlines for Texture */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20"></div>
            </div>

            {/* Bottom Vortex Visualizer Section */}
            <div className="h-64 border-t border-primary/20 relative">
                <Visualizer 
                    analyser={globalAnalyser} 
                    isPlaying={true} 
                    themeColor={primaryColor} 
                    mode="vortex" 
                />
                <div className="absolute bottom-4 left-4 pointer-events-none">
                    <span className="text-[8px] font-mono text-primary/60 uppercase">Frequency Mesh Analysis // Sigma Chaos</span>
                </div>
            </div>

            {/* Corner Decorative Brackets */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-xl pointer-events-none"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-xl pointer-events-none"></div>
        </div>
    );
};

export default StudioOutput;
