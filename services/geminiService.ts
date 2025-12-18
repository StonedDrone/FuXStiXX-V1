
import { GoogleGenAI, Part, Content, Modality, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message, UserSimulationData, PlaylistAnalysisData, MapGroundingChunk, GitData } from '../types';
import * as gitService from './gitService';
import * as workflowService from './workflowService';
import * as knowledgeService from './knowledgeService';
import * as vectorService from './vectorDroneService';

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY environment variable not set");

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Tool Definitions ---
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'git_scout',
    parameters: {
      type: Type.OBJECT,
      description: 'Analyze a GitHub repository history, structure, or dependencies.',
      properties: {
        operation: { type: Type.STRING, enum: ['scout_repo', 'blame_file', 'history_log'], description: 'Type of git analysis' },
        url: { type: Type.STRING, description: 'GitHub URL if applicable' },
        path: { type: Type.STRING, description: 'File path for blame' }
      },
      required: ['operation']
    }
  },
  {
    name: 'knowledge_op',
    parameters: {
      type: Type.OBJECT,
      description: 'Interact with the long-term indexed intelligence base.',
      properties: {
        action: { type: Type.STRING, enum: ['query', 'status', 'purge'], description: 'Intelligence operation' },
        query: { type: Type.STRING, description: 'The question for the knowledge base' }
      },
      required: ['action']
    }
  },
  {
    name: 'automation_op',
    parameters: {
      type: Type.OBJECT,
      description: 'Manage Directed Acyclic Graphs (DAGs) for workflow automation.',
      properties: {
        action: { type: Type.STRING, enum: ['status', 'trigger', 'clear'], description: 'DAG action' },
        name: { type: Type.STRING, description: 'Name of the DAG' }
      },
      required: ['action']
    }
  },
  {
    name: 'vector_drone_op',
    parameters: {
      type: Type.OBJECT,
      description: 'Control the physical or simulated Vector Drone vessel.',
      properties: {
        action: { type: Type.STRING, enum: ['status', 'roam', 'say'], description: 'Drone command' },
        text: { type: Type.STRING, description: 'Text for drone to speak' },
        roam_state: { type: Type.STRING, enum: ['start', 'stop'], description: 'Roam control' }
      },
      required: ['action']
    }
  },
  {
    name: 'financial_scout',
    parameters: {
      type: Type.OBJECT,
      description: 'Scan financial markets for stock, crypto, or quant intel.',
      properties: {
        type: { type: Type.STRING, enum: ['stock', 'crypto', 'quant', 'news'], description: 'Asset type' },
        ticker: { type: Type.STRING, description: 'Ticker symbol (e.g. BTC, AAPL)' }
      },
      required: ['type', 'ticker']
    }
  },
  {
    name: 'binary_analyst',
    parameters: {
      type: Type.OBJECT,
      description: 'Perform a hex-level analysis of an attached binary or text file.',
      properties: {
        file_name: { type: Type.STRING, description: 'The name of the file to scan' }
      },
      required: ['file_name']
    }
  }
];

export const sendMessageToAI = async (history: Message[], currentUserMessageParts: Part[], location?: { latitude: number, longitude: number }) => {
    const queryText = currentUserMessageParts.find(p => 'text' in p)?.text || "";
    const isMapQuery = /near|nearby|where is|location|map|find|restaurant|store|osint|geospatial/i.test(queryText);

    const contents: Content[] = history
        .filter(msg => msg.id !== 'init' && msg.text)
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
    
    contents.push({ role: 'user', parts: currentUserMessageParts });

    // Use gemini-2.5-flash for maps queries as per rules, otherwise use gemini-3-flash-preview
    const model = isMapQuery ? 'gemini-2.5-flash' : 'gemini-3-flash-preview';

    return await ai.models.generateContentStream({
        model: model,
        contents: contents,
        config: {
            systemInstruction: AI_PERSONA_INSTRUCTION,
            tools: isMapQuery 
                ? [{ googleMaps: {} }, { googleSearch: {} }] 
                : [{ functionDeclarations: toolDeclarations }, { googleSearch: {} }],
            toolConfig: (isMapQuery && location) ? {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            } : undefined
        },
    });
};

export const generateImageFromAI = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: aspectRatio as any } }
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("Forge failed.");
}

export const generateAudioFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with a cool persona: ${prompt}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Sonic failure.");
    
    // Convert PCM to playable format (simulation)
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
};

export const resetChat = () => { /* Session is stateless in this implementation */ };
