// components/tabs/ScriptTab.tsx
import React, { useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Loader } from '../Loader';
import { RefreshCwIcon, FileTextIcon } from '../icons';
import { CopyButton } from '../common/CopyButton';

export const ScriptTab: React.FC = () => {
    const { 
        analysisResult, 
        minWordCount, 
        setState, 
        handleGenerateScript,
        activeScriptTitle,
        scriptResult
    } = useAppContext();
    
    const [isGenerating, setIsGenerating] = useState(false);
    
    if (!analysisResult) return <div className="text-center text-gray-400">يجب تحليل مقال أولاً لتوليد اسكربت.</div>;

    const onGenerateScript = async (title: string) => {
        setIsGenerating(true);
        await handleGenerateScript(title);
        setIsGenerating(false);
    }

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'bg-green-500/20 text-green-300 border-green-500/50';
        if (score >= 75) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
        return 'bg-red-500/20 text-red-300 border-red-500/50';
    };

    const renderScriptResult = () => {
        if (isGenerating && !scriptResult) {
            return (
                <div className="p-6 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center animate-pulse mt-6">
                    <Loader />
                    <p className="mt-4 text-lg text-gray-400">جاري كتابة الاسكربت الاحترافي...</p>
                    <p className="text-sm text-gray-500">قد تستغرق هذه العملية بضع لحظات.</p>
                </div>
            );
        }

        if (!scriptResult) return null;

        return (
            <div className="p-6 bg-gray-800/80 border border-gray-700 rounded-lg space-y-4 animate-fade-in mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="text-2xl font-bold text-indigo-400">الاسكربت المقترح لـ "{activeScriptTitle}"</h3>
                    <div className="flex items-center gap-4">
                        <div className="text-center">
                             <div className={`font-black text-2xl px-4 py-2 rounded-md border ${getScoreColor(scriptResult.score)}`}>
                                {scriptResult.score}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">تقييم الجودة</p>
                        </div>
                         <div className="text-center">
                             <div className="font-bold text-2xl text-gray-300 px-4 py-2">
                                {scriptResult.wordCount}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">عدد الكلمات</p>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-400 border-r-4 border-indigo-500 pr-4 italic">{scriptResult.reason}</p>
                <textarea
                    readOnly
                    value={scriptResult.script}
                    className="w-full h-80 p-4 bg-gray-900 border border-gray-600 rounded-md text-gray-300 resize-y"
                />
                <div className="flex items-center gap-4">
                    <CopyButton text={scriptResult.script} className="p-3 flex-1 bg-gray-700 text-lg" />
                    <button onClick={() => activeScriptTitle && onGenerateScript(activeScriptTitle)} disabled={isGenerating} className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg flex items-center justify-center gap-2">
                        {isGenerating ? <Loader /> : <RefreshCwIcon className="w-5 h-5" />}
                        إعادة توليد
                    </button>
                </div>
            </div>
        )
    };

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in space-y-6">
            <h2 className="text-3xl font-bold text-center text-indigo-400 border-b border-gray-700 pb-4">مولد الاسكربت الصوتي</h2>
            
            <div>
                <h3 className="text-xl font-bold mb-3 text-gray-300">1. اختر العنوان لتوليد الاسكربت</h3>
                <div className="space-y-2">
                     {analysisResult.titles.map((suggestion, index) => (
                       <div key={index} className={`p-3 border-2 rounded-lg flex items-center justify-between gap-4 ${activeScriptTitle === suggestion.title ? 'bg-indigo-900/50 border-indigo-500' : 'bg-gray-800 border-gray-700'}`}>
                           <p className='font-bold flex-grow text-right'>{suggestion.title}</p>
                           <button onClick={() => onGenerateScript(suggestion.title)} disabled={isGenerating && activeScriptTitle === suggestion.title} className="p-2 bg-indigo-600/80 rounded-md hover:bg-indigo-500/80 transition-colors flex items-center gap-2 text-sm px-3">
                               {isGenerating && activeScriptTitle === suggestion.title ? <Loader /> : <FileTextIcon className="w-5 h-5"/>}
                               <span>{scriptResult && activeScriptTitle === suggestion.title ? 'إعادة توليد' : 'اكتب الاسكربت'}</span>
                           </button>
                       </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-3 text-gray-300">2. حدد طول الاسكربت (اختياري)</h3>
                <label className="text-sm text-gray-400 mr-2">الحد الأدنى لكلمات الاسكربت:</label>
                <input 
                    type="number"
                    value={minWordCount}
                    onChange={(e) => setState({ minWordCount: e.target.value })}
                    className="w-24 p-1 bg-gray-900 border border-gray-600 rounded-md text-center"
                    step="50"
                    min="50"
                />
            </div>
            
             {(isGenerating || scriptResult) && renderScriptResult()}

        </div>
    );
};
