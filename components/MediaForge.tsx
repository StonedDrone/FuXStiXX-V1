
import React, { useState, useEffect, useRef } from 'react';
import { QuickActionType, MEDIA_QUICK_ACTIONS } from './ChatInterface';
import { XIcon } from './icons/XIcon';
import { SendIcon } from './icons/SendIcon';

interface MediaForgeProps {
    type: QuickActionType;
    onClose: () => void;
    onExecute: (prompt: string) => void;
}

const MediaForge: React.FC<MediaForgeProps> = ({ type, onClose, onExecute }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const action = MEDIA_QUICK_ACTIONS.find(a => a.type === type);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleExecute = () => {
        if (!prompt.trim()) return;
        let fullPrompt = `${action?.prefix}${prompt}`;
        if (type === 'image') {
            fullPrompt += ` | aspectRatio: ${aspectRatio}`;
        }
        onExecute(fullPrompt);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleExecute();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-2xl bg-layer-1 border-2 border-primary rounded-xl shadow-[0_0_40px_rgba(50,205,50,0.3)] overflow-hidden flex flex-col max-h-[80vh]">
                
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

                <div className="relative p-6 space-y-4 flex-1 overflow-y-auto">
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
                            className="w-full h-32 bg-black/40 border border-primary/30 rounded-lg p-4 font-mono text-sm text-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 resize-none placeholder:text-gray-600 shadow-inner"
                        />
                    </div>

                    {type === 'image' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-500">
                            <label className="block text-[10px] font-mono text-primary uppercase mb-2 tracking-tighter">Dimensional Ratio</label>
                            <div className="flex flex-wrap gap-2">
                                {['1:1', '16:9', '9:16', '4:3', '3:4'].map(ratio => (
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
                        disabled={!prompt.trim()}
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
