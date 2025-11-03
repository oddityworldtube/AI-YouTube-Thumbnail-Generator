// components/settings/SettingsModal.tsx
import React, { useState, useEffect } from 'react';
import * as apiKeyManager from '../../services/apiKeyManager';
import { useHistory } from '../../hooks/useHistory';
import { useAppContext } from '../../hooks/useAppContext';
import { Trash2Icon } from '../icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [keys, setKeys] = useState<string[]>([]);
    const [newKey, setNewKey] = useState('');
    const [activeKey, setActiveKey] = useState<string | undefined>('');
    const { history, removeHistoryItem, clearHistory } = useHistory();
    const { loadStateFromHistory } = useAppContext();

    useEffect(() => {
        if (isOpen) {
            setKeys(apiKeyManager.getApiKeys());
            setActiveKey(apiKeyManager.getActiveApiKey());
        }
    }, [isOpen]);

    const handleAddKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKeyManager.addApiKey(newKey)) {
            setKeys(apiKeyManager.getApiKeys());
            setNewKey('');
             if(!activeKey) {
                setActiveKey(apiKeyManager.getActiveApiKey());
            }
        }
    };

    const handleRemoveKey = (key: string) => {
        apiKeyManager.removeApiKey(key);
        setKeys(apiKeyManager.getApiKeys());
        setActiveKey(apiKeyManager.getActiveApiKey());
    };
    
    const handleLoadHistory = (item: (typeof history)[0]) => {
        loadStateFromHistory(item);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-cyan-400">الإعدادات</h2>
                </div>
                
                <div className="p-5 overflow-y-auto space-y-8">
                    {/* API Key Management */}
                    <section>
                        <h3 className="text-lg font-semibold mb-3 text-gray-300 border-b border-gray-600 pb-2">إدارة مفاتيح Gemini API</h3>
                        <div className="space-y-2">
                            {keys.map(key => (
                                <div key={key} className={`p-2 rounded-md flex items-center justify-between text-sm transition-colors ${key === activeKey ? 'bg-green-800/50' : 'bg-gray-700/50'}`}>
                                    <span className="font-mono text-gray-400">
                                        {key.substring(0, 4)}...{key.substring(key.length - 4)}
                                        {key === activeKey && <span className="text-green-400 text-xs ml-2">(نشط)</span>}
                                    </span>
                                    <button onClick={() => handleRemoveKey(key)} className="p-1 hover:bg-red-500/20 rounded-full">
                                        <Trash2Icon className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddKey} className="mt-4 flex gap-2">
                            <input
                                type="text"
                                value={newKey}
                                onChange={e => setNewKey(e.target.value)}
                                placeholder="أضف مفتاح API جديد"
                                className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold">إضافة</button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">سيتم التبديل بين المفاتيح تلقائياً عند حدوث خطأ أو الوصول للحد الأقصى.</p>
                    </section>
                    
                    {/* History Management */}
                    <section>
                        <div className="flex justify-between items-center mb-3 border-b border-gray-600 pb-2">
                            <h3 className="text-lg font-semibold text-gray-300">سجل التحليلات</h3>
                            {history.length > 0 && 
                                <button onClick={clearHistory} className="text-xs text-red-400 hover:underline">مسح السجل</button>
                            }
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {history.length > 0 ? history.map(item => (
                                <div key={item.id} className="p-2 rounded-md bg-gray-700/50 flex items-center justify-between text-sm">
                                    <div className="flex-grow">
                                        <p className="text-gray-300 truncate">{item.article.substring(0, 60)}...</p>
                                        <p className="text-xs text-gray-500">{new Date(item.date).toLocaleString('ar-EG')}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <button onClick={() => handleLoadHistory(item)} className="px-3 py-1 text-xs bg-cyan-700 hover:bg-cyan-600 rounded-md">
                                            استعادة
                                        </button>
                                        <button onClick={() => removeHistoryItem(item.id)} className="p-1 hover:bg-red-500/20 rounded-full">
                                            <Trash2Icon className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 text-center py-4">لا يوجد سجل حتى الآن.</p>}
                        </div>
                    </section>
                </div>

                <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">إغلاق</button>
                </div>
            </div>
        </div>
    );
};
