
import { useState, useRef, useCallback, useEffect } from 'react';
import { Emotion } from '../types';

// The 'Human' class is globally available from the script tag in index.html
declare const Human: any;

type HumanError = {
    error: string;
};

// Configuration for the Human library
const humanConfig = {
  backend: 'humangl' as const,
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: {
    enabled: true,
    detector: { enabled: true, rotation: true },
    mesh: { enabled: true },
    iris: { enabled: true },
    emotion: { enabled: true },
    description: { enabled: true },
  },
  body: { enabled: false },
  hand: { enabled: false },
};

export const useEmotionDetection = () => {
    const [isDetecting, setIsDetecting] = useState(false);
    const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);

    const humanRef = useRef<any | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);

    const detectionLoop = useCallback(async () => {
        if (!isDetecting || !humanRef.current || !videoRef.current) return;

        try {
            const result = await humanRef.current.detect(videoRef.current);
            if (result.face && result.face.length > 0) {
                const face = result.face[0];
                if (face.emotion && face.emotion.length > 0) {
                    const dominantEmotion = face.emotion.reduce((prev: Emotion, current: Emotion) => 
                        (prev.score > current.score) ? prev : current
                    );
                    setCurrentEmotion(dominantEmotion);
                }
            } else {
                 setCurrentEmotion(null);
            }
        } catch (e) {
            console.error("Error in detection loop:", e);
            setError("An error occurred during emotion analysis.");
        } finally {
            animationFrameId.current = requestAnimationFrame(detectionLoop);
        }
    }, [isDetecting]);

    const stopDetection = useCallback(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsDetecting(false);
        setCurrentEmotion(null);
        console.log("Emotion detection stopped.");
    }, []);

    const startDetection = useCallback(async () => {
        if (isDetecting || isInitializing) return;

        console.log("Initializing emotion detection...");
        setIsInitializing(true);
        setError(null);
        setCurrentEmotion(null);

        try {
            // Get camera stream FIRST to ensure availability before loading the library.
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Camera not supported by your browser.");
            }
            streamRef.current = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 640 }, height: { ideal: 480 } } 
            });

            // Set up hidden video element now that we have the stream.
            if (!videoRef.current) {
                videoRef.current = document.createElement('video');
                videoRef.current.style.display = 'none';
                document.body.appendChild(videoRef.current);
            }
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play();

            // Initialize Human library now that the video stream is active.
            if (!humanRef.current) {
                humanRef.current = new Human(humanConfig);
                await humanRef.current.load();
                console.log("Human library loaded.");
            }
            
            setIsDetecting(true);
            setIsInitializing(false);
            console.log("Emotion detection started.");
            
            // Start the detection loop
            animationFrameId.current = requestAnimationFrame(detectionLoop);

        } catch (err) {
            // FIX: Replaced unsafe type casting with a robust error handling block that
            // correctly checks for different error types (standard Error vs. Human library's custom error object)
            // to prevent type assertion errors and provide a more accurate error message.
            console.error("Failed to start emotion detection:", err);
            let message = "Camera access denied or unavailable.";
            if (err instanceof Error) {
                message = err.message;
            } else if (err && typeof err === 'object' && 'error' in err && typeof (err as any).error === 'string') {
                message = (err as HumanError).error;
            }
            setError(message);
            setIsInitializing(false);
            stopDetection();
        }
    }, [isDetecting, isInitializing, detectionLoop, stopDetection]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopDetection();
            if(videoRef.current) {
                 document.body.removeChild(videoRef.current);
                 videoRef.current = null;
            }
        }
    }, [stopDetection]);

    return { isDetecting, isInitializing, currentEmotion, error, startDetection, stopDetection };
};
