import React, { useRef, useEffect, useState } from 'react';
import { XIcon } from './icons/XIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { ScanIcon } from './icons/ScanIcon';

// TensorFlow and COCO-SSD are loaded from CDN in index.html
declare const tf: any;
declare const cocoSsd: any;

interface ObjectDetectionViewProps {
    onClose: () => void;
    onReport: (objects: string[]) => void;
}

type Prediction = {
  bbox: [number, number, number, number];
  class: string;
  score: number;
};

const ObjectDetectionView: React.FC<ObjectDetectionViewProps> = ({ onClose, onReport }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('Loading TensorFlow.js...');
    const [detectedObjects, setDetectedObjects] = useState<Prediction[]>([]);
    
    const animationFrameId = useRef<number | null>(null);
    const modelRef = useRef<any | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const predictionLoop = async () => {
        if (!modelRef.current || !videoRef.current || videoRef.current.readyState < 3) {
            animationFrameId.current = requestAnimationFrame(predictionLoop);
            return;
        }

        const predictions: Prediction[] = await modelRef.current.detect(videoRef.current);
        setDetectedObjects(predictions);
        
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#32CD32';

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const text = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;

            ctx.strokeStyle = themeColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            ctx.fillStyle = themeColor;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x, y, textWidth + 8, 20);
            
            ctx.fillStyle = '#000000';
            ctx.fillText(text, x + 4, y + 14);
        });

        animationFrameId.current = requestAnimationFrame(predictionLoop);
    };

    useEffect(() => {
        const initialize = async () => {
            try {
                 if (!tf || !cocoSsd) {
                    throw new Error("TensorFlow.js or COCO-SSD model not loaded. Check script tags in index.html.");
                 }
                
                setStatus('Loading COCO-SSD model...');
                modelRef.current = await cocoSsd.load();
                
                setStatus('Requesting camera access...');
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Camera not supported by your browser.");
                }
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.onloadedmetadata = () => {
                        setStatus('Scanning...');
                        animationFrameId.current = requestAnimationFrame(predictionLoop);
                    }
                }
            } catch (err: any) {
                console.error("Initialization error:", err);
                setError(err.message || 'An unknown error occurred during setup.');
                setStatus('Error');
            }
        };

        initialize();

        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleReport = () => {
        const uniqueObjects = [...new Set(detectedObjects.map(obj => obj.class))];
        onReport(uniqueObjects);
    };

    const isLoading = status !== 'Scanning...' && status !== 'Error';

    return (
        <div className="absolute inset-0 bg-base/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-layer-1 border-2 border-primary rounded-lg shadow-2xl shadow-primary/30 flex items-center justify-center overflow-hidden">
                {isLoading && (
                    <div className="flex flex-col items-center text-secondary">
                        <LoaderIcon />
                        <p className="mt-2 font-mono">{status}</p>
                    </div>
                )}
                {error && <p className="text-danger p-4 text-center font-mono">{error}</p>}
                
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-md ${isLoading || error ? 'hidden' : 'block'}`} />
                <canvas ref={canvasRef} className={`absolute top-0 left-0 w-full h-full object-cover ${isLoading || error ? 'hidden' : 'block'}`} />
                
                <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full bg-base/50 text-secondary hover:bg-base transition-colors z-10">
                    <XIcon />
                </button>
            </div>
            <div className="mt-6 flex items-center space-x-6">
                <button onClick={onClose} className="px-6 py-3 bg-layer-2 border border-layer-3 rounded-lg text-sm font-bold text-secondary hover:bg-layer-3 transition-colors">
                    Cancel
                </button>
                 <button onClick={handleReport} disabled={!!error || isLoading || detectedObjects.length === 0} className="p-3 px-6 bg-primary text-black hover:scale-105 transition-transform disabled:bg-layer-3 disabled:cursor-not-allowed flex items-center space-x-2 font-bold rounded-lg" aria-label="Analyze and Report" title="Analyze and Report">
                    <ScanIcon />
                    <span>Analyze & Report</span>
                </button>
            </div>
        </div>
    );
};

export default ObjectDetectionView;