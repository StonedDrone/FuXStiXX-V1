let syncIntervalId: number | null = null;

export interface LiveSyncUpdate {
    fileName: string;
    summary: string;
    content: string;
}

export const start = (onUpdate: (update: LiveSyncUpdate) => void): void => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    console.log("Attempting to engage live code sync...");
    throw new Error("Direct file system access is not available for Live Sync.");
};

export const stop = (): void => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        console.log("Live code sync disengaged.");
    }
};