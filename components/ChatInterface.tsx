import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Attachment } from '../types';
import { CHECK_IN_PROMPT } from '../constants';
import { sendMessageToAI, generateImageFromAI, generateVideoFromAI, generateAudioFromAI } from '../services/geminiService';
import * as hfService from '../services/huggingFaceService';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons/SendIcon';
import { CameraIcon } from './icons/CameraIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { XIcon } from './icons/XIcon';
import { AttachmentIcon } from './icons/AttachmentIcons';
import { useUIState, Theme } from '../contexts/UIStateContext';

interface ChatInterfaceProps {
  initialInput: string | null;
  onInitialInputUsed: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialInput, onInitialInputUsed }) => {
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
  const { setTheme } = useUIState();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

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
    if (initialInput) {
        setInput(initialInput);
        textAreaRef.current?.focus();
        onInitialInputUsed();
    }
  }, [initialInput, onInitialInputUsed]);

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
  
  const handleHuggingFaceCommand = async (commandString: string) => {
    const aiResponseId = (Date.now() + 1).toString();
    
    const parts = commandString.split('|').map(p => p.trim());
    const commandPart = parts[0];
    const params: Record<string, string> = {};
    parts.slice(1).forEach(part => {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            params[key.trim()] = valueParts.join(':').trim();
        }
    });

    let type: any;
    let promise: Promise<any>;
    let query = {};
    let text = `Accessing Hugging Face Hub, Captain...`;

    try {
        if (commandPart === 'HF Model Query') {
            type = 'modelQuery';
            query = { model: params.model, prompt: params.prompt };
            if (!params.model || !params.prompt) throw new Error("Missing 'model' or 'prompt' parameter for Model Query.");
            text = `Querying model: \`${params.model}\`...`;
            promise = hfService.queryModel(params.model, params.prompt);
        } else if (commandPart === 'HF LLM Search') {
            type = 'modelSearch';
            query = { query: params.query };
             if (!params.query) throw new Error("Missing 'query' parameter for LLM Search.");
            text = `Searching for models matching: \`${params.query}\`...`;
            promise = hfService.searchModels(params.query);
        } else if (commandPart === 'HF Space Explorer') {
            type = 'spaceInfo';
            query = { space: params.space };
             if (!params.space) throw new Error("Missing 'space' parameter for Space Explorer.");
            text = `Exploring Space: \`${params.space}\`...`;
            promise = hfService.getSpaceInfo(params.space);
        } else {
            throw new Error('Unknown Hugging Face command.');
        }

        setMessages(prev => [...prev, { id: aiResponseId, text, sender: 'ai' }]);

        const result = await promise;
        
        setMessages(prev => prev.map(m => m.id === aiResponseId ? {
             ...m,
             text: `Hugging Face operation complete, Captain.`,
             huggingFaceData: { type, query, result }
        } : m));

    } catch (error: any) {
        console.error('Hugging Face command failed:', error);
        const errorMessage = error.message || 'An unknown error occurred.';
        setMessages(prev => {
            const existingMsg = prev.find(m => m.id === aiResponseId);
            if (existingMsg) {
                return prev.map(m => m.id === aiResponseId ? {
                     ...m,
                     text: `Hugging Face operation failed, Captain.`,
                     huggingFaceData: { type, query, result: null, error: errorMessage }
                } : m);
            }
            // If the loading message wasn't even set, add a new error message
            return [...prev, {
                id: aiResponseId,
                sender: 'ai',
                text: `Hugging Face operation failed, Captain.`,
                huggingFaceData: { type, query, result: null, error: errorMessage }
            }];
        });
    }
  };

  const handleSend = useCallback(async () => {
    const userMessageText = input;
    if ((!userMessageText.trim() && attachments.length === 0) || isLoading || !isOnline) return;

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
    setAttachments([]);
    setIsLoading(true);

    const imagePromptPrefix = "Generate an image of: ";
    const videoPromptPrefix = "Generate a video of: ";
    const audioPromptPrefix = "Generate music of: ";
    const hfPrefix = "HF ";

    try {
      if (userMessageText.startsWith(hfPrefix)) {
          await handleHuggingFaceCommand(userMessageText);
      } else if (userMessageText.startsWith(imagePromptPrefix)) {
          const prompt = userMessageText.substring(imagePromptPrefix.length);
          const aiResponseId = (Date.now() + 1).toString();
          setMessages(prev => [...prev, { id: aiResponseId, text: "Forging image...", sender: 'ai', media: { type: 'image', prompt, status: 'generating', url: '' } }]);
          const imageUrl = await generateImageFromAI(prompt);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Image generation complete, Captain.", media: { type: 'image', prompt, status: 'complete', url: imageUrl } } : m));

      } else if (userMessageText.startsWith(videoPromptPrefix)) {
          const prompt = userMessageText.substring(videoPromptPrefix.length);
          const aiResponseId = (Date.now() + 1).toString();
          setMessages(prev => [...prev, { id: aiResponseId, text: "Synthesizing video...", sender: 'ai', media: { type: 'video', prompt, status: 'generating', url: '' } }]);
          const videoUrl = await generateVideoFromAI(prompt);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Video synthesis complete, Captain.", media: { type: 'video', prompt, status: 'complete', url: videoUrl } } : m));

      } else if (userMessageText.startsWith(audioPromptPrefix)) {
          const prompt = userMessageText.substring(audioPromptPrefix.length);
          const aiResponseId = (Date.now() + 1).toString();
          setMessages(prev => [...prev, { id: aiResponseId, text: "Synthesizing audio...", sender: 'ai', media: { type: 'audio', prompt, status: 'generating', url: '' } }]);
          const audioUrl = await generateAudioFromAI(prompt);
          setMessages(prev => prev.map(m => m.id === aiResponseId ? { ...m, text: "Sonic synthesis complete, Captain.", media: { type: 'audio', prompt, status: 'complete', url: audioUrl } } : m));

      } else {
        const parts: any[] = [];
        if (userMessageText.trim()) {
            parts.push({ text: userMessageText.trim() });
        }
        if (attachments.length > 0) {
            const fileParts = await Promise.all(
                attachments.map(async (file) => ({
                    inlineData: { mimeType: file.type || 'application/octet-stream', data: await fileToBase64(file) }
                }))
            );
            parts.push(...fileParts);
        }

        const aiResponseId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: aiResponseId, text: '', sender: 'ai' }]);

        const stream = await sendMessageToAI([...messages], parts);
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
            if (command.theme && ['normal', 'analyzing', 'chaos', 'stealth', 'overdrive'].includes(command.theme)) {
              setTheme(command.theme as Theme);
            }
          } catch (e) { console.error("Failed to parse FUX_STATE command:", e); }
          messageToDisplay = fullResponse.replace(commandRegex, '').trim();
        }
        setMessages((prev) => prev.map((msg) => msg.id === aiResponseId ? { ...msg, text: messageToDisplay } : msg));
      }
    } catch (error) {
      console.error('Error in handleSend:', error);
      const errorId = (Date.now() + 1).toString();
      const errorMessage = { id: errorId, text: 'Sorry, I encountered an error. Please check the console, your API key, or network connection.', sender: 'ai' };
      // Check if the last message was a generating message and update it, otherwise add a new error message.
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.sender === 'ai' && (lastMsg.media?.status === 'generating' || lastMsg.huggingFaceData)) {
             if (lastMsg.media) {
                return prev.map(m => m.id === lastMsg.id ? { ...m, text: "Generation failed, Captain.", media: { ...m.media!, status: 'error' } } : m);
             }
             if (lastMsg.huggingFaceData) {
                 return prev.map(m => m.id === lastMsg.id ? { ...m, text: `Hugging Face operation failed.`, huggingFaceData: { ...m.huggingFaceData!, error: (error as Error).message } } : m)
             }
        }
        return [...prev, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, attachments, messages, isOnline, setTheme]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVision = () => {
    setInput("[Visual Cortex Activated] Analyze the current state of the application's interface and report your findings, co-pilot.");
    setTimeout(() => handleSend(), 0); 
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
          {isLoading && messages[messages.length-1]?.sender === 'user' && (
             <ChatMessage key="loading" message={{id: 'loading', sender: 'ai', text: '...'}} />
          )}
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
         {!isOnline && (
            <div className="text-center text-xs text-danger mb-2 font-mono">
                SYSTEM OFFLINE - Connection to mothership lost.
            </div>
        )}
        <div className="relative flex items-center">
          <textarea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isOnline ? "Command your co-pilot, Captain... (drag & drop files or zip folders)" : "System is offline..."}
            className="w-full bg-layer-1 border border-layer-3 rounded-lg p-3 pr-32 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent resize-none font-mono text-sm disabled:opacity-50"
            rows={1}
            disabled={isLoading || !isOnline}
          />
          <div className="absolute right-3 flex items-center space-x-1">
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !isOnline}
                className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200"
                aria-label="Attach files"
                title="Attach files"
            >
                <PaperclipIcon />
            </button>
            <button
                onClick={handleVision}
                disabled={isLoading || !isOnline}
                className="p-2 rounded-full text-secondary disabled:text-layer-3 disabled:cursor-not-allowed hover:text-primary transition-colors duration-200"
                aria-label="Activate Visual Cortex"
                title="Activate Visual Cortex"
            >
                <CameraIcon />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !isOnline || (!input.trim() && attachments.length === 0)}
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