
import { Part } from "@google/genai";

export type Sender = 'user' | 'ai';

export interface Attachment {
    name: string;
    type: string;
}

export interface GitCommit {
    sha: string;
    author: string;
    date: string;
    message: string;
    url: string;
    avatarUrl: string;
}

export interface GitBlameLine {
    lineNumber: number;
    author: string;
    commitSha: string;
    content: string;
    date: string;
}

export interface RepoFile {
    path: string;
    type: 'blob' | 'tree';
    size?: number;
    url: string;
}

export interface DependencyData {
    name: string;
    version: string;
    isDev?: boolean;
}

export interface GitData {
    type: 'history' | 'blame' | 'structure' | 'dependencies';
    repoName: string;
    commits?: GitCommit[];
    blame?: GitBlameLine[];
    filePath?: string;
    files?: RepoFile[];
    dependencies?: DependencyData[];
}

export type HuggingFaceDataType = 'modelQuery' | 'modelSearch' | 'spaceInfo' | 'datasetSearch';

export interface HuggingFaceResult {
    type: HuggingFaceDataType;
    query: Record<string, any>;
    result: any | null;
    error?: string;
}

export type FinancialDataType = 'stock' | 'news' | 'crypto' | 'quant';

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

export interface QuantitativeMetrics {
    ticker: string;
    alpha: string;
    beta: string;
    sharpeRatio: string;
    sentiment: 'Bullish' | 'Neutral' | 'Bearish';
    recommendation: string;
}

export interface FinancialData {
    type: FinancialDataType;
    data: StockQuote | NewsArticle[] | CryptoPrice | QuantitativeMetrics;
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

export interface TranscriptionData {
    fileName: string;
    transcription: string;
}

export interface IndexedDocument {
    id: string;
    sourceName: string;
    sourceType: 'url' | 'file';
    indexedAt: string;
    chunkCount: number;
}

export interface KnowledgeBaseData {
    documents: IndexedDocument[];
}

export interface MissionNode {
    name: string;
    emoji: string;
    color: string;
}

export type MissionStatus = 'Standby' | 'Active' | 'Completed' | 'Failed';

export interface Mission {
    id: string;
    name: string;
    objective: string;
    flow: MissionNode[];
    status: MissionStatus;
}

export interface MissionData {
    missions: Mission[];
}

export interface NeuralNode {
    id: string;
    label: string;
    type: 'input' | 'output' | 'conv' | 'dense' | 'attention' | 'other';
}

export interface NeuralLayer {
    id: string;
    name: string;
    nodes: NeuralNode[];
}

export interface NeuralConnection {
    from: string; // layer id
    to: string; // layer id
}

export interface NeuralArchitectureData {
    modelName: string;
    layers: NeuralLayer[];
    connections: NeuralConnection[];
    summary: string;
}

export interface UserJourneyStep {
    action: string;
    description: string;
    outcome: 'success' | 'failure' | 'neutral';
}
export interface UserSimulationData {
    persona: string;
    goal: string;
    journey: UserJourneyStep[];
    summary: string;
}

export interface HexDumpData {
  fileName: string;
  hex: string;
  ascii: string;
}

export interface VectorStatus {
    isOnline: boolean;
    batteryLevel: number;
    wifiStrength: number;
    isCharging: boolean;
    statusText: string;
    headAngle: number; // Degrees
    liftHeight: number; // mm
    isPathing: boolean;
    bridgeLatency: number; // ms
}

export interface PlaylistAnalysisData {
    sourceUrl: string;
    name: string;
    description: string;
    mood: string[];
    genres: string[];
    topArtists: string[];
    trackCount: number;
}

export interface MapGroundingChunk {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  attachments?: Attachment[];
  status?: 'generating' | 'complete' | 'error';
  media?: {
    type: 'image' | 'video' | 'audio' | 'vr' | 'creativeCode' | 'uiMockup' | 'motionFx' | 'algoVisualization' | 'icon' | 'densePose' | 'magic3d' | 'gaussianDream';
    url?: string;
    content?: string;
    prompt: string;
    status?: 'generating' | 'complete' | 'error';
    progress?: number;
  };
  huggingFaceData?: HuggingFaceResult;
  financialData?: FinancialData;
  workflowData?: WorkflowData;
  transcriptionData?: TranscriptionData;
  knowledgeBaseData?: KnowledgeBaseData;
  missionData?: MissionData;
  neuralArchitectureData?: NeuralArchitectureData;
  userSimulationData?: UserSimulationData;
  hexDumpData?: HexDumpData;
  vectorStatus?: VectorStatus;
  playlistAnalysisData?: PlaylistAnalysisData;
  gitData?: GitData;
  mapsGrounding?: MapGroundingChunk[];
  isLiveStream?: boolean;
  isLiveSyncUpdate?: boolean;
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

export type LiveStreamState = {
    source: string | null;
    status: 'idle' | 'active' | 'error';
};
