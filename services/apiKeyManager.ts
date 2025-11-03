// services/apiKeyManager.ts

const API_KEYS_STORAGE_KEY = 'gemini_api_keys';
const CURRENT_KEY_INDEX_KEY = 'gemini_api_key_current_index';

// Safely access the environment variable. This will be replaced by Vite during the build process
// on platforms like Vercel, but this safe access prevents errors in development environments
// where `import.meta.env` might not be defined.
const initialApiKey = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_API_KEY : undefined;


const getInitialKeys = (): string[] => {
    try {
        const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
        if (storedKeys) {
            const keys = JSON.parse(storedKeys);
            if (Array.isArray(keys) && keys.length > 0) {
                return keys;
            }
        }
    } catch (error) {
        console.error("Failed to parse API keys from localStorage", error);
    }
    // If nothing in storage, use the initial key from environment if it exists
    return initialApiKey ? [initialApiKey] : [];
};

let apiKeys: string[] = getInitialKeys();
let currentIndex: number = 0;

try {
    const storedIndex = localStorage.getItem(CURRENT_KEY_INDEX_KEY);
    if(storedIndex) {
        currentIndex = parseInt(storedIndex, 10) % apiKeys.length || 0;
    }
} catch(e) {
    currentIndex = 0;
}


const saveKeysToStorage = () => {
    try {
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys));
    } catch (error) {
        console.error("Failed to save API keys to localStorage", error);
    }
};

const saveIndexToStorage = () => {
     try {
        localStorage.setItem(CURRENT_KEY_INDEX_KEY, String(currentIndex));
    } catch (error) {
        console.error("Failed to save API key index to localStorage", error);
    }
}

export const getApiKeys = (): string[] => {
    return [...apiKeys];
};

export const addApiKey = (key: string): boolean => {
    if (key && !apiKeys.includes(key)) {
        apiKeys.push(key);
        saveKeysToStorage();
        return true;
    }
    return false;
};

export const removeApiKey = (keyToRemove: string) => {
    const initialLength = apiKeys.length;
    apiKeys = apiKeys.filter(key => key !== keyToRemove);
    if (apiKeys.length < initialLength) {
        if (currentIndex >= apiKeys.length) {
            currentIndex = 0;
            saveIndexToStorage();
        }
        saveKeysToStorage();
    }
};

export const getActiveApiKey = (): string | undefined => {
    if (apiKeys.length === 0) {
        return undefined;
    }
    return apiKeys[currentIndex];
};

export const switchToNextApiKey = (): string | undefined => {
    if (apiKeys.length === 0) {
        return undefined;
    }
    currentIndex = (currentIndex + 1) % apiKeys.length;
    saveIndexToStorage();
    console.log(`Switched to API key at index ${currentIndex}`);
    return apiKeys[currentIndex];
};

export const hasApiKeys = (): boolean => {
    return apiKeys.length > 0;
}
