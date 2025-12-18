
import React from 'react';
import { GitData } from '../types';

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

const GitHistoryView: React.FC<{ data: GitData }> = ({ data }) => {
    return (
        <div className="mt-3 border border-layer-3 rounded-xl bg-layer-2/30 overflow-hidden font-sans shadow-lg">
            <div className="p-3 bg-layer-2 border-b border-layer-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-primary">⏳</span>
                    <span className="text-[10px] font-mono text-secondary uppercase tracking-[0.2em]">Time Warp: {data.repoName}</span>
                </div>
                <span className="text-[9px] font-mono text-primary/50">GIT_HUB_LIVE_SYNC</span>
            </div>
            <div className="p-4 space-y-4">
                {data.commits?.map((commit, i) => (
                    <div key={commit.sha} className="flex space-x-3 relative">
                        {i !== data.commits!.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-[-16px] w-0.5 bg-layer-3"></div>
                        )}
                        <img src={commit.avatarUrl} className="w-8 h-8 rounded-full border border-layer-3 z-10" alt={commit.author} />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-xs font-bold text-secondary truncate">{commit.author}</p>
                                <span className="text-[9px] font-mono text-gray-500 whitespace-nowrap ml-2">{formatTimeAgo(commit.date)}</span>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-2 mt-0.5">{commit.message}</p>
                            <a href={commit.url} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-primary/60 hover:text-primary transition-colors mt-1 block">
                                {commit.sha.substring(0, 7)} ->
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GitHistoryView;
