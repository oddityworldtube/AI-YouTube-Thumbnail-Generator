// context/AppContext.tsx
import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { AppState, AppStep, ArtStyle, TextOptions, TitleSuggestion, ScriptResult, HistoryItem, AnalysisResult } from '../types';
import * as geminiService from '../services/geminiService';
import * as apiKeyManager from '../services/apiKeyManager';
import { useHistory } from '../hooks/useHistory';

const initialTextOptions: TextOptions = {
    text: '',
    position: { x: 0.5, y: 0.5 },
    align: 'center',
    font: 'Cairo',
    fontSize: 72,
    textColor: '#FFFFFF',
    strokeColor: '#000000',
    highlightedWords: [],
    highlightColor: '#FFFF00',
    highlightScale: 1.2,
    lineHeightScale: 1.2,
};

const initialState: AppState = {
    step: AppStep.Initial,
    article: '',
    isTrendingTopic: false,
    analysisResult: null,
    editedSummary: '',
    artStyle: 'Realistic',
    backgroundImages: [],
    selectedBackgroundImage: null,
    textOptions: initialTextOptions,
    shortTitles: [],
    scriptResult: null,
    minWordCount: '1000',
    activeScriptTitle: null,
    error: null,
};

interface AppContextType extends AppState {
    setState: (newState: Partial<AppState>) => void;
    setError: (error: string | null) => void;
    handleAnalyze: () => Promise<void>;
    handleRegenerateBackground: () => Promise<void>;
    handleGenerateShortTitles: (isAutomatic: boolean) => Promise<void>;
    handleGenerateScript: (title: string) => Promise<void>;
    // FIX: Updated handleTitleClick to allow an optional third argument for analysis results.
    handleTitleClick: (title: string, isSelection?: boolean, currentAnalysisResult?: AnalysisResult | null) => Promise<void>;
    handleReset: () => void;
    loadStateFromHistory: (historyItem: HistoryItem) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const getFriendlyErrorMessage = (error: unknown): string => {
    let errorMessage = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";

    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    if (errorMessage.includes("Imagen API is only accessible to billed users")) {
        return "خطأ الوصول: يتطلب نموذج الصور (Imagen) مفتاح API مرتبط بحساب تم تفعيل الفوترة به. يرجى التحقق من إعدادات المفتاح أو إضافة مفتاح آخر صالح.";
    }
    if (errorMessage.toLowerCase().includes("api key not valid")) {
        return "مفتاح API غير صالح. يرجى التحقق من المفتاح في الإعدادات.";
    }
    if (errorMessage.includes("سياسات الأمان") || errorMessage.toLowerCase().includes("safety") || errorMessage.toLowerCase().includes("policy")) {
        return "تم حظر المحتوى بسبب سياسات الأمان. حاول تعديل النص ليكون أكثر حيادية.";
    }
    if (errorMessage.toLowerCase().includes("resource has been exhausted") || errorMessage.toLowerCase().includes("quota")) {
        return "تم تجاوز حد الاستخدام للمفتاح الحالي. حاول استخدام مفتاح آخر أو المحاولة لاحقًا.";
    }
    
    // Check if the message is already friendly from withApiRetry
    if (errorMessage.startsWith("فشل الطلب") || errorMessage.startsWith("فشل طلب API")) {
        return errorMessage;
    }

    // Try to parse JSON from the error message for a cleaner message
    try {
        const jsonMatch = errorMessage.match(/{.*}/s); // Use 's' flag for multiline
        if (jsonMatch && jsonMatch[0]) {
            const errorObj = JSON.parse(jsonMatch[0]);
            if (errorObj.error && errorObj.error.message) {
                 return `فشل طلب API: ${errorObj.error.message}`;
            }
        }
    } catch (e) {
        // Parsing failed, ignore and fall through
    }
    
    // Fallback to a truncated version if it's too long and technical
    if (errorMessage.length > 150) {
        return "حدث خطأ فني. يرجى مراجعة وحدة التحكم لمزيد من التفاصيل.";
    }

    return errorMessage; // Return the original message if it's short
};


// A helper function to wrap API calls with retry logic and better error handling
async function withApiRetry<T>(apiCall: (apiKey: string) => Promise<T>): Promise<T> {
    const initialApiKey = apiKeyManager.getActiveApiKey();
    if (!initialApiKey) {
        throw new Error("لا يوجد مفتاح API. الرجاء إضافة مفتاح في الإعدادات.");
    }

    try {
        return await apiCall(initialApiKey);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`API call failed with key: ${initialApiKey}. Error: ${errorMessage}. Attempting to switch key and retry.`, error);

        // If the error is due to content policy, don't retry, just show a helpful message.
        if (errorMessage.includes("سياسات الأمان") || errorMessage.toLowerCase().includes("safety") || errorMessage.toLowerCase().includes("policy")) {
            throw new Error(`فشل إنشاء المحتوى لمخالفته سياسات الأمان. حاول تعديل المدخلات لتكون أكثر حيادية.`);
        }
        
        const nextApiKey = apiKeyManager.switchToNextApiKey();
        
        // If there's no other key to try, or we've cycled through all keys
        if (!nextApiKey || nextApiKey === initialApiKey) {
            const friendlyMessage = getFriendlyErrorMessage(error);
            const finalMessage = `فشل طلب API ولا يوجد مفاتيح أخرى صالحة للمحاولة. السبب: ${friendlyMessage}`;
            throw new Error(finalMessage);
        }
        
        try {
            return await apiCall(nextApiKey);
        } catch (retryError) {
             console.error(`API call failed again with key: ${nextApiKey}. Error: ${retryError}`, retryError);
             const friendlyMessage = getFriendlyErrorMessage(retryError);
             const finalMessage = `فشل الطلب بعد محاولة تبديل المفتاح. السبب: ${friendlyMessage}`;
             throw new Error(finalMessage);
        }
    }
}


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(initialState);
    const { addHistoryItem } = useHistory();

    const updateState = (newState: Partial<AppState>) => {
        setState(prevState => ({ ...prevState, ...newState }));
    };

    const setError = (error: string | null) => {
        updateState({ error });
    };

    const handleReset = useCallback(() => {
        setState(initialState);
    }, []);

    const loadStateFromHistory = useCallback((historyItem: HistoryItem) => {
        const { article, analysisResult } = historyItem;
        handleReset();
        updateState({
            step: AppStep.StrategyReady,
            article,
            analysisResult,
            editedSummary: analysisResult.summary
        });
    }, [handleReset]);
    

    const handleAnalyze = useCallback(async () => {
        if (!state.article.trim()) {
            setError('الرجاء إدخال نص المقال أولاً.');
            return;
        }
        if (!apiKeyManager.hasApiKeys()) {
            setError("لا يوجد مفتاح API. الرجاء إضافة مفتاح في الإعدادات.");
            return;
        }
        
        updateState({
            step: AppStep.Analyzing,
            error: null,
            analysisResult: null,
            backgroundImages: [],
            selectedBackgroundImage: null,
            shortTitles: [],
            scriptResult: null,
        });

        try {
            const result = await withApiRetry(apiKey => geminiService.analyzeArticle(state.article, state.isTrendingTopic, apiKey));
            
            updateState({ analysisResult: result, editedSummary: result.summary });
            addHistoryItem(state.article, result);

            const initialTitle = result.titles[0]?.title || '';
            await handleTitleClick(initialTitle, true, result); 
            
            updateState({ step: AppStep.GeneratingBackground });

            try {
                const imagesB64 = await withApiRetry(apiKey => geminiService.generateThumbnailBackground(result.summary, state.artStyle, apiKey));
                const imageSrcs = imagesB64.map(b64 => `data:image/jpeg;base64,${b64}`);
                updateState({
                    backgroundImages: imageSrcs,
                    selectedBackgroundImage: imageSrcs[0] || null,
                    step: AppStep.ImageReady,
                });
            } catch (imgErr) {
                 console.error(imgErr);
                 setError(getFriendlyErrorMessage(imgErr));
                 updateState({ step: AppStep.StrategyReady });
            }
        } catch (err) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
            updateState({ step: AppStep.Initial });
        }
    }, [state.article, state.artStyle, state.isTrendingTopic, addHistoryItem]);
    
    const handleRegenerateBackground = useCallback(async () => {
        if (!state.editedSummary) return;
        setError(null);
        try {
            const imagesB64 = await withApiRetry(apiKey => geminiService.generateThumbnailBackground(state.editedSummary, state.artStyle, apiKey));
            const imageSrcs = imagesB64.map(b64 => `data:image/jpeg;base64,${b64}`);
            updateState({ backgroundImages: imageSrcs, selectedBackgroundImage: imageSrcs[0] || null });
        } catch (err) {
            console.error(err);
            setError(getFriendlyErrorMessage(err));
        }
    }, [state.editedSummary, state.artStyle]);

    const handleGenerateShortTitles = useCallback(async (isAutomatic = false) => {
        if (!state.analysisResult?.summary) return;
        if(!isAutomatic) updateState({ shortTitles: [] });
        
        try {
            const titles = await withApiRetry(apiKey => geminiService.generateShortTitles(state.analysisResult!.summary, apiKey));
            updateState({ shortTitles: titles || [] });
            if (isAutomatic && titles && titles.length > 0) {
                 await handleTitleClick(titles[0].title, true, state.analysisResult);
            }
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        }
    }, [state.analysisResult]);

    const handleGenerateScript = useCallback(async (title: string) => {
        if (!state.analysisResult) return;
        updateState({ scriptResult: null, activeScriptTitle: title, error: null });
        try {
            const wordCount = parseInt(state.minWordCount, 10);
            if(isNaN(wordCount) || wordCount <= 0) {
                setError("الرجاء إدخال عدد كلمات صالح.");
                return;
            }
            const result = await withApiRetry(apiKey => geminiService.generateVoiceoverScript(title, state.analysisResult!.description, state.analysisResult!.tags, wordCount, apiKey));
            updateState({ scriptResult: result });
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        }
    }, [state.analysisResult, state.minWordCount]);
    
    // FIX: Made currentAnalysisResult optional to match calls from different components.
    const handleTitleClick = useCallback(async (title: string, isSelection: boolean = true, currentAnalysisResult?: AnalysisResult | null) => {
        const analysisResultToUse = currentAnalysisResult || state.analysisResult;

        updateState({
            textOptions: { ...state.textOptions, text: title, highlightedWords: [] }
        });
        
        if (!isSelection || !analysisResultToUse) return;

        try {
            const highlight = await withApiRetry(apiKey => geminiService.getHighlightKeyword(title, apiKey));
            if (highlight) {
                updateState({
                    textOptions: { ...state.textOptions, text: title, highlightedWords: [highlight] }
                });
            }
        } catch (err) {
            console.error("Failed to get highlight keyword:", err);
        }
    }, [state.analysisResult, state.textOptions]);


    const value = {
        ...state,
        setState: updateState,
        setError,
        handleAnalyze,
        handleRegenerateBackground,
        handleGenerateShortTitles,
        handleGenerateScript,
        handleTitleClick,
        handleReset,
        loadStateFromHistory,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
