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

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
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
        const errorMessage = getErrorMessage(error);
        console.warn(`API call failed with key: ${initialApiKey}. Error: ${errorMessage}. Attempting to switch key and retry.`, error);

        // If the error is due to content policy, don't retry, just show a helpful message.
        if (errorMessage.includes("سياسات الأمان") || errorMessage.toLowerCase().includes("safety") || errorMessage.toLowerCase().includes("policy")) {
            throw new Error(`فشل إنشاء المحتوى لمخالفته سياسات الأمان. حاول تعديل المدخلات لتكون أكثر حيادية.`);
        }
        
        const nextApiKey = apiKeyManager.switchToNextApiKey();
        
        // If there's no other key to try, or we've cycled through all keys
        if (!nextApiKey || nextApiKey === initialApiKey) {
            const finalMessage = `فشل طلب API، ولا يوجد مفاتيح أخرى للمحاولة. الخطأ الأصلي: ${errorMessage}`;
            throw new Error(finalMessage);
        }
        
        try {
            return await apiCall(nextApiKey);
        } catch (retryError) {
             const retryErrorMessage = getErrorMessage(retryError);
             console.error(`API call failed again with key: ${nextApiKey}. Error: ${retryErrorMessage}`, retryError);
             const finalMessage = `فشل طلب API حتى بعد محاولة التبديل إلى مفتاح آخر. الخطأ: ${retryErrorMessage}`;
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
                 const errorMessage = imgErr instanceof Error ? imgErr.message : 'حدث خطأ غير معروف أثناء إنشاء الصورة.';
                 setError(errorMessage);
                 updateState({ step: AppStep.StrategyReady });
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء تحليل النص. الرجاء المحاولة مرة أخرى.';
            setError(errorMessage);
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
            const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف في إعادة توليد الصورة.';
            setError(errorMessage);
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
            setError('خطأ في توليد العناوين القصيرة.');
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
            const errorMessage = err instanceof Error ? err.message : 'فشل توليد الاسكربت.';
            setError(errorMessage);
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
