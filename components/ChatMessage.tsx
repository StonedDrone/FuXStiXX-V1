import React, { useEffect, useRef } from 'react';
import { Message, Sender } from '../types';
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

interface ChatMessageProps {
  message: Message;
  onEditMedia: (message: Message) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onEditMedia }) => {
  const isAI = message.sender === 'ai';
  // FIX: Corrected typo in type from HTMLDivDivElement to HTMLDivElement.
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && (window as any).marked) {
      if (message.text) {
        const dirtyHtml = (window as any).marked.parse(message.text, { gfm: true, breaks: true, async: false });
        const sanitizedHtml = dirtyHtml.replace(/<script.*?>.*?<\/script>/gi, '');
        contentRef.current.innerHTML = sanitizedHtml;
      } else {
        contentRef.current.innerHTML = ''; // Clear content if text is empty
      }
    }
  }, [message.text]);

  const Avatar = ({ sender }: { sender: Sender }) => {
    const iconClass = "w-8 h-8 p-1.5 rounded-full";
    if (message.isLiveStream) {
        return <div className={`${iconClass} bg-green-500/50 text-black`}><StreamIcon /></div>
    }
    if (message.isLiveSyncUpdate) {
        return <div className={`${iconClass} bg-blue-500/50 text-black`}><SyncIcon /></div>
    }
    if (sender === 'ai') {
        return <div className={`${iconClass} bg-accent text-black`}><BotIcon /></div>
    }
    return <div className={`${iconClass} bg-layer-3 text-secondary`}><UserIcon /></div>
  };

  return (
    <div className={`flex items-start gap-4 ${isAI ? '' : 'flex-row-reverse'}`}>
      <div className="flex-shrink-0">
          <Avatar sender={message.sender} />
      </div>
      <div className={`w-full max-w-2xl px-4 py-3 rounded-lg ${
        message.isLiveStream
        ? 'bg-layer-1 border border-dashed border-green-500/50'
        : message.isLiveSyncUpdate
        ? 'bg-layer-1 border border-dashed border-blue-500/50'
        : isAI 
        ? 'bg-layer-1' 
        : 'bg-accent text-black'
      }`}>
        {message.status === 'generating' && !message.text && !message.media && !message.huggingFaceData && !message.financialData && (
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
        >
        </div>
        {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
                {message.attachments.map((att, index) => (
                    <div key={index} className={`flex items-center rounded-full pl-2 pr-3 py-1 text-sm ${
                        isAI 
                        ? 'bg-layer-2 text-secondary' 
                        : 'bg-lime-200 text-black'
                    }`}>
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
                            <span className="text-sm">
                                {message.media.type === 'video' 
                                    ? "Synthesizing video... this may take a few minutes, Captain."
                                    : message.media.type === 'audio'
                                    ? "Synthesizing audio track..."
                                     : message.media.type === 'vr'
                                    ? "Forging VR scene..."
                                    : message.media.type === 'creativeCode'
                                    ? "Writing creative code..."
                                    : message.media.type === 'uiMockup'
                                    ? "Generating UI mockup..."
                                    : message.media.type === 'motionFx'
                                    ? "Crafting motion effect..."
                                    : message.media.type === 'algoVisualization'
                                    ? "Visualizing algorithm..."
                                    : "Generating image..."}
                            </span>
                        </div>
                    )}
                    {message.media.status === 'complete' && (message.media.type === 'image' || message.media.type === 'video') && (
                        <div className="inline-block relative group">
                            {message.media.type === 'image' && message.media.url && (
                                <img src={message.media.url} alt={message.media.prompt} className="rounded-lg max-w-full sm:max-w-sm border-2 border-layer-3" />
                            )}
                            {message.media.type === 'video' && message.media.url && (
                                <video src={message.media.url} controls className="rounded-lg max-w-full sm:max-w-sm border-2 border-layer-3" />
                            )}
                            <button
                                onClick={() => onEditMedia(message)}
                                className="absolute top-2 right-2 p-2 rounded-full bg-base/50 text-secondary hover:bg-base hover:text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label="Edit this media"
                                title="Edit this media"
                            >
                                <EditIcon />
                            </button>
                        </div>
                    )}
                    {message.media.status === 'complete' && message.media.type === 'audio' && message.media.url && (
                        <audio src={message.media.url} controls className="w-full sm:max-w-sm" />
                    )}
                    {message.media.status === 'complete' && message.media.type === 'vr' && message.media.content && (
                        <VRSceneViewer sceneHtml={message.media.content} />
                    )}
                    {message.media.status === 'complete' && message.media.type === 'creativeCode' && message.media.content && (
                        <CreativeCodeViewer sketchJs={message.media.content} />
                    )}
                    {message.media.status === 'complete' && message.media.type === 'uiMockup' && message.media.content && (
                        <UIMockupViewer htmlContent={message.media.content} />
                    )}
                    {message.media.status === 'complete' && message.media.type === 'motionFx' && message.media.content && (
                        <MotionFXViewer htmlContent={message.media.content} />
                    )}
                    {message.media.status === 'complete' && message.media.type === 'algoVisualization' && message.media.content && (
                        <AlgorithmVisualizer htmlContent={message.media.content} />
                    )}
                    {message.media.status === 'error' && (
                        <p className="text-sm text-danger font-mono">Generation failed, Captain.</p>
                    )}
                </div>
            </div>
        )}
        {message.huggingFaceData && (
            <HuggingFaceResult data={message.huggingFaceData} />
        )}
        {message.financialData && (
            <FinancialDataView data={message.financialData} />
        )}
        {message.workflowData && (
            <WorkflowDataView data={message.workflowData} />
        )}
        {message.transcriptionData && (
            <TranscriptionView data={message.transcriptionData} />
        )}
        {message.knowledgeBaseData && (
            <KnowledgeBaseView data={message.knowledgeBaseData} />
        )}
        {message.neuralArchitectureData && (
            <NeuralArchitectureView data={message.neuralArchitectureData} />
        )}
        {message.userSimulationData && (
            <UserSimulationView data={message.userSimulationData} />
        )}
        {message.hexDumpData && (
            <HexView data={message.hexDumpData} />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;