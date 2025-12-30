
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
  const [hoveredPower, setHoveredPower] = useState<string | null>(null);

  return (
    <div className="mb-4 last:mb-0">
      <h3 className="px-3 pt-2 pb-1.5 text-[9px] font-mono text-gray-500 uppercase tracking-[0.25em] border-b border-layer-3 mb-1">{title}</h3>
      <div className="space-y-0.5">
        {powers.map(power => (
          <div key={power.name} className="relative">
            <button
                onClick={() => onPowerClick(power.prompt)}
                className="group w-full text-left flex items-center px-3 py-2 rounded-md transition-all duration-200 text-sm hover:bg-primary/5 border border-transparent hover:border-primary/10"
                onMouseEnter={() => setHoveredPower(power.name)}
                onMouseLeave={() => setHoveredPower(null)}
            >
                <span className="mr-3 text-lg flex-shrink-0 group-hover:scale-110 transition-transform">{power.emoji}</span>
                <span
                className={`flex-1 truncate ${power.font}`}
                style={{
                    color: hoveredPower === power.name ? power.color : 'var(--color-secondary)',
                    textShadow: hoveredPower === power.name ? `0 0 8px ${power.color}40` : 'none',
                }}
                >
                {power.name}
                </span>
            </button>
            
            {/* Tooltip pops out to the right of the dropdown */}
            {hoveredPower === power.name && (
                <div className="absolute left-[102%] top-0 w-80 p-4 bg-layer-2/95 border border-primary/40 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.9)] z-[200] backdrop-blur-2xl animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none">
                    <div className="relative">
                        {/* HUD Decoration */}
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary/40"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary/40"></div>

                        <div className="text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-2 flex justify-between items-center border-b border-primary/10 pb-1.5">
                            <span className="flex items-center space-x-2">
                                <span className="w-1 h-1 bg-primary rounded-full animate-ping"></span>
                                <span>Module_Intel</span>
                            </span>
                            <div className="flex space-x-0.5">
                                <div className="w-1 h-1 bg-primary/40 rounded-full"></div>
                                <div className="w-1 h-1 bg-primary/20 rounded-full"></div>
                            </div>
                        </div>
                        
                        <div className="text-xs text-secondary font-sans leading-relaxed mb-4 px-1">
                            {power.description}
                        </div>
                        
                        <div className="bg-black/80 p-3 rounded-lg border border-primary/20 shadow-inner">
                            <div className="text-[9px] font-mono text-primary/40 uppercase mb-1.5 ml-0.5">Exec_String:</div>
                            <div className="text-[10px] font-mono text-primary/80 break-words font-medium leading-relaxed">
                                <span className="text-primary/30 mr-1.5 opacity-50">>></span>{power.prompt}
                            </div>
                        </div>
                    </div>
                    {/* Connector triangle */}
                    <div className="absolute top-4 -left-1.5 w-3 h-3 bg-layer-2 border-l border-b border-primary/40 rotate-45"></div>
                </div>
            )}
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
        <div className="absolute bottom-full left-0 mb-3 w-80 max-h-[70vh] overflow-y-auto overflow-x-visible bg-layer-1/95 border border-layer-3 rounded-2xl shadow-[0_0_50px_rgba(50,205,50,0.15)] z-[150] p-2.5 backdrop-blur-2xl custom-scrollbar animate-in slide-in-from-bottom-2 fade-in duration-300">
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
