import { GoogleGenAI, Part, Content, Chat, Modality, Type } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message, UserSimulationData } from '../types';

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

export const synthesizeNeRFFromImages = async (files: File[]): Promise<string> => {
    console.log(`Simulating NeRF synthesis for ${files.length} images.`);
    // Simulate a longer processing time for this "super power"
    await new Promise(resolve => setTimeout(resolve, 12000));

    // Randomly fail to show error handling
    if (Math.random() < 0.2) {
        throw new Error("Simulated NeRF synthesis failed. Could not converge on a solution.");
    }

    // Return a pre-canned A-Frame scene that looks like a point cloud
    return `
        <a-scene>
            <a-sky color="#111"></a-sky>
            <a-entity position="0 1.5 -2">
                <a-entity id="points" particle-system="preset: dust; particleCount: 5000; color: #FFF, #32CD32"></a-entity>
                <a-animation attribute="rotation" to="0 360 0" dur="20000" repeat="indefinite" easing="linear"></a-animation>
            </a-entity>
            <a-light type="ambient" color="#888"></a-light>
            <a-light type="point" intensity="0.5" position="2 4 4"></a-light>
        </a-scene>
    `;
};

export const generate3DModelFromImage = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    console.log(`Simulating Magic123 synthesis for image: ${file.name}`);
    
    let progress = 0;
    onProgress(progress);

    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 95) {
            progress = 95; // Don't hit 100 until it's done
        }
        onProgress(Math.round(progress));
    }, 800);

    // Simulate total processing time
    const totalTime = 10000 + Math.random() * 5000;
    await new Promise(resolve => setTimeout(resolve, totalTime));

    clearInterval(interval);
    onProgress(100);

    // Return a mock A-Frame scene representing the 3D model
    return `
        <a-scene>
            <a-sky color="#222"></a-sky>
            <a-entity position="0 1.5 -3">
                <a-box color="#8A2BE2" rotation="0 45 45">
                    <a-animation attribute="rotation" to="0 405 45" dur="10000" repeat="indefinite" easing="linear"></a-animation>
                </a-box>
            </a-entity>
            <a-light type="ambient" color="#AAA"></a-light>
            <a-light type="point" intensity="0.7" position="-2 4 4" color="#FFF"></a-light>
        </a-scene>
    `;
};

export const generateGaussianDreamFromText = async (prompt: string, onProgress: (progress: number, status: string) => void): Promise<string> => {
    console.log(`Simulating Gaussian Dream synthesis for prompt: ${prompt}`);
    
    const stages = [
        { progress: 10, status: "Initializing Gaussian Splats..." },
        { progress: 40, status: "Optimizing Geometry..." },
        { progress: 75, status: "Refining Textures..." },
        { progress: 95, status: "Compiling Scene..." },
    ];

    for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        onProgress(stage.progress, stage.status);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    onProgress(100, "Synthesis complete.");

    // Return a mock A-Frame scene representing the generated model
    return `
        <a-scene>
            <a-sky color="#1A2A3A"></a-sky>
            <a-entity position="0 1.6 -3.5">
                <a-dodecahedron color="#6495ED" radius="0.8" roughness="0.3">
                    <a-animation attribute="rotation" to="360 360 0" dur="15000" repeat="indefinite" easing="linear"></a-animation>
                </a-dodecahedron>
                 <a-torus-knot color="#FFFFFF" radius="1.2" radius-tubular="0.05" p="2" q="5">
                     <a-animation attribute="rotation" to="0 -360 0" dur="20000" repeat="indefinite" easing="linear"></a-animation>
                </a-torus-knot>
            </a-entity>
            <a-light type="ambient" color="#CCC"></a-light>
            <a-light type="point" intensity="0.8" position="3 5 2" color="#FFFFFF"></a-light>
        </a-scene>
    `;
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
