import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Part } from "@google/genai";
import { Message, ActiveModel } from '../types';
import { sendMessageToAI, resetChat, connectLiveSynapse, editImageWithAI, generateImagePro, generateVideoVeo } from '../services/geminiService';
import * as liveSyncService from '../services/liveSyncService';
import * as vectorDroneService from '../services/vectorDroneService';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { KeyIcon } from './icons/KeyIcon';
import { XIcon } from './icons/XIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { useUIState } from '../contexts/UIStateContext';
import { ZapIcon } from './icons/ZapIcon';
import { PowersDropdown } from './PowersDropdown';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import HUDOverlay from './HUDOverlay';
import MediaForge from './MediaForge';
import LiveSyncStatus from './LiveSyncStatus';
import CameraView from './CameraView';

declare const window: any;

export type QuickActionType = 'image' | 'video' | 'audio';

export const MEDIA_QUICK_ACTIONS: { type: QuickActionType; name: string; emoji: string; prefix: string; }[] = [
  { type: 'image', name: 'Forge', emoji: '🎨', prefix: 'Generate an image of: ' },
  { type: 'video', name: 'Synth', emoji: '🎥', prefix: 'Generate a video of: ' },
  { type: 'audio', name: 'Sonic', emoji: '🎵', prefix: 'Generate music of: ' },
];

// Manual decoding logic for Live API raw PCM
const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000) => {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
};

