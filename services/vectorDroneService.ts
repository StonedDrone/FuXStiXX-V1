import { VectorStatus } from '../types';

const NOT_CONNECTED_ERROR = "Vector Drone SDK endpoint not connected.";

export const getStatus = async (): Promise<VectorStatus> => {
    throw new Error(NOT_CONNECTED_ERROR);
};

export const controlRoaming = async (action: 'start' | 'stop'): Promise<string> => {
    throw new Error(NOT_CONNECTED_ERROR);
};

export const sayText = async (text: string): Promise<string> => {
    throw new Error(NOT_CONNECTED_ERROR);
};