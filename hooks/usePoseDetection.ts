
import { useState, useRef, useCallback, useEffect } from 'react';
import { Pose } from '../types';

declare const Human: any;

type HumanError = {
    error: string;
};

// Configuration for the Human library, specifically for pose detection
const humanConfig = {
  backend: 'humangl' as const,
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: { enabled: false }, // Disable face to conserve resources
  body: { enabled: true, modelPath: 'posenet.json' },
  hand: { enabled: false }, // Hand detection is resource intensive
  filter: { enabled: true, equalization: false },
};

// Simple gesture interpretation logic
const interpretPose = (bodyResult: any): Pose | null => {
    if (!bodyResult || bodyResult.length === 0 || !bodyResult[0].keypoints) return null;

    const keypoints = bodyResult[0].keypoints;
    const getPoint = (part: string) => keypoints.find((p: any) => p.part === part);

    const leftShoulder = getPoint('leftShoulder');
    const rightShoulder = getPoint('rightShoulder');
    const leftWrist = getPoint('leftWrist');
    const rightWrist = getPoint('rightWrist');

    if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist) return null;

    const leftHandRaised = leftWrist.position[1] < leftShoulder.position[1];
    const rightHandRaised = rightWrist.position[1] < rightShoulder.position[1];

    if (leftHandRaised && rightHandRaised) {
        return { name: 'both hands raised', score: Math.min(leftWrist.score, rightWrist.score) };
    }
    if (rightHandRaised) {
        return { name: 'right hand raised', score: rightWrist.score };
    }
    if (leftHandRaised) {
        return { name: 'left hand raised', score: leftWrist.score };
    }

    return null; // No specific gesture detected
};

export const usePoseDetection = () => {
    const [isDetecting, setIsDetecting] = useState(false);
    const [currentPose, setCurrentPose] = useState<Pose | null>(null);
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
            const detectedPose = interpretPose(result.body);
            setCurrentPose(detectedPose);
        } catch (e) {
            console.error("Error in pose detection loop:", e);
            setError("An error occurred during pose analysis.");
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
        setCurrentPose(null);
        console.log("Pose detection stopped.");
    }, []);

    const startDetection = useCallback(async () => {
        if (isDetecting || isInitializing) return;

        console.log("Initializing pose detection...");
        setIsInitializing(true);
        setError(null);
        setCurrentPose(null);

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
                console.log("Human library loaded for pose detection.");
            }
            
            setIsDetecting(true);
            setIsInitializing(false);
            console.log("Pose detection started.");
            
            animationFrameId.current = requestAnimationFrame(detectionLoop);

        } catch (err) {
            console.error("Failed to start pose detection:", err);
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
    
    useEffect(() => {
        return () => {
            stopDetection();
            if(videoRef.current) {
                 document.body.removeChild(videoRef.current);
                 videoRef.current = null;
            }
        }
    }, [stopDetection]);

    return { isDetecting, isInitializing, currentPose, error, startDetection, stopDetection };
};
