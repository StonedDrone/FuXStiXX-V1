import React, { useRef, useEffect, useState, useCallback } from 'react';
import { XIcon } from './icons/XIcon';
import { CameraIcon } from './icons/CameraIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { SwitchCameraIcon } from './icons/SwitchCameraIcon';

interface CameraViewProps {
    onClose: () => void;
    onCapture: (file: File) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [currentDeviceId, setCurrentDeviceId] = useState<string | undefined>(undefined);

    // This effect runs once to get available devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                if (!navigator.mediaDevices?.enumerateDevices) {
                     throw new Error("Camera enumeration is not supported by your browser.");
                }
                // We need to request permission first to get device labels
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Stop the temporary stream immediately after getting permission
                tempStream.getTracks().forEach(track => track.stop());

                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
                
                if (videoDevices.length === 0) {
                    throw new Error("No video input devices found.");
                }

                setDevices(videoDevices);
                // Try to find a back camera first ('environment'), otherwise use the first one
                const backCamera = videoDevices.find(device => device.label.toLowerCase().includes('back'));
                setCurrentDeviceId(backCamera ? backCamera.deviceId : videoDevices[0].deviceId);

            } catch (err: any) {
                 console.error("Error enumerating devices:", err);
                 setError(`Camera access denied or unavailable. Please check permissions. Error: ${err.message}`);
                 setIsLoading(false);
            }
        };

        getDevices();
    }, []);

    // This effect runs whenever the selected device changes
    useEffect(() => {
        if (!currentDeviceId) return;

        // Stop previous stream if it exists
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        setIsLoading(true);
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: currentDeviceId } }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                         setIsLoading(false);
                         setError(null);
                    }
                }
            } catch (err: any) {
                console.error("Error starting camera with new device:", err);
                setError(`Failed to switch camera. Error: ${err.message}`);
                setIsLoading(false);
            }
        };

        startCamera();

        // Cleanup on component unmount
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [currentDeviceId]);

    const handleSwitchCamera = useCallback(() => {
        if (devices.length < 2) return;
        const currentIndex = devices.findIndex(device => device.deviceId === currentDeviceId);
        const nextIndex = (currentIndex + 1) % devices.length;
        setCurrentDeviceId(devices[nextIndex].deviceId);
    }, [devices, currentDeviceId]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            // Flip the image horizontally if it's a user-facing camera
            const isFrontFacing = devices.find(d => d.deviceId === currentDeviceId)?.label.toLowerCase().includes('front');
            if(isFrontFacing) {
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "vision-capture.jpg", { type: "image/jpeg" });
                    onCapture(file);
                }
            }, 'image/jpeg');
        }
    };
    
    // Mirror the video feed if it's likely a front-facing camera for a more intuitive user experience
    const isFrontFacing = devices.find(d => d.deviceId === currentDeviceId)?.label.toLowerCase().includes('front');
    const videoTransformClass = isFrontFacing ? 'transform -scale-x-100' : '';

    return (
        <div className="absolute inset-0 bg-base/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-layer-1 border-2 border-primary rounded-lg shadow-2xl shadow-primary/30 flex items-center justify-center overflow-hidden">
                {isLoading && <LoaderIcon />}
                {error && <p className="text-danger p-4 text-center font-mono">{error}</p>}
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${videoTransformClass} ${isLoading || error ? 'hidden' : 'block'}`} />
                <canvas ref={canvasRef} className="hidden" />
                 <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full bg-base/50 text-secondary hover:bg-base transition-colors z-10">
                    <XIcon />
                </button>
            </div>
            <div className="mt-6 flex items-center space-x-6">
                 {devices.length > 1 && (
                     <button onClick={handleSwitchCamera} disabled={isLoading} className="p-4 rounded-full bg-layer-3 text-secondary hover:bg-layer-2 transition-colors disabled:opacity-50" aria-label="Switch Camera" title="Switch Camera">
                         <SwitchCameraIcon />
                     </button>
                 )}
                <button onClick={handleCapture} disabled={!!error || isLoading} className="p-6 rounded-full bg-primary text-black hover:scale-105 transition-transform disabled:bg-layer-3 disabled:cursor-not-allowed" aria-label="Capture Frame" title="Capture Frame">
                    <CameraIcon />
                </button>
            </div>
        </div>
    );
};

export default CameraView;
