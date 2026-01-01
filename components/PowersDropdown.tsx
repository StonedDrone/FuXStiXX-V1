
import React, { useState, useRef } from 'react';
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
    VECTOR_DRONE_POWERS,
    CLI_POWERS
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
  const [hoverPos, setHoverPos] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent, powerName: string) => {
      const rect = e.currentTarget.getBoundingClientRect();
      setHoverPos({ top: rect.top, left: rect.right + 10 });
      // Fixed: Change setHoverPower to setHoveredPower to match the state setter name
      setHoveredPower(powerName);
  };

  return (
    <div className="mb-4 last:mb-0">
      <h3 className="px-3 pt-2 pb-1.5 text-[9px] font-mono text-gray-500 uppercase tracking-[0.25em] border-b border-layer-3 mb-2 flex justify-between items-center">
          <span>{title}</span>
          <div className="w-1 h-1 bg-primary/20 rounded-full"></div>
      </h3>
      <div className="space-y-0.5">
        {powers.map(power => (
          <div key={power.name} className="relative">
            <button
                onClick={() => onPowerClick(power.prompt)}
                className="group w-full text-left flex items-center px-3 py-2 rounded-md transition-all duration-200 text-sm hover:bg-primary/5 border border-transparent hover:border-primary/10"
                onMouseEnter={(e) => handleMouseEnter(e, power.name)}
                onMouseLeave={() => setHoveredPower(null)}
            >
                <span className="mr-3 text-lg flex-shrink-0 group-hover:scale-125 transition-transform duration-300">{power.emoji}</span>
                <span
                className={`flex-1 truncate ${power.font} font-medium`}
                style={{
                    color: hoveredPower === power.name ? power.color : 'var(--color-secondary)',
                    textShadow: hoveredPower === power.name ? `0 0 10px ${power.color}60` : 'none',
                }}
                >
                {power.name}
                </span>
            </button>
            
            {/* Holographic Tooltip - Fixed to avoid clipping */}
            {hoveredPower === power.name && (
                <div 
                    className="fixed w-80 p-5 bg-layer-2/95 border border-primary/40 rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.9)] z-[1000] backdrop-blur-3xl animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none ring-1 ring-white/10"
                    style={{ top: hoverPos.top, left: hoverPos.left }}
                >
                    <div className="relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}></div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-primary/50"></div>
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-primary/50"></div>

                        <div className="text-[10px] font-mono text-primary/70 uppercase tracking-widest mb-3 flex justify-between items-center border-b border-primary/10 pb-2">
                            <span className="flex items-center space-x-2">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                                <span className="font-bold">MODULE_DATA</span>
                            </span>
                        </div>
                        
                        <div className="text-sm text-secondary font-sans leading-relaxed mb-5 px-1 font-medium italic">
                            {power.description}
                        </div>
                        
                        <div className="bg-black/90 p-3.5 rounded-lg border border-primary/20 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                            <div className="text-[9px] font-mono text-primary/40 uppercase mb-2 ml-0.5 flex items-center space-x-2">
                                <span className="w-1 h-[1px] bg-primary/30"></span>
                                <span>SYSTEM_EXEC:</span>
                            </div>
                            <div className="text-[11px] font-mono text-primary/80 break-words font-medium leading-relaxed">
                                <span className="text-primary/30 mr-2 opacity-50 font-bold">$</span>{power.prompt}
                            </div>
                        </div>
                    </div>
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
        <div className="absolute bottom-full left-0 mb-4 w-80 max-h-[75vh] overflow-y-auto overflow-x-visible bg-layer-1/98 border border-layer-3 rounded-2xl shadow-[0_0_60px_rgba(50,205,50,0.25)] z-[150] p-3 backdrop-blur-3xl custom-scrollbar animate-in slide-in-from-bottom-2 fade-in duration-300 ring-1 ring-white/5">
           <PowerSection title="Direct Logic" powers={POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Super Protocol" powers={SUPER_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Terminal Ops" powers={CLI_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Synthesis Lab" powers={CREATIVE_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Intelligence Ops" powers={INTEL_OPS_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Analytic Engine" powers={ANALYTICS_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Data Stream" powers={STREAMING_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Automation Hub" powers={AUTOMATION_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Hugging Face" powers={HUGGING_FACE_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Market Grid" powers={FINANCIAL_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Vector Link" powers={VECTOR_DRONE_POWERS} onPowerClick={handlePowerSelection} />
        </div>
    );
};
