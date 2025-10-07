import React, { useState } from 'react';
import { POWERS, SUPER_POWERS, CREATIVE_POWERS, HUGGING_FACE_POWERS, FINANCIAL_POWERS } from '../constants';

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
    <div className="mb-2 last:mb-0">
      <h3 className="px-3 pt-2 pb-1 text-xs font-mono text-secondary uppercase tracking-wider">{title}</h3>
      <div className="space-y-1">
        {powers.map(power => (
          <button
            key={power.name}
            onClick={() => onPowerClick(power.prompt)}
            className="w-full text-left flex items-center px-3 py-1.5 rounded-md transition-all duration-200 text-sm"
            onMouseEnter={() => setIsHovered(power.name)}
            onMouseLeave={() => setIsHovered(null)}
            style={{
              backgroundColor: isHovered === power.name ? `${power.color}1A` : 'transparent',
            }}
          >
            <span className="mr-3 text-lg">{power.emoji}</span>
            <span
              className={`flex-1 ${power.font}`}
              style={{
                color: power.color,
                textShadow: isHovered === power.name ? `0 0 5px ${power.color}` : 'none',
              }}
            >
              {power.name}
            </span>
          </button>
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
        <div className="absolute bottom-full mb-2 w-80 max-h-[60vh] overflow-y-auto bg-layer-1 border border-layer-3 rounded-lg shadow-2xl shadow-primary/20 z-10 p-2">
           <PowerSection title="Core Powers" powers={POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Super Powers" powers={SUPER_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Creative Powers" powers={CREATIVE_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Hugging Face Ops" powers={HUGGING_FACE_POWERS} onPowerClick={handlePowerSelection} />
           <PowerSection title="Financial Ops" powers={FINANCIAL_POWERS} onPowerClick={handlePowerSelection} />
        </div>
    );
};