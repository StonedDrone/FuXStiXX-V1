
import React, { useState, useEffect, useRef } from 'react';
import { QuickActionType, MEDIA_QUICK_ACTIONS } from './ChatInterface';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';
import { KeyIcon } from './icons/KeyIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';

declare const window: any;

interface MediaForgeProps {
    type: QuickActionType;
    onClose: () => void;
    onExecute: (prompt: string, attachment?: { data: string, mimeType: string }) => void;
}

const MediaForge: React.FC<MediaForgeProps> = ({ type, onClose, onExecute }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [imageSize, setImageSize] = useState('1K');
    const [hasKey, setHasKey] = useState(false);
    const [videoAttachment, setVideoAttachment] = useState<{ data: string, mimeType: string, preview: string } | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const action = MEDIA_QUICK_ACTIONS.find(a => a.type === type);

    useEffect(() => {
        inputRef.current?.focus();
        
        const checkKey = async () => {
            if (window.aistudio?.hasSelectedApiKey) {
                const selected = await window.aistudio.hasSelectedApiKey();
                setHasKey(selected);
            }
        };
        checkKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            setHasKey(true);
        }
    };

    const handleExecute = () => {
        if (!prompt.trim() && !videoAttachment) return;
        
        // For Pro models or Video models, we require an API key
        if ((type === 'image' || type === 'video') && !hasKey) {
            handleSelectKey();
            return;
        }

        let fullPrompt = `${action?.prefix}${prompt}`;
        if (type === 'image') {
            fullPrompt += ` | aspectRatio: ${aspectRatio} | imageSize: ${imageSize}`;
        } else if (type === 'video') {
            fullPrompt += ` | aspectRatio: ${aspectRatio}`;
        }
        
        onExecute(fullPrompt, videoAttachment ? { data: videoAttachment.data, mimeType: videoAttachment.mimeType } : undefined);
    };

    const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const b64 = dataUrl.split(',')[1];
            setVideoAttachment({
                data: b64,
                mimeType: file.type,
                preview: dataUrl
            });
        };
        reader.readAsDataURL(file);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleExecute();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-layer-1 border-2 border-primary rounded-xl shadow-[0_0_40px_rgba(50,205,50,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-pulse"></div>

                <header className="relative p-4 border-b border-primary/20 flex justify-between items-center bg-primary/5">
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">{action?.emoji}</span>
                        <div>
                            <h2 className="text-sm font-mono text-primary uppercase tracking-widest">{action?.name} Console</h2>
                            <p className="text-[10px] font-mono text-secondary/60">
                                {type === 'audio' ? 'SONIC SYNTHESIS ENGAGED' : 'SYNERGY PROTOCOL ACTIVE'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-secondary hover:text-danger transition-colors">
                        <XIcon />
                    </button>
                </header>

                <div className="relative p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {(type === 'image' || type === 'video') && !hasKey && (
                        <div className="p-4 bg-danger/10 border border-danger/30 rounded-lg animate-in slide-in-from-top-2">
                            <p className="text-xs font-mono text-danger mb-3 flex items-center">
                                <span className="mr-2">⚠️</span> PRIVATE TACTICAL UPLINK REQUIRED FOR {type.toUpperCase()} SYNTHESIS
                            </p>
                            <button 
                                onClick={handleSelectKey}
                                className="w-full py-2 bg-danger text-white text-[10px] font-mono font-bold rounded flex items-center justify-center space-x-2 hover:bg-danger/80 transition-all"
                            >
                                <KeyIcon />
                                <span>Authorize Mission Key</span>
                            </button>
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-danger/60 underline mt-2 block text-center">Review Billing Documentation</a>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-mono text-primary uppercase mb-2 tracking-tighter">
                            {type === 'audio' ? 'Sonic Blueprint (Prompt)' : 'Mission Objectives (Prompt)'}
                        </label>
                        <textarea
                            ref={inputRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder={type === 'audio' ? "Describe the frequency... the vibe... the drone..." : "Input target coordinates for synthesis..."}
                            className="w-full h-24 bg-black/40 border border-primary/30 rounded-lg p-4 font-mono text-sm text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none placeholder:text-gray-600 shadow-inner"
                        />
                    </div>

                    {type === 'video' && (
                        <div className="space-y-4">
                            <label className="block text-[10px] font-mono text-primary uppercase mb-2 tracking-tighter">Visual Reference (Optional)</label>
                            <div className="flex items-center space-x-4">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center space-x-2 px-4 py-2 bg-layer-2 border border-primary/20 rounded text-xs font-mono text-secondary hover:text-primary transition-all"
                                >
                                    <PaperclipIcon />
                                    <span>{videoAttachment ? 'Change Photo' : 'Upload photo for animation'}</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFilePick} />
                                {videoAttachment && (
                                    <div className="relative group w-16 h-16 rounded border border-primary/40 overflow-hidden">
                                        <img src={videoAttachment.preview} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setVideoAttachment(null)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                        >
                                            <XIcon className="text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {type === 'image' && (
                        <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-2 duration-500">
                            <div>
                                <label className="block text-[10px] font-mono text-primary uppercase mb-2 tracking-tighter">Aspect Ratio</label>
                                <div className="flex flex-wrap gap-2">
                                    {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(ratio => (
                                        <button
                                            key={ratio}
                                            onClick={() => setAspectRatio(ratio)}
                                            className={`px-3 py-1.5 rounded border font-mono text-xs transition-all ${
                                                aspectRatio === ratio 
                                                ? 'bg-primary text-black border-primary shadow-[0_0_10px_var(--color-primary)]' 
                                                : 'bg-layer-2 text-secondary border-primary/20 hover:border-primary/50'
                                            }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-primary uppercase mb-2 tracking-tighter">Forge Resolution</label>
                                <div className="flex flex-wrap gap-2">
                                    {['1K', '2K', '4K'].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setImageSize(size)}
                                            className={`px-3 py-1.5 rounded border font-mono text-xs transition-all ${
                                                imageSize === size 
                                                ? 'bg-accent text-black border-accent shadow-[0_0_10px_var(--color-accent)]' 
                                                : 'bg-layer-2 text-secondary border-primary/20 hover:border-primary/50'
                                            }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'video' && (
                        <div>
                            <label className="block text-[10px] font-mono text-primary uppercase mb-2 tracking-tighter">Target Format</label>
                            <div className="flex space-x-3">
                                {['16:9', '9:16'].map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={`px-4 py-2 rounded border font-mono text-xs transition-all ${
                                            aspectRatio === ratio 
                                            ? 'bg-primary text-black border-primary shadow-[0_0_10px_var(--color-primary)]' 
                                            : 'bg-layer-2 text-secondary border-primary/20 hover:border-primary/50'
                                        }`}
                                    >
                                        {ratio === '16:9' ? 'Landscape (16:9)' : 'Portrait (9:16)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {type === 'audio' && (
                         <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
                            <p className="text-[10px] font-mono text-secondary/60 leading-relaxed italic">
                                Note: FuXStiXX synthesizes audio using the Zephyr frequency. The output will be audio-reactive and ready for Vortex integration.
                            </p>
                        </div>
                    )}
                </div>

                <footer className="relative p-4 border-t border-primary/20 bg-primary/5 flex justify-end items-center">
                    <button 
                        onClick={handleExecute}
                        disabled={(!prompt.trim() && !videoAttachment) || ((type === 'image' || type === 'video') && !hasKey)}
                        className="flex items-center space-x-2 px-8 py-3 bg-primary text-black font-mono font-bold text-sm uppercase tracking-widest rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(50,205,50,0.4)]"
                    >
                        <span>Engage Synthesis</span>
                        <SendIcon />
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default MediaForge;
