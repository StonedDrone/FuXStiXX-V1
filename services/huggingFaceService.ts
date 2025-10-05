import { getCachedSpaceInfo, setCachedSpaceInfo } from './cacheService';

const HF_TOKEN = process.env.HF_TOKEN;

const API_URL_BASE = 'https://api-inference.huggingface.co/models/';
const HUB_API_URL_BASE = 'https://huggingface.co/api/';

const checkToken = () => {
    if (!HF_TOKEN) {
        throw new Error("Hugging Face token not configured. Please set the HF_TOKEN environment variable.");
    }
}

async function query(url: string, data: any) {
    checkToken();
    const body = { ...data };
    if (!body.options) {
        body.options = { wait_for_model: true };
    }
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Hugging Face API Error:", errorText);
        throw new Error(`Hugging Face API request failed: ${response.statusText} - ${errorText}`);
    }
    return response;
}

export async function queryModel(model: string, prompt: string): Promise<any> {
    const response = await query(API_URL_BASE + model, { inputs: prompt });
    const contentType = response.headers.get('content-type');

    if (contentType?.startsWith('image/')) {
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    const text = await response.text();
    try {
        const json = JSON.parse(text);
        // The API might return an array with one element, or just the element. Standardize to the element.
        return Array.isArray(json) ? json[0] : json;
    } catch (e) {
        // The API sometimes returns raw text for certain models. Wrap it in a standard object.
        return { generated_text: text.trim() };
    }
}

export async function searchModels(query: string): Promise<any> {
    const response = await fetch(`${HUB_API_URL_BASE}models?search=${encodeURIComponent(query)}&limit=10&full=true&config=true`, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` }
    });
    if (!response.ok) {
        throw new Error(`Failed to search models: ${response.statusText}`);
    }
    return response.json();
}

export async function getSpaceInfo(spaceId: string, forceRefresh: boolean = false): Promise<any> {
    if (!forceRefresh) {
        const cachedData = getCachedSpaceInfo(spaceId);
        if (cachedData) {
            return cachedData.data;
        }
    }

    if (!navigator.onLine) {
        const errorMessage = forceRefresh 
            ? `Cannot refresh cache for "${spaceId}". System is offline.`
            : `System is offline. No cached intel found for Space: "${spaceId}".`;
        throw new Error(errorMessage);
    }
    
    // Note: spaceId is often in the format "author/space-name"
    const response = await fetch(`${HUB_API_URL_BASE}spaces/${spaceId}`, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` }
    });
    if (!response.ok) {
        throw new Error(`Failed to get Space info: ${response.statusText}`);
    }
    const data = await response.json();
    
    setCachedSpaceInfo(spaceId, data);

    return data;
}
