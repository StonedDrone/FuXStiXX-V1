
import React, { useEffect, useRef } from 'react';
import { Message, Sender } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { AttachmentIcon } from './icons/AttachmentIcons';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && (window as any).marked) {
      const dirtyHtml = (window as any).marked.parse(message.text || '', { gfm: true, breaks: true, async: false });
       // Basic sanitization for safety
      const sanitizedHtml = dirtyHtml.replace(/<script.*?>.*?<\/script>/gi, '');
      contentRef.current.innerHTML = sanitizedHtml;

      contentRef.current.querySelectorAll('pre code').forEach((block) => {
        // Here you could add a syntax highlighter library if one was available via CDN
        // For now, we'll rely on the prose styles
      });
    }
  }, [message.text]);

  const Avatar = ({ sender }: { sender: Sender }) => {
    const iconClass = "w-8 h-8 p-1.5 rounded-full";
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
        isAI 
        ? 'bg-layer-1' 
        : 'bg-accent text-black'
      }`}>
        <div 
          ref={contentRef} 
          className={`prose prose-sm prose-invert max-w-none 
            prose-p:my-2 prose-headings:my-3 prose-pre:bg-base prose-pre:p-3 prose-pre:rounded-md 
            prose-code:bg-layer-2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded 
            prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
            ${!isAI ? 'prose-p:text-black prose-strong:text-black prose-headings:text-black prose-a:text-black prose-code:text-secondary' : ''}
          `}
        >
          {message.text === '...' && <span className="animate-pulse">...</span>}
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
      </div>
    </div>
  );
};

export default ChatMessage;