
import { GoogleGenAI, Part, Content, Chat, Modality, Type, GenerateContentResponse } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message, UserSimulationData, PlaylistAnalysisData, MapGroundingChunk } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chat: Chat | null = null;

const VALID_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const getChatSession = (history: Message[]): Chat => {
    if (chat) {
        return chat;
    }

    const chatHistory: Content[] = history
        .filter(msg => msg.id !== 'init')
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

    chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: chatHistory,
        config: {
          systemInstruction: AI_PERSONA_INSTRUCTION,
        }
    });
    
    return chat;
}

export const sendMessageToAI = async (history: Message[], currentUserMessageParts: Part[], location?: { latitude: number, longitude: number }) => {
  const queryText = currentUserMessageParts.find(p => 'text' in p)?.text || "";
  const isPlaceQuery = /near|nearby|where is|location|map|find|restaurant|store|park|address|at|in|coordinate|osint|geospatial/i.test(queryText);

  if (isPlaceQuery) {
    const contents: Content[] = history
        .filter(msg => msg.id !== 'init' && msg.text)
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
    
    contents.push({ role: 'user', parts: currentUserMessageParts });

    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
            systemInstruction: AI_PERSONA_INSTRUCTION,
            tools: [{ googleMaps: {} }, { googleSearch: {} }],
            toolConfig: location ? {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            } : undefined
        },
    });
    return response;
  }

  const session = getChatSession(history);
  const result = await session.sendMessageStream({ message: currentUserMessageParts });
  return result;
};

export const generateImageFromAI = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const validatedAspectRatio = VALID_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : '1:1';
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: { aspectRatio: validatedAspectRatio as any }
        }
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Image Forge failed: No image data returned.");
}

export const editImageFromAI = async (prompt: string, base64ImageData: string, mimeType: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: prompt },
            ],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("Image Alchemy failed: No image returned.");
};

export const generateVideoFromAI = async (prompt: string): Promise<string> => {
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video synthesis failed.");
    return `${downloadLink}&key=${API_KEY}`;
}

export const generateAudioFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this with an enigmatic, cool, stoned-drone persona: ${prompt}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Sonic Synthesis failed.");

    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const wavBlob = pcmToWav(bytes, 24000);
    return URL.createObjectURL(wavBlob);
};

function pcmToWav(pcmData: Uint8Array, sampleRate: number): Blob {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    const writeString = (v: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) v.setUint8(offset + i, string.charCodeAt(i));
    };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true);
    return new Blob([header, pcmData], { type: 'audio/wav' });
}

export const generateVRSceneFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Generate A-Frame HTML scene markup only. Wrap in <a-scene>." }
    });
    const match = response.text.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : response.text.trim();
};

export const generateCreativeCodeFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Generate p5.js JavaScript code only." }
    });
    const match = response.text.match(/```(?:javascript|js)?\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : response.text.trim();
};

export const generateUIMockupFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Generate a complete HTML file with embedded CSS for a UI component." }
    });
    const match = response.text.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : response.text.trim();
};

export const generateMotionFXFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Generate a complete HTML file using mojs library from CDN." }
    });
    const match = response.text.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : response.text.trim();
};

export const generateAlgorithmVisualizationFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create a visualization for: ${prompt}`,
        config: { systemInstruction: "Generate a single self-contained HTML file for an animated algorithm visualization." }
    });
    const match = response.text.match(/```(?:html)?\s*([\s\S]*?)\s*```/);
    return match ? match[1].trim() : response.text.trim();
};

export const generateUserSimulationFromAI = async (prompt: string): Promise<UserSimulationData> => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Simulate a user journey for: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    persona: { type: Type.STRING },
                    goal: { type: Type.STRING },
                    journey: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                action: { type: Type.STRING },
                                description: { type: Type.STRING },
                                outcome: { type: Type.STRING }
                            },
                            required: ["action", "description", "outcome"]
                        }
                    },
                    summary: { type: Type.STRING }
                },
                required: ["persona", "goal", "journey", "summary"]
            },
        },
    });
    return JSON.parse(response.text.trim());
};

export const analyzePlaylistFromAI = async (prompt: string): Promise<PlaylistAnalysisData> => {
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following playlist: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sourceUrl: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    mood: { type: Type.ARRAY, items: { type: Type.STRING } },
                    genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                    topArtists: { type: Type.ARRAY, items: { type: Type.STRING } },
                    trackCount: { type: Type.INTEGER }
                },
                required: ["sourceUrl", "name", "description", "mood", "genres", "topArtists", "trackCount"]
            },
        },
    });
    return JSON.parse(response.text.trim());
};

export const performDensePoseAnalysis = async (base64ImageData: string, mimeType: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: "Perform DensePose analysis. Return the UV mapped result image." },
            ],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("DensePose analysis failed.");
};

export const synthesizeNeRFFromImages = async (files: File[]): Promise<string> => {
    throw new Error("Reality Forge Protocol is offline.");
};

export const generate3DModelFromImage = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    throw new Error("3D Magic Protocol is offline.");
};

export const generateGaussianDreamFromText = async (prompt: string, onProgress: (progress: number, status: string) => void): Promise<string> => {
    throw new Error("Gaussian Dream Protocol is offline.");
};

export const transcribeAudio = async (file: File): Promise<string> => {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    const base64Audio = await base64Promise;
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: file.type, data: base64Audio } }, { text: "Transcribe this." }] },
    });
    return response.text;
}

export const generateIconFromAI = async (brandName: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate SVG for: "${brandName}"`,
        config: { systemInstruction: "Output raw SVG markup only." }
    });
    const match = response.text.match(/<svg[\s\S]*?<\/svg>/);
    return match ? match[0].trim() : '';
};

export const resetChat = () => { chat = null; }
