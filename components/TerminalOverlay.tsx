
import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { TerminalLine } from '../types';

interface TerminalOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onCommand: (cmd: string) => void;
    externalLines?: TerminalLine[];
}

const TerminalOverlay: React.FC<TerminalOverlayProps> = ({ isOpen, onClose, onCommand, externalLines = [] }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<TerminalLine[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync external lines from AI tool calls
    useEffect(() => {
        if (externalLines.length > 0) {
            setHistory(prev => [...prev, ...externalLines]);
        }
    }, [externalLines]);

    // Keyboard shortcuts: Escape to close, Ctrl+C to interrupt
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            // Escape to close terminal
            if (e.key === 'Escape') {
                onClose();
            }

            // Ctrl+C to cancel current line
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                if (input.trim()) {
                    setHistory(prev => [...prev, {
                        id: 'sigint-' + Date.now(),
                        text: `${input}^C`,
                        type: 'input',
                        timestamp: new Date().toLocaleTimeString()
                    }]);
                } else {
                    setHistory(prev => [...prev, {
                        id: 'sigint-' + Date.now(),
                        text: '^C',
                        type: 'input',
                        timestamp: new Date().toLocaleTimeString()
                    }]);
                }
                setInput('');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, input, onClose]);

    // Handle scrolling and focus
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        if (isOpen) {
            // Short delay to ensure transition finished before focusing
            const timer = setTimeout(() => inputRef.current?.focus(), 50);
            return () => clearTimeout(timer);
        }
    }, [history, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newLine: TerminalLine = {
            id: Date.now().toString(),
            text: input,
            type: 'input',
            timestamp: new Date().toLocaleTimeString()
        };

        setHistory(prev => [...prev, newLine]);
        onCommand(input);
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col p-4 animate-in fade-in duration-300"
            onClick={() => inputRef.current?.focus()} // Keep focus on click
        >
            <div className="flex justify-between items-center mb-2 border-b border-primary/20 pb-2">
                <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-danger rounded-full cursor-pointer hover:opacity-80" onClick={onClose} title="Close (Esc)"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] ml-4">
                        FuX_CLI_Uplink // RemoteNode_0x7F
                    </span>
                    <span className="text-[8px] font-mono text-primary/30 uppercase hidden md:inline">
                        (ESC to Exit | CTRL+C to Cancel)
                    </span>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-1 text-secondary hover:text-danger transition-colors"
                    title="Close Terminal (Esc)"
                >
                    <XIcon />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-xs p-2 relative" ref={scrollRef}>
                {/* CRT Scanline Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20"></div>
                
                <div className="space-y-1 relative z-10">
                    <div className="text-primary/40 mb-4">
                        [SYSTEM] SYNERGY_LINK_ESTABLISHED<br/>
                        [INFO] AWAITING COMMAND PROTOCOLS...<br/>
                        ------------------------------------
                    </div>
                    
                    {history.map(line => (
                        <div key={line.id} className="flex space-x-2 animate-in fade-in slide-in-from-left-1 duration-150">
                            <span className="text-gray-600 flex-shrink-0">[{line.timestamp}]</span>
                            <span className={`break-all ${
                                line.type === 'input' ? 'text-white' :
                                line.type === 'error' ? 'text-danger' :
                                line.type === 'system' ? 'text-primary/60' : 'text-primary'
                            }`}>
                                {line.type === 'input' ? '> ' : ''}{line.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-2 border-t border-primary/20 pt-2 flex items-center bg-black/40">
                <span className="text-primary font-mono mr-2 flex-shrink-0">fux@captain:~$</span>
                <input 
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-primary font-mono text-xs caret-primary"
                    autoFocus
                    spellCheck={false}
                    autoComplete="off"
                />
            </form>
        </div>
    );
};

export default TerminalOverlay;
