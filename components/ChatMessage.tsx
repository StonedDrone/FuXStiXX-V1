
import React, { useEffect, useRef } from 'react';
import { Message, Sender, Track } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { AttachmentIcon } from './icons/AttachmentIcons';
import { LoaderIcon } from './icons/LoaderIcon';
import HuggingFaceResult from './HuggingFaceResult';
import FinancialDataView from './FinancialDataView';
import WorkflowDataView from './WorkflowDataView';
import TranscriptionView from './TranscriptionView';
import KnowledgeBaseView from './KnowledgeBaseView';
import NeuralArchitectureView from './NeuralArchitectureView';
import UserSimulationView from './UserSimulationView';
import { StreamIcon } from './icons/StreamIcon';
import VRSceneViewer from './VRSceneViewer';
import CreativeCodeViewer from './CreativeCodeViewer';
import UIMockupViewer from './UIMockupViewer';
import MotionFXViewer from './MotionFXViewer';
import AlgorithmVisualizer from './AlgorithmVisualizer';
import HexView from './HexView';
import { EditIcon } from './icons/EditIcon';
import { SyncIcon } from './icons/SyncIcon';
import VectorStatusView from './VectorStatusView';
import PlaylistAnalysisView from './PlaylistAnalysisView';
import GitHistoryView from './GitHistoryView';
import GitBlameView from './GitBlameView';
import SystemScanView from './SystemScanView';
import { PlusIcon } from './icons/PlusIcon';
import { LinkIcon } from './icons/LinkIcon';

