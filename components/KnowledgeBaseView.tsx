import React from 'react';
import { KnowledgeBaseData, IndexedDocument } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { LinkIcon } from './icons/LinkIcon';
import { FileTextIcon } from './icons/FileTextIcon';

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

const formatTimeAgo = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
};

const DocumentItem: React.FC<{ doc: IndexedDocument }> = ({ doc }) => (
    <div className="flex items-center justify-between py-2 border-b border-layer-3 last:border-b-0">
        <div className="flex items-center space-x-3 min-w-0">
            {doc.sourceType === 'url' ? <LinkIcon className="text-primary flex-shrink-0" /> : <FileTextIcon className="text-primary flex-shrink-0" />}
            <p className="text-sm text-secondary truncate" title={doc.sourceName}>{doc.sourceName}</p>
        </div>
        <div className="text-xs text-gray-400 font-mono text-right flex-shrink-0 ml-4">
            <p>Chunks: {doc.chunkCount}</p>
            <p>Indexed: {formatTimeAgo(doc.indexedAt)}</p>
        </div>
    </div>
);

const KnowledgeBaseView: React.FC<{ data: KnowledgeBaseData }> = ({ data }) => {
    return (
        <DataCard title="Intel Base Status" icon={<BookOpenIcon />}>
            {data.documents.length > 0 ? (
                <div className="space-y-1">
                    {data.documents.map(doc => <DocumentItem key={doc.id} doc={doc} />)}
                </div>
            ) : (
                <p className="text-secondary italic text-sm">
                    The intel base is empty, Captain. Use the "Index Source" power to add knowledge.
                </p>
            )}
        </DataCard>
    );
};

export default KnowledgeBaseView;