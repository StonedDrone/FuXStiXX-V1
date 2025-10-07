import React, { useRef, useEffect, useState } from 'react';
import { XIcon } from './icons/XIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { MonitorIcon } from './icons/MonitorIcon';

interface ScreenStreamViewProps {
    onClose: (reason: 'user' | 'error') => void;
}

const ScreenStreamView: React.FC<ScreenStreamViewProps> = ({ onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const startScreenShare = async () => {
            try {
                if (!navigator.mediaDevices?.getDisplayMedia) {
                    throw new Error("Screen sharing is not supported by your browser.");
                }
                streamRef.current = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false // Typically don't need audio for visual analysis
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                    videoRef.current.onloadedmetadata = () => {
                        setIsLoading(false);
                    };
                }

                // Listen for the user stopping the stream via the browser's native UI
                streamRef.current.getVideoTracks()[0].onended = () => {
                    onClose('user');
                };

            } catch (err: any) {
                console.error("Error starting screen share:", err);
                if (err.name === 'NotAllowedError') {
                     onClose('user'); // User cancelled the prompt, not really an error
                } else {
                    setError(`Failed to start screen stream: ${err.message}`);
                    setIsLoading(false);
                    onClose('error');
                }
            }
        };

        startScreenShare();

        return () => {
            streamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, [onClose]);

    const handleStopSharing = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        onClose('user');
    };

    return (
        <div className="absolute inset-0 bg-base/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-layer-1 border-2 border-primary rounded-lg shadow-2xl shadow-primary/30 flex items-center justify-center">
                {isLoading && (
                     <div className="flex flex-col items-center text-secondary">
                        <LoaderIcon />
                        <p className="mt-2 font-mono">Awaiting screen selection...</p>
                    </div>
                )}
                {error && <p className="text-danger p-4 text-center font-mono">{error}</p>}
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain rounded-md ${isLoading || error ? 'hidden' : 'block'}`} />
            </div>
            <div className="mt-6 flex flex-col items-center space-y-2">
                 <p className="text-sm font-mono text-primary flex items-center space-x-2">
                    <MonitorIcon />
                    <span>Visual feed is live. I am observing, Captain.</span>
                 </p>
                 <button onClick={handleStopSharing} disabled={!!error || isLoading} className="p-3 px-6 bg-danger text-white font-bold rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-layer-3 disabled:cursor-not-allowed">
                    Stop Sharing
                </button>
            </div>
        </div>
    );
};

export default ScreenStreamView;
