
import { GoogleGenAI, Chat, Part } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chat: Chat | null = null;

const getChatSession = (): Chat => {
  if (!chat) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: AI_PERSONA_INSTRUCTION,
      },
    });
  }
  return chat;
};

export const sendMessageToAI = async (parts: Part[]) => {
  const chatSession = getChatSession();
  const result = await chatSession.sendMessageStream({ contents: [{ parts }] });
  return result;
};