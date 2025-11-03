// components/views/MainView.tsx
import React, { useState } from 'react';
import { StrategyTab } from '../tabs/StrategyTab';
import { EditorTab } from '../tabs/EditorTab';
import { ScriptTab } from '../tabs/ScriptTab';

type Tab = 'strategy' | 'editor' | 'script';

export const MainView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('editor');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'strategy':
                return <StrategyTab />;
            case 'editor':
                return <EditorTab />;
            case 'script':
                return <ScriptTab />;
            default:
                return <EditorTab />;
        }
    };
    
    return (
        <div className="w-full animate-fade-in">
            <div className="mb-8 flex justify-center border-b border-gray-700">
                {(
                    [
                        { id: 'editor', label: 'محرر الصورة' },
                        { id: 'strategy', label: 'الخطة الاستراتيجية' },
                        { id: 'script', label: 'مولد الاسكربت' },
                    ] as const
                ).map(tab => (
                     <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-lg font-bold transition-colors duration-300 ${
                            activeTab === tab.id
                                ? 'border-b-2 border-cyan-400 text-cyan-400'
                                : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {renderTabContent()}
        </div>
    );
};
