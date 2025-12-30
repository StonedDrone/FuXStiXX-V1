
import React, { useState } from 'react';
import { 
    POWERS, 
    SUPER_POWERS, 
    CREATIVE_POWERS, 
    HUGGING_FACE_POWERS, 
    FINANCIAL_POWERS, 
    ANALYTICS_POWERS, 
    AUTOMATION_POWERS, 
    STREAMING_POWERS, 
    INTEL_OPS_POWERS, 
    VECTOR_DRONE_POWERS,
    CLI_POWERS
} from '../constants';

interface SidebarProps {
  onPowerClick: (prompt: string) => void;
}

type Power = typeof POWERS[0];

const Sidebar: React.FC<SidebarProps> = ({ onPowerClick }) => {
  const PowerListItem: React.FC<{ power: Power; onClick: () => void }> = ({ power, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className="group w-full text-left flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-primary/5 border border-transparent hover:border-primary/10"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <span className="mr-3 text-lg flex-shrink-0 group-hover:scale-110 transition-transform">{power.emoji}</span> 
                <span 
                    className={`flex-1 truncate ${power.font} text-sm`} 
                    style={{ 
                        color: isHovered ? power.color : 'var(--color-secondary)',
                        textShadow: isHovered ? `0 0 8px ${power.color}80` : 'none'
                    }}
                >
                  {power.name}
                </span>
            </button>
            
            {isHovered && (
                <div className="fixed left-[320px] ml-4 w-80 p-4 bg-layer-1/95 border border-primary/40 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.9)] z-[200] backdrop-blur-2xl animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none">
                    <div className="relative">
                        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-primary/40 rounded-tl-sm"></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-primary/40 rounded-br-sm"></div>

                        <div className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.2em] mb-2 border-b border-primary/10 pb-1.5 flex justify-between items-center">
                            <span className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                <span>Tactical_Brief</span>
                            </span>
                            <span className="text-[8px] opacity-40">NODE_{power.name.replace(/\s+/g, '_').toUpperCase()}</span>
                        </div>
                        
                        <div className="text-xs text-secondary font-sans leading-relaxed mb-4 px-1">
                            {power.description}
                        </div>
                        
                        <div className="relative group">
                            <div className="text-[9px] font-mono text-primary/40 uppercase mb-1.5 ml-1">Command_Protocol:</div>
                            <div className="text-[10px] font-mono bg-black/80 p-3 rounded-lg border border-primary/20 text-primary/90 break-words leading-relaxed shadow-inner">
                                <span className="text-primary/30 mr-1.5 font-bold">$</span>{power.prompt}
                            </div>
                        </div>

                        <div className="mt-4 flex space-x-1">
                            <div className="h-1 flex-1 bg-primary/20"></div>
                            <div className="h-1 flex-1 bg-primary/10"></div>
                            <div className="h-1 flex-1 bg-primary/5"></div>
                            <div className="h-1 flex-1 bg-primary/20"></div>
                        </div>
                    </div>
                    <div className="absolute top-6 -left-1.5 w-3 h-3 bg-layer-1 border-l border-b border-primary/40 rotate-45"></div>
                </div>
            )}
        </div>
    );
  };

  const Section = ({ title, powers }: { title: string, powers: Power[] }) => (
    <div className="mb-8">
        <h2 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.3em] mb-3 px-2 border-l-2 border-primary/20">{title}</h2>
        <div className="space-y-0.5 px-1">
          {powers.map(power => (
            <PowerListItem key={power.name} power={power} onClick={() => onPowerClick(power.prompt)} />
          ))}
        </div>
    </div>
  );

  return (
    <aside className="w-80 h-full bg-layer-1 border-r border-layer-3 flex flex-col relative overflow-visible z-30">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 overflow-x-visible">
        <Section title="Core Powers" powers={POWERS} />
        <Section title="Super Powers" powers={SUPER_POWERS} />
        <Section title="CLI Uplink" powers={CLI_POWERS} />
        <Section title="Creative Synth" powers={CREATIVE_POWERS} />
        <Section title="Analytics" powers={ANALYTICS_POWERS} />
        <Section title="Automation" powers={AUTOMATION_POWERS} />
        <Section title="Intel Ops" powers={INTEL_OPS_POWERS} />
        <Section title="Hugging Face" powers={HUGGING_FACE_POWERS} />
        <Section title="Financial" powers={FINANCIAL_POWERS} />
        <Section title="Vector Drone" powers={VECTOR_DRONE_POWERS} />
      </div>
      <div className="p-3 border-t border-layer-3 bg-black/20">
         <div className="flex justify-between items-center text-[8px] font-mono text-primary/40 uppercase tracking-widest px-2">
            <span>Core_Stability</span>
            <span>99.2%</span>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
