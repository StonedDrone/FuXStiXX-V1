import React from 'react';
import { VectorStatus } from '../types';
import { BatteryIcon } from './icons/BatteryIcon';
import { WifiIcon } from './icons/WifiIcon';
import { BotMessageIcon } from './icons/BotMessageIcon';

const DataCard: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="mt-3 border border-layer-3 rounded-lg bg-layer-2/50 overflow-hidden font-sans">
        <div className="p-2 bg-layer-2 border-b border-layer-3 text-xs font-mono">
            <span className="text-secondary">{title}</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);

const VectorStatusView: React.FC<{ data: VectorStatus }> = ({ data }) => {
    const batteryColor = data.batteryLevel > 50 ? 'text-success' : data.batteryLevel > 20 ? 'text-yellow-400' : 'text-danger';
    
    return (
        <DataCard title="Vector Drone Status">
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div className="flex items-center space-x-2">
                    <BatteryIcon className={batteryColor} isCharging={data.isCharging} />
                    <span className="text-secondary">
                        {data.batteryLevel}% {data.isCharging ? '(Charging)' : ''}
                    </span>
                </div>
                 <div className="flex items-center space-x-2">
                    <WifiIcon className="text-primary" />
                    <span className="text-secondary">{data.wifiStrength}% Signal</span>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-layer-3 flex items-start space-x-2">
                <BotMessageIcon className="text-secondary mt-1 flex-shrink-0" />
                <p className="text-sm text-secondary italic">{data.statusText}</p>
            </div>
        </DataCard>
    );
};

export default VectorStatusView;
