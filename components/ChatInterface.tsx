
import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { GoogleGenAI, Blob as GeminiBlob, LiveServerMessage, Modality } from "@google/genai";
import { Message, Attachment, ActiveModel, DAG, LiveStreamState, HexDumpData, Track, MapGroundingChunk } from '../types';
import { CHECK_IN_PROMPT, AI_PERSONA_INSTRUCTION } from '../constants';
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
import * as gitService from '../services/gitService';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { CameraIcon } from './icons/CameraIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { AttachmentIcon } from './icons/AttachmentIcons';
import { useUIState, Theme } from '../contexts/UIStateContext';
import { ZapIcon } from './icons/ZapIcon';
import { PowersDropdown } from './PowersDropdown';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import CameraView from './CameraView';
import ObjectDetectionView from './ObjectDetectionView';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { usePoseDetection } from '../hooks/usePoseDetection';
import ScreenStreamView from './ScreenStreamView';
import HUDOverlay from './HUDOverlay';
import MediaForge from './MediaForge';
import MagicMirrorBox from './MagicMirrorBox';

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

function createBlob(data: Float32Array): GeminiBlob {
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

export type QuickActionType = 'image' | 'video' | 'audio' | 'icon' | '3d' | 'ui';

export const MEDIA_QUICK_ACTIONS: { name: string; type: QuickActionType; emoji: string; color: string; prefix: string }[] = [
    { name: "Forge Image", type: 'image', prefix: "Generate an image of: ", emoji: "🎨", color: "#A020F0" },
    { name: "Synth Video", type: 'video', prefix: "Generate a video of: ", emoji: "🎥", color: "#FFA500" },
    { name: "Synth Audio", type: 'audio', prefix: "Generate music of: ", emoji: "🎵", color: "#1DB954" },
    { name: "Icon Forge", type: 'icon', prefix: "Icon Forge | brand: ", emoji: "🌐", color: "#C0C0C0" },
    { name: "3D Magic", type: '3d', prefix: "3D Magic", emoji: "🪄", color: "#8A2BE2" },
    { name: "UI Forge", type: 'ui', prefix: "Generate a UI mockup for: ", emoji: "✨", color: "#4B0082" },
];

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
  
  const [isHUDVisible, setIsHUDVisible] = useState(true);
  const [activeForgeType, setActiveForgeType] = useState<QuickActionType | null>(null);

  const [hudOps, setHudOps] = useState({
      drone: false,
      data: false,
      chaos: false
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVisionModeEnabled, setIsVisionModeEnabled] = useState(false);
  const [visionStream, setVisionStream] = useState<MediaStream | null>(null);

  const [isScanViewOpen, setIsScanViewOpen] = useState(false);
  const [isScreenStreamOpen, setIsScreenStreamOpen] = useState(false);
  const [dags, setDags] = useState<DAG[]>([]);
  const [liveStreamState, setLiveStreamState] = useState<LiveStreamState>({ source: null, status: 'idle' });
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(false);

  const { theme, setTheme, isStreamMode, globalAnalyser } = useUIState();
  
  const { 
    isDetecting: isEmotionDetecting, 
    isSyncing: isBioSyncing,
    currentEmotion, 
    error: emotionError, 
    startDetection: startEmotionDetection, 
    stopDetection: stopEmotionDetection,
  } = useEmotionDetection();

  const { 
    isDetecting: isPoseDetecting, 
    currentPose, 
    error: poseError, 
    startDetection: startPoseDetection, 
    stopDetection: stopPoseDetection,
  } = usePoseDetection();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const powersButtonRef = useRef<HTMLButtonElement>(null);
  const powersDropdownRef = useRef<HTMLDivElement>(null);
  const sendAfterCaptureRef = useRef(false);
  const sendAfterScanRef = useRef(false);
  
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const liveSessionPromiseRef = useRef<Promise<any> | null>(null);
  const audioResourcesRef = useRef<{
    inputAudioContext: AudioContext;
    outputAudioContext: AudioContext;
    stream: MediaStream;
    scriptProcessor: ScriptProcessorNode;
    sources: Set<AudioBufferSourceNode>;
    nextStartTime: number;
    videoStream: MediaStream | null;
    frameInterval: number | null;
  } | null>(null);
  const liveTranscriptsRef = useRef({ userInput: '', aiOutput: '' });

  useImperativeHandle(ref, () => ({
    clearChat: () => {
      setMessages([initialMessage]);
      resetChat();
    }
  }));

  useEffect(() => {
    const isChaos = theme === 'chaos' || theme === 'chaotic-pulse';
    setHudOps(prev => ({ ...prev, chaos: isChaos }));
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem('fuxstixx-chat-history', JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to persist chat history to localStorage", e);
    }
  }, [messages]);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || text.trim() === '') return;
    const utterance = new SpeechSynthesisUtterance(text.replace(/[#*`]/g, ''));
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSend = useCallback(async (explicitInput?: string) => {
    const userMessageText = explicitInput || input;
    if ((!userMessageText.trim() && attachments.length === 0) || isLoading) return;

    // GitHub Repo Detection logic
    const githubRegex = /github\.com\/([^\/]+)\/([^\/ \n#?]+)/i;
    const githubMatch = userMessageText.match(githubRegex);
    
    const isGitOp = /analyze|structure|scout|repo|commits|blame|history/i.test(userMessageText);

    const userMessage: Message = { id: Date.now().toString(), text: userMessageText, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const aiResponseId = (Date.now() + 1).toString();
    
    try {
      if (githubMatch) {
        const owner = githubMatch[1];
        const repo = githubMatch[2].replace('.git', '');
        gitService.setTargetRepo(owner, repo);
        
        setHudOps(p => ({ ...p, data: true }));
        setMessages((prev) => [...prev, { id: aiResponseId, text: `Scouting repository: **${owner}/${repo}**... Gathering intelligence on structure and dependencies.`, sender: 'ai', status: 'generating' }]);
        
        const structure = await gitService.fetchRepoStructure();
        const deps = await gitService.fetchDependencies();
        
        const analysisPrompt = `Target Repository: ${owner}/${repo}\n\nI have retrieved the structure: ${JSON.stringify(structure.slice(0, 50).map(f => f.path))}...\n\nAnd dependencies: ${JSON.stringify(deps.slice(0, 10))}\n\nPlease provide a tactical overview of this repository for the Captain.`;

        const stream = await sendMessageToAI(messages, [{ text: analysisPrompt }]);
        let full = '';
        for await (const chunk of stream) {
          full += chunk.text;
          setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full, status: 'complete', gitData: { type: 'structure', repoName: repo, files: structure } } : msg));

      } else if (isGitOp) {
        setHudOps(p => ({ ...p, data: true }));
        setMessages((prev) => [...prev, { id: aiResponseId, text: `Executing Git operation for **${gitService.getRepoName()}**...`, sender: 'ai', status: 'generating' }]);
        
        let resultData: any = null;
        let contextText = '';

        if (/history|commits|time warp/i.test(userMessageText)) {
            const history = await gitService.fetchCommitHistory();
            resultData = { type: 'history', repoName: gitService.getRepoName(), commits: history };
            contextText = `Commit history acquired. Reviewing ${history.length} signals.`;
        } else if (/blame|ancestry/i.test(userMessageText)) {
            const pathMatch = userMessageText.match(/path:\s*([^\s|]+)/i) || userMessageText.match(/blame analysis\s+([^\s]+)/i);
            const path = pathMatch ? pathMatch[1] : 'README.md';
            const blame = await gitService.fetchBlameAnalysis(path);
            resultData = { type: 'blame', repoName: gitService.getRepoName(), blame, filePath: path };
            contextText = `Blame analysis for \`${path}\` complete. Authorship verified.`;
        } else {
            const structure = await gitService.fetchRepoStructure();
            resultData = { type: 'structure', repoName: gitService.getRepoName(), files: structure };
            contextText = `System scan manifest generated for ${gitService.getRepoName()}.`;
        }

        const stream = await sendMessageToAI(messages, [{ text: `${contextText}\nUser: ${userMessageText}` }]);
        let full = '';
        for await (const chunk of stream) {
          full += chunk.text;
          setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full } : msg));
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: full, status: 'complete', gitData: resultData } : msg));

      } else {
        const stream = await sendMessageToAI(messages, [{ text: userMessageText }]);
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
  }, [input, isLoading, attachments, messages, theme]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const themePrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#32CD32';

  return (
    <div 
      className={`relative flex flex-col h-full bg-base p-4 transition-all duration-200 ${isDragging ? 'outline-dashed outline-2 outline-primary' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
    >
      {isHUDVisible && (
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

      {isCameraOpen && <CameraView onClose={() => setIsCameraOpen(false)} onCapture={(f) => { setAttachments([f]); handleSend(); setIsCameraOpen(false); }} />}
      {isScanViewOpen && <ObjectDetectionView onClose={() => setIsScanViewOpen(false)} onReport={(o) => { setInput(`Report: ${o.join(', ')}`); handleSend(); setIsScanViewOpen(false); }} />}
      
      {activeForgeType && (
        <MediaForge 
            type={activeForgeType} 
            onClose={() => setActiveForgeType(null)} 
            onExecute={(p) => { handleSend(p); setActiveForgeType(null); }} 
        />
      )}

      <div className="absolute top-20 right-8 z-10 pointer-events-none sm:pointer-events-auto">
        <MagicMirrorBox 
            analyser={globalAnalyser} 
            color={themePrimaryColor} 
            intensity={isLoading ? 0.9 : 0.4} 
            isActive={!isStreamMode}
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 pt-16">
        <div className="space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onEditMedia={() => {}} />
          ))}
        </div>
        <div ref={chatEndRef} />
      </div>
      
      {!isStreamMode && (
        <div className="pt-4 mt-auto">
          <div className="relative flex items-center">
              <button
                  ref={powersButtonRef} onClick={() => setIsPowersOpen(!isPowersOpen)}
                  className="p-2 mr-2 rounded-full bg-layer-1 text-secondary hover:text-primary"
              > <ZapIcon /> </button>
              <textarea 
                  ref={textAreaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
                  placeholder="Command the Chaos Engine..."
                  className="w-full bg-layer-1 border border-layer-3 rounded-lg p-3 pr-[120px] text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
                  rows={1} 
              />
              <div className="absolute right-3 flex items-center space-x-2">
                  <button onClick={() => setIsCameraOpen(true)} className="p-2 text-secondary hover:text-primary"><CameraIcon /></button>
                  <button onClick={() => handleSend()} className="p-2 bg-primary text-black rounded-lg hover:scale-105 transition-transform"><SendIcon /></button>
              </div>
              {isPowersOpen && <PowersDropdown onPowerClick={(p) => { setInput(p); setIsPowersOpen(false); }} onClose={() => setIsPowersOpen(false)} />}
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatInterface;
