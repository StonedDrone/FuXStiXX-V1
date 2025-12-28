
import { GoogleGenAI, Part, Content, Modality, Type, FunctionDeclaration, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message } from '../types';

// Note: GoogleGenAI instance should be created fresh to ensure latest Key from dialog if used
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---
const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'live_sync_op',
    parameters: {
      type: Type.OBJECT,
      description: 'Manage real-time synchronization with the codebase.',
      properties: {
        action: { type: Type.STRING, enum: ['engage', 'disengage', 'status'], description: 'Sync command' }
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
  }
];

export const sendMessageToAI = async (history: Message[], currentUserMessageParts: Part[], options: { model?: string, useSearch?: boolean, useMaps?: boolean, location?: { latitude: number, longitude: number } } = {}) => {
    const ai = getAI();
    const queryText = currentUserMessageParts.find(p => 'text' in p)?.text || "";
    
    // Intelligent model and tool selection logic
    let model = options.model || 'gemini-3-flash-preview'; // Default to Flash for speed
    const tools: any[] = [];
    let toolConfig: any = undefined;

    const isLocationQuery = /near|nearby|where is|location|map|find|restaurant|store|osint|geospatial/i.test(queryText);
    const isComplexQuery = /analyze|explain|reason|complex|code|refactor|simulate|journey/i.test(queryText);
    const hasImage = currentUserMessageParts.some(p => 'inlineData' in p);

    if (isLocationQuery || options.useMaps) {
        model = 'gemini-2.5-flash';
        tools.push({ googleMaps: {} });
        if (options.location) {
            toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: options.location.latitude,
                        longitude: options.location.longitude
                    }
                }
            };
        }
    } else if (options.useSearch || /current|news|latest|recent|who is|what happened/i.test(queryText)) {
        model = 'gemini-3-flash-preview';
        tools.push({ googleSearch: {} });
    } else if (isComplexQuery || hasImage) {
        // AI Chatbot and Image Analysis use Pro
        model = 'gemini-3-pro-preview';
    }

    const contents: Content[] = history
        .filter(msg => msg.id !== 'init' && msg.text)
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
    
    contents.push({ role: 'user', parts: currentUserMessageParts });

    return await ai.models.generateContentStream({
        model: model,
        contents: contents,
        config: {
            systemInstruction: AI_PERSONA_INSTRUCTION,
            tools: tools.length > 0 ? tools : [{ functionDeclarations: toolDeclarations }],
            toolConfig: toolConfig
        },
    });
};

export const editImageWithAI = async (imageB64: string, mimeType: string, prompt: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageB64, mimeType: mimeType } },
                { text: prompt }
            ]
        }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from Forge.");

    let editedImageUrl = '';
    let textResponse = '';

    for (const part of candidate.content.parts) {
        if (part.inlineData) {
            editedImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
            textResponse += part.text;
        }
    }

    return { editedImageUrl, textResponse };
};

export const connectLiveSynapse = async (callbacks: {
    onAudioChunk: (base64: string) => void;
    onInterrupted: () => void;
    onTranscription: (text: string, isUser: boolean) => void;
    onTurnComplete: () => void;
}) => {
    const ai = getAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log("Live Synapse Link Established"),
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                    callbacks.onAudioChunk(message.serverContent.modelTurn.parts[0].inlineData.data);
                }
                if (message.serverContent?.interrupted) {
                    callbacks.onInterrupted();
                }
                if (message.serverContent?.inputTranscription) {
                    callbacks.onTranscription(message.serverContent.inputTranscription.text, true);
                }
                if (message.serverContent?.outputTranscription) {
                    callbacks.onTranscription(message.serverContent.outputTranscription.text, false);
                }
                if (message.serverContent?.turnComplete) {
                    callbacks.onTurnComplete();
                }
            },
            onerror: (e) => console.error("Synapse Leak:", e),
            onclose: () => console.log("Synapse Closed"),
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
            systemInstruction: AI_PERSONA_INSTRUCTION + "\nRespond briefly and keep the chaos alive.",
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        }
    });
};

export const resetChat = () => { /* Session is stateless */ };
