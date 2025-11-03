// hooks/useHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { HistoryItem, AnalysisResult } from '../types';

const HISTORY_STORAGE_KEY = 'youtube_strategist_history';

export const useHistory = () => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (storedHistory) {
                setHistory(JSON.parse(storedHistory));
            }
        } catch (error) {
            console.error("Failed to load history from localStorage", error);
            setHistory([]);
        }
    }, []);

    const saveHistory = useCallback((newHistory: HistoryItem[]) => {
        try {
            // Sort by date descending before saving
            const sortedHistory = newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(sortedHistory));
            setHistory(sortedHistory);
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    }, []);

    const addHistoryItem = useCallback((article: string, analysisResult: AnalysisResult) => {
        const newItem: HistoryItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            article,
            analysisResult
        };
        // Use a function to get the latest state to avoid stale closures
        setHistory(prevHistory => {
            const updatedHistory = [newItem, ...prevHistory];
            saveHistory(updatedHistory);
            return updatedHistory;
        });
    }, [saveHistory]);

    const removeHistoryItem = useCallback((id: string) => {
        const updatedHistory = history.filter(item => item.id !== id);
        saveHistory(updatedHistory);
    }, [history, saveHistory]);

    const clearHistory = useCallback(() => {
        saveHistory([]);
    }, [saveHistory]);

    return { history, addHistoryItem, removeHistoryItem, clearHistory };
};
