import { GoogleGenAI, Part, Content, Chat, Modality, Type } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message, UserSimulationData, PlaylistAnalysisData } from '../types';

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

export const editImageFromAI = async (prompt: string, base64ImageData: string, mimeType: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Image Alchemy failed: The AI did not return an image.");
};

export const performDensePoseAnalysis = async (base64ImageData: string, mimeType: string): Promise<string> => {
    const densePosePrompt = "Analyze the person in this image using the principles of DensePose from facebookresearch. Generate a new image that overlays a colorful UV map onto the person's body to represent their 3D surface structure. The overlay should be visually similar to results from that project.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: densePosePrompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("DensePose analysis failed: The AI did not return an image.");
};

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
    throw new Error("Sonic Synthesis Protocol is currently offline. No audio generation endpoint is available.");
}

export const generateVRSceneFromAI = async (prompt: string): Promise<string> => {
    const vrSystemInstruction = `You are an expert A-Frame developer with deep expertise in 3D shader principles. Your task is to generate a complete, single A-Frame HTML scene based on the user's request.
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

export const generateCreativeCodeFromAI = async (prompt: string): Promise<string> => {
    const creativeCodeSystemInstruction = `You are an expert p5.js developer. Your task is to generate a complete, single p5.js sketch based on the user's request.
- The output MUST be only the p5.js JavaScript code.
- Do NOT include \`<html>\`, \`<head>\`, \`<body>\`, or \`<script>\` tags.
- The code must be self-contained and include both \`setup()\` and \`draw()\` functions.
- The canvas should be created with \`createCanvas(400, 400)\` in the \`setup\` function.
- Make the sketch visually interesting, animated, and interactive (e.g., using \`mouseX\`, \`mouseY\`).
- The final output should be a single block of JavaScript code.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: creativeCodeSystemInstruction,
        }
    });

    // Clean markdown code blocks if present
    const rawText = response.text;
    const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)\s*```/;
    const match = rawText.match(codeBlockRegex);

    if (match && match[1]) {
        return match[1].trim();
    }
    
    return rawText.trim();
};

export const generateUIMockupFromAI = async (prompt: string): Promise<string> => {
    const uiMockupSystemInstruction = `You are an expert UI/UX designer and frontend developer, proficient in modern design systems like Material Design. Your task is to generate a single, self-contained HTML file that represents a UI component based on the user's prompt.
- The output MUST be a complete HTML structure.
- All CSS MUST be included within a \`<style>\` tag in the \`<head>\`. Do NOT use external stylesheets.
- Use modern, clean design principles. Use flexbox or grid for layout.
- Use placeholder content where necessary (e.g., "Lorem ipsum", placeholder images from unsplash.com).
- The component should be visually appealing and responsive.
- Do NOT include any JavaScript (\`<script>\` tags). The mockup is for visual purposes only.
- The final output should be a single block of HTML code, starting with \`<!DOCTYPE html>\`.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: uiMockupSystemInstruction,
        }
    });

    // Clean markdown code blocks if present
    const rawText = response.text;
    const codeBlockRegex = /```(?:html)?\s*([\s\S]*?)\s*```/;
    const match = rawText.match(codeBlockRegex);

    if (match && match[1]) {
        return match[1].trim();
    }
    
    return rawText.trim();
};

export const generateMotionFXFromAI = async (prompt: string): Promise<string> => {
    const motionFXSystemInstruction = `You are a motion graphics expert specializing in mojs. Your task is to generate a single, self-contained HTML file that creates a beautiful animation based on the user's prompt.
- The output MUST be a complete HTML structure.
- The mojs library MUST be included from the CDN: \`<script src="https://cdn.jsdelivr.net/npm/@mojs/core"></script>\`.
- The animation should be triggered automatically on load and ideally replay when the container is clicked.
- All CSS and JavaScript MUST be included within the HTML file in \`<style>\` and \`<script>\` tags.
- The animation should be centered in the body. Make the background a dark color (e.g., #111).
- The final output should be a single block of HTML code, starting with \`<!DOCTYPE html>\`.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: motionFXSystemInstruction,
        }
    });

    const rawText = response.text;
    const codeBlockRegex = /```(?:html)?\s*([\s\S]*?)\s*```/;
    const match = rawText.match(codeBlockRegex);

    if (match && match[1]) {
        return match[1].trim();
    }
    
    return rawText.trim();
};

export const generateAlgorithmVisualizationFromAI = async (prompt: string): Promise<string> => {
    const algoVisSystemInstruction = `You are an expert in data structures and algorithms, and a skilled frontend developer. Your task is to generate a single, self-contained HTML file that visualizes the algorithm specified by the user.
- The output MUST be a complete HTML structure.
- All CSS and JavaScript MUST be included within the file in \`<style>\` and \`<script>\` tags.
- The visualization should be animated and clearly show the step-by-step process of the algorithm.
- For sorting algorithms, visualize an array of bars of different heights being sorted.
- The visualization should be clean, easy to understand, and visually appealing. Use a dark theme.
- The visualization should start automatically on load and have simple controls (e.g., a "Restart" button).
- The final output should be a single block of HTML code, starting with \`<!DOCTYPE html>\`.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a visualization for: ${prompt}`,
        config: {
            systemInstruction: algoVisSystemInstruction,
        }
    });

    const rawText = response.text;
    const codeBlockRegex = /```(?:html)?\s*([\s\S]*?)\s*```/;
    const match = rawText.match(codeBlockRegex);

    if (match && match[1]) {
        return match[1].trim();
    }
    
    return rawText.trim();
};

