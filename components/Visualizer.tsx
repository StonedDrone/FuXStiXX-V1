import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
    analyser: AnalyserNode | null;
    isPlaying: boolean;
    themeColor: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying, themeColor }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!analyser || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let animationFrameId: number;

        const draw = () => {
            animationFrameId = requestAnimationFrame(draw);
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
        };
        
        const clearCanvas = () => {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (isPlaying) {
            draw();
        } else {
            clearCanvas();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearCanvas();
        };

    }, [analyser, isPlaying, themeColor]);

    return (
        <div className="h-24 bg-layer-2/50 w-full p-2">
            <canvas ref={canvasRef} width="600" height="80" className="w-full h-full" />
        </div>
    );
};

export default Visualizer;
