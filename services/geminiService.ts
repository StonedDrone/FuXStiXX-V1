import { GoogleGenAI, Part, Content } from "@google/genai";
import { AI_PERSONA_INSTRUCTION } from '../constants';
import { Message } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const sendMessageToAI = async (history: Message[], currentUserMessageParts: Part[]) => {
  // Convert our message history into the format the Gemini API expects.
  // We only send the text of past messages to conserve tokens. Attachments are only processed for the current turn.
  const contents: Content[] = history
    .filter(msg => msg.id !== 'init') // The initial greeting is not part of the conversation history for the AI
    .map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      // For the last user message in the history (the one we're sending now), use the full parts with attachments.
      // For all other messages, just use the text.
      parts: msg.id === history[history.length - 1].id && msg.sender === 'user'
        ? currentUserMessageParts
        : [{ text: msg.text }]
    }));

  const result = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: {
      systemInstruction: AI_PERSONA_INSTRUCTION,
    }
  });
  
  return result;
};
