import React from 'react';
import { VectorStatus } from '../types';
import { BatteryIcon } from './icons/BatteryIcon';
import { WifiIcon } from './icons/WifiIcon';
import { BotMessageIcon } from './icons/BotMessageIcon';

const DataCard: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => (
    <div className="mt-3 border border-layer-3 rounded-lg bg-layer-2/50 overflow-hidden font-sans shadow-lg shadow-primary/5">
        <div className="p-2 bg-layer-2 border-b border-layer-3 text-[10px] font-mono flex items-center justify-between">
            <span className="text-secondary uppercase tracking-widest">{title}</span>
            <span className="text-primary/50">gRPC_BRIDGE_LINK: STABLE</span>
        </div>
        <div className="p-3">
            {children}
        </div>
    </div>
);

const TelemetryRow: React.FC<{ label: string, value: string | number, unit?: string }> = ({ label, value, unit }) => (
    <div className="flex justify-between items-center py-1 border-b border-layer-3/30 last:border-0">
        <span className="text-[10px] text-gray-500 uppercase">{label}</span>
        <span className="text-xs font-mono text-secondary">{value}{unit}</span>
    </div>
);

const VectorStatusView: React.FC<{ data: VectorStatus }> = ({ data }) => {
    const batteryColor = data.batteryLevel > 50 ? 'text-success' : data.batteryLevel > 20 ? 'text-yellow-400' : 'text-danger';
    
    return (
        <DataCard title="Vector Drone | Core Telemetry">
            <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center space-x-2 bg-black/30 p-2 rounded">
                    <BatteryIcon className={batteryColor} isCharging={data.isCharging} />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-500 font-mono">POWER</span>
                        <span className="text-xs font-mono text-secondary">
                            {data.batteryLevel}% {data.isCharging ? '⚡' : ''}
                        </span>
                    </div>
                </div>
                 <div className="flex items-center space-x-2 bg-black/30 p-2 rounded">
                    <WifiIcon className="text-primary" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-gray-500 font-mono">SIGNAL</span>
                        <span className="text-xs font-mono text-secondary">{data.wifiStrength}%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-0 bg-black/20 p-2 rounded">
                <TelemetryRow label="Head Angle" value={data.headAngle} unit="°" />
                <TelemetryRow label="Lift Height" value={data.liftHeight} unit="mm" />
                <TelemetryRow label="Bridge Latency" value={data.bridgeLatency} unit="ms" />
                <TelemetryRow label="Active Pathing" value={data.isPathing ? "TRUE" : "FALSE"} />
            </div>

            <div className="mt-3 pt-3 border-t border-layer-3 flex items-start space-x-2">
                <BotMessageIcon className="text-primary/70 mt-1 flex-shrink-0" />
                <div className="flex-1">
                    <span className="text-[8px] text-gray-500 font-mono block">SYSTEM_LOG</span>
                    <p className="text-xs text-secondary font-mono italic">{data.statusText}</p>
                </div>
            </div>
        </DataCard>
    );
};

export default VectorStatusView;