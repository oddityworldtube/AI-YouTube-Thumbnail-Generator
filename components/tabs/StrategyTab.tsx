// components/tabs/StrategyTab.tsx
import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { CopyButton } from '../common/CopyButton';
import { LinkIcon } from '../icons';

export const StrategyTab: React.FC = () => {
    const { analysisResult, textOptions, handleTitleClick } = useAppContext();

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'bg-green-500/20 text-green-300 border-green-500/50';
        if (score >= 75) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
        return 'bg-red-500/20 text-red-300 border-red-500/50';
    };

    if (!analysisResult) return <div className="text-center text-gray-400">لا توجد بيانات استراتيجية لعرضها.</div>;

    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in space-y-8">
           <h2 className="text-3xl font-bold text-center text-cyan-400 border-b border-gray-700 pb-4">الخطة الاستراتيجية للمحتوى</h2>
           
           <div>
               <h3 className="text-xl font-bold mb-3 text-cyan-400">العناوين المقترحة (لليوتيوب)</h3>
                <div className="space-y-3">
                    {analysisResult.titles.map((suggestion, index) => (
                       <div key={index} className={`p-4 border-2 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${textOptions.text === suggestion.title ? 'bg-cyan-900/50 border-cyan-500' : 'bg-gray-800 border-gray-700'}`}>
                           <button 
                            onClick={() => handleTitleClick(suggestion.title, true)} 
                            className='flex-grow text-right w-full'>
                                <p className='font-bold text-lg'>{suggestion.title}</p>
                                <p className='text-xs text-gray-400 mt-1'>{suggestion.reason}</p>
                           </button>
                           <div className="flex-shrink-0 w-full sm:w-auto flex items-center justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-700/50">
                               <CopyButton text={suggestion.title} className="p-2" />
                               <div className={`font-black text-xl px-3 py-1 rounded-md border ${getScoreColor(suggestion.score)}`}>
                                    {suggestion.score}
                               </div>
                           </div>
                       </div>
                    ))}
               </div>
           </div>
            
            <div className="relative p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <h3 className="text-lg font-bold mb-2 text-green-400">الوصف المقترح</h3>
               <CopyButton text={analysisResult.description} className="absolute top-2 left-2" />
               <p className="text-gray-300 whitespace-pre-wrap text-sm max-h-32 overflow-y-auto">{analysisResult.description}</p>
           </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="relative p-4 bg-gray-900 border border-gray-700 rounded-lg">
                   <h3 className="text-lg font-bold mb-2 text-yellow-400">الكلمات المفتاحية (Tags)</h3>
                   <CopyButton text={analysisResult.tags.join(', ')} className="absolute top-2 left-2" />
                   <div className="flex flex-wrap gap-2">
                       {analysisResult.tags.map(tag => <span key={tag} className="bg-gray-700 text-yellow-300 text-xs font-medium px-2.5 py-1 rounded">{tag}</span>)}
                   </div>
               </div>
               <div className="relative p-4 bg-gray-900 border border-gray-700 rounded-lg">
                   <h3 className="text-lg font-bold mb-2 text-blue-400">الهاشتاجات</h3>
                   <CopyButton text={analysisResult.hashtags.join(' ')} className="absolute top-2 left-2" />
                   <div className="flex flex-wrap gap-3">
                       {analysisResult.hashtags.map(tag => <span key={tag} className="text-blue-400 font-semibold">{tag}</span>)}
                   </div>
               </div>
           </div>

            {analysisResult.sources && analysisResult.sources.length > 0 && (
                <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-bold mb-3 text-indigo-400 flex items-center gap-2">
                        <LinkIcon className="w-5 h-5" />
                        المصادر المستخدمة في التحليل
                    </h3>
                    <ul className="space-y-2 list-disc list-inside">
                        {analysisResult.sources.map((source, index) => (
                            <li key={index}>
                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:text-indigo-200 hover:underline transition-colors text-sm">
                                    {source.web.title || source.web.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
       </div>
    );
};
