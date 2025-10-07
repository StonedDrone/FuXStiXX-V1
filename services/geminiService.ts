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

const VALID_ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

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

export const generateImageFromAI = async (prompt: string, aspectRatio: string = '1:1'): Promise<string> => {
    const validatedAspectRatio = VALID_ASPECT_RATIOS.includes(aspectRatio) ? aspectRatio : '1:1';

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: validatedAspectRatio,
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

export const generateVRSceneFromAI = async (prompt: string): Promise<string> => {
    const vrSystemInstruction = `You are an expert A-Frame developer. Your task is to generate a complete, single A-Frame HTML scene based on the user's request.
- The output MUST be only the A-Frame markup.
- The entire response should be wrapped in an \`<a-scene>\` tag.
- Do NOT include \`<html>\`, \`<head>\`, \`<body>\`, or \`<script>\` tags.
- Use primitive shapes like \`<a-box>\`, \`<a-sphere>\`, \`<a-cylinder>\`, \`<a-plane>\`, \`<a-sky>\`.
- You can use assets, but they must be declared in an \`<a-assets>\` block and loaded from publicly accessible URLs (e.g., from Sketchfab, Google Poly).
- Make the scene visually interesting and immersive. Add animations or interactivity if it fits the prompt.
- Ensure the scene is well-lit using lights or environment presets.
- The final output should be a single block of A-Frame HTML code.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: vrSystemInstruction,
        }
    });

    // The Gemini API might wrap the code in markdown, so we need to clean it.
    const rawText = response.text;
    const codeBlockRegex = /```(?:html)?\s*([\s\S]*?)\s*```/;
    const match = rawText.match(codeBlockRegex);

    if (match && match[1]) {
        return match[1].trim();
    }
    
    // If no markdown block is found, assume the whole response is the code.
    return rawText.trim();
};

export const transcribeAudio = async (file: File): Promise<string> => {
    console.log(`Simulating transcription for file: ${file.name}`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time

    return `
[00:00:01] **Operator Alpha:** Mission status check. All systems nominal.
[00:00:05] **Operator Bravo:** Confirmed. Orbit is stable. We're tracking the anomaly on schedule.
[00:00:10] **Operator Alpha:** Any new developments on the signal source?
[00:00:13] **Operator Bravo:** Negative. Still faint. Looks like a repeating pattern, but the resolution is too low to decode. We'll need to deploy the deep-space probe for a closer look.
[00:00:21] **Operator Alpha:** Understood. The Captain has already authorized the deployment. Proceed when ready.
[00:00:25] **Operator Bravo:** Roger that. Initiating probe deployment sequence now.
[00:00:29] **[STATIC]**
[00:00:32] **Operator Alpha:** ...signal strength is dropping. We might be losing them.
`;
}


// Function to reset the chat if needed, e.g., for a "new chat" button.
export const resetChat = () => {
    chat = null;
}