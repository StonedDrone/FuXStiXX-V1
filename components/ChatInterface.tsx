
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { GoogleGenAI, Blob as GeminiBlob, LiveServerMessage, Modality, Part } from "@google/genai";
import { Message, Attachment, ActiveModel, DAG, LiveStreamState, HexDumpData, Track, MapGroundingChunk, GitData } from '../types';
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { sendMessageToAI, resetChat } from '../services/geminiService';
import * as gitService from '../services/gitService';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { CameraIcon } from './icons/CameraIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { AttachmentIcon } from './icons/AttachmentIcons';
import { useUIState } from '../contexts/UIStateContext';
import { ZapIcon } from './icons/ZapIcon';
import { PowersDropdown } from './PowersDropdown';
import CameraView from './CameraView';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import HUDOverlay from './HUDOverlay';
import MediaForge from './MediaForge';
import MagicMirrorBox from './MagicMirrorBox';

// --- Media Forge Constants (Exported for MediaForge component) ---
export type QuickActionType = 'image' | 'video' | 'audio' | 'icon' | '3d' | 'ui';

export const MEDIA_QUICK_ACTIONS: { name: string; type: QuickActionType; emoji: string; color: string; prefix: string }[] = [
    { name: "Forge Image", type: 'image', prefix: "Generate an image of: ", emoji: "🎨", color: "#A020F0" },
    { name: "Synth Video", type: 'video', prefix: "Generate a video of: ", emoji: "🎥", color: "#FFA500" },
    { name: "Synth Audio", type: 'audio', prefix: "Generate music of: ", emoji: "🎵", color: "#1DB954" },
    { name: "Icon Forge", type: 'icon', prefix: "Icon Forge | brand: ", emoji: "🌐", color: "#C0C0C0" },
    { name: "3D Magic", type: '3d', prefix: "3D Magic", emoji: "🪄", color: "#8A2BE2" },
    { name: "UI Forge", type: 'ui', prefix: "Generate a UI mockup for: ", emoji: "✨", color: "#4B0082" },
];

// --- Audio Utility Functions ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

const fileToPart = async (file: File): Promise<Part> => {
  const base64 = await blobToBase64(file);
  return {
    inlineData: {
      data: base64,
      mimeType: file.type
    }
  };
};

