
import React from 'react';
import { GitData } from '../types';

const GitBlameView: React.FC<{ data: GitData }> = ({ data }) => {
    return (
        <div className="mt-3 border border-layer-3 rounded-xl bg-base overflow-hidden font-mono text-[11px] shadow-2xl">
            <div className="p-2 bg-layer-2 border-b border-layer-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-primary">🧬</span>
                    <span className="text-[9px] uppercase tracking-widest text-secondary">Blame Analysis: {data.filePath}</span>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <tbody>
                        {data.blame?.map((line) => (
                            <tr key={line.lineNumber} className="hover:bg-primary/5 transition-colors border-b border-layer-3/20 last:border-0">
                                <td className="py-1 px-3 text-gray-600 text-right select-none w-10 border-r border-layer-3">{line.lineNumber}</td>
                                <td className="py-1 px-3 text-primary/40 truncate max-w-[80px]">{line.commitSha}</td>
                                <td className="py-1 px-3 text-secondary/60 truncate max-w-[100px] border-r border-layer-3">{line.author}</td>
                                <td className="py-1 px-4 text-secondary whitespace-pre">{line.content}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="p-2 bg-layer-2/50 text-[8px] text-center text-gray-500 uppercase tracking-tighter">
                Direct Execution Link | Path Verified in BeatDrop Core
            </div>
        </div>
    );
};

export default GitBlameView;
