
import React, { useState } from 'react';
import { POWERS, SUPER_POWERS } from '../constants';

const Sidebar: React.FC = () => {
  // FIX: Explicitly type the inline component with React.FC to correctly handle the 'key' prop.
  const PowerListItem: React.FC<{ power: typeof POWERS[0]}> = ({ power }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <li 
            className="flex items-start p-1 rounded-md transition-all duration-200 cursor-pointer" 
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
        </li>
    );
  };

  return (
    <aside className="w-80 bg-layer-1 border-r border-layer-3 flex flex-col p-4 overflow-y-auto">
      <div className="flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 font-mono">Powers</h2>
        <ul className="space-y-3 text-sm">
          {POWERS.map(power => (
            <PowerListItem key={power.name} power={power} />
          ))}
        </ul>
      </div>
       <div className="mt-8 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 font-mono">Super Powers</h2>
        <ul className="space-y-3 text-sm">
          {SUPER_POWERS.map(power => (
            <PowerListItem key={power.name} power={power} />
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;