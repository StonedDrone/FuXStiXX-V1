
import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { KeyIcon } from './icons/KeyIcon';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onActivate: (details: { modelId: string; baseURL: string }) => void;
}

declare const window: any;

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onActivate }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [modelName, setModelName] = useState('');
    const [hasPrivateUplink, setHasPrivateUplink] = useState(false);

    useEffect(() => {
        const savedUrl = localStorage.getItem('fuxstixx-lmstudio-url') || 'http://localhost:1234/v1';
        const savedModel = localStorage.getItem('fuxstixx-lmstudio-model') || 'local-model';
        setBaseUrl(savedUrl);
        setModelName(savedModel);
        
        const checkKey = async () => {
            if (window.aistudio?.hasSelectedApiKey) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setHasPrivateUplink(hasKey);
            }
        };
        checkKey();
    }, [isOpen]);

    const handleActivate = () => {
        if (!baseUrl.trim() || !modelName.trim()) {
            alert("Captain, both the Base URL and Model Name are required to establish a connection.");
            return;
        }
        localStorage.setItem('fuxstixx-lmstudio-url', baseUrl);
        localStorage.setItem('fuxstixx-lmstudio-model', modelName);
        onActivate({ baseURL: baseUrl, modelId: modelName });
    };

    const handleSwitchUplink = async () => {
        if (window.aistudio?.openSelectKey) {
            await window.aistudio.openSelectKey();
            setHasPrivateUplink(true);
        }
    };

    return (
        <div className={`
            absolute top-0 right-0 h-full bg-layer-1/90 backdrop-blur-sm z-20 
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            w-full md:w-[400px] border-l-2 border-primary shadow-2xl shadow-primary/20
        `}>
            <div className="flex flex-col h-full">
                <header className="flex justify-between items-center p-4 border-b border-layer-3">
                    <h2 className="text-2xl font-mono text-primary">Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-layer-2">
                        <XIcon />
                    </button>
                </header>
                <div className="p-4 overflow-y-auto space-y-8">
                    {/* Mission Key Section */}
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <h3 className="font-mono text-sm font-bold text-primary uppercase mb-2 flex items-center space-x-2">
                            <KeyIcon />
                            <span>Tactical Uplink</span>
                        </h3>
                        <p className="text-xs text-gray-400 mb-4">
                            FuXStiXX uses a shared mission quota. If you hit limits (Error 429), switch to a private paid uplink.
                        </p>
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-mono ${hasPrivateUplink ? 'text-success' : 'text-yellow-500'}`}>
                                STATUS: {hasPrivateUplink ? 'PRIVATE_UPLINK_ACTIVE' : 'SHARED_QUOTA'}
                            </span>
                            <button 
                                onClick={handleSwitchUplink}
                                className="px-3 py-1.5 bg-primary/10 border border-primary/40 rounded text-[10px] font-mono text-primary hover:bg-primary hover:text-black transition-all"
                            >
                                {hasPrivateUplink ? 'CHANGE_KEY' : 'AUTHORIZE_PRIVATE_KEY'}
                            </button>
                        </div>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[9px] text-primary/40 underline mt-2 block">Mission Billing Documentation</a>
                    </div>

                    <div className="mb-6">
                        <h3 className="font-mono text-lg text-secondary mb-3">Local LLM Bridge</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Server Base URL</label>
                                <input
                                    type="text"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="http://localhost:1234/v1"
                                    className="w-full bg-layer-2 border border-layer-3 rounded-md p-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Model Name</label>
                                <input
                                    type="text"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    placeholder="e.g., Meta-Llama-3-8B"
                                    className="w-full bg-layer-2 border border-layer-3 rounded-md p-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                                />
                            </div>
                            <button
                                onClick={handleActivate}
                                className="w-full p-3 bg-layer-3 border border-primary/20 text-primary font-bold rounded-lg hover:bg-primary hover:text-black transition-all text-xs"
                            >
                                Save & Activate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
