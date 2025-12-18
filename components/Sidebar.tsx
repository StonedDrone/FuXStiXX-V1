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
    VECTOR_DRONE_POWERS 
} from '../constants';

interface SidebarProps {
  onPowerClick: (prompt: string) => void;
}

type Power = typeof POWERS[0];

const Sidebar: React.FC<SidebarProps> = ({ onPowerClick }) => {
  const PowerListItem: React.FC<{ power: Power; onClick: () => void }> = ({ power, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className="relative isolate">
            <button
                onClick={onClick}
                className="group w-full text-left flex items-center p-2 rounded-lg transition-all duration-200 hover:bg-white/5"
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
            
            {/* HUD Tooltip - Positioned to pop out without clipping if possible, or overlay */}
            {isHovered && (
                <div className="absolute left-[90%] top-0 ml-4 w-72 p-4 bg-layer-1/95 border border-primary/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] z-[100] backdrop-blur-xl animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none">
                    <div className="relative">
                        <div className="text-[9px] font-mono text-primary/50 uppercase tracking-[0.2em] mb-2 border-b border-primary/10 pb-1 flex justify-between">
                            <span>Tactical_Brief</span>
                            <span className="text-primary/30">ID: {power.name.replace(/\s+/g, '_').toUpperCase()}</span>
                        </div>
                        <div className="text-xs text-secondary font-sans leading-relaxed mb-4">
                            {power.description}
                        </div>
                        <div className="relative">
                            <div className="text-[8px] font-mono text-primary/60 uppercase mb-1">Command_String:</div>
                            <div className="text-[10px] font-mono bg-black/60 p-2.5 rounded-lg border border-primary/20 text-primary/90 break-all leading-tight shadow-inner">
                                <span className="text-primary/30 mr-1.5">></span>{power.prompt}
                            </div>
                        </div>
                        {/* Decorative HUD Corner */}
                        <div 
                          className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm"
                          style={{ borderColor: power.color }}
                        ></div>
                    </div>
                    {/* Connector Triangle */}
                    <div className="absolute top-4 -left-1.5 w-3 h-3 bg-layer-1 border-l border-b border-primary/30 rotate-45"></div>
                </div>
            )}
        </div>
    );
  };

  const Section = ({ title, powers }: { title: string, powers: Power[] }) => (
    <div className="mb-8 flex-shrink-0">
        <h2 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.3em] mb-3 px-2 border-l-2 border-primary/20">{title}</h2>
        <div className="space-y-0.5">
          {powers.map(power => (
            <PowerListItem key={power.name} power={power} onClick={() => onPowerClick(power.prompt)} />
          ))}
        </div>
    </div>
  );

  return (
    <aside className="w-80 bg-layer-1 border-r border-layer-3 flex flex-col p-4 overflow-y-auto overflow-x-visible custom-scrollbar">
      <Section title="Core Powers" powers={POWERS} />
      <Section title="Super Powers" powers={SUPER_POWERS} />
      <Section title="Creative Synth" powers={CREATIVE_POWERS} />
      <Section title="Analytics" powers={ANALYTICS_POWERS} />
      <Section title="Automation" powers={AUTOMATION_POWERS} />
      <Section title="Intel Ops" powers={INTEL_OPS_POWERS} />
      <Section title="Hugging Face" powers={HUGGING_FACE_POWERS} />
      <Section title="Financial" powers={FINANCIAL_POWERS} />
      <Section title="Vector Drone" powers={VECTOR_DRONE_POWERS} />
    </aside>
  );
};

export default Sidebar;