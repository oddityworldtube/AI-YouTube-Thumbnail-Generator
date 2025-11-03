// components/common/CopyButton.tsx
import React, { useState } from 'react';
import { ClipboardCopyIcon } from '../icons';

export const CopyButton: React.FC<{ text: string, className?: string }> = ({ text, className = '' }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className={`p-2 bg-gray-700/50 rounded-md hover:bg-gray-600/50 transition-colors ${className}`}>
            <ClipboardCopyIcon className={`w-5 h-5 ${copied ? 'text-green-400' : 'text-gray-300'}`} />
        </button>
    );
};
