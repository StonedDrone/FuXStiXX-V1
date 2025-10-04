import React from 'react';
import { POWERS, SUPER_POWERS } from '../constants';

const Sidebar: React.FC = () => {
  const PowerListItem = ({ power }: { power: typeof POWERS[0]}) => (
    <li className="flex items-start" title={power.description}>
        <span className="mr-3 text-lg">{power.emoji}</span> 
        <span className={`flex-1 ${power.font}`} style={{ color: power.color }}>
          {power.name}
        </span>
    </li>
  );

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
