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
        <div className="relative group/item">
            <button
                onClick={onClick}
                className="w-full text-left flex items-start p-1.5 rounded-md transition-all duration-200"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    backgroundColor: isHovered ? `${power.color}1A` : 'transparent',
                }}
            >
                <span className="mr-3 text-lg flex-shrink-0">{power.emoji}</span> 
                <span 
                    className={`flex-1 truncate ${power.font}`} 
                    style={{ 
                        color: power.color,
                        textShadow: isHovered ? `0 0 8px ${power.color}80` : 'none'
                    }}
                >
                  {power.name}
                </span>
            </button>
            
            {/* Cyber Tooltip Overlay */}
            <div className="absolute left-full ml-4 top-0 w-72 p-4 bg-layer-1/95 border border-primary/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 pointer-events-none transition-all duration-300 z-[100] backdrop-blur-xl -translate-x-2">
                <div className="relative">
                    <div className="text-[10px] font-mono text-primary/40 uppercase tracking-[0.2em] mb-2 border-b border-primary/10 pb-1 flex justify-between">
                        <span>Power Specs</span>
                        <span className="animate-pulse">Active</span>
                    </div>
                    <div className="text-sm text-secondary font-sans leading-relaxed mb-4">
                        {power.description}
                    </div>
                    <div className="relative">
                        <div className="text-[9px] font-mono text-primary/60 uppercase mb-1">Command String:</div>
                        <div className="text-[10px] font-mono bg-black/60 p-2.5 rounded-lg border border-primary/20 text-primary/90 break-words leading-tight shadow-inner">
                            <span className="text-primary/30 mr-1.5">></span>{power.prompt}
                        </div>
                    </div>
                    {/* Decorative Corner Bracket */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-primary/40"></div>
                </div>
                {/* Connector Triangle */}
                <div className="absolute top-4 -left-1.5 w-3 h-3 bg-layer-1 border-l border-b border-primary/30 rotate-45"></div>
            </div>
        </div>
    );
  };

  const Section = ({ title, powers }: { title: string, powers: Power[] }) => (
    <div className="mb-8 flex-shrink-0">
        <h2 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.3em] mb-4 px-2 border-l-2 border-primary/20">{title}</h2>
        <div className="space-y-1 text-sm">
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