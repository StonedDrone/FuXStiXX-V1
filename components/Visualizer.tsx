
import React, { useRef, useEffect, useState } from 'react';

declare const butterchurn: any;
declare const butterchurnPresets: any;

interface VisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
    themeColor: string;
    mode?: 'standard' | 'vortex';
    customPreset?: string; 
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
                
                const presets = butterchurnPresets.default.getPresets();
                const presetNames = Object.keys(presets).filter(name => 
                    !name.includes('flexi') // Filter out some overly heavy ones
                );
                const initialPreset = presets[presetNames[Math.floor(Math.random() * presetNames.length)]];
                visualizer.loadPreset(initialPreset, 0);
                
                setIsVortexReady(true);

                // Auto-cycle presets for streaming energy every 30s
                const cycleInterval = setInterval(() => {
                    if (isPlaying) {
                        const randomKey = presetNames[Math.floor(Math.random() * presetNames.length)];
                        visualizer.loadPreset(presets[randomKey], 5.7); // Smooth 5.7s transition
                    }
                }, 30000);

                return () => clearInterval(cycleInterval);
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
    }, [mode, analyser, isPlaying]);

    useEffect(() => {
        if (isVortexReady && customPreset && butterchurnRef.current) {
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
                
                // BeatDrop Style Signal Visualization
                const barCount = 128;
                const barWidth = canvas.width / barCount;
                for (let i = 0; i < barCount; i++) {
                    const idx = Math.floor(i * (bufferLength / barCount));
                    const barHeight = (dataArray[idx] / 255) * canvas.height;
                    
                    const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
                    gradient.addColorStop(0, themeColor);
                    gradient.addColorStop(1, '#ffffff');
                    
                    ctx.fillStyle = gradient;
                    ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
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
        <div className="h-full w-full bg-black relative group overflow-hidden">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover" 
            />
        </div>
    );
};

export default Visualizer;
