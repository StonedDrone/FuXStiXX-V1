
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Attachment } from '../types';
import { CHECK_IN_PROMPT } from '../constants';
import { sendMessageToAI } from '../services/geminiService';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { CameraIcon } from './icons/CameraIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { AttachmentIcon } from './icons/AttachmentIcons';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      text: 'FuXStiXX online. I am your co-pilot, Captain. Ready to progress the Mission. How may I assist?',
      sender: 'ai',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  const handleSend = useCallback(async (prompt?: string) => {
    const userMessageText = prompt || input;
    if ((!userMessageText.trim() && attachments.length === 0) || isLoading) return;

    const messageAttachments: Attachment[] = attachments.map(file => ({
        name: file.name,
        type: file.type,
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMessageText,
      sender: 'user',
      attachments: messageAttachments,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const attachmentsToSend = [...attachments];
    setAttachments([]); // Clear attachments from UI immediately
    setIsLoading(true);

    const aiResponseId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiResponseId,
      text: '',
      sender: 'ai',
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const parts: any[] = [];
      if (userMessageText.trim()) {
          parts.push({ text: userMessageText.trim() });
      }

      if (attachmentsToSend.length > 0) {
          const fileParts = await Promise.all(
              attachmentsToSend.map(async (file) => {
                  const base64Data = await fileToBase64(file);
                  return {
                      inlineData: {
                          mimeType: file.type || 'application/octet-stream',
                          data: base64Data,
                      },
                  };
              })
          );
          parts.push(...fileParts);
      }

      const stream = await sendMessageToAI(parts);
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiResponseId ? { ...msg, text: fullResponse } : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
       setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiResponseId ? { ...msg, text: 'Sorry, I encountered an error. Please check the console or API key.' } : msg
          )
        );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, attachments]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVision = () => {
    handleSend("[Visual Cortex Activated] Analyze the current state of the application's interface and report your findings, co-pilot.");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
        setAttachments(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-base p-4 transition-all duration-200 ${isDragging ? 'outline-dashed outline-2 outline-offset-[-8px] outline-primary' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && messages[messages.length-1].sender === 'user' && (
             <ChatMessage key="loading" message={{id: 'loading', sender: 'ai', text: '...'}} />
          )}
        </div>
        <div ref={chatEndRef} />
      </div>
      
      <div className="pt-4 mt-auto">
        {messages.length <= 1 && (
            <div className="flex justify-center mb-4">
                <button
                    onClick={() => handleSend(CHECK_IN_PROMPT)}
                    className="p-3 px-6 bg-layer-1 border border-layer-3 rounded-lg text-center text-sm hover:bg-layer-2 hover:border-primary transition-colors duration-200"
                >
                    Mission Check-in
                </button>
            </div>
        )}
        {attachments.length > 0 && (
            <div className="mb-2 p-2 bg-layer-1 border border-layer-3 rounded-lg flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {attachments.map((file, index) => (
                    <div key={index} className="flex items-center bg-layer-2 rounded-full pl-2 pr-1 py-1 text-sm text-secondary">
                        <AttachmentIcon fileType={file.type} />
                        <span className="ml-1.5 mr-2 truncate max-w-[200px]">{file.name}</span>
                        <button onClick={() => handleRemoveAttachment(index)} className="p-1 rounded-full hover:bg-layer-3 text-gray-400 hover:text-white">
                            <XIcon />
                        </button>
                    </div>
                ))}
            </div>
        )}
        <div className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Command your co-pilot, Captain... (drag & drop files or zip folders)"
            className="w-full bg-layer-1 border border-layer-3 rounded-lg p-3 pr-32 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono text-sm"
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-3 flex items-center space-x-1">
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200"
                aria-label="Attach files"
                title="Attach files"
            >
                <PaperclipIcon />
            </button>
            <button
                onClick={handleVision}
                disabled={isLoading}
                className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200"
                aria-label="Activate Visual Cortex"
                title="Activate Visual Cortex"
            >
                <CameraIcon />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="p-2 rounded-full bg-accent text-black disabled:bg-layer-3 disabled:text-secondary disabled:cursor-not-allowed hover:bg-primary transition-colors duration-200"
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
       <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect}
        multiple 
        className="hidden" 
        accept="image/*,video/*,application/zip,application/x-zip-compressed,multipart/x-zip,.md,.txt,.py,.js,.ts,.html,.css,.json"
      />
    </div>
  );
};

export default ChatInterface;