let syncIntervalId: number | null = null;

const MOCK_FILES: Record<string, string> = {
    'App.tsx': `import React from 'react';\n// ... (rest of the file content)`,
    'services/geminiService.ts': `import { GoogleGenAI } from "@google/genai";\n// Updated with new model parameters`,
    'components/ChatInterface.tsx': `const ChatInterface = () => {\n  // Refactored handleSend for clarity\n}`,
    'constants.ts': `export const NEW_FEATURE_FLAG = true;\n// ...`
};

const MOCK_CHANGES: string[] = [
    'Refactored component for better performance and readability.',
    'Added a new feature flag for upcoming functionality.',
    'Fixed a critical bug related to state management.',
    'Updated API service to use the latest model version.',
    'Improved UI responsiveness on smaller devices.',
];

export interface LiveSyncUpdate {
    fileName: string;
    summary: string;
    content: string;
}

const generateUpdate = (): LiveSyncUpdate => {
    const fileNames = Object.keys(MOCK_FILES);
    const fileName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const summary = MOCK_CHANGES[Math.floor(Math.random() * MOCK_CHANGES.length)];
    const content = MOCK_FILES[fileName];
    return { fileName, summary, content };
};

export const start = (onUpdate: (update: LiveSyncUpdate) => void): void => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }
    console.log("Live code sync engaged.");
    
    // Trigger first update quickly, then settle into interval
    setTimeout(() => onUpdate(generateUpdate()), 3000);

    syncIntervalId = window.setInterval(() => {
        onUpdate(generateUpdate());
    }, Math.random() * 10000 + 15000); // every 15-25 seconds
};

export const stop = (): void => {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        console.log("Live code sync disengaged.");
    }
};
