import { IndexedDocument } from '../types';
import { v4 as uuidv4 } from 'uuid';

const KNOWLEDGE_BASE_KEY = 'fuxstixx-knowledge-base';

interface StoredChunk {
  docId: string;
  sourceName: string;
  content: string;
}

interface KnowledgeBase {
    documents: IndexedDocument[];
    chunks: StoredChunk[];
}

let knowledgeBase: KnowledgeBase = { documents: [], chunks: [] };

const loadKnowledgeBase = (): void => {
    try {
        const saved = localStorage.getItem(KNOWLEDGE_BASE_KEY);
        knowledgeBase = saved ? JSON.parse(saved) : { documents: [], chunks: [] };
    } catch (error) {
        console.error("Failed to load knowledge base from localStorage", error);
        knowledgeBase = { documents: [], chunks: [] };
    }
};

const saveKnowledgeBase = (): void => {
    try {
        localStorage.setItem(KNOWLEDGE_BASE_KEY, JSON.stringify(knowledgeBase));
    } catch (error) {
        console.error("Failed to save knowledge base to localStorage", error);
    }
};

// --- Service Functions ---

export const addDocument = async (sourceName: string, sourceType: 'url' | 'file', content: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
    
    const docId = uuidv4();
    
    // Simple chunking by paragraph
    const contentChunks = content.split(/\n\s*\n/).filter(p => p.trim().length > 20);

    const newDocument: IndexedDocument = {
        id: docId,
        sourceName,
        sourceType,
        indexedAt: new Date().toISOString(),
        chunkCount: contentChunks.length,
    };
    
    const newChunks: StoredChunk[] = contentChunks.map(chunkContent => ({
        docId,
        sourceName,
        content: chunkContent,
    }));

    knowledgeBase.documents.push(newDocument);
    knowledgeBase.chunks.push(...newChunks);

    saveKnowledgeBase();
};

export const retrieve = async (question: string): Promise<{ context: string | null; sources: string[] }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate retrieval time

    const queryWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    // Very simple keyword matching for simulation
    const relevantChunks = knowledgeBase.chunks.filter(chunk => {
        const chunkContent = chunk.content.toLowerCase();
        return queryWords.some(word => chunkContent.includes(word));
    });
    
    if (relevantChunks.length === 0) {
        return { context: null, sources: [] };
    }
    
    // Get unique chunks to avoid duplicates
    const uniqueChunks = Array.from(new Map(relevantChunks.map(c => [c.content, c])).values());

    const context = uniqueChunks.map(c => c.content).join('\n\n');
    const sources = [...new Set(uniqueChunks.map(c => c.sourceName))];

    // Limit context size to avoid overwhelming the model
    const MAX_CONTEXT_LENGTH = 4000;
    const truncatedContext = context.length > MAX_CONTEXT_LENGTH ? context.substring(0, MAX_CONTEXT_LENGTH) + '...' : context;
    
    return { context: truncatedContext, sources };
};

export const getDocuments = (): IndexedDocument[] => {
    return knowledgeBase.documents;
};

export const purge = (): void => {
    knowledgeBase = { documents: [], chunks: [] };
    saveKnowledgeBase();
};

// Initial load
loadKnowledgeBase();