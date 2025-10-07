



import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { GoogleGenAI, Blob, LiveServerMessage, Modality } from "@google/genai";
import { Message, Attachment, ActiveModel, DAG, LiveStreamState, HexDumpData } from '../types';
import { CHECK_IN_PROMPT } from '../constants';
import { sendMessageToAI, generateImageFromAI, generateVideoFromAI, generateAudioFromAI, resetChat, transcribeAudio, generateVRSceneFromAI, editImageFromAI, synthesizeNeRFFromImages, generateCreativeCodeFromAI, generateUIMockupFromAI, generateMotionFXFromAI, generateAlgorithmVisualizationFromAI, generateUserSimulationFromAI, generateIconFromAI, performDensePoseAnalysis, generate3DModelFromImage, generateGaussianDreamFromText, analyzePlaylistFromAI } from '../services/geminiService';
import * as hfService from '../services/huggingFaceService';
import * as lmStudioService from '../services/lmStudioService';
import * as financialService from '../services/financialService';
import * as workflowService from '../services/workflowService';
import * as streamingService from '../services/streamingService';
import * as knowledgeService from '../services/knowledgeService';
import * as analysisService from '../services/analysisService';
import * as liveSyncService from '../services/liveSyncService';
import * as vectorDroneService from '../services/vectorDroneService';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { CameraIcon } from './icons/CameraIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { AttachmentIcon } from './icons/AttachmentIcons';
import { useUIState, Theme } from '../contexts/UIStateContext';
import { ZapIcon } from './icons/ZapIcon';
import { PowersDropdown } from './PowersDropdown';
import { HuggingFaceIcon } from './icons/HuggingFaceIcon';
import { LMStudioIcon } from './icons/LMStudioIcon';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import CameraView from './CameraView';
import ObjectDetectionView from './ObjectDetectionView';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { usePoseDetection } from '../hooks/usePoseDetection';
import { FaceSmileIcon } from './icons/FaceSmileIcon';
import { PersonStandingIcon } from './icons/PersonStandingIcon';
import { ScanIcon } from './icons/ScanIcon';
import WorkflowStatus from './WorkflowStatus';
import LiveStreamStatus from './LiveStreamStatus';
import ScreenStreamView from './ScreenStreamView';
import LiveSyncStatus from './LiveSyncStatus';

// --- Audio Utility Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Audio Utility Functions ---

type LiveStatus = 'idle' | 'connecting' | 'active' | 'error';
type LiveTranscripts = { user: string; ai: string; };

export interface ChatInterfaceHandle {
  clearChat: () => void;
}

