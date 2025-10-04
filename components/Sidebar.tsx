import React from 'react';
import { POWERS, SUPER_POWERS } from '../constants';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-80 bg-layer-1 border-r border-layer-3 flex flex-col p-4 overflow-y-auto">
      <div className="flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-2 font-mono">Powers</h2>
        <ul className="space-y-1 text-sm text-secondary">
          {POWERS.map(power => (
            <li key={power.name} className="flex items-start" title={power.description}>
                <span className="text-primary mr-2 mt-1">●</span> 
                <span>{power.name}</span>
            </li>
          ))}
        </ul>
      </div>
       <div className="mt-6 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-200 mb-2 font-mono">Super Powers</h2>
        <ul className="space-y-1 text-sm text-secondary">
          {SUPER_POWERS.map(power => (
            <li key={power.name} className="flex items-start" title={power.description}>
                <span className="text-primary mr-2 mt-1">●</span> 
                <span>{power.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
