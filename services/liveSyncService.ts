
let syncIntervalId: number | null = null;

export interface LiveSyncUpdate {
    fileName: string;
    summary: string;
    content: string;
}

const simulatedUpdates: LiveSyncUpdate[] = [
    { fileName: 'App.tsx', summary: 'Optimized render cycles for the MagicMirrorBox.', content: '// [LiveSync] Performance patch applied to animation loop.' },
    { fileName: 'constants.ts', summary: 'Injected new chaotic frequencies into the Vortex Engine.', content: '// [LiveSync] Frequency delta adjusted for higher resonance.' },
    { fileName: 'geminiService.ts', summary: 'Refined tool hand-off protocols for better mission stability.', content: '// [LiveSync] Tool schema validation strictly enforced.' },
    { fileName: 'HUDOverlay.tsx', summary: 'Refined optical telemetry overlays for bio-signal detection.', content: '// [LiveSync] HUD opacity tuned for stealth visibility.' },
    { fileName: 'Playlist.tsx', summary: 'Synchronized Mission Jams with the Vortex frequency core.', content: '// [LiveSync] Audio buffer latency reduced by 12ms.' }
];

export const start = (onUpdate: (update: LiveSyncUpdate) => void): void => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    console.log("Engaging live code sync simulation...");
    
    // Send first update after 15 seconds, then every 45
    setTimeout(() => {
        const initial = simulatedUpdates[Math.floor(Math.random() * simulatedUpdates.length)];
        onUpdate(initial);
    }, 15000);

    syncIntervalId = window.setInterval(() => {
        const update = simulatedUpdates[Math.floor(Math.random() * simulatedUpdates.length)];
        onUpdate(update);
    }, 45000);
};

export const stop = (): void => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        console.log("Live code sync disengaged.");
    }
};