export interface ChatInterfaceHandle {
  clearChat: () => void;
}

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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPowersOpen, setIsPowersOpen] = useState(false);
  
  const [isHUDVisible, setIsHUDVisible] = useState(true);
  const [activeForgeType, setActiveForgeType] = useState<QuickActionType | null>(null);

  const [hudOps, setHudOps] = useState({ drone: false, data: false, chaos: false });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVisionModeEnabled, setIsVisionModeEnabled] = useState(false);
  const [visionStream, setVisionStream] = useState<MediaStream | null>(null);

  const { theme, isStreamMode, globalAnalyser } = useUIState();
  
  const { 
    isDetecting: isEmotionDetecting, 
    isSyncing: isBioSyncing,
    currentEmotion, 
    startDetection: startEmotionDetection, 
    stopDetection: stopEmotionDetection,
    analyzeImage: analyzeStaticImage
  } = useEmotionDetection();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    clearChat: () => {
      resetChat();
    }
  }));

  useEffect(() => {
    const isChaos = theme === 'chaos' || theme === 'chaotic-pulse';
    setHudOps(prev => ({ ...prev, chaos: isChaos }));
  }, [theme]);

  useEffect(() => {
    if (isVisionModeEnabled) {
      startEmotionDetection();
    } else {
      stopEmotionDetection();
    }
  }, [isVisionModeEnabled, startEmotionDetection, stopEmotionDetection]);

  // Persistent Vision Mode Stream management
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    const startVision = async () => {
      try {
        currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        setVisionStream(currentStream);
        if (pipVideoRef.current) pipVideoRef.current.srcObject = currentStream;
      } catch (err) {
        console.error("Failed to start vision stream:", err);
        setIsVisionModeEnabled(false);
      }
    };

    if (isVisionModeEnabled) startVision();
    else {
      if (visionStream) {
        visionStream.getTracks().forEach(track => track.stop());
        setVisionStream(null);
      }
    }
    return () => { if (currentStream) currentStream.getTracks().forEach(track => track.stop()); };
  }, [isVisionModeEnabled]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    try { localStorage.setItem('fuxstixx-chat-history', JSON.stringify(messages)); } catch (e) {}
  }, [messages]);

  const handleSend = useCallback(async (explicitInput?: string) => {
    const userMessageText = explicitInput || input;
    if ((!userMessageText.trim() && attachments.length === 0) || isLoading) return;

    setIsLoading(true);
    setHudOps(p => ({ ...p, data: true }));

    // Local Bio-Signal Decoding for attachments
    let bioSignalContext = "";
    if (attachments.length > 0) {
        const imageAttachments = attachments.filter(f => f.type.startsWith('image/'));
        for (const file of imageAttachments) {
            const mood = await analyzeStaticImage(file);
            if (mood) {
                bioSignalContext += `\n[BIO_SIGNAL_DECODED: CAPTAIN_MOOD=${mood.emotion.toUpperCase()} (${Math.round(mood.score * 100)}% CONFIDENCE)]`;
            }
        }
    }

    // Include real-time mood if vision is on
    if (isVisionModeEnabled && currentEmotion) {
        bioSignalContext += `\n[LIVE_BIO_SYNC: CURRENT_MOOD=${currentEmotion.emotion.toUpperCase()}]`;
    }

    const enhancedPrompt = bioSignalContext 
        ? `${userMessageText}\n\n${bioSignalContext}` 
        : userMessageText;

    const fileParts = await Promise.all(attachments.map(fileToPart));
    const contentParts = [...fileParts, { text: enhancedPrompt }];

    const githubRegex = /github\.com\/([^\/]+)\/([^\/ \n#?]+)/i;
    const githubMatch = userMessageText.match(githubRegex);
    const isGitOp = /analyze|structure|scout|repo|commits|blame|history/i.test(userMessageText);

    const userMessage: Message = { 
      id: Date.now().toString(), 
      text: userMessageText, 
      sender: 'user',
      attachments: attachments.map(f => ({ name: f.name, type: f.type }))
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);

    const aiResponseId = (Date.now() + 1).toString();
    
    try {
      if (githubMatch) {
        const owner = githubMatch[1];
        const repo = githubMatch[2].replace('.git', '');
        gitService.setTargetRepo(owner, repo);
        setMessages((prev) => [...prev, { id: aiResponseId, text: `Engaging Full Spectrum Scout on **${owner}/${repo}**... Mapping architecture, history, and dependencies.`, sender: 'ai', status: 'generating' }]);
        
        // Parallel Intel Fetch
        const [structure, history, dependencies] = await Promise.all([
          gitService.fetchRepoStructure(),
          gitService.fetchCommitHistory(10),
          gitService.fetchDependencies()
        ]);

        const gitIntelPayload: GitData = {
          repoName: repo,
          repoOwner: owner,
          structure,
          commits: history,
          dependencies
        };

        const analysisPrompt = `Target Repository Intel: ${owner}/${repo}\n\nSTRUCTURE: ${JSON.stringify(structure.slice(0, 40).map(f => f.path))}...\nHISTORY: ${history.length} recent commits analyzed.\nDEPENDENCIES: ${dependencies.length} packages identified.\n\nPlease provide a tactical overview of this codebase. Highlight its core logic, mission-critical dependencies, and recent development trajectory. ${bioSignalContext}`;
        
        const stream = await sendMessageToAI(messages, [{ text: analysisPrompt }]);
        let full = '';
        for await (const chunk of stream) {
          full += chunk.text;
          setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full, status: 'complete', gitData: gitIntelPayload } : msg));
      } else if (isGitOp) {
        setMessages((prev) => [...prev, { id: aiResponseId, text: `Executing specific Git intel operation...`, sender: 'ai', status: 'generating' }]);
        
        const [structure, history, dependencies] = await Promise.all([
          gitService.fetchRepoStructure(),
          gitService.fetchCommitHistory(5),
          gitService.fetchDependencies()
        ]);

        const gitIntelPayload: GitData = {
          repoName: gitService.getRepoName(),
          repoOwner: gitService.getRepoOwner(),
          structure,
          commits: history,
          dependencies
        };

        const stream = await sendMessageToAI(messages, [...fileParts, { text: `User request: ${enhancedPrompt}\nContext: ${gitService.getRepoName()}\nIntel Available: Structure, History, Dependencies.` }]);
        let full = '';
        for await (const chunk of stream) {
          full += chunk.text;
          setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full, status: 'complete', gitData: gitIntelPayload } : msg));
      } else {
        const stream = await sendMessageToAI(messages, contentParts);
        let full = '';
        setMessages((prev) => [...prev, { id: aiResponseId, text: '', sender: 'ai', status: 'generating' }]);
        for await (const chunk of stream) {
          full += chunk.text;
          setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full, status: 'complete' } : msg));
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { id: aiResponseId, text: `Critical failure: ${error.message}`, sender: 'ai', status: 'error' }]);
    } finally {
      setIsLoading(false);
      setHudOps(p => ({ ...p, data: false }));
    }
  }, [input, isLoading, attachments, messages, isVisionModeEnabled, currentEmotion, analyzeStaticImage, setMessages]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) setAttachments(prev => [...prev, ...Array.from(files)]);
    e.target.value = '';
  };

  const themePrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#32CD32';

  return (
    <div 
      className={`relative flex flex-col h-full bg-base p-4 transition-all duration-200 ${isDragging ? 'outline-dashed outline-2 outline-primary' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { 
        e.preventDefault(); 
        setIsDragging(false); 
        const files = e.dataTransfer.files;
        if (files.length > 0) setAttachments(prev => [...prev, ...Array.from(files)]);
      }}
    >
      {isHUDVisible && !isStreamMode && (
        <HUDOverlay 
          isLoading={isLoading} 
          activeForge={activeForgeType !== null} 
          currentEmotion={currentEmotion} 
          isBioSyncing={isBioSyncing}
          activeDroneOp={hudOps.drone}
          activeDataTransfer={hudOps.data}
          activeChaosEngine={hudOps.chaos}
        />
      )}

      {isCameraOpen && <CameraView onClose={() => setIsCameraOpen(false)} onCapture={(f) => { setAttachments(prev => [...prev, f]); setIsCameraOpen(false); }} />}
      
      {activeForgeType && (
        <MediaForge 
            type={activeForgeType} 
            onClose={() => setActiveForgeType(null)} 
            onExecute={(p) => { handleSend(p); setActiveForgeType(null); }} 
        />
      )}

      {isVisionModeEnabled && !isStreamMode && (
        <div className="absolute bottom-24 right-8 w-48 aspect-video bg-black border-2 border-primary rounded-lg overflow-hidden z-10 shadow-lg shadow-primary/20 animate-in fade-in zoom-in duration-300">
            <video ref={pipVideoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary/20 backdrop-blur-sm rounded text-[8px] font-mono text-primary uppercase border border-primary/20">
                Bio_Sync_Active
            </div>
        </div>
      )}

      {!isStreamMode && (
        <div className="absolute top-20 right-8 z-10 pointer-events-none sm:pointer-events-auto">
          <MagicMirrorBox 
              analyser={globalAnalyser} 
              color={themePrimaryColor} 
              intensity={isLoading ? 0.9 : 0.4} 
              isActive={!isStreamMode}
          />
        </div>
      )}

      <div className={`flex-1 overflow-y-auto pr-2 ${isStreamMode ? 'pt-4' : 'pt-16'}`}>
        <div className="space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onEditMedia={() => {}} />
          ))}
        </div>
        <div ref={chatEndRef} />
      </div>
      
      {!isStreamMode && (
        <div className="pt-4 mt-auto">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-1">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center space-x-2 bg-layer-2 border border-primary/20 rounded-lg px-2 py-1.5 text-xs text-secondary shadow-lg">
                  <AttachmentIcon fileType={file.type} />
                  <span className="truncate max-w-[150px] font-mono">{file.name}</span>
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="p-1 hover:text-danger"><XIcon /></button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-center">
              <button onClick={() => setIsPowersOpen(!isPowersOpen)} className="p-2 mr-2 rounded-full bg-layer-1 text-secondary hover:text-primary transition-colors"><ZapIcon /></button>
              <textarea 
                  ref={textAreaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
                  placeholder="Command the Chaos Engine..."
                  className="w-full bg-layer-1 border border-layer-3 rounded-lg p-3 pr-[160px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
                  rows={1} 
              />
              <div className="absolute right-3 flex items-center space-x-1">
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 text-secondary hover:text-primary" title="Upload Mission Intel"><PaperclipIcon /></button>
                  <button onClick={() => setIsVisionModeEnabled(!isVisionModeEnabled)} className={`p-2 rounded-lg transition-all ${isVisionModeEnabled ? 'text-primary bg-primary/10' : 'text-secondary'}`} title="Continuous Vision Mode"><VideoCameraIcon /></button>
                  <button onClick={() => setIsCameraOpen(true)} className="p-2 text-secondary hover:text-primary" title="Camera Snapshot"><CameraIcon /></button>
                  <button onClick={() => handleSend()} className="p-2 bg-primary text-black rounded-lg hover:scale-105" title="Transmit Message"><SendIcon /></button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
              {isPowersOpen && (
                <PowersDropdown 
                    onPowerClick={(p) => { 
                        const isForgePower = MEDIA_QUICK_ACTIONS.find(a => p.startsWith(a.prefix) || p === a.name);
                        if (isForgePower) {
                            setActiveForgeType(isForgePower.type);
                        } else {
                            setInput(p); 
                        }
                        setIsPowersOpen(false); 
                    }} 
                    onClose={() => setIsPowersOpen(false)} 
                />
              )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatInterface;
