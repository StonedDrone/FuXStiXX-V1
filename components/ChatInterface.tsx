import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { GoogleGenAI, Blob, LiveServerMessage, Modality } from "@google/genai";
import { Message, Attachment } from '../types';
import { CHECK_IN_PROMPT } from '../constants';
import { sendMessageToAI, generateImageFromAI, generateVideoFromAI, generateAudioFromAI, resetChat } from '../services/geminiService';
import * as hfService from '../services/huggingFaceService';
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
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import CameraView from './CameraView';

// --- Media Utility Functions ---
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

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
// --- End Media Utility Functions ---


type ActiveModel = {
    type: 'gemini' | 'huggingface';
    modelId: string;
};

type LiveStatus = 'idle' | 'connecting' | 'active' | 'error';
type LiveTranscripts = { user: string; ai: string; };

export interface ChatInterfaceHandle {
  clearChat: () => void;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, {}>((props, ref) => {
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
  const [activeModel, setActiveModel] = useState<ActiveModel>({ type: 'gemini', modelId: 'gemini-2.5-flash' });
  const [isPowersOpen, setIsPowersOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
  const [liveTranscripts, setLiveTranscripts] = useState<LiveTranscripts>({ user: '', ai: '' });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLiveVideoEnabled, setIsLiveVideoEnabled] = useState(false);
  const { setTheme } = useUIState();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const powersButtonRef = useRef<HTMLButtonElement>(null);
  const powersDropdownRef = useRef<HTMLDivElement>(null);
  const sendAfterCaptureRef = useRef(false);
  
  // Refs for live conversation resources
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
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

    if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop());
        videoStreamRef.current = null;
    }
    if(liveVideoRef.current) liveVideoRef.current.srcObject = null;
    setIsLiveVideoEnabled(false);

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
        if (audioResourcesRef.current.inputAudioContext?.state !== 'closed') {
             audioResourcesRef.current.inputAudioContext?.close();
        }
        for (const source of audioResourcesRef.current.sources.values()) {
            source.stop();
        }
        audioResourcesRef.current.sources.clear();
        if (audioResourcesRef.current.outputAudioContext?.state !== 'closed') {
            audioResourcesRef.current.outputAudioContext?.close();
        }
        audioResourcesRef.current = null;
    }
    
    setLiveStatus('idle');
    setLiveTranscripts({ user: '', ai: '' });
    liveTranscriptsRef.current = { userInput: '', aiOutput: '' };
  }, []);

  const toggleLiveVideoStream = useCallback(async () => {
    if (isLiveVideoEnabled) {
        // Stop the video stream
        if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
        if (videoStreamRef.current) {
            videoStreamRef.current.getTracks().forEach(track => track.stop());
            videoStreamRef.current = null;
        }
        if(liveVideoRef.current) liveVideoRef.current.srcObject = null;
        setIsLiveVideoEnabled(false);
    } else {
        // Start the video stream
        if (!liveSessionPromiseRef.current) {
            console.error("Live session not active. Cannot start video stream.");
            setMessages(prev => [...prev, {id: Date.now().toString(), text: "Live session is not active. Please start a conversation first.", sender: 'ai'}]);
            return;
        }
        try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoStreamRef.current = videoStream;
            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = videoStream;
            }
            setIsLiveVideoEnabled(true);

            const FRAME_RATE = 2; // frames per second
            const JPEG_QUALITY = 0.7;

            frameIntervalRef.current = window.setInterval(() => {
                if (liveVideoRef.current && liveCanvasRef.current && liveVideoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
                    const videoEl = liveVideoRef.current;
                    const canvasEl = liveCanvasRef.current;
                    const ctx = canvasEl.getContext('2d');

                    if (ctx) {
                        canvasEl.width = videoEl.videoWidth;
                        canvasEl.height = videoEl.videoHeight;
                        ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
                        canvasEl.toBlob(
                            async (blob) => {
                                if (blob) {
                                    const base64Data = await blobToBase64(blob);
                                    liveSessionPromiseRef.current?.then((session) => {
                                        session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } });
                                    });
                                }
                            },
                            'image/jpeg',
                            JPEG_QUALITY
                        );
                    }
                }
            }, 1000 / FRAME_RATE);

        } catch (error) {
            console.error("Failed to start video stream:", error);
            setMessages(prev => [...prev, {id: Date.now().toString(), text: "Could not start video stream. Please check camera permissions.", sender: 'ai'}]);
            setIsLiveVideoEnabled(false);
        }
    }
  }, [isLiveVideoEnabled]);

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
  }, []);

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
  
  const handleSend = useCallback(async () => {
    const userMessageText = input;
    if ((!userMessageText.trim() && attachments.length === 0) || isLoading || !isOnline) return;

    const imagePromptPrefix = "Generate an image of: ";
    const videoPromptPrefix = "Generate a video of: ";
    const audioPromptPrefix = "Generate music of: ";
    const hfPrefix = "HF ";
    const ghostCodePrefix = "Ghost Code |";
    const isCreativeCommand = userMessageText.trim().startsWith(imagePromptPrefix) || userMessageText.trim().startsWith(videoPromptPrefix) || userMessageText.trim().startsWith(audioPromptPrefix) || userMessageText.trim().startsWith(ghostCodePrefix);

    if (activeModel.type === 'huggingface' && !userMessageText.trim().startsWith(hfPrefix) && !isCreativeCommand) {
        const userMessage: Message = { id: Date.now().toString(), text: userMessageText.trim(), sender: 'user' };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const aiResponseId = (Date.now() + 1).toString();
        try {
            setMessages(prev => [...prev, { id: aiResponseId, text: `Querying ${activeModel.modelId}...`, sender: 'ai', huggingFaceData: { type: 'modelQuery', query: { model: activeModel.modelId, prompt: userMessage.text }, result: null } }]);
            const result = await hfService.queryModel(activeModel.modelId, userMessage.text);
             if (isVoiceEnabled) speakText("Response received from Hugging Face model.");
            setMessages(prev => prev.map(m => m.id === aiResponseId ? {
                ...m,
                text: 'Hugging Face operation complete, Captain.',
                huggingFaceData: { type: 'modelQuery', query: { model: activeModel.modelId, prompt: userMessage.text }, result }
            } : m));
        } catch (error: any) {
            const errorMessage = error.message || 'An unknown error occurred.';
            const failureText = `Hugging Face operation failed.`;
            if (isVoiceEnabled) speakText(failureText);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? {
                 ...m,
                 text: failureText,
                 huggingFaceData: { type: 'modelQuery', query: { model: activeModel.modelId, prompt: userMessage.text }, result: null, error: errorMessage }
            } : m));
        } finally {
            setIsLoading(false);
        }
        return;
    }

    const messageAttachments: Attachment[] = attachments.map(file => ({ name: file.name, type: file.type }));
    const userMessage: Message = { id: Date.now().toString(), text: userMessageText, sender: 'user', attachments: messageAttachments };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const aiResponseId = (Date.now() + 1).toString();
    
    try {
      if (userMessageText.startsWith(hfPrefix)) {
          await handleHuggingFaceCommand(userMessageText);
      } else if (userMessageText.startsWith(imagePromptPrefix)) {
          const prompt = userMessageText.substring(imagePromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Forging image...", sender: 'ai', media: { type: 'image', prompt, status: 'generating', url: '' } }]);
          const imageUrl = await generateImageFromAI(prompt);
          const successText = "Image generation complete.";
          if (isVoiceEnabled) speakText(successText);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: successText, media: { type: 'image', prompt, status: 'complete', url: imageUrl } } : m));
      } else if (userMessageText.startsWith(videoPromptPrefix)) {
          const prompt = userMessageText.substring(videoPromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Synthesizing video...", sender: 'ai', media: { type: 'video', prompt, status: 'generating', url: '' } }]);
          const videoUrl = await generateVideoFromAI(prompt);
          const successText = "Video synthesis complete.";
          if (isVoiceEnabled) speakText(successText);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: successText, media: { type: 'video', prompt, status: 'complete', url: videoUrl } } : m));
      } else if (userMessageText.startsWith(audioPromptPrefix)) {
          const prompt = userMessageText.substring(audioPromptPrefix.length);
          setMessages(prev => [...prev, { id: aiResponseId, text: "Synthesizing audio...", sender: 'ai', media: { type: 'audio', prompt, status: 'generating', url: '' } }]);
          const audioUrl = await generateAudioFromAI(prompt);
          const successText = "Sonic synthesis complete.";
          if (isVoiceEnabled) speakText(successText);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: successText, media: { type: 'audio', prompt, status: 'complete', url: audioUrl } } : m));
      } else {
        const parts: any[] = [];
        let generationPrompt = userMessageText.trim();

        if (userMessageText.trim().startsWith(ghostCodePrefix)) {
            const ghostParts = userMessageText.split('|').map(p => p.trim());
            const params: Record<string, string> = {};
            ghostParts.slice(1).forEach(part => {
                const [key, ...valueParts] = part.split(':');
                if (key && valueParts.length > 0) {
                    params[key.trim().toLowerCase()] = valueParts.join(':').trim();
                }
            });

            const lang = params.lang || 'javascript';
            const request = params.request;

            if (!request || request === '[description of code]') {
                throw new Error("Missing 'request' parameter for Ghost Code protocol. Please describe the code you need.");
            }
            generationPrompt = `Generate a code snippet for the following request.\nLanguage: ${lang}\nRequest: "${request}"\n\nIMPORTANT: Only output the raw code, wrapped in a markdown code block for the specified language. Do not add any explanatory text, introduction, or conclusion.`;
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
  }, [input, isLoading, attachments, messages, isOnline, setTheme, activeModel, isVoiceEnabled, speakText]);

  useEffect(() => {
    if (sendAfterCaptureRef.current) {
        handleSend();
        sendAfterCaptureRef.current = false;
    }
  }, [attachments, input, handleSend]);

  const handleCameraCapture = (file: File) => {
    setAttachments([file]);
    setInput("Analyze this frame from my visual feed, Captain.");
    setIsCameraOpen(false);
    sendAfterCaptureRef.current = true;
  };
  
  const handleHuggingFaceCommand = async (commandString: string) => {
    const aiResponseId = (Date.now() + 1).toString();
    let type: any, query: Record<string, any> = {}, loadingText: string;

    try {
        const parts = commandString.split('|').map(p => p.trim());
        const commandPart = parts[0];
        const params: Record<string, string> = {};
        parts.slice(1).forEach(part => {
            const [key, ...valueParts] = part.split(':');
            if (key && valueParts.length > 0) {
                params[key.trim()] = valueParts.join(':').trim();
            }
        });

        if (commandPart === 'HF LLM Search') {
            type = 'modelSearch';
            if (!params.query) throw new Error("Missing 'query' parameter for LLM Search.");
            query = { query: params.query };
            loadingText = `Searching for models matching: \`${params.query}\`...`;
        } else if (commandPart === 'HF Model Query') {
            type = 'modelQuery';
            if (!params.model || !params.prompt) throw new Error("Missing 'model' or 'prompt' parameter for Model Query.");
            query = { model: params.model, prompt: params.prompt };
            loadingText = `Querying model: \`${params.model}\`...`;
        } else if (commandPart === 'HF Space Explorer' || commandPart === 'HF Cache Space') {
            type = 'spaceInfo';
            if (!params.space) throw new Error(`Missing 'space' parameter for ${commandPart}.`);
            query = { space: params.space };
            loadingText = commandPart === 'HF Space Explorer' 
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
        if (commandPart === 'HF LLM Search') {
            result = await hfService.searchModels(params.query);
        } else if (commandPart === 'HF Model Query') {
            result = await hfService.queryModel(params.model, params.prompt);
            setActiveModel({ type: 'huggingface', modelId: params.model });
        } else if (commandPart === 'HF Space Explorer') {
            result = await hfService.getSpaceInfo(params.space, false);
        } else if (commandPart === 'HF Cache Space') {
            result = await hfService.getSpaceInfo(params.space, true);
        }

        const successText = commandPart === 'HF Cache Space'
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
      <div className="w-full flex flex-col bg-layer-1 border border-layer-3 rounded-lg text-gray-200 font-mono text-sm overflow-hidden">
        {isLiveVideoEnabled && (
          <div className="relative w-full aspect-video bg-black">
              <video ref={liveVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
          </div>
        )}
        <div className="p-3">
          <div className={`flex items-center justify-between text-primary mb-2 flex-shrink-0`}>
              <div className={`flex items-center space-x-2 ${pulse ? 'animate-pulse' : ''}`}>
                  <MicrophoneIcon />
                  <span>{statusText}</span>
              </div>
              <button 
                  onClick={toggleLiveVideoStream} 
                  className={`p-2 rounded-full transition-colors duration-200 ${isLiveVideoEnabled ? 'text-danger' : 'text-secondary'} hover:bg-layer-2`} 
                  aria-label={isLiveVideoEnabled ? "Stop Vision Stream" : "Start Vision Stream"}
                  title={isLiveVideoEnabled ? "Stop Vision Stream" : "Start Vision Stream"}
              >
                  <CameraIcon />
              </button>
          </div>
          <div className="w-full text-xs text-secondary overflow-y-auto pr-2 max-h-24">
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
      </div>
    );
  };

  return (
    <div 
      className={`relative flex flex-col h-full bg-base p-4 transition-all duration-200 ${isDragging ? 'outline-dashed outline-2 outline-offset-[-8px] outline-primary' : ''}`}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
    >
      <canvas ref={liveCanvasRef} className="hidden"></canvas>
      {isCameraOpen && <CameraView onClose={() => setIsCameraOpen(false)} onCapture={handleCameraCapture} />}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-6">
          {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
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
        {activeModel.type === 'huggingface' && (
            <div className="flex items-center justify-between text-xs font-mono text-secondary bg-layer-1 p-2 rounded-t-lg border-b border-layer-3 -mb-px">
                <div className="flex items-center space-x-2 truncate">
                    <HuggingFaceIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span className="truncate">Active Model: <span className="text-primary">{activeModel.modelId}</span></span>
                </div>
                <button 
                    onClick={() => setActiveModel({ type: 'gemini', modelId: 'gemini-2.5-flash' })}
                    className="flex items-center space-x-1 hover:text-primary transition-colors" title="Return to FuXStiXX core"
                > <XIcon /> <span>Disconnect</span> </button>
            </div>
        )}
        <div className="relative">
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
                      className="w-full bg-layer-1 border border-layer-3 rounded-lg p-3 pl-12 pr-48 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono text-sm disabled:opacity-50"
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
       <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" accept="image/*,video/*,application/zip,application/x-zip-compressed,multipart/x-zip,.md,.txt,.py,.js,.ts,.html,.css,.json" />
    </div>
  );
});

export default ChatInterface;