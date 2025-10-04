import React from 'react';
import { POWERS, SUPER_POWERS } from '../constants';
import { XIcon } from './icons/XIcon';

interface CodexProps {
    isOpen: boolean;
    onClose: () => void;
}

const Codex: React.FC<CodexProps> = ({ isOpen, onClose }) => {
    
    const PowerEntry = ({ power }: { power: typeof POWERS[0]}) => (
        <div className="mb-4 border-b border-layer-3 pb-2">
            <h3 className="text-lg flex items-center">
                <span className="mr-3 text-xl">{power.emoji}</span> 
                <span className={`${power.font}`} style={{ color: power.color }}>
                {power.name}
                </span>
            </h3>
            <p className="text-sm text-secondary pl-9">{power.description}</p>
        </div>
    );

    return (
        <div className={`
            absolute top-0 left-0 h-full bg-layer-1/90 backdrop-blur-sm z-20 
            transition-transform duration-300 ease-in-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            w-full md:w-[400px] border-r-2 border-primary shadow-2xl shadow-primary/20
        `}>
            <div className="flex flex-col h-full">
                <header className="flex justify-between items-center p-4 border-b border-layer-3">
                    <h2 className="text-2xl font-mono text-primary">StiXX of FuX</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-layer-2">
                        <XIcon />
                    </button>
                </header>
                <div className="p-4 overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="font-mono text-xl text-secondary mb-3">Core Powers</h3>
                        {POWERS.map(p => <PowerEntry key={p.name} power={p} />)}
                    </div>
                     <div>
                        <h3 className="font-mono text-xl text-secondary mb-3">Super Powers</h3>
                        {SUPER_POWERS.map(p => <PowerEntry key={p.name} power={p} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Codex;
