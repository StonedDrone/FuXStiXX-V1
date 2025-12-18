
import React from 'react';
import { GitData } from '../types';

const SystemScanView: React.FC<{ data: GitData }> = ({ data }) => {
    const hasStructure = !!data.structure && data.structure.length > 0;
    const hasDeps = !!data.dependencies && data.dependencies.length > 0;

    if (!hasStructure && !hasDeps) return null;

    return (
        <div className="mt-3 border border-layer-3 rounded-xl bg-layer-2/20 overflow-hidden font-mono shadow-xl backdrop-blur-md">
            <div className="p-3 bg-layer-2 border-b border-layer-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <span className="text-primary">{hasStructure ? '⚙️' : '🕸️'}</span>
                    <span className="text-[10px] text-secondary uppercase tracking-[0.2em]">
                        {hasStructure ? 'System Manifest' : 'Dependency Web'}: {data.repoName}
                    </span>
                </div>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-6">
                {hasStructure && (
                    <div className="space-y-1">
                        <h5 className="text-[9px] font-mono text-primary/40 uppercase mb-2 tracking-widest border-b border-primary/10 pb-1">FILE_ARCHITECTURE</h5>
                        {data.structure?.map((file, idx) => (
                            <div key={idx} className="flex items-center text-[11px] group py-0.5">
                                <span className="text-gray-600 mr-2 flex-shrink-0 w-4 text-center">
                                    {file.type === 'tree' ? '📁' : '📄'}
                                </span>
                                <span className={`${file.type === 'tree' ? 'text-primary/80 font-bold' : 'text-secondary/70'} group-hover:text-primary transition-colors truncate`}>
                                    {file.path}
                                </span>
                                {file.size && (
                                    <span className="ml-auto text-[9px] text-gray-600 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {hasDeps && (
                    <div className="space-y-2">
                        <h5 className="text-[9px] font-mono text-primary/40 uppercase mb-2 tracking-widest border-b border-primary/10 pb-1">DEPENDENCY_MATRIX</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {data.dependencies?.map((dep, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-black/40 border border-primary/10 rounded group hover:border-primary/30 transition-all">
                                    <span className="text-[10px] text-secondary truncate mr-2 font-mono" title={dep.name}>{dep.name}</span>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        {dep.isDev && <span className="text-[7px] bg-primary/20 text-primary px-1 rounded font-bold">DEV</span>}
                                        <span className="text-[9px] text-gray-500 font-bold font-mono">{dep.version}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-2 bg-primary/5 text-[8px] text-center text-primary/40 uppercase tracking-tighter border-t border-primary/10">
                Direct Memory Link | Integrity Verified via NDI
            </div>
        </div>
    );
};

export default SystemScanView;
