import React from 'react';
import { PlaylistAnalysisData } from '../types';
import { MusicIcon } from './icons/MusicIcon';
import { LinkIcon } from './icons/LinkIcon';

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

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-layer-3 text-secondary text-xs font-medium px-2.5 py-1 rounded-full">
        {children}
    </span>
);

const PlaylistAnalysisView: React.FC<{ data: PlaylistAnalysisData }> = ({ data }) => {
    return (
        <DataCard title="Playlist Analysis" icon={<MusicIcon />}>
            <div className="mb-3">
                <h4 className="font-bold text-lg text-primary">{data.name}</h4>
                <p className="text-xs text-gray-400 font-mono">Tracks: {data.trackCount}</p>
                <p className="text-sm text-secondary italic mt-1">"{data.description}"</p>
            </div>

            <div className="space-y-3">
                <div>
                    <h5 className="text-xs font-mono text-gray-400 mb-1.5">MOOD</h5>
                    <div className="flex flex-wrap gap-2">
                        {data.mood.map(m => <Tag key={m}>{m}</Tag>)}
                    </div>
                </div>
                <div>
                    <h5 className="text-xs font-mono text-gray-400 mb-1.5">GENRES</h5>
                    <div className="flex flex-wrap gap-2">
                        {data.genres.map(g => <Tag key={g}>{g}</Tag>)}
                    </div>
                </div>
                 <div>
                    <h5 className="text-xs font-mono text-gray-400 mb-1.5">TOP ARTISTS</h5>
                    <div className="flex flex-wrap gap-2">
                        {data.topArtists.map(a => <Tag key={a}>{a}</Tag>)}
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-layer-3">
                <a 
                    href={data.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-mono text-primary hover:underline flex items-center space-x-1"
                >
                    <LinkIcon />
                    <span>View Original Playlist</span>
                </a>
            </div>
        </DataCard>
    );
};

export default PlaylistAnalysisView;
