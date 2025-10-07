let streamIntervalId: number | null = null;

const MOCK_LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const MOCK_LOG_MESSAGES = [
    'User authentication successful for user: admin',
    'Database connection established.',
    'API endpoint GET /api/data requested.',
    'Failed to process payment for transaction ID: 847291',
    'Cache cleared successfully.',
    'System performing scheduled maintenance.',
    'Unusual login pattern detected from IP: 192.168.1.101',
    'High memory usage detected: 92% of total.',
];

const generateLogLine = (): string => {
    const timestamp = new Date().toISOString();
    const level = MOCK_LOG_LEVELS[Math.floor(Math.random() * MOCK_LOG_LEVELS.length)];
    const message = MOCK_LOG_MESSAGES[Math.floor(Math.random() * MOCK_LOG_MESSAGES.length)];
    return `${timestamp} [${level}] - ${message}`;
};

const analyzeLogLine = (log: string): string => {
    if (log.includes('ERROR') || log.includes('Failed')) {
        return `[LIVE ANALYSIS] Critical error detected: \`${log}\`. Recommend immediate investigation, Captain.`;
    }
    if (log.includes('WARN') || log.includes('Unusual') || log.includes('High memory')) {
        return `[LIVE ANALYSIS] Potential anomaly detected: \`${log}\`. I am monitoring the situation.`;
    }
    return ''; // Don't report on mundane logs
};

export const start = (source: string, onNewMessage: (message: string) => void) => {
    if (streamIntervalId) {
        clearInterval(streamIntervalId);
    }

    console.log(`Starting live intel stream for source: ${source}`);

    streamIntervalId = window.setInterval(() => {
        const logLine = generateLogLine();
        const analysis = analyzeLogLine(logLine);
        if (analysis) {
            onNewMessage(analysis);
        }
    }, 4000); // Generate a new log every 4 seconds
};

export const stop = () => {
    if (streamIntervalId) {
        clearInterval(streamIntervalId);
        streamIntervalId = null;
        console.log("Live intel stream stopped.");
    }
};
