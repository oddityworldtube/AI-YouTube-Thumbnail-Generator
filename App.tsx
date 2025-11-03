// App.tsx
import React, { useState } from 'react';
import { AppStep } from './types';
import { useAppContext } from './hooks/useAppContext';
import { InitialView } from './components/views/InitialView';
import { MainView } from './components/views/MainView';
import { SettingsModal } from './components/settings/SettingsModal';
import { SettingsIcon } from './components/icons';

const App: React.FC = () => {
    const { step, error, setError } = useAppContext();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const renderContent = () => {
        if (step < AppStep.StrategyReady) {
            return <InitialView />;
        }
        return <MainView />;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col" style={{ background: 'radial-gradient(circle at top, #1F2937, #111827)'}}>
            <div className="w-full bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 z-20">
                <header className="relative text-center p-6 sm:p-8 md:p-12 max-w-5xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                           مساعد يوتيوب الاستراتيجي
                        </span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-400">
                        من تحليل المقال إلى الصورة النهائية، كل ما تحتاجه لنجاح فيديوهاتك.
                    </p>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 p-3 bg-gray-700/50 rounded-full hover:bg-gray-600/50 transition-colors"
                        aria-label="Open settings"
                    >
                        <SettingsIcon className="w-6 h-6 text-gray-300" />
                    </button>
                </header>
            </div>
            
            <div className="w-full max-w-7xl mx-auto p-6 sm:p-8 md:p-12 flex-grow">
                <main className="flex items-start justify-center">
                    {renderContent()}
                </main>
            </div>

            {error && (
                <div 
                    className="fixed bottom-5 right-5 bg-red-600 text-white py-3 px-6 rounded-lg shadow-lg animate-fade-in cursor-pointer z-50"
                    onClick={() => setError(null)}
                >
                    {error}
                </div>
            )}
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default App;
