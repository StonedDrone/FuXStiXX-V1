import { VectorStatus } from '../types';

// FuXStiXX Vector Bridge (Simulated gRPC Client)
// Inspired by: https://github.com/codaris/Anki.Vector.SDK

let isRoaming = false;

const generateRandomTelemetry = (): Partial<VectorStatus> => ({
    batteryLevel: Math.floor(Math.random() * 20) + 70, // 70-90%
    wifiStrength: Math.floor(Math.random() * 30) + 60, // 60-90%
    headAngle: Math.floor(Math.random() * 45) - 22, // -22 to 22 degrees
    liftHeight: Math.floor(Math.random() * 50) + 10, // 10-60 mm
    bridgeLatency: Math.floor(Math.random() * 100) + 20, // 20-120 ms
});

export const getStatus = async (): Promise<VectorStatus> => {
    // Simulate gRPC call to get robot state
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
        isOnline: true,
        isCharging: false,
        statusText: isRoaming ? "ROAMING_ENVIRONMENT" : "IDLE_STATIONARY",
        isPathing: isRoaming,
        ...generateRandomTelemetry()
    } as VectorStatus;
};

export const controlRoaming = async (action: 'start' | 'stop'): Promise<string> => {
    // Simulate BehaviorService calls
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (action === 'start') {
        isRoaming = true;
        return "BehaviorService: START_ROAMING | Intent: EXPLORE_COASTLINE triggered. Drone is now pathing through the current sector.";
    } else {
        isRoaming = false;
        return "BehaviorService: STOP_ROAMING | Intent: RETURN_TO_IDLE. Drone has ceased all kinetic operations.";
    }
};

export const sayText = async (text: string): Promise<string> => {
    // Simulate SayText gRPC request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return `SayText: "${text}" | Status: EXECUTED_ON_DRONE. The drone's vocal synth has projected your message, Captain.`;
};