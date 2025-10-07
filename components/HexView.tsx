import React from 'react';
import { HexDumpData } from '../types';
import { BinaryIcon } from './icons/BinaryIcon';

interface HexViewProps {
  data: HexDumpData;
}

const DataCard: React.FC<{ children: React.ReactNode, title: string, icon?: React.ReactNode }> = ({ children, title, icon }) => (
    <div className="mt-3 border border-layer-3 rounded-lg bg-layer-2/50 overflow-hidden font-sans">
        <div className="p-2 bg-layer-2 border-b border-layer-3 text-xs font-mono flex items-center space-x-2">
            {icon}
            <span className="text-secondary">{title}</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);

const HexView: React.FC<HexViewProps> = ({ data }) => {
    const hexLines = data.hex.split('\n');
    const asciiLines = data.ascii.split('\n');

    return (
        <div className="relative">
            <DataCard title={`Binary Scan: ${data.fileName}`} icon={<BinaryIcon />}>
                <div className="bg-base p-2 rounded-md font-mono text-xs text-secondary overflow-x-auto">
                    <div className="flex">
                        <pre className="pr-4 border-r border-layer-3 text-gray-400"><code>{hexLines.join('\n')}</code></pre>
                        <pre className="pl-4 text-primary"><code>{asciiLines.join('\n')}</code></pre>
                    </div>
                </div>
            </DataCard>
            <div className="absolute bottom-2 right-2 bg-base/50 text-secondary text-[10px] font-mono px-2 py-0.5 rounded pointer-events-none">
                RE Analysis Engine: Z0F
            </div>
        </div>
    );
};

export default HexView;