// components/common/AccordionItem.tsx
import React from 'react';
import { ChevronDownIcon } from '../icons';
import { Loader } from '../Loader';

interface AccordionItemProps {
    title: string;
    id: string;
    isOpen: boolean;
    onToggle: (id: string) => void;
    children: React.ReactNode;
    isLoading?: boolean;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, id, isOpen, onToggle, children, isLoading = false }) => (
    <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-800/50">
        <button
            onClick={() => onToggle(id)}
            className="w-full flex justify-between items-center p-3 bg-gray-800 hover:bg-gray-700/80 transition-colors"
            aria-expanded={isOpen}
            aria-controls={`accordion-content-${id}`}
        >
            <div className="flex items-center gap-2">
                <h4 className="font-semibold text-cyan-400">{title}</h4>
                {isLoading && <Loader />}
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div id={`accordion-content-${id}`} className="p-3 bg-gray-900/30 animate-fade-in-down space-y-3">
                {children}
            </div>
        )}
    </div>
);
