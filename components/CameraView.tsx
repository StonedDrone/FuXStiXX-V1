import React, { useRef, useEffect, useState } from 'react';
import { XIcon } from './icons/XIcon';
import { CameraIcon } from './icons/CameraIcon';
import { LoaderIcon } from './icons/LoaderIcon';

interface CameraViewProps {
    onClose: () => void;
    onCapture: (file: File) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    throw new Error("Camera not supported by your browser.");
                }
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                         setIsLoading(false);
                    }
                }
            } catch (err: any) {
                console.error("Error accessing camera:", err);
                setError(`Camera access denied or unavailable. Please check permissions. Error: ${err.message}`);
                setIsLoading(false);
            }
        };

        startCamera();

        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "vision-capture.jpg", { type: "image/jpeg" });
                    onCapture(file);
                }
            }, 'image/jpeg');
        }
    };

    return (
        <div className="absolute inset-0 bg-base/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-layer-1 border-2 border-primary rounded-lg shadow-2xl shadow-primary/30 flex items-center justify-center">
                {isLoading && <LoaderIcon />}
                {error && <p className="text-danger p-4 text-center font-mono">{error}</p>}
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover rounded-md ${isLoading || error ? 'hidden' : 'block'}`} />
                <canvas ref={canvasRef} className="hidden" />
                 <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full bg-base/50 text-secondary hover:bg-base transition-colors">
                    <XIcon />
                </button>
            </div>
            <div className="mt-6 flex items-center space-x-6">
                <button onClick={onClose} className="px-6 py-3 bg-layer-2 border border-layer-3 rounded-lg text-sm font-bold text-secondary hover:bg-layer-3 transition-colors">
                    Cancel
                </button>
                <button onClick={handleCapture} disabled={!!error || isLoading} className="p-3 px-6 bg-primary text-black hover:scale-105 transition-transform disabled:bg-layer-3 disabled:cursor-not-allowed flex items-center space-x-2 font-bold rounded-lg" aria-label="Capture Frame" title="Capture Frame">
                    <CameraIcon />
                    <span>Capture Frame</span>
                </button>
            </div>
        </div>
    );
};

export default CameraView;