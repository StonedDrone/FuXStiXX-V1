const HF_CACHE_KEY = 'fuxstixx-hf-cache';

interface HFCache {
    spaces: Record<string, { data: any; timestamp: string }>;
}

const getCache = (): HFCache => {
    try {
        const cachedData = localStorage.getItem(HF_CACHE_KEY);
        return cachedData ? JSON.parse(cachedData) : { spaces: {} };
    } catch (error) {
        console.error("Failed to read from HF cache", error);
        return { spaces: {} };
    }
};

const saveCache = (cache: HFCache) => {
    try {
        localStorage.setItem(HF_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error("Failed to write to HF cache", error);
    }
};

export const getCachedSpaceInfo = (spaceId: string): { data: any; timestamp: string } | null => {
    const cache = getCache();
    return cache.spaces[spaceId.toLowerCase()] || null;
};

export const setCachedSpaceInfo = (spaceId: string, data: any) => {
    const cache = getCache();
    cache.spaces[spaceId.toLowerCase()] = { data, timestamp: new Date().toISOString() };
    saveCache(cache);
};