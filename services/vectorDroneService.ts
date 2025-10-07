import { VectorStatus } from '../types';

let isRoaming = false;

export const getStatus = async (): Promise<VectorStatus> => {
    await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 500));
    
    // Simulate some variability
    const battery = Math.floor(Math.random() * 60 + 40); // 40-100%
    const isCharging = battery < 95 && Math.random() > 0.7;

    return {
        isOnline: true,
        batteryLevel: battery,
        wifiStrength: Math.floor(Math.random() * 30 + 70), // 70-100%
        isCharging,
        statusText: isRoaming ? 'Actively exploring environment.' : 'Idle. Awaiting command.'
    };
};

export const controlRoaming = async (action: 'start' | 'stop'): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (action === 'start' && !isRoaming) {
        isRoaming = true;
        return "Acknowledged. Engaging autonomous exploration protocols.";
    }
    if (action === 'start' && isRoaming) {
        return "Drone is already in autonomous exploration mode, Captain.";
    }
    if (action === 'stop' && isRoaming) {
        isRoaming = false;
        return "Acknowledged. Halting exploration and returning to standby.";
    }
    if (action === 'stop' && !isRoaming) {
        return "Drone is already on standby, Captain.";
    }
    return "Invalid roam command.";
};

export const sayText = async (text: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Vector drone says: ${text}`);
    return `Acknowledged. Relaying message via drone's speakers: "${text}"`;
};
