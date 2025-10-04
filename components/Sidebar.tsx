import React, { useState } from 'react';
import { POWERS, SUPER_POWERS, CREATIVE_POWERS, HUGGING_FACE_POWERS } from '../constants';

interface SidebarProps {
  onPowerClick: (prompt: string) => void;
}

type Power = typeof POWERS[0];

const Sidebar: React.FC<SidebarProps> = ({ onPowerClick }) => {
  const PowerListItem: React.FC<{ power: Power; onClick: () => void }> = ({ power, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            className="w-full text-left flex items-start p-1 rounded-md transition-all duration-200"
            title={power.description}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: isHovered ? `${power.color}1A` : 'transparent', // ~10% opacity glow
            }}
        >
            <span className="mr-3 text-lg">{power.emoji}</span> 
            <span 
                className={`flex-1 ${power.font}`} 
                style={{ 
                    color: power.color,
                    textShadow: isHovered ? `0 0 5px ${power.color}` : 'none'
                }}
            >
              {power.name}
            </span>
        </button>
    );
  };

  return (
    <aside className="w-80 bg-layer-1 border-r border-layer-3 flex flex-col p-4 overflow-y-auto">
      <div className="flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 font-mono">Powers</h2>
        <div className="space-y-3 text-sm">
          {POWERS.map(power => (
            <PowerListItem key={power.name} power={power} onClick={() => onPowerClick(power.prompt)} />
          ))}
        </div>
      </div>
       <div className="mt-8 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 font-mono">Super Powers</h2>
        <div className="space-y-3 text-sm">
          {SUPER_POWERS.map(power => (
            <PowerListItem key={power.name} power={power} onClick={() => onPowerClick(power.prompt)} />
          ))}
        </div>
      </div>
      <div className="mt-8 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 font-mono">Creative Powers</h2>
        <div className="space-y-3 text-sm">
          {CREATIVE_POWERS.map(power => (
            <PowerListItem key={power.name} power={power} onClick={() => onPowerClick(power.prompt)} />
          ))}
        </div>
      </div>
      <div className="mt-8 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 font-mono">Hugging Face Ops</h2>
        <div className="space-y-3 text-sm">
          {HUGGING_FACE_POWERS.map(power => (
            <PowerListItem key={power.name} power={power} onClick={() => onPowerClick(power.prompt)} />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;