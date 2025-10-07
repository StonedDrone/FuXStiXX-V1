let streamIntervalId: number | null = null;

export const start = (source: string, onNewMessage: (message: string) => void) => {
    if (streamIntervalId) {
        clearInterval(streamIntervalId);
    }
    console.log(`Attempting to start live intel stream for source: ${source}`);
    throw new Error("Live streaming endpoint not configured. Direct execution requires a valid source connection.");
};

export const stop = () => {
    if (streamIntervalId) {
        clearInterval(streamIntervalId);
        streamIntervalId = null;
        console.log("Live intel stream stopped.");
    }
};