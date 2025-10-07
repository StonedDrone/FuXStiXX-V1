// FIX: Removed self-import of 'Sender' which was causing a name conflict.
export type Sender = 'user' | 'ai';

export interface Attachment {
    name: string;
    type: string;
}

export type HuggingFaceDataType = 'modelQuery' | 'modelSearch' | 'spaceInfo';

export interface HuggingFaceResult {
    type: HuggingFaceDataType;
    query: Record<string, any>;
    result: any | null;
    error?: string;
}

export type FinancialDataType = 'stock' | 'news' | 'crypto';

export interface StockQuote {
    ticker: string;
    name: string;
    price: string;
    change: string;
    changePercent: string;
    volume: string;
    isPositive: boolean;
}

export interface NewsArticle {
    headline: string;
    source: string;
    url: string;
    timestamp: string;
}

export interface CryptoPrice {
    symbol: string;
    name: string;
    price: string;
    change24h: string;
    isPositive: boolean;
}

export interface FinancialData {
    type: FinancialDataType;
    data: StockQuote | NewsArticle[] | CryptoPrice;
}

export type DAGRunStatus = 'running' | 'success' | 'failed' | 'scheduled';

export interface DAGTask {
    id: string;
    description: string;
}

export interface DAGRun {
    id: string;
    startTime: string;
    endTime?: string;
    status: DAGRunStatus;
}

export interface DAG {
    id: string;
    name: string;
    schedule: string;
    tasks: DAGTask[];
    runs: DAGRun[];
    isPaused: boolean;
}

export interface WorkflowData {
    dags: DAG[];
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  attachments?: Attachment[];
  status?: 'generating' | 'complete' | 'error';
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    prompt: string;
    status?: 'generating' | 'complete' | 'error';
  };
  huggingFaceData?: HuggingFaceResult;
  financialData?: FinancialData;
  workflowData?: WorkflowData;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  albumArtUrl: string;
  audioSrc: string;
  playCount: number;
  lastPlayed: string | null;
}

export type ActiveModel = {
    type: 'gemini' | 'huggingface' | 'lmstudio';
    modelId: string;
    baseURL?: string;
};

export interface Emotion {
    emotion: string;
    score: number;
}

export interface Pose {
    name: string;
    score: number;
}