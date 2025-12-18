import React, { useState } from 'react';
import { 
    POWERS, 
    SUPER_POWERS, 
    CREATIVE_POWERS, 
    HUGGING_FACE_POWERS, 
    FINANCIAL_POWERS, 
    AUTOMATION_POWERS, 
    STREAMING_POWERS, 
    INTEL_OPS_POWERS, 
    ANALYTICS_POWERS, 
    VECTOR_DRONE_POWERS 
} from '../constants';

type Power = typeof POWERS[0];

interface PowersDropdownProps {
  onPowerClick: (prompt: string) => void;
  onClose: () => void;
}

const PowerSection: React.FC<{
  title: string;
  powers: Power[];
  onPowerClick: (prompt: string) => void;
}> = ({ title, powers, onPowerClick }) => {
  const [isHovered, setIsHovered] = useState<string | null>(null);

  return (
    <div className="mb-4 last:mb-0">
      <h3 className="px-3 pt-2 pb-1.5 text-[9px] font-mono text-gray-500 uppercase tracking-[0.25em] border-b border-layer-3 mb-1">{title}</h3>
      <div className="space-y-0.5">
        {powers.map(power => (
          <div key={power.name} className="relative group/power">
            <button
                onClick={() => onPowerClick(power.prompt)}
                className="w-full text-left flex items-center px-3 py-2 rounded-md transition-all duration-200 text-sm group-hover/power:bg-primary/5"
                onMouseEnter={() => setIsHovered(power.name)}
                onMouseLeave={() => setIsHovered(null)}
            >
                <span className="mr-3 text-lg flex-shrink-0">{power.emoji}</span>
                <span
                className={`flex-1 truncate ${power.font}`}
                style={{
                    color: isHovered === power.name ? power.color : 'var(--color-secondary)',
                    textShadow: isHovered === power.name ? `0 0 8px ${power.color}40` : 'none',
                }}
                >
                {power.name}
                </span>
            </button>
            
            {/* Enhanced Tooltip for Dropdown */}
            <div className="absolute left-full ml-3 top-0 w-72 p-4 bg-layer-2 border border-primary/30 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] opacity-0 group-hover/power:opacity-100 group-hover/power:translate-x-1 pointer-events-none transition-all duration-300 z-[110] backdrop-blur-2xl -translate-x-2 border-l-4">
                <div className="relative">
                    <div className="text-[9px] font-mono text-primary/50 uppercase tracking-widest mb-2 flex justify-between items-center">
                        <span>Tactical Brief</span>
                        <div className="flex space-x-1">
                            <span className="w-1 h-1 bg-primary/40 rounded-full animate-ping"></span>
                            <span className="w-1 h-1 bg-primary/40 rounded-full"></span>
                        </div>
                    </div>
                    <div className="text-sm text-secondary font-sans leading-snug mb-4">
                        {power.description}
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-primary/10 shadow-inner">
                        <div className="text-[8px] font-mono text-primary/40 uppercase mb-1">Execute:</div>
                        <div className="text-[10px] font-mono text-primary/80 break-words font-medium">
                            <span className="text-primary/20 mr-1.5">></span>{power.prompt}
                        </div>
                    </div>
                </div>
                {/* Connector triangle */}
                <div className="absolute top-4 -left-1.5 w-3 h-3 bg-layer-2 border-l border-b border-primary/30 rotate-45"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PowersDropdown: React.FC<PowersDropdownProps> = ({ onPowerClick, onClose }) => {
    
    const handlePowerSelection = (prompt: string) => {
        onPowerClick(prompt);
        onClose();
    };

    return (
        <div className="absolute bottom-full left-0 mb-3 w-80 max-h-[70vh] overflow-y-auto overflow-x-visible bg-layer-1/95 border border-layer-3 rounded-2xl shadow-[0_0_50px_rgba(50,205,50,0.15)] z-[90] p-2.5 backdrop-blur-2xl custom-scrollbar animate-in slide-in-from-bottom-2 fade-in duration-300">
           <PowerSection title="Core Capabilities" powers={POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Super Systems" powers={SUPER_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Creative Synthesis" powers={CREATIVE_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Intelligence Ops" powers={INTEL_OPS_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Analytic Engines" powers={ANALYTICS_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Stream Processing" powers={STREAMING_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Automation Hub" powers={AUTOMATION_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Hugging Face Hub" powers={HUGGING_FACE_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Financial Matrix" powers={FINANCIAL_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Vector Drone" powers={VECTOR_DRONE_POWERS} onPowerClick={handlePowerSelection} />
        </div>
    );
};