export const generateUserSimulationFromAI = async (prompt: string): Promise<UserSimulationData> => {
    const userSimSystemInstruction = `You are a product analyst expert specializing in user behavior simulation. Based on the user's prompt, generate a plausible user journey. The response must be a JSON object that strictly adheres to the provided schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Simulate a user journey for the following goal: "${prompt}"`,
        config: {
            systemInstruction: userSimSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    persona: { type: Type.STRING, description: "A brief description of the user persona (e.g., 'Power User', 'New Customer')." },
                    goal: { type: Type.STRING, description: "The primary objective of the user's journey." },
                    journey: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                action: { type: Type.STRING, description: "The specific action the user takes (e.g., 'Clicks Sign Up Button')." },
                                description: { type: Type.STRING, description: "A short explanation of the user's thinking or motivation for this action." },
                                outcome: { type: Type.STRING, description: "The result of the action: 'success', 'failure', or 'neutral'." }
                            },
                            required: ["action", "description", "outcome"]
                        }
                    },
                    summary: { type: Type.STRING, description: "A concluding summary of the user's journey, highlighting key friction points or successes." }
                },
                required: ["persona", "goal", "journey", "summary"]
            },
        },
    });

    const jsonStr = response.text.trim();
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse user simulation JSON:", e);
        throw new Error("The AI returned an invalid JSON object for the user simulation.");
    }
};

const parseCommand = (commandString: string): { command: string, params: Record<string, string> } => {
    const parts = commandString.split('|').map(p => p.trim());
    const command = parts[0];
    const params: Record<string, string> = {};
    parts.slice(1).forEach(part => {
        const [key, ...valueParts] = part.split(':');
        if (key && valueParts.length > 0) {
            params[key.trim().toLowerCase()] = valueParts.join(':').trim();
        }
    });
    return { command, params };
};

export const analyzePlaylistFromAI = async (prompt: string): Promise<PlaylistAnalysisData> => {
    const playlistSystemInstruction = `You are a music analysis expert with deep knowledge of Spotify's ecosystem. Based on the user's prompt which contains a URL or description of a playlist, generate a plausible and detailed analysis. The response must be a JSON object that strictly adheres to the provided schema. Be creative and make the analysis sound authentic.`;
    
    const { params } = parseCommand(prompt);
    if (!params.url) throw new Error("Missing 'url' parameter for Playlist Analysis.");
    const url = params.url;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following playlist: "${url}"`,
        config: {
            systemInstruction: playlistSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sourceUrl: { type: Type.STRING, description: "The original URL of the playlist provided by the user." },
                    name: { type: Type.STRING, description: "A plausible name for the playlist." },
                    description: { type: Type.STRING, description: "A short, creative description of the playlist's vibe." },
                    mood: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of 3-5 keywords describing the mood (e.g., 'Chill', 'Upbeat', 'Melancholic')."
                    },
                    genres: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of 3-5 prominent genres found in the playlist (e.g., 'Lofi Hip-Hop', 'Indie Pop')."
                    },
                    topArtists: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of 3-5 representative artists from the playlist."
                    },
                    trackCount: { type: Type.INTEGER, description: "A plausible number of tracks in the playlist (e.g., between 20 and 150)." }
                },
                required: ["sourceUrl", "name", "description", "mood", "genres", "topArtists", "trackCount"]
            },
        },
    });

    const jsonStr = response.text.trim();
    try {
        const parsedJson = JSON.parse(jsonStr);
        // The AI generates the content, but we ensure the source URL is the one provided by the user.
        parsedJson.sourceUrl = url;
        return parsedJson;
    } catch (e) {
        console.error("Failed to parse playlist analysis JSON:", e);
        throw new Error("The AI returned an invalid JSON object for the playlist analysis.");
    }
};

export const synthesizeNeRFFromImages = async (files: File[]): Promise<string> => {
    throw new Error("Reality Forge Protocol is currently offline. No NeRF synthesis endpoint is available.");
};

export const generate3DModelFromImage = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    throw new Error("3D Magic Protocol is currently offline. No single-image 3D synthesis endpoint is available.");
};

export const generateGaussianDreamFromText = async (prompt: string, onProgress: (progress: number, status: string) => void): Promise<string> => {
    throw new Error("Gaussian Dream Protocol is currently offline. No text-to-3D endpoint is available.");
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

export const transcribeAudio = async (file: File): Promise<string> => {
    const base64Audio = await fileToBase64(file);
    const audioPart: Part = {
        inlineData: {
            mimeType: file.type,
            data: base64Audio,
        },
    };
    const textPart: Part = {
        text: "Transcribe the following audio file.",
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
    });

    return response.text;
}

export const generateIconFromAI = async (brandName: string): Promise<string> => {
    const iconSystemInstruction = `You are an SVG icon generation specialist with deep knowledge of the 'simple-icons' library. Your task is to generate the raw SVG code for a given brand name.
- The output MUST be only the SVG code, starting with \`<svg ...>\` and ending with \`</svg>\`.
- Do NOT include any other text, explanation, or markdown backticks.
- The SVG should be simple, monochrome, and follow the design principles of the Simple Icons library.
- Set the SVG fill attribute to "currentColor" so it can be styled with CSS.
- Add a <title> tag inside the SVG with the brand name.
- If you don't know the icon for a specific brand, return an SVG of a simple question mark in a circle as a fallback.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate the SVG for the brand: "${brandName}"`,
        config: {
            systemInstruction: iconSystemInstruction,
        }
    });
    
    const rawText = response.text;
    const svgRegex = /<svg[\s\S]*?<\/svg>/;
    const match = rawText.match(svgRegex);

    if (match) {
        return match[0].trim();
    }
    
    // Fallback if no SVG is found
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v2h-2v-2zm0 4h2v6h-2v-6z"/></svg>`;
};


// Function to reset the chat if needed, e.g., for a "new chat" button.
export const resetChat = () => {
    chat = null;
}