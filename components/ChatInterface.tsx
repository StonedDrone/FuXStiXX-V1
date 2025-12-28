
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Part } from "@google/genai";
import { Message, ActiveModel } from '../types';
import { sendMessageToAI, resetChat, connectLiveSynapse, editImageWithAI } from '../services/geminiService';
import * as liveSyncService from '../services/liveSyncService';
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

declare const window: any;

export type QuickActionType = 'image' | 'video' | 'audio';

export const MEDIA_QUICK_ACTIONS: { type: QuickActionType; name: string; emoji: string; prefix: string; }[] = [
  { type: 'image', name: 'Forge', emoji: '🎨', prefix: 'Generate an image of: ' },
  { type: 'video', name: 'Synth', emoji: '🎥', prefix: 'Generate a video of: ' },
  { type: 'audio', name: 'Sonic', emoji: '🎵', prefix: 'Generate music of: ' },
];

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
};

const encodePCM = (data: Float32Array) => {
  const int16 = new Int16Array(data.length);
  for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export interface ChatInterfaceHandle { clearChat: () => void; }

interface ChatInterfaceProps {
    activeModel: ActiveModel;
    setActiveModel: (model: ActiveModel) => void;
    isTfReady: boolean;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({ activeModel, setActiveModel, isTfReady, messages, setMessages }, ref) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPowersOpen, setIsPowersOpen] = useState(false);
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [activeForge, setActiveForge] = useState<QuickActionType | null>(null);
  const [pendingImage, setPendingImage] = useState<{ b64: string, mime: string, name: string } | null>(null);
  const { isStreamMode, globalAnalyser } = useUIState();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    currentEmotion, 
    isSyncing: isBioSyncing, 
    startDetection, 
    stopDetection, 
    stream: cameraStream 
  } = useEmotionDetection();
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({ clearChat: () => resetChat() }));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
      if (isCameraActive) {
          startDetection();
      } else {
          stopDetection();
      }
  }, [isCameraActive, startDetection, stopDetection]);

  useEffect(() => {
      if (cameraPreviewRef.current && cameraStream) {
          cameraPreviewRef.current.srcObject = cameraStream;
      }
  }, [cameraStream]);

  const toggleVoiceBridge = async () => {
    if (isVoiceActive) {
      liveSessionRef.current?.close();
      liveSessionRef.current = null;
      setIsVoiceActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      const sessionPromise = connectLiveSynapse({
        onAudioChunk: async (base64) => {
            const data = decodeBase64(base64);
            const buffer = await decodeAudioData(data, ctx);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            
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
        },
        onTranscription: (text, isUser) => {
            console.log(`[SYNAPSE_${isUser ? 'USER' : 'CORE'}]: ${text}`);
        },
        onTurnComplete: () => {
            console.log("Synapse turn complete");
        }
      });

      sessionPromise.then(session => {
        liveSessionRef.current = session;
        const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            session.sendRealtimeInput({ media: { data: encodePCM(inputData), mimeType: 'audio/pcm;rate=16000' } });
        };
        
        source.connect(processor);
        processor.connect(inputCtx.destination);
      });

      setIsVoiceActive(true);
    } catch (e) {
      console.error("Failed to bridge synapse:", e);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
            const b64 = (reader.result as string).split(',')[1];
            setPendingImage({ b64, mime: file.type, name: file.name });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSend = useCallback(async (explicitInput?: string) => {
    const userMessageText = explicitInput || input;
    if (!userMessageText.trim() && !pendingImage || isLoading) return;

    setIsLoading(true);
    setQuotaError(false);

    const userMessage: Message = { 
        id: Date.now().toString(), 
        text: userMessageText, 
        sender: 'user',
        attachments: pendingImage ? [{ name: pendingImage.name, type: pendingImage.mime }] : []
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const aiResponseId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiResponseId, text: '', sender: 'ai', status: 'generating' }]);

    try {
        const parts: Part[] = [{ text: userMessageText }];
        if (pendingImage) {
            parts.push({ inlineData: { data: pendingImage.b64, mimeType: pendingImage.mime } });
        }

        const stream = await sendMessageToAI(messages, parts);
        let fullText = '';
        let groundingChunks: any[] = [];

        for await (const chunk of stream) {
            if (chunk.text) {
                fullText += chunk.text;
            }
            // Capture grounding chunks for Search/Maps
            const metadata = (chunk as any).candidates?.[0]?.groundingMetadata;
            if (metadata?.groundingChunks) {
                groundingChunks = [...groundingChunks, ...metadata.groundingChunks];
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
        setPendingImage(null);
    } catch (error: any) {
        const isQuota = error.message?.includes('429') || error.message?.includes('quota');
        if (isQuota) setQuotaError(true);
        setMessages(prev => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: isQuota ? "Tactical uplink saturated. Switch to Private Uplink to continue mission." : `Core Error: ${error.message}`, status: 'error' } : msg));
    } finally {
        setIsLoading(false);
    }
  }, [input, messages, setMessages, pendingImage]);

  const handleAlchemy = async (prompt: string) => {
      if (!pendingImage) {
          alert("Captain, provide an image subject for Alchemy first.");
          return;
      }
      setIsLoading(true);
      const aiResponseId = Date.now().toString();
      setMessages(prev => [...prev, { id: aiResponseId, text: 'Alchemy in progress...', sender: 'ai', status: 'generating' }]);
      
      try {
          const { editedImageUrl, textResponse } = await editImageWithAI(pendingImage.b64, pendingImage.mime, prompt);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? {
              ...m,
              text: textResponse || "Alchemy complete.",
              status: 'complete',
              media: { type: 'image', url: editedImageUrl, prompt: prompt, status: 'complete' }
          } : m));
          setPendingImage(null);
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
        handleSend(messages[messages.length - 1]?.text); // Retry last message
    }
  };

  return (
    <div className={`relative flex flex-col h-full bg-base p-4 overflow-hidden`}>
      <HUDOverlay 
        isLoading={isLoading} 
        activeForge={!!activeForge} 
        currentEmotion={currentEmotion} 
        isBioSyncing={isBioSyncing} 
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

      {isLiveSyncActive && <div className="absolute top-24 left-8 z-10"><LiveSyncStatus isActive={true} /></div>}
      
      {/* Live Bio-Link Camera Feed */}
      {isCameraActive && !isStreamMode && (
          <div className="absolute top-24 right-10 z-10 w-64 aspect-video bg-black border border-primary/40 rounded shadow-2xl shadow-primary/10 animate-in fade-in zoom-in duration-500 group">
              <video 
                  ref={cameraPreviewRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover grayscale brightness-125 opacity-70 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 border-[1px] border-primary/20 pointer-events-none"></div>
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary/20 backdrop-blur-sm rounded-sm text-[7px] font-mono text-primary uppercase tracking-widest border border-primary/40 animate-pulse">
                  Bio_Link_Optical
              </div>
              {currentEmotion && (
                  <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-sm border border-primary/10 text-[9px] font-mono text-primary flex justify-between items-center">
                      <span className="uppercase">{currentEmotion.emotion}</span>
                      <span>{(currentEmotion.score * 100).toFixed(0)}%</span>
                  </div>
              )}
          </div>
      )}

      <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${isStreamMode ? 'pt-4' : 'pt-20'}`}>
          <div className="space-y-6">{messages.map((msg) => (<ChatMessage key={msg.id} message={msg} onEditMedia={() => {}} />))}<div ref={chatEndRef} /></div>
      </div>
      
      {!isStreamMode && (
        <div className="pt-4 mt-auto">
          {pendingImage && (
              <div className="mb-2 flex items-center p-2 bg-layer-1 rounded-lg border border-primary/30 animate-in slide-in-from-bottom-2">
                  <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center mr-3 overflow-hidden">
                      <img src={`data:${pendingImage.mime};base64,${pendingImage.b64}`} className="w-full h-full object-cover" alt="pending" />
                  </div>
                  <span className="text-xs font-mono text-secondary truncate flex-1">{pendingImage.name}</span>
                  <button onClick={() => setPendingImage(null)} className="p-1 text-gray-500 hover:text-danger"><XIcon /></button>
              </div>
          )}
          <div className="relative flex items-center">
              <button onClick={() => setIsPowersOpen(!isPowersOpen)} className="p-2 mr-2 rounded-full bg-layer-1 text-secondary hover:text-primary transition-colors"><ZapIcon /></button>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Command the Chaos Engine..." className="w-full bg-layer-1 border border-layer-3 rounded-lg p-3 pr-[180px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm" rows={1} />
              <div className="absolute right-3 flex items-center space-x-1">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-secondary hover:text-primary transition-all" title="Uplink Image Data"><PaperclipIcon /></button>
                  <button onClick={() => setIsCameraActive(!isCameraActive)} className={`p-2 rounded-lg transition-all ${isCameraActive ? 'text-primary bg-primary/10' : 'text-secondary hover:text-primary'}`} title="Toggle Bio-Sync Camera"><VideoCameraIcon /></button>
                  <button onClick={toggleVoiceBridge} className={`p-2 rounded-lg transition-all ${isVoiceActive ? 'text-primary bg-primary/10 animate-pulse' : 'text-secondary hover:text-primary'}`} title="Live Synapse (Voice Mode)"><MicrophoneIcon /></button>
                  <button onClick={() => handleSend()} className="p-2 bg-primary text-black rounded-lg hover:scale-105" title="Transmit Message"><SendIcon /></button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              {isPowersOpen && <PowersDropdown onPowerClick={(p) => { 
                if (p.startsWith("Generate an image of:")) setActiveForge('image');
                else if (p.startsWith("Generate a video of:")) setActiveForge('video');
                else if (p.startsWith("Generate music of:")) setActiveForge('audio');
                else if (p.startsWith("Image Alchemy")) {
                    const promptPart = p.split('| prompt: ')[1] || '';
                    if (pendingImage) handleAlchemy(promptPart);
                    else alert("Captain, provide an image subject for Alchemy first.");
                }
                else setInput(p);
                setIsPowersOpen(false); 
              }} onClose={() => setIsPowersOpen(false)} />}
          </div>
        </div>
      )}

      {activeForge && (
        <MediaForge 
          type={activeForge} 
          onClose={() => setActiveForge(null)} 
          onExecute={(p) => {
            handleSend(p);
            setActiveForge(null);
          }}
        />
      )}
    </div>
  );
});

export default ChatInterface;