interface ChatInterfaceProps {
    activeModel: ActiveModel;
    setActiveModel: (model: ActiveModel) => void;
    isTfReady: boolean;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({ activeModel, setActiveModel, isTfReady }, ref) => {
  const initialMessage: Message = {
      id: 'init',
      text: 'FuXStiXX online. I am your co-pilot, Captain. Ready to progress the Mission. How may I assist?',
      sender: 'ai',
  };

  const [messages, setMessages] = useState<Message[]>(() => {
      try {
        const savedMessages = localStorage.getItem('fuxstixx-chat-history');
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
        return [initialMessage];
      } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        return [initialMessage];
      }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPowersOpen, setIsPowersOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
  const [liveTranscripts, setLiveTranscripts] = useState<LiveTranscripts>({ user: '', ai: '' });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanViewOpen, setIsScanViewOpen] = useState(false);
  const [isScreenStreamOpen, setIsScreenStreamOpen] = useState(false);
  const [dags, setDags] = useState<DAG[]>([]);
  const [liveStreamState, setLiveStreamState] = useState<LiveStreamState>({ source: null, status: 'idle' });
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(false);

  const { setTheme } = useUIState();
  const { 
    isDetecting: isEmotionDetecting, 
    currentEmotion, 
    error: emotionError, 
    startDetection: startEmotionDetection, 
    stopDetection: stopEmotionDetection,
    isInitializing: isEmotionSensorInitializing
  } = useEmotionDetection();
  const { 
    isDetecting: isPoseDetecting, 
    currentPose, 
    error: poseError, 
    startDetection: startPoseDetection, 
    stopDetection: stopPoseDetection,
    isInitializing: isPoseSensorInitializing
  } = usePoseDetection();


  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const powersButtonRef = useRef<HTMLButtonElement>(null);
  const powersDropdownRef = useRef<HTMLDivElement>(null);
  const sendAfterCaptureRef = useRef(false);
  const sendAfterScanRef = useRef(false);
  
  // Refs for live conversation resources
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioResourcesRef = useRef<{
    inputAudioContext: AudioContext;
    outputAudioContext: AudioContext;
    stream: MediaStream;
    scriptProcessor: ScriptProcessorNode;
    sources: Set<AudioBufferSourceNode>;
    nextStartTime: number;
  } | null>(null);
  const liveTranscriptsRef = useRef({ userInput: '', aiOutput: '' });

  useImperativeHandle(ref, () => ({
    clearChat: () => {
      setMessages([initialMessage]);
      resetChat();
    }
  }));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('fuxstixx-chat-history', JSON.stringify(messages));
  }, [messages]);
  
    useEffect(() => {
    // Initialize the workflow service scheduler
    workflowService.initializeScheduler(setDags);
    // Initial load
    setDags(workflowService.getDags());
    
    // Set up a periodic check to update the UI, e.g., every 5 seconds
    const intervalId = setInterval(() => {
      setDags(workflowService.getDags());
    }, 5000);

    return () => {
        clearInterval(intervalId);
        // We might want a way to stop the scheduler if the component unmounts
        // workflowService.stopScheduler(); 
    };
  }, []);


  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
        setVoices(englishVoices);
    };

    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }

    return () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();
        }
        // Ensure live conversation is stopped on unmount
        if (liveStatus !== 'idle') {
            stopLiveConversation();
        }
        // Ensure intel stream is stopped on unmount
        streamingService.stop();
        liveSyncService.stop();
    };
  }, []);
  
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPowersOpen &&
        powersButtonRef.current &&
        !powersButtonRef.current.contains(event.target as Node) &&
        powersDropdownRef.current &&
        !powersDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPowersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPowersOpen]);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || text.trim() === '') {
        return;
    }
    
    const cleanedText = text
        .replace(/```[\s\S]*?```/g, 'Code block follows.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\[.*?\]\(.*?\)/g, (match) => match.split('](')[0].substring(1))
        .replace(/#+\s/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    const fuxstixxVoice = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang === 'en-US') || voices[0];
    if (fuxstixxVoice) {
        utterance.voice = fuxstixxVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stopLiveConversation = useCallback(async () => {
    console.log('Stopping live conversation...');
    if (liveSessionPromiseRef.current) {
        try {
            const session = await liveSessionPromiseRef.current;
            session.close();
        } catch (e) {
            console.error('Error closing live session:', e);
        }
        liveSessionPromiseRef.current = null;
    }

    if (audioResourcesRef.current) {
        audioResourcesRef.current.stream?.getTracks().forEach(track => track.stop());
        audioResourcesRef.current.scriptProcessor?.disconnect();
        audioResourcesRef.current.inputAudioContext?.close();
        
        for (const source of audioResourcesRef.current.sources.values()) {
            source.stop();
        }
        audioResourcesRef.current.sources.clear();
        audioResourcesRef.current.outputAudioContext?.close();
        audioResourcesRef.current = null;
    }
    
    setLiveStatus('idle');
    setLiveTranscripts({ user: '', ai: '' });
    liveTranscriptsRef.current = { userInput: '', aiOutput: '' };
  }, []);

  const startLiveConversation = useCallback(async () => {
    setLiveStatus('connecting');
    liveTranscriptsRef.current = { userInput: '', aiOutput: '' };

    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
      const sources = new Set<AudioBufferSourceNode>();
      let nextStartTime = 0;

      audioResourcesRef.current = { stream, inputAudioContext, outputAudioContext, scriptProcessor, sources, nextStartTime };
      
      liveSessionPromiseRef.current = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
              onopen: () => {
                  setLiveStatus('active');
                  const source = inputAudioContext.createMediaStreamSource(stream);
                  scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                      const pcmBlob = createBlob(inputData);
                      liveSessionPromiseRef.current?.then((session) => {
                          session.sendRealtimeInput({ media: pcmBlob });
                      });
                  };
                  source.connect(scriptProcessor);
                  scriptProcessor.connect(inputAudioContext.destination);
              },
              onmessage: async (message: LiveServerMessage) => {
                  if (message.serverContent?.inputTranscription) {
                      const text = message.serverContent.inputTranscription.text;
                      liveTranscriptsRef.current.userInput += text;
                      setLiveTranscripts(prev => ({...prev, user: liveTranscriptsRef.current.userInput}));
                  }
                   if (message.serverContent?.outputTranscription) {
                      const text = message.serverContent.outputTranscription.text;
                      liveTranscriptsRef.current.aiOutput += text;
                      setLiveTranscripts(prev => ({...prev, ai: liveTranscriptsRef.current.aiOutput}));
                  }
                  if (message.serverContent?.turnComplete) {
                      const userMsg = liveTranscriptsRef.current.userInput.trim();
                      const aiMsg = liveTranscriptsRef.current.aiOutput.trim();

                      if (userMsg) {
                          setMessages(prev => [...prev, {id: Date.now().toString(), text: userMsg, sender: 'user'}]);
                      }
                      if (aiMsg) {
                          setMessages(prev => [...prev, {id: (Date.now() + 1).toString(), text: aiMsg, sender: 'ai'}]);
                      }

                      liveTranscriptsRef.current = { userInput: '', aiOutput: '' };
                      setLiveTranscripts({user: '', ai: ''});
                  }

                  const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                  if (base64EncodedAudioString && audioResourcesRef.current) {
                      let res = audioResourcesRef.current;
                      res.nextStartTime = Math.max(res.nextStartTime, res.outputAudioContext.currentTime);
                      const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), res.outputAudioContext, 24000, 1);
                      const source = res.outputAudioContext.createBufferSource();
                      source.buffer = audioBuffer;
                      source.connect(res.outputAudioContext.destination);
                      source.addEventListener('ended', () => { res.sources.delete(source); });
                      source.start(res.nextStartTime);
                      res.nextStartTime += audioBuffer.duration;
                      res.sources.add(source);
                  }

                  if (message.serverContent?.interrupted && audioResourcesRef.current) {
                      for (const source of audioResourcesRef.current.sources.values()) {
                          source.stop();
                          audioResourcesRef.current.sources.delete(source);
                      }
                      audioResourcesRef.current.nextStartTime = 0;
                  }
              },
              onerror: (e: ErrorEvent) => {
                  console.error('Live session error:', e);
                  setMessages(prev => [...prev, {id: Date.now().toString(), text: "Live conversation encountered an error.", sender: 'ai'}]);
                  setLiveStatus('error');
                  stopLiveConversation();
              },
              onclose: (e: CloseEvent) => {
                  console.log('Live session closed.');
                  stopLiveConversation();
              },
          },
          config: {
              responseModalities: [Modality.AUDIO],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
              },
          },
      });

    } catch (error) {
        console.error('Failed to start live conversation:', error);
        setMessages(prev => [...prev, {id: Date.now().toString(), text: "Could not start live conversation. Please check microphone permissions.", sender: 'ai'}]);
        setLiveStatus('error');
        stopLiveConversation();
    }
  }, [stopLiveConversation]);

  const handleToggleLive = () => {
      if (liveStatus === 'idle' || liveStatus === 'error') {
          startLiveConversation();
      } else {
          stopLiveConversation();
      }
  };

  const handlePowerClick = useCallback((prompt: string) => {
    setInput(prompt);
    // Using a power resets the active model to FuXStiXX for consistency
    setActiveModel({ type: 'gemini', modelId: 'gemini-2.5-flash' });
    textAreaRef.current?.focus();
  }, [setActiveModel]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
  };

   const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const parseCommand = (commandString: string): { command: string, params: Record<string, string> } => {
    const parts = commandString.split('|').map(p => p.trim());
    const command = parts[0];
    const params: Record<string, string> = {};
    parts.slice(1).forEach(part => {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            params[key.trim().toLowerCase()] = valueParts.join(':').trim();
        }
    });
    return { command, params };
  };
  
  const generateHexDump = async (file: File, bytesToShow: number = 256): Promise<HexDumpData> => {
    const buffer = await file.arrayBuffer();
    const view = new Uint8Array(buffer.slice(0, bytesToShow));
    let hex = '';
    let ascii = '';
    for (let i = 0; i < view.length; i++) {
        if (i > 0 && i % 16 === 0) {
            hex += '\n';
            ascii += '\n';
        }
        const byte = view[i];
        hex += byte.toString(16).padStart(2, '0').toUpperCase() + ' ';
        ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
    }
    return { fileName: file.name, hex: hex.trim(), ascii: ascii.trim() };
  };

  const handleSend = useCallback(async () => {
    const userMessageText = input;
    if ((!userMessageText.trim() && attachments.length === 0) || isLoading || !isOnline) return;

    const imagePromptPrefix = "Generate an image of: ";
    const imageAlchemyPrefix = "Image Alchemy |";
    const videoPromptPrefix = "Generate a video of: ";
    const audioPromptPrefix = "Generate music of: ";
    const iconForgePrefix = "Icon Forge |";
    const vrScenePromptPrefix = "Generate a VR scene of: ";
    const creativeCodePromptPrefix = "Generate a creative code sketch of: ";
    const uiMockupPromptPrefix = "Generate a UI mockup for: ";
    const motionFXPromptPrefix = "Generate a motion effect for: ";
    const algoVisPromptPrefix = "Visualize algorithm: ";
    const userSimPromptPrefix = "Simulate user journey for: ";
    const devRoadmapPromptPrefix = "Generate a dev roadmap for: ";
    const realityForgePrefix = "Reality Forge";
    const magic3DPrefix = "3D Magic";
    const gaussianDreamPrefix = "Gaussian Dream |";
    const transcribeAudioPrefix = "Transcribe Audio";
    const ghostCodePrefix = "Ghost Code |";
    const financialPrefixes = ["Market Pulse |", "Sector Intel |", "Crypto Scan |", "Alpha Signal |"];
    const analysisPrefixes = ["Neural Cartography |", "Visualize algorithm: ", "Simulate user journey for: ", "Design Deconstruction |", "Binary Scan", "Dense Scan", "Playlist Analysis |"];
    const automationPrefixes = ["Define DAG |", "Trigger DAG |", "DAG Status", "Clear All DAGs"];
    const streamingPrefixes = ["Live Intel Stream |", "Stop Intel Stream", "Screen Stream", "Engage Live Sync", "Disengage Live Sync"];
    const knowledgePrefixes = ["Index Source |", "Query Intel Base |", "Intel Base Status", "Purge Intel Base"];
    const vectorDronePrefixes = ["Vector Status", "Vector Roam |", "Vector Say |"];

    const messageAttachments: Attachment[] = attachments.map(file => ({ name: file.name, type: file.type }));
    const userMessage: Message = { id: Date.now().toString(), text: userMessageText, sender: 'user', attachments: messageAttachments };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const aiResponseId = (Date.now() + 1).toString();
    
    try {
      if (activeModel.type === 'lmstudio') {
          if (!activeModel.baseURL) throw new Error("LM Studio base URL is not configured.");
          setMessages((prev) => [...prev, { id: aiResponseId, text: '', sender: 'ai', status: 'generating' }]);
          const stream = lmStudioService.sendMessageStream(activeModel.baseURL, activeModel.modelId, messages, userMessageText);
          
          let fullResponse = '';
          for await (const chunk of stream) {
            fullResponse += chunk;
            setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: fullResponse } : msg));
          }
          if (isVoiceEnabled) speakText(fullResponse);
          setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: fullResponse, status: 'complete' } : msg));

      } else if (userMessageText.startsWith("HF ")) {
          await handleHuggingFaceCommand(userMessageText);

      } else if (financialPrefixes.some(prefix => userMessageText.startsWith(prefix))) {
          await handleFinancialCommand(userMessageText);
      
      } else if (analysisPrefixes.some(prefix => userMessageText.startsWith(prefix)) && !userMessageText.startsWith(devRoadmapPromptPrefix)) {
            await handleAnalysisCommand(userMessage);
            
      } else if (automationPrefixes.some(prefix => userMessageText.startsWith(prefix))) {
            await handleAutomationCommand(userMessageText);

      } else if (streamingPrefixes.some(prefix => userMessageText.startsWith(prefix))) {
            await handleStreamingCommand(userMessageText);
      
      } else if (knowledgePrefixes.some(prefix => userMessageText.startsWith(prefix))) {
            await handleKnowledgeCommand(userMessage);

      } else if (vectorDronePrefixes.some(prefix => userMessageText.startsWith(prefix))) {
            await handleVectorDroneCommand(userMessageText);

      } else if (userMessageText.startsWith(transcribeAudioPrefix)) {
          if (attachments.length === 0 || !attachments[0].type.startsWith('audio/')) {
              throw new Error("Please attach an audio file to use the Transcribe Audio power.");
          }
          const audioFile = attachments[0];
          setMessages(prev => [...prev, { id: aiResponseId, text: `Processing audio signal from \`${audioFile.name}\`...`, sender: 'ai' }]);
          const transcription = await transcribeAudio(audioFile);
          if (isVoiceEnabled) speakText("Transcription complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Transcription complete, Captain.", transcriptionData: { fileName: audioFile.name, transcription } } : m));
      
      } else if (userMessageText.startsWith(gaussianDreamPrefix)) {
            const { params } = parseCommand(userMessageText);
            if (!params.prompt) throw new Error("Missing 'prompt' parameter for Gaussian Dream.");
            setMessages(prev => [...prev, { id: aiResponseId, text: "Dreaming with Gaussian Splats...", sender: 'ai', media: { type: 'gaussianDream', prompt: params.prompt, status: 'generating', progress: 0 } }]);
            
            const onProgress = (progress: number, status: string) => {
                setMessages(prev => prev.map(m => 
                    (m.id === aiResponseId && m.media)
                    ? { ...m, text: status, media: { ...m.media, progress } } 
                    : m
                ));
            };

            const modelScene = await generateGaussianDreamFromText(params.prompt, onProgress);
            if (isVoiceEnabled) speakText("Gaussian Dream synthesis complete.");
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Gaussian Dream synthesis complete.", media: { ...m.media, status: 'complete', content: modelScene } } : m));
      
      } else if (userMessageText.startsWith(imageAlchemyPrefix)) {
          if (attachments.length === 0 || !attachments[0].type.startsWith('image/')) {
              throw new Error("Please attach an image file to use the Image Alchemy power.");
          }
          const { params } = parseCommand(userMessageText);
          if (!params.prompt) throw new Error("Missing 'prompt' parameter for Image Alchemy.");
          const imageFile = attachments[0];
          setMessages(prev => [...prev, { id: aiResponseId, text: "Performing Image Alchemy...", sender: 'ai', media: { type: 'image', prompt: params.prompt, status: 'generating' } }]);
          const base64Image = await fileToBase64(imageFile);
          const imageUrl = await editImageFromAI(params.prompt, base64Image, imageFile.type);
          if (isVoiceEnabled) speakText("Image Alchemy complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Image Alchemy complete.", media: { type: 'image', prompt: params.prompt, status: 'complete', url: imageUrl } } : m));

      } else if (userMessageText.startsWith(imagePromptPrefix)) {
          const content = userMessageText.substring(imagePromptPrefix.length);
          const parts = content.split('|').map(p => p.trim());
          const prompt = parts[0];
          let aspectRatio = '1:1';
          if (parts.length > 1 && parts[1].toLowerCase().startsWith('aspectratio:')) {
              aspectRatio = parts[1].substring('aspectratio:'.length).trim();
          }
          setMessages(prev => [...prev, { id: aiResponseId, text: "Forging image...", sender: 'ai', media: { type: 'image', prompt: content, status: 'generating' } }]);
          const imageUrl = await generateImageFromAI(prompt, aspectRatio);
          if (isVoiceEnabled) speakText("Image generation complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Image generation complete.", media: { type: 'image', prompt: content, status: 'complete', url: imageUrl } } : m));

      } else if (userMessageText.startsWith(videoPromptPrefix)) {
          const prompt = userMessageText.substring(videoPromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Synthesizing video...", sender: 'ai', media: { type: 'video', prompt, status: 'generating' } }]);
          const videoUrl = await generateVideoFromAI(prompt);
          if (isVoiceEnabled) speakText("Video synthesis complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Video synthesis complete.", media: { type: 'video', prompt, status: 'complete', url: videoUrl } } : m));

      } else if (userMessageText.startsWith(audioPromptPrefix)) {
          const prompt = userMessageText.substring(audioPromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Synthesizing audio...", sender: 'ai', media: { type: 'audio', prompt, status: 'generating' } }]);
          const audioUrl = await generateAudioFromAI(prompt);
          if (isVoiceEnabled) speakText("Sonic synthesis complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Sonic synthesis complete.", media: { type: 'audio', prompt, status: 'complete', url: audioUrl } } : m));
      
      } else if (userMessageText.startsWith(iconForgePrefix)) {
          const { params } = parseCommand(userMessageText);
          if (!params.brand) throw new Error("Missing 'brand' parameter for Icon Forge.");
          setMessages(prev => [...prev, { id: aiResponseId, text: `Forging icon for ${params.brand}...`, sender: 'ai', media: { type: 'icon', prompt: params.brand, status: 'generating' } }]);
          const iconSvg = await generateIconFromAI(params.brand);
          if (isVoiceEnabled) speakText("Icon forged.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: `Icon for ${params.brand} forged.`, media: { type: 'icon', prompt: params.brand, status: 'complete', content: iconSvg } } : m));

      } else if (userMessageText.startsWith(vrScenePromptPrefix)) {
          const prompt = userMessageText.substring(vrScenePromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Forging VR scene...", sender: 'ai', media: { type: 'vr', prompt, status: 'generating' } }]);
          const sceneHtml = await generateVRSceneFromAI(prompt);
          if (isVoiceEnabled) speakText("VR scene generation complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "VR scene generation complete.", media: { type: 'vr', prompt, status: 'complete', content: sceneHtml } } : m));
      
      } else if (userMessageText.startsWith(creativeCodePromptPrefix)) {
          const prompt = userMessageText.substring(creativeCodePromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Writing creative code...", sender: 'ai', media: { type: 'creativeCode', prompt, status: 'generating' } }]);
          const sketchJs = await generateCreativeCodeFromAI(prompt);
          if (isVoiceEnabled) speakText("Creative coding sketch complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Creative coding sketch complete.", media: { type: 'creativeCode', prompt, status: 'complete', content: sketchJs } } : m));

      } else if (userMessageText.startsWith(uiMockupPromptPrefix)) {
          const prompt = userMessageText.substring(uiMockupPromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Forging UI mockup...", sender: 'ai', media: { type: 'uiMockup', prompt, status: 'generating' } }]);
          const mockupHtml = await generateUIMockupFromAI(prompt);
          if (isVoiceEnabled) speakText("UI mockup generation complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "UI mockup generation complete.", media: { type: 'uiMockup', prompt, status: 'complete', content: mockupHtml } } : m));

      } else if (userMessageText.startsWith(motionFXPromptPrefix)) {
          const prompt = userMessageText.substring(motionFXPromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Crafting motion effect...", sender: 'ai', media: { type: 'motionFx', prompt, status: 'generating' } }]);
          const fxHtml = await generateMotionFXFromAI(prompt);
          if (isVoiceEnabled) speakText("Motion effect generated.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Motion effect generated.", media: { type: 'motionFx', prompt, status: 'complete', content: fxHtml } } : m));

      } else if (userMessageText.startsWith(realityForgePrefix)) {
          if (attachments.length < 2) {
              throw new Error("Reality Forge requires at least 2 images from different angles, Captain.");
          }
          setMessages(prev => [...prev, { id: aiResponseId, text: "Synthesizing 3D reality from visual data...", sender: 'ai', media: { type: 'vr', prompt: userMessageText, status: 'generating' } }]);
          const sceneHtml = await synthesizeNeRFFromImages(attachments);
          if (isVoiceEnabled) speakText("Reality Forge synthesis complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Reality Forge synthesis complete.", media: { type: 'vr', prompt: userMessageText, status: 'complete', content: sceneHtml } } : m));
      
      } else if (userMessageText.startsWith(magic3DPrefix)) {
          if (attachments.length === 0 || !attachments[0].type.startsWith('image/')) {
              throw new Error("3D Magic requires a single attached image, Captain.");
          }
          const imageFile = attachments[0];
          setMessages(prev => [...prev, { id: aiResponseId, text: "Initiating 3D synthesis...", sender: 'ai', media: { type: 'magic3d', prompt: userMessageText, status: 'generating', progress: 0 } }]);
          
          const onProgress = (progress: number) => {
              setMessages(prev => prev.map(m => 
                  (m.id === aiResponseId && m.media)
                  ? { ...m, media: { ...m.media, progress } } 
                  : m
              ));
          };

          const modelScene = await generate3DModelFromImage(imageFile, onProgress);
          if (isVoiceEnabled) speakText("3D model synthesis complete.");
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "3D model synthesis complete.", media: { ...m.media, status: 'complete', content: modelScene } } : m));

      } else {
        const parts: any[] = [];
        let generationPrompt = userMessageText.trim();
        
        const contextParts: string[] = [];
        if (isEmotionDetecting && currentEmotion?.emotion) {
            contextParts.push(`Captain seems ${currentEmotion.emotion}`);
        }
        if (isPoseDetecting && currentPose?.name) {
            contextParts.push(`Captain's gesture: ${currentPose.name}`);
        }

        if (contextParts.length > 0) {
            generationPrompt = `(${contextParts.join(', ')}) ${generationPrompt}`;
        }

        if (userMessageText.trim().startsWith(ghostCodePrefix)) {
            const { params } = parseCommand(userMessageText);
            if (!params.request || params.request === '[description of code]') throw new Error("Missing 'request' parameter for Ghost Code.");
            generationPrompt = `Generate a code snippet for the following request.\nLanguage: ${params.lang || 'javascript'}\nRequest: "${params.request}"\n\nIMPORTANT: Only output the raw code, wrapped in a markdown code block for the specified language. Do not add any explanatory text, introduction, or conclusion.`;
        }
        
        if (userMessageText.startsWith(devRoadmapPromptPrefix)) {
            const topic = userMessageText.substring(devRoadmapPromptPrefix.length);
            generationPrompt = `As an expert engineering mentor, create a detailed, step-by-step learning roadmap for "${topic}". Use Markdown formatting with headings, subheadings, nested lists, and bold text for clarity. The roadmap should be practical, suggest key concepts and technologies for each step, and recommend a small project to solidify the learning.`;
        }

        if (generationPrompt) parts.push({ text: generationPrompt });
        
        if (attachments.length > 0) {
            const fileParts = await Promise.all(attachments.map(async (file) => ({
                inlineData: { mimeType: file.type || 'application/octet-stream', data: await fileToBase64(file) }
            })));
            parts.push(...fileParts);
        }

        setMessages((prev) => [...prev, { id: aiResponseId, text: '', sender: 'ai', status: 'generating' }]);
        const stream = await sendMessageToAI([...messages, userMessage], parts);
        
        let fullResponse = '';
        for await (const chunk of stream) {
          fullResponse += chunk.text;
          setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: fullResponse } : msg));
        }

        const commandRegex = /\[FUX_STATE:(.*?)\]$/;
        const match = fullResponse.match(commandRegex);
        let messageToDisplay = fullResponse;
        if (match && match[1]) {
          try {
            const command = JSON.parse(match[1]);
            if (command.theme) setTheme(command.theme as Theme);
          } catch (e) { console.error("Failed to parse FUX_STATE command:", e); }
          messageToDisplay = fullResponse.replace(commandRegex, '').trim();
        }
        if (isVoiceEnabled) speakText(messageToDisplay);
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: messageToDisplay, status: 'complete' } : msg));
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      const errorText = error instanceof Error ? error.message : 'An unknown error occurred.';
      const errorMessageText = `Sorry, Captain. I encountered an error: ${errorText}`;
      if (isVoiceEnabled) speakText(errorMessageText);
      setMessages(prev => {
        const lastMsg = prev.find(m => m.id === aiResponseId);
        if (lastMsg) {
            return prev.map(m => {
                if (m.id === aiResponseId) {
                    const updatedMessage = { ...m, status: 'error' as const, text: errorMessageText };
                    if (m.media) updatedMessage.media = { ...m.media, status: 'error' as const };
                    if (m.huggingFaceData) updatedMessage.huggingFaceData = { ...m.huggingFaceData, error: errorText };
                    return updatedMessage;
                }
                return m;
            });
        }
        return [...prev, { id: aiResponseId, text: errorMessageText, sender: 'ai', status: 'error' }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, attachments, messages, isOnline, setTheme, activeModel, isVoiceEnabled, speakText, setActiveModel, isEmotionDetecting, currentEmotion, isPoseDetecting, currentPose]);

  useEffect(() => {
    if (sendAfterCaptureRef.current || sendAfterScanRef.current) {
        handleSend();
        sendAfterCaptureRef.current = false;
        sendAfterScanRef.current = false;
    }
  }, [attachments, input, handleSend]);

  const handleCameraCapture = (file: File) => {
    setAttachments([file]);
    setInput("Analyze this frame from my visual feed, Captain.");
    setIsCameraOpen(false);
    sendAfterCaptureRef.current = true;
  };
  
  const handleScanReport = (objects: string[]) => {
    const objectList = objects.length > 0 ? `\`${objects.join('`, `')}\`` : 'no objects';
    setInput(`I've completed an environmental scan. Objects detected: ${objectList}. Provide a tactical analysis.`);
    setIsScanViewOpen(false);
    sendAfterScanRef.current = true;
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const handleEditMedia = useCallback(async (message: Message) => {
    if (!message.media) return;

    if (message.media.type === 'image' && message.media.url) {
      try {
        const file = await dataUrlToFile(message.media.url, `edit-${Date.now()}.png`);
        setAttachments([file]);
        setInput('Image Alchemy | prompt: ');
        textAreaRef.current?.focus();
      } catch (error) {
        console.error("Failed to prepare image for editing:", error);
      }
    } else if (message.media.type === 'video') {
      // For video, we re-use the original prompt for modification.
      setInput(`Generate a video of: ${message.media.prompt}`);
      setAttachments([]);
      textAreaRef.current?.focus();
    }
  }, []);

  const handleKnowledgeCommand = async (userMessage: Message) => {
    const aiResponseId = (Date.now() + 1).toString();
    const commandString = userMessage.text;
    const { command, params } = parseCommand(commandString);

    try {
        if (command === 'Index Source') {
            let sourceName: string;
            let content: string;
            let sourceType: 'url' | 'file';

            if (params.url) {
                sourceName = params.url;
                sourceType = 'url';
                setMessages(prev => [...prev, { id: aiResponseId, text: `Acknowledged. Processing and indexing \`${sourceName}\`... This may take a moment.`, sender: 'ai' }]);
                content = `Simulated content from ${sourceName}. Haystack is a framework for building search systems. It allows you to use transformer models.`; // In a real app, you'd fetch this URL.
            } else if (attachments.length > 0) {
                const file = attachments[0];
                sourceName = file.name;
                sourceType = 'file';
                setMessages(prev => [...prev, { id: aiResponseId, text: `Acknowledged. Processing and indexing \`${sourceName}\`...`, sender: 'ai' }]);
                content = await fileToText(file);
            } else {
                throw new Error("Missing source. Provide a 'url' parameter or attach a file.");
            }

            await knowledgeService.addDocument(sourceName, sourceType, content);
            const successText = `Source '${sourceName}' has been successfully indexed into the intel base.`;
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: successText } : m));
            if (isVoiceEnabled) speakText(successText);

        } else if (command === 'Query Intel Base') {
            if (!params.question) throw new Error("Missing 'question' parameter.");
            const question = params.question;
            setMessages(prev => [...prev, { id: aiResponseId, text: `Querying the intel base for: "${question}"...`, sender: 'ai', status: 'generating' }]);
            
            const { context, sources } = await knowledgeService.retrieve(question);
            
            if (!context) {
                const noResultText = `No relevant information found in the intel base for your query, Captain.`;
                setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: noResultText, status: 'complete' } : m));
                if (isVoiceEnabled) speakText(noResultText);
                return;
            }

            const ragPrompt = `Based *only* on the following context, answer the user's question. If the context doesn't contain the answer, say so. Mention the sources used.\n\nContext:\n---\n${context}\n---\nSources: ${sources.join(', ')}\n\nQuestion: ${question}`;
            
            const stream = await sendMessageToAI([...messages, userMessage], [{ text: ragPrompt }]);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: fullResponse } : msg));
            }
            if (isVoiceEnabled) speakText(fullResponse);
            setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, status: 'complete' } : msg));
            
        } else if (command === 'Intel Base Status') {
            const documents = knowledgeService.getDocuments();
            const responseText = "Captain, here is the current manifest of the intel base.";
            setMessages(prev => [...prev, { id: aiResponseId, text: responseText, sender: 'ai', knowledgeBaseData: { documents } }]);
            if (isVoiceEnabled) speakText(responseText);

        } else if (command === 'Purge Intel Base') {
            knowledgeService.purge();
            const responseText = "Confirmed. All indexed knowledge has been purged from my long-term memory. The intel base is now empty.";
            setMessages(prev => [...prev, { id: aiResponseId, text: responseText, sender: 'ai' }]);
            if (isVoiceEnabled) speakText(responseText);

        } else {
            throw new Error('Unknown Intel Ops command.');
        }

    } catch (error: any) {
        console.error('Knowledge command failed:', error);
        const failureText = `Intel Ops command failed, Captain: ${error.message}`;
        if (isVoiceEnabled) speakText(failureText);
        setMessages(prev => {
            const existingMsg = prev.find(m => m.id === aiResponseId);
            if (existingMsg) {
                return prev.map(m => m.id === aiResponseId ? { ...m, status: 'error' as const, text: failureText } : m);
            }
            return [...prev, { id: aiResponseId, sender: 'ai', status: 'error' as const, text: failureText }];
        });
    }
};

  const handleStreamingCommand = async (commandString: string) => {
    const { command, params } = parseCommand(commandString);
    let responseText = '';
    
    if (command === 'Screen Stream') {
        responseText = "Acknowledged. Establishing direct visual feed from your screen.";
        setIsScreenStreamOpen(true);
    } else if (command === 'Live Intel Stream') {
        if (!params.source) {
            responseText = "Error: Missing 'source' parameter for Live Intel Stream.";
        } else if (liveStreamState.status === 'active') {
            responseText = `Error: An intel stream from '${liveStreamState.source}' is already active.`;
        } else {
            responseText = `Tapping into the data stream for '${params.source}', Captain. I will report any significant events in real-time.`;
            setLiveStreamState({ source: params.source, status: 'active' });
            streamingService.start(params.source, (newMessage) => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: newMessage,
                    sender: 'ai',
                    isLiveStream: true,
                }]);
            });
        }
    } else if (command === 'Stop Intel Stream') {
        if (liveStreamState.status !== 'active') {
            responseText = "No active intel stream to stop, Captain.";
        } else {
            responseText = `Acknowledged. Terminating the live feed from '${liveStreamState.source}'. Standing by.`;
            streamingService.stop();
            setLiveStreamState({ source: null, status: 'idle' });
        }
    } else if (command === 'Engage Live Sync') {
        if (isLiveSyncActive) {
            responseText = "Live sync is already engaged, Captain.";
        } else {
            responseText = "Acknowledged. Engaging real-time codebase sync. I will report any changes automatically.";
            setIsLiveSyncActive(true);
            liveSyncService.start(async (update) => {
                await knowledgeService.addDocument(update.fileName, 'file', update.content);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: `**Detected change in \`${update.fileName}\`:**\n> ${update.summary}\n\nRe-indexing of the source is complete.`,
                    sender: 'ai',
                    isLiveSyncUpdate: true,
                }]);
            });
        }
    } else if (command === 'Disengage Live Sync') {
        if (!isLiveSyncActive) {
            responseText = "Live sync is not currently active.";
        } else {
            responseText = "Acknowledged. Disengaging live codebase sync.";
            setIsLiveSyncActive(false);
            liveSyncService.stop();
        }
    } else {
        responseText = "Unknown streaming command.";
    }
    
    if (responseText) {
        setMessages(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            text: responseText, 
            sender: 'ai', 
        }]);
        if (isVoiceEnabled) speakText(responseText);
    }
  };
  
    const handleScreenStreamClose = (reason: 'user' | 'error') => {
        setIsScreenStreamOpen(false);
        const text = reason === 'user'
            ? "Screen stream terminated, Captain."
            : "Screen stream encountered an error and was terminated.";
        setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'ai' }]);
    };

  const handleAutomationCommand = async (commandString: string) => {
    const aiResponseId = (Date.now() + 1).toString();
    const { command, params } = parseCommand(commandString);
    let responseText = '';
    let workflowData: any = null;
    
    try {
        if (command === 'Define DAG') {
            if (!params.name || !params.schedule || !params.tasks) throw new Error("Missing parameters. 'name', 'schedule', and 'tasks' are required.");
            const tasks = params.tasks.split(',').map(t => t.trim());
            workflowService.defineDag(params.name, params.schedule, tasks);
            responseText = `DAG '${params.name}' has been defined and scheduled. I will orchestrate its tasks as instructed.`;
            setDags(workflowService.getDags()); // Update state immediately
        } else if (command === 'Trigger DAG') {
            if (!params.name) throw new Error("Missing 'name' parameter.");
            workflowService.triggerDag(params.name);
            responseText = `Acknowledged. Manually triggering a run for DAG '${params.name}'. Monitoring execution.`;
            setDags(workflowService.getDags());
        } else if (command === 'DAG Status') {
            responseText = "Captain, here is the current status of all automated workflows.";
            workflowData = { dags: workflowService.getDags() };
        } else if (command === 'Clear All DAGs') {
            workflowService.clearAllDags();
            responseText = "Confirmed, Captain. All defined DAGs and their operational history have been purged from the system.";
            setDags([]);
        } else {
            throw new Error('Unknown automation command.');
        }

        setMessages(prev => [...prev, { 
            id: aiResponseId, 
            text: responseText, 
            sender: 'ai', 
            workflowData 
        }]);
        if (isVoiceEnabled) speakText(responseText);

    } catch (error: any) {
        console.error('Automation command failed:', error);
        const failureText = `Automation command failed, Captain: ${error.message}`;
        if (isVoiceEnabled) speakText(failureText);
        setMessages(prev => [...prev, { id: aiResponseId, sender: 'ai', status: 'error' as const, text: failureText }]);
    }
};

  const handleAnalysisCommand = async (userMessage: Message) => {
    const aiResponseId = (Date.now() + 1).toString();
    const commandString = userMessage.text;
    const { command, params } = parseCommand(commandString);
    const algoVisPromptPrefix = "Visualize algorithm: ";
    const userSimPromptPrefix = "Simulate user journey for: ";
    let loadingText: string;

    try {
        if (command === 'Neural Cartography') {
            if (!params.model) throw new Error("Missing 'model' parameter for Neural Cartography.");
            loadingText = `Mapping neural pathways for model: \`${params.model}\`...`;
            setMessages(prev => [...prev, { id: aiResponseId, text: loadingText, sender: 'ai' }]);
            const data = await analysisService.analyzeModelArchitecture(params.model);
            const successText = `Neural architecture map complete for ${data.modelName}.`;
            if (isVoiceEnabled) speakText(successText);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: successText, neuralArchitectureData: data } : m));
        } else if (commandString.startsWith(algoVisPromptPrefix)) {
            const prompt = commandString.substring(algoVisPromptPrefix.length);
            setMessages(prev => [...prev, { id: aiResponseId, text: "Visualizing algorithm...", sender: 'ai', media: { type: 'algoVisualization', prompt, status: 'generating' } }]);
            const vizHtml = await generateAlgorithmVisualizationFromAI(prompt);
            if (isVoiceEnabled) speakText("Algorithm visualization complete.");
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Algorithm visualization complete.", media: { type: 'algoVisualization', prompt, status: 'complete', content: vizHtml } } : m));
        } else if (commandString.startsWith(userSimPromptPrefix)) {
            const prompt = commandString.substring(userSimPromptPrefix.length);
            setMessages(prev => [...prev, { id: aiResponseId, text: "Simulating user journey...", sender: 'ai' }]);
            const data = await generateUserSimulationFromAI(prompt);
            const successText = `User journey simulation for persona '${data.persona}' is complete.`;
            if (isVoiceEnabled) speakText(successText);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: successText, userSimulationData: data } : m));
        } else if (command === 'Design Deconstruction') {
            let prompt = "You are a world-class UI/UX design critic. Analyze the following and provide a detailed critique. Cover layout, color theory, typography, accessibility, and overall user experience. Use markdown for formatting.";
            if (params.url) {
                prompt += `\n\nAnalyze the design of this URL: ${params.url}`;
            } else if (attachments.length === 0 || !attachments[0].type.startsWith('image/')) {
                throw new Error("Please attach a screenshot or provide a 'url' parameter for Design Deconstruction.");
            }
            setMessages(prev => [...prev, { id: aiResponseId, text: 'Deconstructing design...', sender: 'ai', status: 'generating' }]);
            const stream = await sendMessageToAI([...messages, userMessage], [{ text: prompt }]);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: fullResponse } : m));
            }
            if (isVoiceEnabled) speakText("Design deconstruction complete.");
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, status: 'complete' } : m));
        } else if (command === 'Binary Scan') {
            if (attachments.length === 0) throw new Error("Please attach a file to use the Binary Scan power.");
            const file = attachments[0];
            setMessages(prev => [...prev, { id: aiResponseId, text: `Scanning binary structure of \`${file.name}\`...`, sender: 'ai', status: 'generating' }]);
            const dumpData = await generateHexDump(file);
            const prompt = `You are a reverse engineering specialist, trained on the Z0F course materials. Analyze the following hex dump from '${dumpData.fileName}'. Identify file headers (magic numbers), embedded strings (ASCII/Unicode), potential entry points, and any recognizable data structures or code patterns. Provide a concise, expert summary of your findings.\n\n${dumpData.hex}`;
            const stream = await sendMessageToAI([...messages, userMessage], [{ text: prompt }]);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: `Scan of \`${file.name}\` complete:\n\n${fullResponse}`, hexDumpData: dumpData } : m));
            }
            if (isVoiceEnabled) speakText("Binary scan complete.");
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, status: 'complete' } : m));
        } else if (command === 'Dense Scan') {
            if (attachments.length === 0 || !attachments[0].type.startsWith('image/')) {
                throw new Error("Please attach an image file to use the Dense Scan power.");
            }
            const imageFile = attachments[0];
            setMessages(prev => [...prev, { id: aiResponseId, text: "Performing DensePose analysis...", sender: 'ai', media: { type: 'densePose', prompt: command, status: 'generating' } }]);
            const base64Image = await fileToBase64(imageFile);
            const imageUrl = await performDensePoseAnalysis(base64Image, imageFile.type);
            if (isVoiceEnabled) speakText("Dense Scan complete.");
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Dense Scan complete.", media: { type: 'densePose', prompt: command, status: 'complete', url: imageUrl } } : m));
        } else if (command === 'Playlist Analysis') {
            if (!params.url) throw new Error("Missing 'url' parameter for Playlist Analysis.");
            loadingText = `Analyzing playlist from \`${params.url}\`...`;
            setMessages(prev => [...prev, { id: aiResponseId, text: loadingText, sender: 'ai' }]);
            const data = await analyzePlaylistFromAI(commandString);
            const successText = `Playlist analysis complete for "${data.name}".`;
            if (isVoiceEnabled) speakText(successText);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: successText, playlistAnalysisData: data } : m));
        }
        else {
            throw new Error('Unknown analysis command.');
        }
    } catch (error: any) {
        console.error('Analysis command failed:', error);
        const failureText = `Analysis command failed, Captain: ${error.message}`;
        if (isVoiceEnabled) speakText(failureText);
        setMessages(prev => {
            const existingMsg = prev.find(m => m.id === aiResponseId);
            if (existingMsg) {
                return prev.map(m => m.id === aiResponseId ? { ...m, status: 'error' as const, text: failureText } : m);
            }
            return [...prev, { id: aiResponseId, sender: 'ai', status: 'error' as const, text: failureText }];
        });
    }
  };

  const handleFinancialCommand = async (commandString: string) => {
    const aiResponseId = (Date.now() + 1).toString();
    const { command, params } = parseCommand(commandString);
    let loadingText: string;

    try {
        if (command === 'Market Pulse') {
            if (!params.ticker) throw new Error("Missing 'ticker' parameter.");
            loadingText = `Accessing market data for ${params.ticker.toUpperCase()}, Captain...`;
            setMessages(prev => [...prev, { id: aiResponseId, text: loadingText, sender: 'ai' }]);
            const data = await financialService.getStockQuote(params.ticker);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Data acquired. Here is the current pulse:", financialData: { type: 'stock', data } } : m));
        } else if (command === 'Sector Intel') {
            if (!params.ticker) throw new Error("Missing 'ticker' parameter.");
            loadingText = `Retrieving sector intel for ${params.ticker.toUpperCase()}...`;
            setMessages(prev => [...prev, { id: aiResponseId, text: loadingText, sender: 'ai' }]);
            const data = await financialService.getStockNews(params.ticker);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Latest headlines on your target:", financialData: { type: 'news', data } } : m));
        } else if (command === 'Crypto Scan') {
            if (!params.symbol) throw new Error("Missing 'symbol' parameter.");
            loadingText = `Scanning crypto markets for ${params.symbol.toUpperCase()}...`;
            setMessages(prev => [...prev, { id: aiResponseId, text: loadingText, sender: 'ai' }]);
            const data = await financialService.getCryptoPrice(params.symbol);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Crypto asset data acquired:", financialData: { type: 'crypto', data } } : m));
        } else if (command === 'Alpha Signal') {
            if (!params.ticker) throw new Error("Missing 'ticker' parameter for Alpha Signal.");
            loadingText = `Calculating alpha signal for ${params.ticker.toUpperCase()}...`;
            setMessages(prev => [...prev, { id: aiResponseId, text: loadingText, sender: 'ai' }]);
            const data = await financialService.getQuantMetrics(params.ticker);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Quantitative analysis complete.", financialData: { type: 'quant', data } } : m));
        } else {
            throw new Error('Unknown financial command.');
        }

    } catch (error: any) {
        console.error('Financial command failed:', error);
        const failureText = `Financial data request failed, Captain: ${error.message}`;
        if (isVoiceEnabled) speakText(failureText);
        setMessages(prev => {
            const existingMsg = prev.find(m => m.id === aiResponseId);
            if (existingMsg) {
                return prev.map(m => m.id === aiResponseId ? { ...m, status: 'error' as const, text: failureText } : m);
            }
            return [...prev, { id: aiResponseId, sender: 'ai', status: 'error' as const, text: failureText }];
        });
    }
};

  const handleHuggingFaceCommand = async (commandString: string) => {
    const aiResponseId = (Date.now() + 1).toString();
    let type: any, query: Record<string, any> = {}, loadingText: string;

    try {
        const { command, params } = parseCommand(commandString.substring(3)); // remove "HF "

        if (command === 'LLM Search') {
            type = 'modelSearch';
            if (!params.query) throw new Error("Missing 'query' parameter for LLM Search.");
            query = { query: params.query };
            loadingText = `Searching for models matching: \`${params.query}\`...`;
        } else if (command === 'Model Query') {
            type = 'modelQuery';
            if (!params.model || !params.prompt) throw new Error("Missing 'model' or 'prompt' parameter for Model Query.");
            query = { model: params.model, prompt: params.prompt };
            loadingText = `Querying model: \`${params.model}\`...`;
        } else if (command === 'Dataset Scout') {
            type = 'datasetSearch';
            if (!params.query) throw new Error("Missing 'query' parameter for Dataset Scout.");
            query = { query: params.query };
            loadingText = `Scouting for datasets matching: \`${params.query}\`...`;
        } else if (command === 'Space Explorer' || command === 'Cache Space') {
            type = 'spaceInfo';
            if (!params.space) throw new Error(`Missing 'space' parameter for ${command}.`);
            query = { space: params.space };
            loadingText = command === 'Space Explorer' 
                ? `Exploring Space: \`${params.space}\`...` 
                : `Attempting to cache intel for Space: \`${params.space}\`...`;
        } else {
            throw new Error('Unknown Hugging Face command.');
        }

        setMessages(prev => [...prev, {
            id: aiResponseId,
            text: loadingText,
            sender: 'ai',
            huggingFaceData: { type, query, result: null }
        }]);

        let result: any;
        if (command === 'LLM Search') {
            result = await hfService.searchModels(params.query);
        } else if (command === 'Model Query') {
            result = await hfService.queryModel(params.model, params.prompt);
            setActiveModel({ type: 'huggingface', modelId: params.model });
        } else if (command === 'Dataset Scout') {
            result = await hfService.searchDatasets(params.query);
        } else if (command === 'Space Explorer') {
            result = await hfService.getSpaceInfo(params.space, false);
        } else if (command === 'Cache Space') {
            result = await hfService.getSpaceInfo(params.space, true);
        }

        const successText = command === 'Cache Space'
            ? `Intel for \`${params.space}\` has been successfully cached for offline use.`
            : `Hugging Face operation complete, Captain.`;
        
        if (isVoiceEnabled) speakText(successText);

        setMessages(prev => prev.map(m => m.id === aiResponseId ? {
             ...m,
             text: successText,
             huggingFaceData: { type, query, result }
        } : m));

    } catch (error: any) {
        console.error('Hugging Face command failed:', error);
        const failureText = `Hugging Face operation failed, Captain.`;
        if (isVoiceEnabled) speakText(failureText);
        const errorMessage = error.message || 'An unknown error occurred.';
        setMessages(prev => {
            const existingMsg = prev.find(m => m.id === aiResponseId);
            if (existingMsg) {
                return prev.map(m => m.id === aiResponseId ? {
                     ...m,
                     text: failureText,
                     huggingFaceData: { type, query, result: null, error: errorMessage }
                } : m);
            }
            return [...prev, {
                id: aiResponseId,
                sender: 'ai',
                text: failureText,
                huggingFaceData: { type, query, result: null, error: errorMessage }
            }];
        });
    }
  };

  const handleVectorDroneCommand = async (commandString: string) => {
    const aiResponseId = (Date.now() + 1).toString();
    const { command, params } = parseCommand(commandString);
    
    try {
        if (command === 'Vector Status') {
            setMessages(prev => [...prev, { id: aiResponseId, text: "Pinging drone for status...", sender: 'ai' }]);
            const status = await vectorDroneService.getStatus();
            setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Drone status report acquired.", vectorStatus: status } : m));
        } else if (command === 'Vector Roam') {
            if (params.action !== 'start' && params.action !== 'stop') throw new Error("Invalid 'action' parameter for Vector Roam. Use 'start' or 'stop'.");
            const responseText = await vectorDroneService.controlRoaming(params.action as 'start' | 'stop');
            setMessages(prev => [...prev, { id: aiResponseId, text: responseText, sender: 'ai' }]);
        } else if (command === 'Vector Say') {
            if (!params.text) throw new Error("Missing 'text' parameter for Vector Say.");
            const responseText = await vectorDroneService.sayText(params.text);
            setMessages(prev => [...prev, { id: aiResponseId, text: responseText, sender: 'ai' }]);
        } else {
            throw new Error("Unknown Vector Drone command.");
        }
    } catch (error: any) {
        console.error("Vector command failed:", error);
        const failureText = `Vector command failed, Captain: ${error.message}`;
        if (isVoiceEnabled) speakText(failureText);
        setMessages(prev => {
            const existingMsg = prev.find(m => m.id === aiResponseId);
            if (existingMsg) {
                return prev.map(m => m.id === aiResponseId ? { ...m, status: 'error' as const, text: failureText } : m);
            }
            return [...prev, { id: aiResponseId, sender: 'ai', status: 'error' as const, text: failureText }];
        });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
  };
  const handleRemoveAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
  };
  
  const LiveStatusDisplay = () => {
    let statusText = "Live Conversation Active";
    let pulse = true;
    switch (liveStatus) {
      case 'connecting': statusText = "Connecting..."; break;
      case 'error': statusText = "Connection Error. Retry?"; pulse = false; break;
      case 'active': statusText = "Listening..."; break;
    }

    const transcriptEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [liveTranscripts]);

    return (
      <div className="w-full flex flex-col bg-layer-1 border border-layer-3 rounded-lg p-3 h-[120px] text-gray-200 font-mono text-sm">
        <div className={`flex items-center space-x-2 text-primary mb-2 flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`}>
          <MicrophoneIcon />
          <span>{statusText}</span>
        </div>
        <div className="w-full text-xs text-secondary flex-1 overflow-y-auto pr-2 min-h-0">
          {liveTranscripts.user && (
            <div className="flex items-start gap-2 mb-1">
              <span className="font-bold text-gray-400 flex-shrink-0">Captain:</span>
              <p className="flex-1 break-words whitespace-pre-wrap">{liveTranscripts.user}</p>
            </div>
          )}
          {liveTranscripts.ai && (
            <div className="flex items-start gap-2">
              <span className="font-bold text-primary flex-shrink-0">FuXStiXX:</span>
              <p className="flex-1 break-words whitespace-pre-wrap">{liveTranscripts.ai}</p>
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      </div>
    );
  };

  const SensorDisplay: React.FC<{
    isDetecting: boolean;
    isInitializing: boolean;
    error: string | null;
    currentValue: { name: string; score?: number } | null;
    type: 'Emotion' | 'Pose';
  }> = ({ isDetecting, isInitializing, error, currentValue, type }) => {
    if (!isDetecting && !isInitializing && !error) return null;
    
    let text = "Initializing...";
    if (error) text = "Sensor Error";
    else if (isDetecting) {
        if (currentValue) {
            text = currentValue.score 
                ? `${currentValue.name} (${(currentValue.score * 100).toFixed(0)}%)`
                : currentValue.name;
        } else {
            text = "Detecting...";
        }
    }
    
    return (
        <div className="bg-layer-1 px-3 py-1 rounded-md text-xs flex items-center shadow-md border border-layer-3 font-mono">
            <span className={`mr-2 w-2 h-2 rounded-full ${error ? 'bg-danger' : 'bg-primary'} ${isDetecting && 'animate-pulse'}`}></span>
            <span className={error ? 'text-danger' : 'text-secondary'}>{type}: {text}</span>
        </div>
    );
};

  const isExternalModelActive = activeModel.type === 'huggingface' || activeModel.type === 'lmstudio';
  const providerName = activeModel.type === 'huggingface' ? 'Hugging Face' : 'Local LLM';

  const ExternalModelIcon = () => {
    if (activeModel.type === 'huggingface') return <HuggingFaceIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    if (activeModel.type === 'lmstudio') return <LMStudioIcon className="w-4 h-4 text-purple-400 flex-shrink-0" />;
    return null;
  };

  return (
    <div 
      className={`relative flex flex-col h-full bg-base p-4 transition-all duration-200 ${isDragging ? 'outline-dashed outline-2 outline-offset-[-8px] outline-primary' : ''}`}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      {isCameraOpen && <CameraView onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />}
      {isScanViewOpen && <ObjectDetectionView onClose={() => setIsScanViewOpen(false)} onReport={handleScanReport} />}
      {isScreenStreamOpen && <ScreenStreamView onClose={handleScreenStreamClose} />}
      
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex items-center space-x-2">
            <LiveStreamStatus streamState={liveStreamState} />
            <LiveSyncStatus isActive={isLiveSyncActive} />
        </div>
        <WorkflowStatus dags={dags} />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pt-16">
        <div className="space-y-6">
          {messages.map((msg) => <ChatMessage key={msg.id} message={msg} onEditMedia={handleEditMedia} />)}
        </div>
        <div ref={chatEndRef} />
      </div>
      
      <div className="pt-4 mt-auto">
        {messages.length <= 1 && (
            <div className="flex justify-center mb-4">
                <button
                    onClick={() => setInput(CHECK_IN_PROMPT)}
                    className="p-3 px-6 bg-layer-1 border border-layer-3 rounded-lg text-center text-sm hover:bg-layer-2 hover:border-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isOnline || isLoading}
                > Mission Check-in </button>
            </div>
        )}
        {attachments.length > 0 && (
            <div className="mb-2 p-2 bg-layer-1 border border-layer-3 rounded-lg flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {attachments.map((file, index) => (
                    <div key={index} className="flex items-center bg-layer-2 rounded-full pl-2 pr-1 py-1 text-sm text-secondary">
                        <AttachmentIcon fileType={file.type} />
                        <span className="ml-1.5 mr-2 truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => handleRemoveAttachment(index)} className="p-1 rounded-full hover:bg-layer-3 text-gray-400 hover:text-white"><XIcon /></button>
                    </div>
                ))}
            </div>
        )}
        {!isOnline && (<div className="text-center text-xs text-danger mb-2 font-mono">SYSTEM OFFLINE</div>)}
        {isExternalModelActive && (
            <div className="flex items-center justify-between text-xs font-mono text-secondary bg-layer-1 p-2 rounded-t-lg border-b border-layer-3 -mb-px">
                <div className="flex items-center space-x-2 truncate">
                    <ExternalModelIcon />
                    <span className="truncate">Active Model ({providerName}): <span className="text-primary">{activeModel.modelId}</span></span>
                </div>
                <button 
                    onClick={() => setActiveModel({ type: 'gemini', modelId: 'gemini-2.5-flash' })}
                    className="flex items-center space-x-1 hover:text-primary transition-colors" title="Return to FuXStiXX core"
                > <XIcon /> <span>Disconnect</span> </button>
            </div>
        )}
        <div className="relative">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex items-center space-x-2">
                <SensorDisplay
                    isDetecting={isEmotionDetecting} isInitializing={isEmotionSensorInitializing}
                    error={emotionError} currentValue={currentEmotion ? { name: currentEmotion.emotion, score: currentEmotion.score } : null}
                    type="Emotion"
                />
                <SensorDisplay
                    isDetecting={isPoseDetecting} isInitializing={isPoseSensorInitializing}
                    error={poseError} currentValue={currentPose ? { name: currentPose.name, score: currentPose.score } : null}
                    type="Pose"
                />
            </div>
            <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center">
                    <button
                        ref={powersButtonRef} onClick={() => setIsPowersOpen(prev => !prev)}
                        disabled={isLoading || !isOnline || liveStatus !== 'idle'}
                        className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200"
                        aria-label="Access Powers" title="Access Powers"
                    > <ZapIcon /> </button>
                </div>

                {liveStatus !== 'idle' ? <LiveStatusDisplay /> : (
                  <textarea ref={textAreaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
                      placeholder={isOnline ? "Command your co-pilot..." : "System is offline..."}
                      className="w-full bg-layer-1 border border-layer-3 rounded-lg p-3 pl-12 pr-[290px] text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono text-sm disabled:opacity-50"
                      rows={1} disabled={isLoading || !isOnline} />
                )}

                <div className="absolute right-3 flex items-center space-x-1">
                    {liveStatus === 'idle' && (
                        <>
                            <button onClick={() => fileInputRef.current?.click()} disabled={isLoading || !isOnline} className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200" aria-label="Attach files" title="Attach files">
                                <PaperclipIcon />
                            </button>
                            <button onClick={() => setIsCameraOpen(true)} disabled={isLoading || !isOnline} className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200" aria-label="Activate Live Vision" title="Activate Live Vision">
                                <CameraIcon />
                            </button>
                            <button onClick={() => isEmotionDetecting ? stopEmotionDetection() : startEmotionDetection()} disabled={isLoading || !isOnline || isEmotionSensorInitializing} className={`p-2 rounded-full transition-colors duration-200 ${isEmotionDetecting ? 'text-primary animate-pulse' : 'text-secondary'} disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary`} aria-label="Toggle Emotion Sensor" title="Toggle Emotion Sensor">
                                <FaceSmileIcon />
                            </button>
                             <button onClick={() => isPoseDetecting ? stopPoseDetection() : startPoseDetection()} disabled={isLoading || !isOnline || isPoseSensorInitializing} className={`p-2 rounded-full transition-colors duration-200 ${isPoseDetecting ? 'text-primary animate-pulse' : 'text-secondary'} disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary`} aria-label="Toggle Kinetic Sensor" title="Toggle Kinetic Sensor">
                                <PersonStandingIcon />
                            </button>
                             <button onClick={() => setIsScanViewOpen(true)} disabled={isLoading || !isOnline || !isTfReady} className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200" aria-label="Environmental Scanner" title={!isTfReady ? "Initializing environmental sensors..." : "Environmental Scanner"}>
                                <ScanIcon />
                            </button>
                            <button onClick={() => setIsVoiceEnabled(prev => !prev)} className={`p-2 rounded-full transition-colors duration-200 ${isVoiceEnabled ? 'text-primary' : 'text-secondary'} disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary`} aria-label="Toggle Voice Output" title="Toggle Voice Output">
                                {isVoiceEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
                            </button>
                        </>
                    )}
                     <button onClick={handleToggleLive} disabled={!isOnline || isLoading} className={`p-2 rounded-full transition-colors duration-200 ${liveStatus !== 'idle' ? 'text-danger animate-pulse' : 'text-secondary'} disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary`} aria-label={liveStatus !== 'idle' ? "End Live Conversation" : "Start Live Conversation"} title={liveStatus !== 'idle' ? "End Live Conversation" : "Start Live Conversation"}>
                        <MicrophoneIcon />
                    </button>
                    {liveStatus === 'idle' && (
                      <button onClick={() => handleSend()} disabled={isLoading || !isOnline || (!input.trim() && attachments.length === 0)} className="p-2 rounded-full bg-accent text-black disabled:bg-layer-3 disabled:text-secondary disabled:cursor-not-allowed hover:bg-primary transition-colors duration-200" aria-label="Send message">
                          <SendIcon />
                      </button>
                    )}
                </div>
            </div>
            {isPowersOpen && <div ref={powersDropdownRef}><PowersDropdown onPowerClick={handlePowerClick} onClose={() => setIsPowersOpen(false)} /></div>}
        </div>
      </div>
       <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept="*" />
    </div>
  );
});

export default ChatInterface;
