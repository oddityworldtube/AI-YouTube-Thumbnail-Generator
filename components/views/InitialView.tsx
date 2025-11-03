// components/views/InitialView.tsx
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Loader } from '../Loader';
import { Wand2Icon } from '../icons';
// FIX: Imported AppStep enum to resolve reference error.
import { AppStep } from '../../types';

export const InitialView: React.FC = () => {
    // FIX: Destructured isTrendingTopic from context to use in the component.
    const { step, article, isTrendingTopic, setState, handleAnalyze } = useAppContext();
    const isLoading = step === AppStep.Analyzing;

    return (
        <div className="w-full max-w-3xl mx-auto flex-grow flex flex-col items-center justify-center">
            <textarea
                className="w-full h-64 p-4 bg-gray-900 border-2 border-gray-700 rounded-lg text-lg text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-none"
                placeholder="الصق محتوى المقال هنا..."
                value={article}
                onChange={(e) => setState({ article: e.target.value })}
                disabled={isLoading}
            />
            <div className="mt-4 flex items-center justify-center">
                <label htmlFor="trending-checkbox" className="flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        id="trending-checkbox" 
                        // FIX: Used the destructured isTrendingTopic state variable.
                        checked={isTrendingTopic}
                        onChange={(e) => setState({ isTrendingTopic: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-gray-700"
                    />
                    <span className="mr-3 text-gray-300">المقالة مرتبطة بأحداث حالية (يستخدم بحث جوجل)</span>
                </label>
            </div>
            <button onClick={handleAnalyze} disabled={isLoading || !article.trim()} className="mt-6 w-full flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 text-white font-bold text-xl py-4 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed">
                {isLoading ? <Loader /> : <Wand2Icon className="w-6 h-6"/>}
                <span>{isLoading ? 'جاري التحليل والإنشاء...' : 'تحليل وإنشاء الصورة'}</span>
            </button>
        </div>
    );
};