// Manual encoding logic for Live API raw PCM
const encodePCM = (data: Float32Array) => {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

// Manual decode for b64
const decodeB64 = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export interface ChatInterfaceHandle { clearChat: () => void; }

interface ChatInterfaceProps {
    activeModel: ActiveModel;
    setActiveModel: (model: ActiveModel) => void;
    isTfReady: boolean;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

interface PendingFile {
    id: string;
    file: File;
    preview?: string;
    content?: string;
    isImage: boolean;
    emotion?: string;
}

// Fixed missing closing logic and default export for ChatInterface
const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({ activeModel, setActiveModel, isTfReady, messages, setMessages }, ref) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPowersOpen, setIsPowersOpen] = useState(false);
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeForge, setActiveForge] = useState<QuickActionType | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const { isStreamMode, globalAnalyser, setGlobalAnalyser, setTheme } = useUIState();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const { 
    currentEmotion, 
    isSyncing: isBioSyncing, 
    startDetection, 
    stopDetection, 
    analyzeImage,
    stream: cameraStream 
  } = useEmotionDetection();
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Live API Session Refs
  const liveSessionRef = useRef<any>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const liveSynapseHistoryRef = useRef<{user: string, ai: string}>({user: '', ai: ''});

  useImperativeHandle(ref, () => ({ clearChat: () => resetChat() }));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
      startDetection();
      return () => stopDetection();
  }, [startDetection, stopDetection]);

  // Listener for Sidebar power selections
  useEffect(() => {
    const handlePowerEvent = (e: any) => {
      const prompt = e.detail?.detail?.prompt || e.detail?.prompt;
      if (prompt) {
         if (prompt.startsWith("Generate an image of:")) setActiveForge('image');
         else if (prompt.startsWith("Generate a video of:")) setActiveForge('video');
         else if (prompt.startsWith("Generate music of:")) setActiveForge('audio');
         else setInput(prompt);
      }
    };
    window.addEventListener('fux-power-command', handlePowerEvent);
    return () => window.removeEventListener('fux-power-command', handlePowerEvent);
  }, []);

  // Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
        
        if (event.results[0].isFinal) {
          handleSend(transcript);
          setIsDictating(false);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsDictating(false);
      };

      recognitionRef.current.onend = () => {
        setIsDictating(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleDictation = () => {
    if (isVoiceActive) {
        toggleLiveSynapse();
        return;
    }
    
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      if (!recognitionRef.current) {
        alert("Captain, speech synthesis/recognition links are unavailable on this browser.");
        return;
      }
      setIsDictating(true);
      recognitionRef.current.start();
    }
  };

  const toggleLiveSynapse = async () => {
    if (isVoiceActive) {
      liveSessionRef.current?.close();
      liveSessionRef.current = null;
      setIsVoiceActive(false);
      return;
    }

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!outputAudioContextRef.current) {
          outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = outputAudioContextRef.current;
      if (!globalAnalyser) {
          const analyzer = ctx.createAnalyser();
          analyzer.fftSize = 1024;
          setGlobalAnalyser(analyzer);
      }
      
      const sessionPromise = connectLiveSynapse({
        onAudioChunk: async (base64) => {
            const data = decodeB64(base64);
            const buffer = await decodeAudioData(data, ctx);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            if (globalAnalyser) source.connect(globalAnalyser);
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            activeSourcesRef.current.add(source);
            source.onended = () => activeSourcesRef.current.delete(source);
        },
        onInterrupted: () => {
            activeSourcesRef.current.forEach(s => s.stop());
            activeSourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            liveSynapseHistoryRef.current.ai = '';
        },
        onTranscription: (text, isUser) => {
            if (isUser) {
                liveSynapseHistoryRef.current.user += text;
            } else {
                liveSynapseHistoryRef.current.ai += text;
                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last?.sender === 'ai' && last.isLiveStream) {
                        return [...prev.slice(0, -1), { ...last, text: liveSynapseHistoryRef.current.ai }];
                    }
                    return [...prev, { id: 'live-' + Date.now(), sender: 'ai', text: text, isLiveStream: true }];
                });
            }
        },
        onTurnComplete: () => {
            if (liveSynapseHistoryRef.current.user) {
                const userText = liveSynapseHistoryRef.current.user;
                setMessages(prev => [
                    ...prev.filter(m => !m.isLiveStream),
                    { id: 'u-' + Date.now(), sender: 'user', text: userText },
                    { id: 'a-' + Date.now(), sender: 'ai', text: liveSynapseHistoryRef.current.ai, status: 'complete' }
                ]);
                liveSynapseHistoryRef.current = { user: '', ai: '' };
            }
        },
        onFunctionCall: async (fc) => {
            console.log("[SYNAPSE_TOOL_CALL]", fc);
            let result = "Operation acknowledged.";
            if (fc.name === 'vector_drone_op') {
                if (fc.args.action === 'roam') result = await vectorDroneService.controlRoaming(fc.args.roam_state);
                if (fc.args.action === 'status') result = JSON.stringify(await vectorDroneService.getStatus());
                if (fc.args.action === 'say') result = await vectorDroneService.sayText(fc.args.text);
            }
            if (fc.name === 'terminal_op') {
                window.dispatchEvent(new CustomEvent('fux-terminal-relay', { detail: { text: fc.args.command, type: 'output' } }));
                result = `Command relayed to Captain's CLI node: ${fc.args.command}`;
            }
            
            const session = await sessionPromise;
            session.sendToolResponse({
                functionResponses: [{
                    id: fc.id,
                    name: fc.name,
                    response: { result: result }
                }]
            });
            return result;
        }
      });

      sessionPromise.then(session => {
        liveSessionRef.current = session;
        const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = inputCtx.createMediaStreamSource(micStream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            session.sendRealtimeInput({ media: { data: encodePCM(inputData), mimeType: 'audio/pcm;rate=16000' } });
        };
        source.connect(processor);
        processor.connect(inputCtx.destination);
      });

      setIsVoiceActive(true);
    } catch (e: any) {
      console.error("Failed to bridge synapse:", e);
      alert(`Bridge Failure: ${e.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPending: PendingFile[] = await Promise.all(files.map(async (file: File) => {
        const id = Math.random().toString(36).substring(7);
        const isImage = file.type.startsWith('image/');
        let preview = undefined;
        let content = undefined;
        if (isImage) {
            preview = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
        } else {
            content = await file.text();
        }
        return { id, file, preview, content, isImage };
    }));
    setPendingFiles(prev => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = async (file: File) => {
    const id = 'cap-' + Date.now();
    const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
    });
    const detectedEmotion = await analyzeImage(file);
    setPendingFiles(prev => [...prev, {
        id,
        file,
        preview,
        isImage: true,
        emotion: detectedEmotion?.emotion
    }]);
    setIsCameraActive(false);
  };

  const removePendingFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleSend = useCallback(async (explicitInput?: string, attachment?: { data: string, mimeType: string }) => {
    const userMessageText = explicitInput || input;
    const hasFiles = pendingFiles.length > 0 || !!attachment;
    if (!userMessageText.trim() && !hasFiles || isLoading) return;

    if (userMessageText.startsWith("Generate an image of:") || userMessageText.startsWith("Generate a video of:")) {
        handleGenerateMedia(userMessageText, attachment);
        setInput('');
        return;
    }

    setIsLoading(true);
    setQuotaError(false);
    const userMessage: Message = { 
        id: Date.now().toString(), 
        text: userMessageText, 
        sender: 'user',
        attachments: pendingFiles.map(f => ({ name: f.file.name, type: f.file.type }))
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const aiResponseId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiResponseId, text: '', sender: 'ai', status: 'generating' }]);

    try {
        const parts: Part[] = [];
        if (currentEmotion) {
            parts.push({ text: `[CAPTAIN_BIO_SIGNATURE: ${currentEmotion.emotion.toUpperCase()} (${(currentEmotion.score * 100).toFixed(0)}% confidence)] ` });
        }
        for (const pf of pendingFiles) {
            if (pf.isImage && pf.preview) {
                const b64 = pf.preview.split(',')[1];
                let attachmentPrefix = "";
                if (pf.emotion) {
                    attachmentPrefix = `[ATTACHMENT_BIO_STATE: ${pf.emotion.toUpperCase()}] `;
                }
                parts.push({ text: attachmentPrefix });
                parts.push({ inlineData: { data: b64, mimeType: pf.file.type } });
            } else if (pf.content) {
                parts.push({ text: `\n--- START OF FILE ${pf.file.name} ---\n${pf.content}\n--- END OF FILE ---\n` });
            }
        }
        parts.push({ text: userMessageText });

        const stream = await sendMessageToAI(messages, parts);
        let fullText = '';
        let groundingChunks: any[] = [];

        for await (const chunk of stream) {
            if (chunk.text) {
                fullText += chunk.text;
                // Parse for FUX_STATE theme commands
                const stateMatch = fullText.match(/\[FUX_STATE:(\{.*?\})\]/);
                if (stateMatch) {
                    try {
                        const state = JSON.parse(stateMatch[1]);
                        if (state.theme) setTheme(state.theme);
                    } catch (e) {
                        console.warn("Failed to parse FUX_STATE:", e);
                    }
                }
            }
            const metadata = (chunk as any).candidates?.[0]?.groundingMetadata;
            if (metadata?.groundingChunks) {
                groundingChunks = [...groundingChunks, ...metadata.groundingChunks];
            }
            if ((chunk as any).functionCalls) {
                for (const fc of (chunk as any).functionCalls) {
                    if (fc.name === 'terminal_op') {
                        window.dispatchEvent(new CustomEvent('fux-terminal-relay', { detail: { text: fc.args.command, type: 'output' } }));
                    }
                    if (fc.name === 'image_generation_op') {
                        handleGenerateMedia(`Generate an image of: ${fc.args.prompt} | aspectRatio: ${fc.args.aspect_ratio || '1:1'}`);
                    }
                    if (fc.name === 'image_editing_op') {
                        const targetImage = pendingFiles.find(f => f.isImage);
                        if (targetImage) {
                             handleAlchemy(fc.args.prompt);
                        } else {
                             fullText += `\n[SYSTEM] I attempted to edit an image but no subject was attached. Please provide the image you want me to modify.`;
                        }
                    }
                }
            }
            setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { 
                ...msg, 
                text: fullText,
                mapsGrounding: groundingChunks.map(c => ({
                    title: c.maps?.title || c.web?.title || 'Intelligence Chunk',
                    uri: c.maps?.uri || c.web?.uri || ''
                })).filter(c => c.uri)
            } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, status: 'complete' } : msg));
        setPendingFiles([]);
    } catch (error: any) {
        const isQuota = error.message?.includes('429') || error.message?.includes('quota');
        const isNotFound = error.message?.includes("Requested entity was not found.");
        if (isQuota) setQuotaError(true);
        if (isNotFound && window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
        }
        setMessages(prev => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: isQuota ? "Tactical uplink saturated. Switch to Private Uplink to continue mission." : `Core Error: ${error.message}`, status: 'error' } : msg));
    } finally {
        setIsLoading(false);
    }
  }, [input, messages, setMessages, pendingFiles, currentEmotion, setTheme]);

  const handleGenerateMedia = async (command: string, attachment?: { data: string, mimeType: string }) => {
      setIsLoading(true);
      const isVideo = command.startsWith("Generate a video of:");
      const aiResponseId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiResponseId, text: isVideo ? 'Engaging Veo Animate...' : 'Engaging Forge Synthesis...', sender: 'ai', status: 'generating' }]);
      try {
          if (isVideo) {
            const prompt = command.split('|')[0].replace("Generate a video of:", "").trim();
            const arMatch = command.match(/aspectRatio:\s*([\d:]+)/);
            const aspectRatio = (arMatch ? arMatch[1] : "16:9") as '16:9' | '9:16';
            const videoUrl = await generateVideoVeo(prompt, attachment?.data, attachment?.mimeType, aspectRatio);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? {
                ...m,
                text: "Veo synthesis complete, Captain. Motion data stabilized.",
                status: 'complete',
                media: { type: 'video', url: videoUrl, prompt: prompt, status: 'complete' }
            } : m));
          } else {
            const prompt = command.split('|')[0].replace("Generate an image of:", "").trim();
            const arMatch = command.match(/aspectRatio:\s*([\d:]+)/);
            const szMatch = command.match(/imageSize:\s*([\w]+)/);
            const aspectRatio = arMatch ? arMatch[1] : "1:1";
            const imageSize = szMatch ? szMatch[1] : "1K";
            const { imageUrl, textResponse } = await generateImagePro(prompt, aspectRatio, imageSize);
            setMessages(prev => prev.map(m => m.id === aiResponseId ? {
                ...m,
                text: textResponse || "Synthesis complete, Captain.",
                status: 'complete',
                media: { type: 'image', url: imageUrl, prompt: prompt, status: 'complete' }
            } : m));
          }
      } catch (err: any) {
          console.error("Synthesis Failure:", err);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: `Synthesis failure: ${err.message}`, status: 'error' } : m));
      } finally {
          setIsLoading(false);
      }
  };

  const handleAlchemy = async (prompt: string) => {
      const pendingImage = pendingFiles.find(f => f.isImage);
      if (!pendingImage || !pendingImage.preview) {
          alert("Captain, provide an image subject for Alchemy first.");
          return;
      }
      setIsLoading(true);
      const aiResponseId = Date.now().toString();
      setMessages(prev => [...prev, { id: aiResponseId, text: 'Alchemy in progress...', sender: 'ai', status: 'generating' }]);
      try {
          const b64 = pendingImage.preview.split(',')[1];
          const { editedImageUrl, textResponse } = await editImageWithAI(b64, pendingImage.file.type, prompt);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? {
              ...m,
              text: textResponse || "Alchemy complete.",
              status: 'complete',
              media: { type: 'image', url: editedImageUrl, prompt: prompt, status: 'complete' }
          } : m));
          setPendingFiles(prev => prev.filter(f => f.id !== pendingImage.id));
      } catch (err: any) {
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: `Alchemy failure: ${err.message}`, status: 'error' } : m));
      } finally {
          setIsLoading(false);
      }
  };

  const handleSwitchUplink = async () => {
    if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setQuotaError(false);
        handleSend(messages[messages.length - 1]?.text); 
    }
  };

  const handleEditMediaFromChat = useCallback((msg: Message) => {
    if (msg.media?.url && msg.media.type === 'image') {
        fetch(msg.media.url)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "re-edit-subject.png", { type: blob.type });
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPendingFiles(prev => [...prev, {
                        id: 'edit-' + Date.now(),
                        file,
                        preview: e.target?.result as string,
                        isImage: true
                    }]);
                };
                reader.readAsDataURL(file);
            });
    }
  }, []);

  return (
    <div className={`relative flex flex-col h-full bg-base p-4 overflow-hidden`}>
      <HUDOverlay 
        isLoading={isLoading || isDictating || isVoiceActive} 
        activeForge={!!activeForge} 
        currentEmotion={currentEmotion} 
        isBioSyncing={isBioSyncing || isDictating || isVoiceActive} 
        activeDataTransfer={isLoading} 
        activeChaosEngine={true} 
      />
      
      {quotaError && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md p-4 bg-danger/10 border border-danger/40 backdrop-blur-xl rounded-xl shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-danger font-mono font-bold text-xs uppercase mb-2 flex items-center">
                  <span className="mr-2 animate-pulse">⚠️</span> Uplink Saturated (Quota Exceeded)
              </h3>
              <p className="text-[10px] text-secondary/80 font-mono mb-4">Shared mission frequencies are crowded. Switch to your private tactical uplink (API Key) to restore communications.</p>
              <div className="flex space-x-3">
                  <button onClick={handleSwitchUplink} className="flex-1 py-2 bg-danger text-white text-[10px] font-mono font-bold rounded hover:bg-danger/80 transition-all flex items-center justify-center space-x-2">
                      <KeyIcon />
                      <span>Switch to Private Uplink</span>
                  </button>
                  <button onClick={() => setQuotaError(false)} className="p-2 text-secondary hover:text-white"><XIcon /></button>
              </div>
          </div>
      )}

      {(isLiveSyncActive || isVoiceActive) && (
        <div className="absolute top-24 left-8 z-10 flex flex-col space-y-2">
            {isLiveSyncActive && <LiveSyncStatus isActive={true} />}
            {isVoiceActive && (
                <div className="bg-primary/20 border border-primary/40 rounded-full px-4 py-1 flex items-center space-x-2 animate-pulse">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest">Live_Synapse_Active</span>
                </div>
            )}
        </div>
      )}
      
      {isCameraActive && !isStreamMode && (
          <CameraView 
            onClose={() => setIsCameraActive(false)}
            onCapture={handleCameraCapture}
          />
      )}

      <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${isStreamMode ? 'pt-4' : 'pt-20'}`}>
          <div className="space-y-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onEditMedia={handleEditMediaFromChat} />
            ))}
            <div ref={chatEndRef} />
          </div>
      </div>
      
      {!isStreamMode && (
        <div className="pt-4 mt-auto">
          {pendingFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2 animate-in slide-in-from-bottom-2">
                  {pendingFiles.map((pf) => (
                    <div key={pf.id} className="relative group flex items-center p-2 bg-layer-1 rounded-lg border border-primary/30 min-w-[150px] max-w-[250px]">
                        {pf.isImage && pf.preview ? (
                            <img src={pf.preview} alt="upload preview" className="w-10 h-10 object-cover rounded border border-primary/20 mr-2" />
                        ) : (
                            <div className="w-10 h-10 bg-layer-2 rounded flex items-center justify-center mr-2"><PaperclipIcon /></div>
                        )}
                        <span className="text-[10px] font-mono text-secondary truncate flex-1">{pf.file.name}</span>
                        <button onClick={() => removePendingFile(pf.id)} className="p-1 text-secondary/40 hover:text-danger"><XIcon /></button>
                    </div>
                  ))}
              </div>
          )}
          
          <div className="flex items-center space-x-2 relative">
             <div className="relative">
                <button 
                  onClick={() => setIsPowersOpen(!isPowersOpen)}
                  className={`p-3 rounded-full transition-all duration-300 ${isPowersOpen ? 'bg-primary text-black rotate-45 shadow-[0_0_15px_var(--color-primary)]' : 'bg-layer-2 text-primary hover:bg-layer-3'}`}
                  aria-label="Toggle Chaos Powers"
                >
                  <ZapIcon />
                </button>
                {isPowersOpen && <PowersDropdown onPowerClick={(p) => { setInput(p); setIsPowersOpen(false); }} onClose={() => setIsPowersOpen(false)} />}
             </div>

             <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-layer-2 text-secondary hover:bg-layer-3 hover:text-primary transition-all"
                aria-label="Attach Intel"
                title="Attach Files/Code"
             >
                <PaperclipIcon />
             </button>
             <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

             <button 
                onClick={() => setIsCameraActive(true)}
                className="p-3 rounded-full bg-layer-2 text-secondary hover:bg-layer-3 hover:text-primary transition-all"
                aria-label="Optical Link"
                title="Camera/Vision Capture"
             >
                <VideoCameraIcon />
             </button>

             <div className="flex-1 relative flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                  }}
                  placeholder="Issue command to FuXStiXX..."
                  className="w-full bg-layer-2 border border-layer-3 rounded-full py-3 px-6 pr-12 text-secondary focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none h-12 custom-scrollbar font-mono text-sm leading-tight"
                />
                <div className="absolute right-2 flex items-center space-x-1">
                    {MEDIA_QUICK_ACTIONS.map(action => (
                        <button
                            key={action.type}
                            onClick={() => setActiveForge(action.type)}
                            className="p-2 text-secondary/40 hover:text-primary transition-colors text-lg"
                            title={action.name}
                        >
                            {action.emoji}
                        </button>
                    ))}
                </div>
             </div>

             <button
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
                className="p-3 rounded-full bg-primary text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_var(--color-primary)]"
             >
                <SendIcon />
             </button>

             <button
                onClick={toggleDictation}
                className={`p-3 rounded-full transition-all duration-300 ${isDictating || isVoiceActive ? 'bg-danger text-white animate-pulse shadow-[0_0_15px_#f85149]' : 'bg-layer-2 text-secondary hover:text-primary'}`}
                aria-label="Voice Link"
             >
                <MicrophoneIcon />
             </button>
          </div>
        </div>
      )}

      {activeForge && (
          <MediaForge 
            type={activeForge} 
            onClose={() => setActiveForge(null)} 
            onExecute={(p, att) => { handleSend(p, att); setActiveForge(null); }} 
          />
      )}
    </div>
  );
});

export default ChatInterface;