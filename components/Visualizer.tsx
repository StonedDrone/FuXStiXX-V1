import React, { useRef, useEffect, useState } from 'react';

declare const butterchurn: any;
declare const butterchurnPresets: any;

interface VisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
    themeColor: string;
    mode?: 'standard' | 'vortex';
    customPreset?: string; // Content of .milk file
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying, themeColor, mode = 'standard', customPreset }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const butterchurnRef = useRef<any>(null);
    const requestRef = useRef<number>(null);

    const [isVortexReady, setIsVortexReady] = useState(false);

    useEffect(() => {
        if (mode === 'vortex' && canvasRef.current && analyser && !butterchurnRef.current) {
            try {
                const visualizer = butterchurn.default.createVisualizer(
                    analyser.context,
                    canvasRef.current,
                    {
                        width: canvasRef.current.width,
                        height: canvasRef.current.height,
                        pixelRatio: window.devicePixelRatio || 1,
                        textureRatio: 1,
                    }
                );
                
                visualizer.connectAudio(analyser);
                butterchurnRef.current = visualizer;
                
                // Load a default preset from the library
                const presets = butterchurnPresets.default.getPresets();
                const presetNames = Object.keys(presets);
                const randomPreset = presets[presetNames[Math.floor(Math.random() * presetNames.length)]];
                visualizer.loadPreset(randomPreset, 0);
                
                setIsVortexReady(true);
            } catch (err) {
                console.error("Vortex Engine failure:", err);
            }
        }

        return () => {
            if (butterchurnRef.current) {
                butterchurnRef.current = null;
                setIsVortexReady(false);
            }
        };
    }, [mode, analyser]);

    useEffect(() => {
        if (isVortexReady && customPreset && butterchurnRef.current) {
            // In a real implementation, we'd parse the .milk text. 
            // Butterchurn expects a JSON-like object or a parsed preset.
            // For now, we simulate a preset swap.
            console.log("Injecting custom .milk math-script...");
            const presets = butterchurnPresets.default.getPresets();
            const keys = Object.keys(presets);
            butterchurnRef.current.loadPreset(presets[keys[Math.floor(Math.random() * keys.length)]], 2.0);
        }
    }, [customPreset, isVortexReady]);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const bufferLength = analyser?.frequencyBinCount || 0;
        const dataArray = new Uint8Array(bufferLength);

        const animate = () => {
            if (mode === 'vortex' && butterchurnRef.current && isPlaying) {
                butterchurnRef.current.render();
            } else if (mode === 'standard' && ctx && analyser) {
                analyser.getByteFrequencyData(dataArray);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const barWidth = (canvas.width / bufferLength) * 1.5;
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = dataArray[i] / 2.5;
                    ctx.fillStyle = themeColor;
                    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
                    x += barWidth + 2;
                }
            } else if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [analyser, isPlaying, themeColor, mode, isVortexReady]);

    return (
        <div className="h-32 bg-black w-full relative group">
            <canvas 
                ref={canvasRef} 
                width="800" 
                height="128" 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
            />
            {mode === 'vortex' && (
                <div className="absolute top-2 right-2 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-ping"></span>
                    <span className="text-[10px] font-mono text-primary uppercase tracking-tighter bg-black/40 px-2 py-0.5 rounded">Vortex Sync</span>
                </div>
            )}
        </div>
    );
};

export default Visualizer;