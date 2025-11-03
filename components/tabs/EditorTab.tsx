// components/tabs/EditorTab.tsx
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { useCanvasRenderer } from '../../hooks/useCanvasRenderer';
// FIX: Imported AppStep to be used for checking component state.
import { AppStep, ArtStyle, SupportedFont, TextAlignment, TextOptions } from '../../types';
import { Loader } from '../Loader';
import { DownloadIcon, RefreshCwIcon, SparklesIcon } from '../icons';
import { AccordionItem } from '../common/AccordionItem';

export const EditorTab: React.FC = () => {
    const {
        step,
        textOptions,
        setState,
        selectedBackgroundImage,
        backgroundImages,
        handleRegenerateBackground,
        handleGenerateShortTitles,
        handleTitleClick,
        handleReset,
        shortTitles,
        artStyle,
        editedSummary,
        analysisResult
    } = useAppContext();

    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isGeneratingShortTitles, setIsGeneratingShortTitles] = useState(false);
    const [isHighlighting, setIsHighlighting] = useState(false);

    const { finalImage, isRendering: isCanvasRendering } = useCanvasRenderer(selectedBackgroundImage, textOptions);

    const [isDragging, setIsDragging] = useState(false);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const textStartPos = useRef({ x: 0, y: 0 });
    const [openAccordions, setOpenAccordions] = useState<string[]>(['text', 'presets']);

    const onRegenerateBackground = async () => {
        setIsRegenerating(true);
        await handleRegenerateBackground();
        setIsRegenerating(false);
    };

    const onGenerateShortTitles = async (isAutomatic: boolean) => {
        setIsGeneratingShortTitles(true);
        await handleGenerateShortTitles(isAutomatic);
        setIsGeneratingShortTitles(false);
    };

    const onTitleClick = async (title: string, isSelection: boolean = true) => {
        setState({ textOptions: { ...textOptions, text: title, highlightedWords: [] } });
        if (!isSelection) return;

        setIsHighlighting(true);
        try {
            await handleTitleClick(title, isSelection);
        } finally {
            setIsHighlighting(false);
        }
    };
    
    // Auto-generate short titles when the background image is first selected.
    React.useEffect(() => {
        if (selectedBackgroundImage && shortTitles.length === 0 && !isGeneratingShortTitles && analysisResult) {
            onGenerateShortTitles(true);
        }
    }, [selectedBackgroundImage, shortTitles.length, isGeneratingShortTitles, analysisResult]);

    const handleDownload = () => {
        if (!finalImage) return;
        const link = document.createElement('a');
        link.href = finalImage;
        link.download = 'youtube_thumbnail.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return;
        e.preventDefault();
        setIsDragging(true);
        const rect = imageContainerRef.current.getBoundingClientRect();
        dragStartPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        textStartPos.current = { x: textOptions.position.x, y: textOptions.position.y };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !imageContainerRef.current) return;
        const rect = imageContainerRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const deltaX = currentX - dragStartPos.current.x;
        const deltaY = currentY - dragStartPos.current.y;

        const newX = textStartPos.current.x + deltaX / rect.width;
        const newY = textStartPos.current.y + deltaY / rect.height;

        setState({
            textOptions: {
                ...textOptions,
                position: {
                    x: Math.max(0, Math.min(1, newX)),
                    y: Math.max(0, Math.min(1, newY)),
                }
            }
        });
    };
    
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseLeave = () => setIsDragging(false);
    
    const toggleHighlightWord = (word: string) => {
        const newHighlightedWords = textOptions.highlightedWords.includes(word)
            ? textOptions.highlightedWords.filter(w => w !== word)
            : [...textOptions.highlightedWords, word];
        setState({ textOptions: { ...textOptions, highlightedWords: newHighlightedWords }});
    };

    const currentTextKeywords = useMemo(() => {
        if (!textOptions.text) return [];
        return [...new Set(textOptions.text.split(/[\s\n]+/).filter(w => w.length > 2))];
    }, [textOptions.text]);

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const applyPreset = (presetOptions: Partial<TextOptions>) => {
        setState({ textOptions: { ...textOptions, ...presetOptions } });
    };

    const designPresets: { [key: string]: Partial<TextOptions> } = {
        'إخباري': { font: 'Tajawal', fontSize: 80, textColor: '#FFFFFF', strokeColor: '#000000', highlightColor: '#FFDD00', highlightScale: 1.1, lineHeightScale: 1.1, align: 'right' },
        'جريء': { font: 'Changa', fontSize: 96, textColor: '#FFFF00', strokeColor: '#000000', highlightColor: '#FF0000', highlightScale: 1.25, lineHeightScale: 1.0, align: 'center' },
        'وثائقي': { font: 'Amiri', fontSize: 70, textColor: '#E0E0E0', strokeColor: '#1C1C1C', highlightColor: '#4A90E2', highlightScale: 1.15, lineHeightScale: 1.3, align: 'center' },
    };


    return (
         <div className="w-full animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow">
                    <div 
                        ref={imageContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        className={`relative aspect-video w-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl shadow-cyan-500/20 border-2 border-cyan-500 ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
                    >
                        {step === AppStep.GeneratingBackground && !finalImage && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10">
                                <Loader />
                                <p className="mt-2 text-lg">...جاري إنشاء الخلفيات</p>
                            </div>
                        )}
                        {(!finalImage && step >= AppStep.GeneratingBackground) ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800"><Loader /></div>
                        ) : finalImage ? (
                             <img src={finalImage} alt="Final Thumbnail" className="w-full h-full object-cover select-none pointer-events-none" />
                        ) : null}
                        {isCanvasRendering && (
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                <Loader />
                             </div>
                        )}
                        <button onClick={onRegenerateBackground} disabled={isRegenerating} className="absolute top-2 right-2 p-2 bg-gray-800/70 rounded-full hover:bg-gray-700/90 transition-transform transform hover:scale-110 cursor-pointer">
                            {isRegenerating ? <Loader /> : <RefreshCwIcon className="w-5 h-5"/>}
                        </button>
                    </div>

                    {backgroundImages.length > 1 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-bold text-gray-400 mb-2 text-center">اختر الخلفية</h4>
                            <div className="flex justify-center gap-2">
                                {backgroundImages.map((imgSrc, index) => (
                                    <button key={index} onClick={() => setState({ selectedBackgroundImage: imgSrc })} className={`w-1/3 aspect-video rounded-md overflow-hidden border-2 transition-all duration-200 ${selectedBackgroundImage === imgSrc ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-gray-500'}`}>
                                        <img src={imgSrc} alt={`Background option ${index + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="flex gap-4 mt-4">
                        <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-3 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 transform hover:scale-105">
                            <RefreshCwIcon className="w-5 h-5"/>
                            <span>البدء من جديد</span>
                        </button>
                        <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-3 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 transform hover:scale-105">
                            <DownloadIcon className="w-5 h-5"/>
                            <span>تحميل</span>
                        </button>
                    </div>
                </div>
                <div className="w-full lg:w-96 flex-shrink-0 space-y-3">
                     <h3 className="text-xl font-bold text-center text-cyan-400 border-b border-gray-700 pb-2 mb-4">لوحة التحكم والتصميم</h3>

                    <div className="grid grid-cols-1 gap-6">
                       <div>
                           <h3 className="text-sm font-bold mb-2 text-purple-400">النمط الفني للصورة</h3>
                           <div className="flex gap-2">
                                {(['Realistic', 'Artistic', 'Minimalist', 'Cartoon'] as ArtStyle[]).map(style => (
                                   <button key={style} onClick={() => setState({ artStyle: style })} className={`flex-1 p-2 border-2 rounded-lg transition-all duration-300 text-sm font-semibold ${artStyle === style ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 hover:border-purple-600'}`}>
                                       {style}
                                   </button>
                                ))}
                           </div>
                       </div>
                       <div>
                           <h3 className="text-sm font-bold mb-2 text-gray-400">ملخص لتوجيه الصورة (قابل للتعديل)</h3>
                            <input
                               type="text"
                               value={editedSummary}
                               onChange={(e) => setState({ editedSummary: e.target.value })}
                               className="w-full p-2 bg-gray-900 border-2 border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-purple-500 text-sm"
                               dir="ltr"
                            />
                       </div>
                   </div>
                    
                     <AccordionItem title="النص الأساسي" id="text" isOpen={openAccordions.includes('text')} onToggle={toggleAccordion}>
                         <label className="block text-sm font-medium text-gray-300 mb-1">النص (استخدم Enter لسطر جديد)</label>
                         <textarea value={textOptions.text} onChange={(e) => onTitleClick(e.target.value, true) } className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-sm resize-none" rows={3}/>
                         <button onClick={() => onGenerateShortTitles(false)} disabled={isGeneratingShortTitles} className="w-full text-xs mt-1 p-1 bg-purple-700 hover:bg-purple-600 rounded flex items-center justify-center gap-2">
                            {isGeneratingShortTitles ? <Loader /> : <SparklesIcon className="w-3 h-3"/>}
                            اقتراح عناوين قصيرة جديدة
                         </button>
                         {shortTitles.length > 0 && (
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                                {shortTitles.map((suggestion, index) => (
                                    <button key={index} onClick={() => onTitleClick(suggestion.title, true)} className={`w-full text-xs p-1.5 rounded text-right flex justify-between items-center ${textOptions.text === suggestion.title ? 'bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                        <span>{suggestion.title}</span>
                                        <span className="text-yellow-300 font-bold">{suggestion.score}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </AccordionItem>
                    
                    <AccordionItem title="قوالب التصميم" id="presets" isOpen={openAccordions.includes('presets')} onToggle={toggleAccordion}>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(designPresets).map(([name, options]) => (
                                <button key={name} onClick={() => applyPreset(options)} className="p-2 bg-gray-700 hover:bg-cyan-600 rounded-md transition-colors text-sm">
                                    {name}
                                </button>
                            ))}
                        </div>
                    </AccordionItem>
                    
                    <AccordionItem title="التصميم والألوان" id="design" isOpen={openAccordions.includes('design')} onToggle={toggleAccordion}>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">حجم الخط ({textOptions.fontSize}px)</label>
                            <input type="range" min="32" max="140" step="2" value={textOptions.fontSize} onChange={e => setState({ textOptions: {...textOptions, fontSize: parseInt(e.target.value)}})} className="w-full h-8 cursor-pointer"/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">تباعد الأسطر ({Math.round(textOptions.lineHeightScale * 100)}%)</label>
                            <input type="range" min="1.0" max="2.0" step="0.05" value={textOptions.lineHeightScale} onChange={e => setState({ textOptions: {...textOptions, lineHeightScale: parseFloat(e.target.value)}})} className="w-full h-8 cursor-pointer"/>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">المحاذاة</label>
                            <div className="grid grid-cols-3 gap-1 bg-gray-900 p-1 rounded-md">
                                {(['right', 'center', 'left'] as TextAlignment[]).map(align => 
                                    <button key={align} onClick={() => setState({ textOptions: {...textOptions, align: align}})} className={`py-1 rounded transition-colors ${textOptions.align === align ? 'bg-cyan-600 text-white' : 'bg-transparent text-gray-300 hover:bg-gray-700'}`}>{align}</button>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">نوع الخط</label>
                            <select value={textOptions.font} onChange={e => setState({ textOptions: {...textOptions, font: e.target.value as SupportedFont}})} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-sm">
                                {(['Cairo', 'Tajawal', 'Changa', 'Amiri', 'Reem Kufi', 'Lemonada'] as SupportedFont[]).map(font => <option key={font} value={font} style={{fontFamily: font}}>{font}</option>)}
                            </select>
                        </div>
                         <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">لون النص</label>
                                <input type="color" value={textOptions.textColor} onChange={e => setState({ textOptions: {...textOptions, textColor: e.target.value}})} className="w-full h-10 p-1 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">لون الحد</label>
                                <input type="color" value={textOptions.strokeColor} onChange={e => setState({ textOptions: {...textOptions, strokeColor: e.target.value}})} className="w-full h-10 p-1 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"/>
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem title="الكلمات المميزة" id="highlight" isOpen={openAccordions.includes('highlight')} onToggle={toggleAccordion} isLoading={isHighlighting}>
                         <div className="flex flex-wrap gap-1 justify-center">
                            {currentTextKeywords.map(word => (
                                <button key={word} onClick={() => toggleHighlightWord(word)} className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${textOptions.highlightedWords.includes(word) ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'}`}>
                                    {word}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <div>
                                <label className="text-xs text-gray-400">اللون</label>
                                <input type="color" value={textOptions.highlightColor} onChange={e => setState({ textOptions: {...textOptions, highlightColor: e.target.value}})} className="w-full h-8 p-1 bg-gray-800 border border-gray-600 rounded-md cursor-pointer"/>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">الحجم ({Math.round(textOptions.highlightScale * 100)}%)</label>
                                <input type="range" min="1" max="2.5" step="0.05" value={textOptions.highlightScale} onChange={e => setState({ textOptions: {...textOptions, highlightScale: parseFloat(e.target.value)}})} className="w-full h-8 cursor-pointer"/>
                            </div>
                        </div>
                    </AccordionItem>
                </div>
            </div>
        </div>
    );
};