
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
    const [top, setTop] = useState(0);

    const handleMouseEnter = (e: React.MouseEvent) => {
        setTop(e.currentTarget.getBoundingClientRect().top);
        setIsHovered(true);
    };

    return (
        <div className="relative">
            <button
                onClick={onClick}
                className="group w-full text-left flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-primary/5 border border-transparent hover:border-primary/10"
                onMouseEnter={handleMouseEnter}
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
            
            {/* Holographic HUD Tooltip */}
            {isHovered && (
                <div 
                    className="fixed left-[320px] ml-4 w-80 p-5 bg-layer-1/95 border border-primary/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-[999] backdrop-blur-3xl animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none ring-1 ring-white/10"
                    style={{ top: top }}
                >
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-2 w-full animate-data-stream opacity-20"></div>
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary/60"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary/60"></div>

                        <div className="text-[10px] font-mono text-primary/80 uppercase tracking-[0.3em] mb-3 border-b border-primary/20 pb-2 flex justify-between items-center">
                            <span className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
                                <span>POWER_INTEL</span>
                            </span>
                        </div>
                        
                        <div className="text-sm text-secondary font-sans leading-relaxed mb-4 px-1 font-medium antialiased">
                            {power.description}
                        </div>
                        
                        <div className="relative">
                            <div className="text-[9px] font-mono text-primary/40 uppercase mb-2 ml-1 flex justify-between items-center">
                                <span>COMMAND_SEQUENCE:</span>
                            </div>
                            <div className="text-[11px] font-mono bg-black/80 p-3 rounded-lg border border-primary/20 text-primary/90 break-words leading-relaxed shadow-inner">
                                <span className="text-primary/40 mr-2 font-bold select-none">>></span>
                                {power.prompt}
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-6 -left-1.5 w-3 h-3 bg-layer-1 border-l border-b border-primary/40 rotate-45"></div>
                </div>
            )}
        </div>
    );
  };

  const Section = ({ title, powers }: { title: string, powers: Power[] }) => (
    <div className="mb-8 last:mb-0">
        <h2 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.4em] mb-4 px-2 border-l-2 border-primary/40 flex justify-between items-center">
            <span>{title}</span>
        </h2>
        <div className="space-y-1 px-1">
          {powers.map(power => (
            <PowerListItem key={power.name} power={power} onClick={() => onPowerClick(power.prompt)} />
          ))}
        </div>
    </div>
  );

  return (
    <aside className="w-80 h-full bg-layer-1 border-r border-layer-3 flex flex-col relative overflow-visible z-30">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 overflow-x-visible">
        <Section title="Core Logic" powers={POWERS} />
        <Section title="Super Systems" powers={SUPER_POWERS} />
        <Section title="CLI Operations" powers={CLI_POWERS} />
        <Section title="Creative Hub" powers={CREATIVE_POWERS} />
        <Section title="Analytic Grid" powers={ANALYTICS_POWERS} />
        <Section title="Automation" powers={AUTOMATION_POWERS} />
        <Section title="Intel Archive" powers={INTEL_OPS_POWERS} />
        <Section title="Hugging Face" powers={HUGGING_FACE_POWERS} />
        <Section title="Financials" powers={FINANCIAL_POWERS} />
        <Section title="Drone Link" powers={VECTOR_DRONE_POWERS} />
      </div>
      <div className="p-4 border-t border-layer-3 bg-black/40 backdrop-blur-sm">
         <div className="flex justify-between items-center text-[9px] font-mono text-primary/60 uppercase tracking-widest px-2">
            <span className="flex items-center space-x-2">
                <span className="w-1 h-1 bg-success rounded-full animate-pulse"></span>
                <span>Power_Grid</span>
            </span>
            <span>NOMINAL</span>
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