interface ChatMessageProps {
  message: Message;
  onEditMedia: (message: Message) => void;
  onAddToPlaylist?: (track: Track) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEditMedia, onAddToPlaylist }) => {
  const isAI = message.sender === 'ai';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && (window as any).marked) {
      if (message.text) {
        const dirtyHtml = (window as any).marked.parse(message.text, { gfm: true, breaks: true, async: false });
        const sanitizedHtml = dirtyHtml.replace(/<script.*?>.*?<\/script>/gi, '');
        contentRef.current.innerHTML = sanitizedHtml;
      } else {
        contentRef.current.innerHTML = '';
      }
    }
  }, [message.text]);

  const handleSyncToJams = () => {
      if (message.media?.url && onAddToPlaylist) {
          const newTrack: Track = {
              id: `synth-${Date.now()}`,
              title: `Synth: ${message.media.prompt.substring(0, 20)}...`,
              artist: 'FuXStiXX',
              albumArtUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200',
              audioSrc: message.media.url,
              playCount: 0,
              lastPlayed: null
          };
          onAddToPlaylist(newTrack);
      }
  };

  const Avatar = ({ sender }: { sender: Sender }) => {
    const iconClass = "w-8 h-8 p-1.5 rounded-full";
    if (message.isLiveStream) return <div className={`${iconClass} bg-green-500/50 text-black`}><StreamIcon /></div>
    if (message.isLiveSyncUpdate) return <div className={`${iconClass} bg-blue-500/50 text-black`}><SyncIcon /></div>
    if (sender === 'ai') return <div className={`${iconClass} bg-accent text-black`}><BotIcon /></div>
    return <div className={`${iconClass} bg-layer-3 text-secondary`}><UserIcon /></div>
  };

  return (
    <div className={`flex items-start gap-4 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className="flex-shrink-0">
          <Avatar sender={message.sender} />
      </div>
      <div className={`w-full max-w-2xl px-4 py-3 rounded-lg transition-all duration-500 ${
        message.isLiveStream
        ? 'bg-layer-1 border border-dashed border-green-500/50'
        : message.isLiveSyncUpdate
        ? 'bg-layer-1 border border-dashed border-blue-500/50'
        : isAI 
        ? `bg-layer-1 ${message.status === 'generating' ? 'ai-bubble-generating border border-primary/20 shadow-lg' : ''}` 
        : 'bg-accent text-black'
      }`}>
        {message.status === 'generating' && !message.text && !message.media && (
          <div className="flex items-center space-x-2 text-secondary animate-pulse">
              <LoaderIcon />
              <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div 
          ref={contentRef} 
          className={`prose prose-sm prose-invert max-w-none 
            prose-p:my-2 prose-headings:my-3 prose-pre:bg-base prose-pre:p-3 prose-pre:rounded-md 
            prose-code:bg-layer-2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded 
            prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
            ${!isAI ? 'prose-p:text-black prose-strong:text-black prose-headings:text-black prose-a:text-black prose-code:text-secondary' : ''}
          `}
        />
        {message.mapsGrounding && message.mapsGrounding.length > 0 && (
          <div className="mt-4 pt-4 border-t border-layer-3">
             <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-2 flex items-center space-x-2">
                <LinkIcon size={12} />
                <span>Verified Intelligence Chunks</span>
             </p>
             <div className="flex flex-wrap gap-2">
                {message.mapsGrounding.map((chunk, idx) => (
                  <a 
                    key={idx} 
                    href={chunk.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center space-x-1.5 bg-layer-2 border border-layer-3 hover:border-primary/50 px-2.5 py-1 rounded-md text-xs text-secondary transition-colors"
                  >
                    <span>{chunk.title}</span>
                    <span className="text-[10px] text-primary">↗</span>
                  </a>
                ))}
             </div>
          </div>
        )}
        {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
                {message.attachments.map((att, index) => (
                    <div key={index} className={`flex items-center rounded-full pl-2 pr-3 py-1 text-sm ${isAI ? 'bg-layer-2 text-secondary' : 'bg-lime-200 text-black'}`}>
                        <AttachmentIcon fileType={att.type} />
                        <span className="ml-1.5">{att.name}</span>
                    </div>
                ))}
            </div>
        )}
        {message.media && (
            <div className="mt-2">
                <blockquote className={`border-l-4 pl-3 italic text-sm ${isAI ? 'border-layer-3 text-secondary' : 'border-lime-500 text-gray-800'}`}>
                    {message.media.prompt}
                </blockquote>
                <div className="mt-3">
                    {message.media.status === 'generating' && (
                        <div className="flex items-center space-x-2 text-secondary animate-pulse">
                            <LoaderIcon />
                            <span className="text-sm">Synthesizing {message.media.type}...</span>
                        </div>
                    )}
                    {message.media.status === 'complete' && message.media.type === 'audio' && message.media.url && (
                        <div className="flex flex-col space-y-2">
                            <audio src={message.media.url} controls className="w-full sm:max-w-sm" />
                            <button 
                                onClick={handleSyncToJams}
                                className="flex items-center space-x-2 text-[10px] font-mono uppercase tracking-widest text-primary hover:text-white transition-colors border border-primary/20 hover:border-primary/60 px-3 py-1.5 rounded-full w-fit"
                            >
                                <PlusIcon />
                                <span>Inject into Mission Jams</span>
                            </button>
                        </div>
                    )}
                    {message.media.status === 'complete' && (message.media.type === 'image' || message.media.type === 'video') && (
                        <div className="inline-block relative group">
                            {message.media.type === 'image' && message.media.url && <img src={message.media.url} alt={message.media.prompt} className="rounded-lg max-w-full sm:max-w-sm border-2 border-layer-3" />}
                            {message.media.type === 'video' && message.media.url && <video src={message.media.url} controls className="rounded-lg max-w-full sm:max-w-sm border-2 border-layer-3" />}
                            <button onClick={() => onEditMedia(message)} className="absolute top-2 right-2 p-2 rounded-full bg-base/50 text-secondary hover:bg-base hover:text-primary transition-all opacity-0 group-hover:opacity-100"><EditIcon /></button>
                        </div>
                    )}
                    {message.media.status === 'complete' && message.media.type === 'vr' && message.media.content && <VRSceneViewer sceneHtml={message.media.content} />}
                    {message.media.status === 'complete' && message.media.type === 'creativeCode' && message.media.content && <CreativeCodeViewer sketchJs={message.media.content} />}
                    {message.media.status === 'error' && <p className="text-sm text-danger font-mono">Synthesis failure.</p>}
                </div>
            </div>
        )}
        {message.huggingFaceData && <HuggingFaceResult data={message.huggingFaceData} />}
        {message.financialData && <FinancialDataView data={message.financialData} />}
        {message.workflowData && <WorkflowDataView data={message.workflowData} />}
        {message.knowledgeBaseData && <KnowledgeBaseView data={message.knowledgeBaseData} />}
        {message.playlistAnalysisData && <PlaylistAnalysisView data={message.playlistAnalysisData} />}
        {message.hexDumpData && <HexView data={message.hexDumpData} />}
        {message.vectorStatus && <VectorStatusView data={message.vectorStatus} />}
        {message.gitData && message.gitData.type === 'history' && <GitHistoryView data={message.gitData} />}
        {message.gitData && message.gitData.type === 'blame' && <GitBlameView data={message.gitData} />}
        {message.gitData && (message.gitData.type === 'structure' || message.gitData.type === 'dependencies') && <SystemScanView data={message.gitData} />}
      </div>
    </div>
  );
};

export default ChatMessage;
