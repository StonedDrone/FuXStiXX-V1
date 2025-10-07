import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    onActivate: (details: { modelId: string; baseURL: string }) => void;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onActivate }) => {
    const [baseUrl, setBaseUrl] = useState('');
    const [modelName, setModelName] = useState('');

    useEffect(() => {
        const savedUrl = localStorage.getItem('fuxstixx-lmstudio-url') || 'http://localhost:1234/v1';
        const savedModel = localStorage.getItem('fuxstixx-lmstudio-model') || 'local-model';
        setBaseUrl(savedUrl);
        setModelName(savedModel);
    }, []);

    const handleActivate = () => {
        if (!baseUrl.trim() || !modelName.trim()) {
            alert("Captain, both the Base URL and Model Name are required to establish a connection.");
            return;
        }
        localStorage.setItem('fuxstixx-lmstudio-url', baseUrl);
        localStorage.setItem('fuxstixx-lmstudio-model', modelName);
        onActivate({ baseURL: baseUrl, modelId: modelName });
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
                <div className="p-4 overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="font-mono text-xl text-secondary mb-3">Local LLM Connection</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Connect to an OpenAI-compatible API, such as one provided by LM Studio or Ollama.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="base-url" className="block text-sm font-medium text-gray-300 mb-1">
                                    Server Base URL
                                </label>
                                <input
                                    type="text"
                                    id="base-url"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                    placeholder="http://localhost:1234/v1"
                                    className="w-full bg-layer-2 border border-layer-3 rounded-md p-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="model-name" className="block text-sm font-medium text-gray-300 mb-1">
                                    Model Name
                                </label>
                                <input
                                    type="text"
                                    id="model-name"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    placeholder="e.g., lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF"
                                    className="w-full bg-layer-2 border border-layer-3 rounded-md p-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    The model identifier as loaded in your local server.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleActivate}
                                className="w-full p-3 bg-primary text-black font-bold rounded-lg hover:bg-opacity-80 transition-colors duration-200"
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
