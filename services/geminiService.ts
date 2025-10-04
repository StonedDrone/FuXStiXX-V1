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

// Function to reset the chat if needed, e.g., for a "new chat" button.
export const resetChat = () => {
    chat = null;
}