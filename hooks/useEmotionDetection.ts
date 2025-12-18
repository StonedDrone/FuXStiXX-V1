import { useState, useRef, useCallback, useEffect } from 'react';
import { Emotion } from '../types';

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
    const [isSyncing, setIsSyncing] = useState(false);

    const humanRef = useRef<any | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameId = useRef<number | null>(null);

    const detectionLoop = useCallback(async () => {
        if (!isDetecting || !humanRef.current || !videoRef.current) return;

        try {
            const result = await humanRef.current.detect(videoRef.current);
            if (result.face && result.face.length > 0) {
                setIsSyncing(true);
                const face = result.face[0];
                if (face.emotion && face.emotion.length > 0) {
                    // Sort to find the highest score emotion robustly
                    const sortedEmotions = [...face.emotion].sort((a, b) => b.score - a.score);
                    setCurrentEmotion(sortedEmotions[0]);
                }
            } else {
                 setIsSyncing(false);
                 setCurrentEmotion(null);
            }
        } catch (e) {
            console.error("Error in detection loop:", e);
            setError("Bio-signal decoding interrupted.");
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
        setIsSyncing(false);
        setCurrentEmotion(null);
        console.log("Bio-signal decoding stopped.");
    }, []);

    const startDetection = useCallback(async () => {
        if (isDetecting || isInitializing) return;

        console.log("Initializing Bio-Signal Decoder...");
        setIsInitializing(true);
        setError(null);
        setCurrentEmotion(null);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Optical link not supported by this vessel.");
            }
            streamRef.current = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 640 }, height: { ideal: 480 } } 
            });

            if (!videoRef.current) {
                videoRef.current = document.createElement('video');
                videoRef.current.style.display = 'none';
                document.body.appendChild(videoRef.current);
            }
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play();

            if (!humanRef.current) {
                const HumanClass = (window as any).Human?.Human || (window as any).Human;
                if (typeof HumanClass !== 'function') {
                    throw new Error("Bio-decoder core libraries not found.");
                }
                humanRef.current = new HumanClass(humanConfig);
                await humanRef.current.load();
                console.log("Bio-decoder core loaded.");
            }
            
            setIsDetecting(true);
            setIsInitializing(false);
            console.log("Bio-signal decoding engaged.");
            
            animationFrameId.current = requestAnimationFrame(detectionLoop);

        } catch (err) {
            console.error("Failed to engage bio-decoder:", err);
            let message = "Optical link access denied.";
            if (err instanceof Error) {
                message = err.message;
            }
            setError(message);
            setIsInitializing(false);
            stopDetection();
        }
    }, [isDetecting, isInitializing, detectionLoop, stopDetection]);
    
    useEffect(() => {
        return () => {
            stopDetection();
            if(videoRef.current && videoRef.current.parentNode) {
                 document.body.removeChild(videoRef.current);
                 videoRef.current = null;
            }
        }
    }, [stopDetection]);

    return { isDetecting, isInitializing, isSyncing, currentEmotion, error, startDetection, stopDetection };
};