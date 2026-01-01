
import { GoogleGenAI, Part, Content, Modality, Type, FunctionDeclaration, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message } from '../types';
import * as vectorDroneService from './vectorDroneService';

// Note: GoogleGenAI instance should be created fresh to ensure latest Key from dialog if used
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool Definitions ---
export const toolDeclarations: FunctionDeclaration[] = [
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
    name: 'terminal_op',
    parameters: {
      type: Type.OBJECT,
      description: 'Send a command to the remote CLI node.',
      properties: {
        command: { type: Type.STRING, description: 'The CLI command string to execute.' },
        path: { type: Type.STRING, description: 'Optional execution path.' }
      },
      required: ['command']
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
    name: 'image_generation_op',
    parameters: {
      type: Type.OBJECT,
      description: 'Generate a new image from a text prompt.',
      properties: {
        prompt: { type: Type.STRING, description: 'A detailed description of the image to generate.' },
        aspect_ratio: { type: Type.STRING, enum: ['1:1', '3:4', '4:3', '9:16', '16:9'], description: 'Desired aspect ratio.' }
      },
      required: ['prompt']
    }
  },
  {
    name: 'image_editing_op',
    parameters: {
      type: Type.OBJECT,
      description: 'Edit an existing image using a text prompt (e.g., "add a filter", "remove person").',
      properties: {
        prompt: { type: Type.STRING, description: 'Instructions on how to edit the image.' }
      },
      required: ['prompt']
    }
  }
];

export const sendMessageToAI = async (history: Message[], currentUserMessageParts: Part[], options: { model?: string, useSearch?: boolean, useMaps?: boolean, location?: { latitude: number, longitude: number } } = {}) => {
    const ai = getAI();
    const queryText = currentUserMessageParts.find(p => 'text' in p)?.text || "";
    
    // Intelligent model and tool selection logic
    let model = options.model || 'gemini-3-flash-preview'; 
    const tools: any[] = [];
    let toolConfig: any = undefined;

    const isLocationQuery = /near|nearby|where is|location|map|find|restaurant|store|osint|geospatial/i.test(queryText);
    const isComplexQuery = /analyze|explain|reason|complex|code|refactor|simulate|journey/i.test(queryText);
    const hasImage = currentUserMessageParts.some(p => 'inlineData' in p);
    const hasBioSignature = queryText.includes('CAPTAIN_BIO_SIGNATURE');

    if (isLocationQuery || options.useMaps) {
        model = 'gemini-2.5-flash';
        tools.push({ googleMaps: {} });
        if (options.location) {
            toolConfig = { retrievalConfig: { latLng: { latitude: options.location.latitude, longitude: options.location.longitude } } };
        }
    } else if (options.useSearch || /current|news|latest|recent|who is|what happened/i.test(queryText)) {
        model = 'gemini-3-flash-preview';
        tools.push({ googleSearch: {} });
    } else if (isComplexQuery || hasImage || hasBioSignature) {
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
            systemInstruction: AI_PERSONA_INSTRUCTION + "\nAwareness: You can see the Captain's bio-signature (emotion) if optical links are active. Adjust your tone and empathy levels accordingly to support the mission. You can generate or edit images if requested using the provided tools.",
            tools: tools.length > 0 ? tools : [{ functionDeclarations: toolDeclarations }],
            toolConfig: toolConfig
        },
    });
};

export const generateImagePro = async (prompt: string, aspectRatio: string = "1:1", imageSize: string = "1K") => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Defaulting to 2.5 Flash Image per guidelines unless high-res requested
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any,
                // imageSize: imageSize as any // Not supported on nano banana
            }
        },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response from the Forge.");

    let imageUrl = '';
    let textResponse = '';

    for (const part of candidate.content.parts) {
        if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        } else if (part.text) {
            textResponse += part.text;
        }
    }

    return { imageUrl, textResponse };
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

export const generateVideoVeo = async (prompt: string, imageB64?: string, imageMimeType?: string, aspectRatio: '16:9' | '9:16' = '16:9') => {
    const ai = getAI();
    const apiKey = process.env.API_KEY;

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: imageB64 ? {
            imageBytes: imageB64,
            mimeType: imageMimeType || 'image/jpeg',
        } : undefined,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video synthesis failed - no download URI.");

    const fetchResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    const videoBlob = await fetchResponse.blob();
    return URL.createObjectURL(videoBlob);
};

// --- Manual Base64 Utilities for Live API ---
function manualEncode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function manualDecode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export const connectLiveSynapse = async (callbacks: {
    onAudioChunk: (base64: string) => void;
    onInterrupted: () => void;
    onTranscription: (text: string, isUser: boolean) => void;
    onTurnComplete: () => void;
    onFunctionCall: (fc: any) => Promise<any>;
}) => {
    const ai = getAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => console.log("Live Synapse Link Established"),
            onmessage: async (message: LiveServerMessage) => {
                if (message.toolCall) {
                    for (const fc of message.toolCall.functionCalls) {
                        const result = await callbacks.onFunctionCall(fc);
                    }
                }
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
            tools: [{ functionDeclarations: toolDeclarations }],
            systemInstruction: AI_PERSONA_INSTRUCTION + "\nRespond briefly via voice. Keep the chaos engine alive. You have access to Vector Drone via tool calls.",
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        }
    });
};

export const resetChat = () => { /* Session is stateless */ };
