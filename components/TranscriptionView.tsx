import React from 'react';
import { TranscriptionData } from '../types';

interface TranscriptionViewProps {
  data: TranscriptionData;
}

const DataCard: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="mt-3 border border-layer-3 rounded-lg bg-layer-2/50 overflow-hidden font-sans">
        <div className="p-2 bg-layer-2 border-b border-layer-3 text-xs font-mono">
            <span className="text-secondary">{title}</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ data }) => {
  return (
    <DataCard title={`Transcription: ${data.fileName}`}>
      <pre className="whitespace-pre-wrap text-sm font-mono bg-base p-3 rounded-md text-secondary overflow-x-auto">
        <code>{data.transcription.trim()}</code>
      </pre>
    </DataCard>
  );
};

export default TranscriptionView;
