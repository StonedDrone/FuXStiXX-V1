import { Message } from '../types';

const formatHistory = (history: Message[], newUserMessage: string): { role: string; content: string }[] => {
    const formatted: { role: string; content: string }[] = history
        .filter(msg => msg.id !== 'init' && (msg.status === 'complete' || msg.status === undefined) && msg.text.trim() !== '')
        .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));
    formatted.push({ role: 'user', content: newUserMessage });
    return formatted;
};

export async function* sendMessageStream(
    baseURL: string,
    model: string,
    history: Message[],
    userMessage: string
): AsyncGenerator<string> {
    const messages = formatHistory(history, userMessage);
    
    try {
        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorBody}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Could not get reader from response body.');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last, potentially incomplete line

            for (const line of lines) {
                if (line.trim() === '' || !line.startsWith('data: ')) continue;
                if (line.includes('[DONE]')) return;
                
                try {
                    const json = JSON.parse(line.substring(6));
                    const content = json.choices[0]?.delta?.content;
                    if (content) {
                        yield content;
                    }
                } catch (e) {
                    console.error('Error parsing stream chunk:', line, e);
                }
            }
        }
    } catch (error) {
        console.error("LM Studio service error:", error);
        if (error instanceof Error) {
            yield `\n\n**Error communicating with local model:**\n> ${error.message}`;
        } else {
            yield `\n\n**An unknown error occurred while communicating with the local model.**`;
        }
    }
}
