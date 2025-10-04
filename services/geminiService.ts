import { GoogleGenAI, Part, Content, Chat } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// We'll manage a single chat session.
let chat: Chat | null = null;

const getChatSession = (history: Message[]): Chat => {
    if (chat) {
        return chat;
    }

    // Convert our message history into the format the Gemini API expects for initializing a chat.
    // We only send the text of past messages to conserve tokens.
    const chatHistory: Content[] = history
        .filter(msg => msg.id !== 'init') // The initial greeting is not part of the conversation history for the AI
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }] // For history, we only need the text.
        }));

    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory,
        config: {
          systemInstruction: AI_PERSONA_INSTRUCTION,
        }
    });
    
    return chat;
}

export const sendMessageToAI = async (history: Message[], currentUserMessageParts: Part[]) => {
  const session = getChatSession(history);
  
  const result = await session.sendMessageStream({ message: currentUserMessageParts });
  
  return result;
};

export const generateImageFromAI = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
}

export const generateVideoFromAI = async (prompt: string): Promise<string> => {
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: {
            numberOfVideos: 1
        }
    });

    while (!operation.done) {
        // Wait for 10 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    // The link needs the API key appended to be used as a src
    return `${downloadLink}&key=${API_KEY}`;
}

export const generateAudioFromAI = async (prompt: string): Promise<string> => {
    console.log("Simulating audio generation for prompt:", prompt);
    // Simulate network delay and generation time
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // In a real scenario, this would call a text-to-music API.
    // For now, we return a pre-canned track to demonstrate the UI flow.
    const mockAudioUrl = 'https://cdn.pixabay.com/audio/2023/08/01/audio_a1458f3889.mp3';
    
    // Randomly simulate a failure to show error handling
    if (prompt.toLowerCase().includes("error")) {
         throw new Error("Simulated audio generation failure.");
    }

    return mockAudioUrl;
}


// Function to reset the chat if needed, e.g., for a "new chat" button.
export const resetChat = () => {
    chat = null;
}