
import React from 'react';
import { GitData } from '../types';
import { BinaryIcon } from './icons/BinaryIcon';

const SystemScanView: React.FC<{ data: GitData }> = ({ data }) => {
    const isStructure = data.type === 'structure';
    const isDeps = data.type === 'dependencies';

    return (
        <div className="mt-3 border border-layer-3 rounded-xl bg-layer-2/20 overflow-hidden font-mono shadow-xl backdrop-blur-md">
            <div className="p-3 bg-layer-2 border-b border-layer-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-primary">{isStructure ? '⚙️' : '🕸️'}</span>
                    <span className="text-[10px] text-secondary uppercase tracking-[0.2em]">
                        {isStructure ? 'System Manifest' : 'Dependency Web'}: {data.repoName}
                    </span>
                </div>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                {isStructure && data.files && (
                    <div className="space-y-1">
                        {data.files.map((file, idx) => (
                            <div key={idx} className="flex items-center text-[11px] group">
                                <span className="text-gray-600 mr-2">
                                    {file.type === 'tree' ? '📁' : '📄'}
                                </span>
                                <span className={`${file.type === 'tree' ? 'text-primary/80' : 'text-secondary/70'} group-hover:text-primary transition-colors truncate`}>
                                    {file.path}
                                </span>
                                {file.size && (
                                    <span className="ml-auto text-[9px] text-gray-600">{(file.size / 1024).toFixed(1)} KB</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {isDeps && data.dependencies && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {data.dependencies.map((dep, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-black/40 border border-primary/10 rounded group hover:border-primary/30 transition-all">
                                <span className="text-[10px] text-secondary truncate mr-2" title={dep.name}>{dep.name}</span>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    {dep.isDev && <span className="text-[8px] bg-primary/20 text-primary px-1 rounded">DEV</span>}
                                    <span className="text-[9px] text-gray-500 font-bold">{dep.version}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="p-2 bg-primary/5 text-[8px] text-center text-primary/40 uppercase tracking-tighter border-t border-primary/10">
                Direct Memory Link | Integrity Verified
            </div>
        </div>
    );
};

export default SystemScanView;
