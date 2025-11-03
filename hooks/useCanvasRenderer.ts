// hooks/useCanvasRenderer.ts
import { useState, useEffect } from 'react';
import { TextOptions } from '../types';
import { useDebounce } from './useDebounce';

const drawTextOnImageInternal = (backgroundImageSrc: string, options: TextOptions): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { text, position, align, font, fontSize, textColor, strokeColor, highlightedWords, highlightColor, highlightScale, lineHeightScale } = options;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = backgroundImageSrc;

        img.onload = () => {
            const canvasWidth = 1280;
            const canvasHeight = 720;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

            ctx.textBaseline = 'middle';
            
            const maxWidth = canvasWidth * 0.9;
            const initialLines = text.split('\n');
            const finalLines: string[] = [];
            const spaceWidth = fontSize * 0.2;
            
            const isWordHighlighted = (word: string): boolean => {
                if (!highlightedWords || highlightedWords.length === 0) return false;
                const lowerWord = word.toLowerCase().trim().replace(/[.,!?:;]$/, '');
                return highlightedWords.some(hw => lowerWord.includes(hw.toLowerCase().trim()));
            };

            initialLines.forEach(line => {
                const words = line.split(' ').filter(w => w);
                if (words.length === 0) return;

                let currentLineWords: string[] = [];
                let currentLineWidth = 0;

                for (const word of words) {
                    const isHighlighted = isWordHighlighted(word);
                    const currentFontSize = isHighlighted ? fontSize * highlightScale : fontSize;
                    ctx.font = `900 ${currentFontSize}px ${font}`;
                    const wordWidth = ctx.measureText(word).width;

                    const testWidth = currentLineWidth + (currentLineWords.length > 0 ? spaceWidth : 0) + wordWidth;

                    if (testWidth > maxWidth) {
                        finalLines.push(currentLineWords.join(' '));
                        currentLineWords = [word];
                        currentLineWidth = wordWidth;
                    } else {
                        currentLineWords.push(word);
                        currentLineWidth = testWidth;
                    }
                }
                finalLines.push(currentLineWords.join(' '));
            });

            const lineHeight = fontSize * lineHeightScale;
            const totalTextHeight = (finalLines.length * lineHeight) - (lineHeight - fontSize);
            const startX = position.x * canvasWidth;
            let startY = (position.y * canvasHeight) - totalTextHeight / 2 + lineHeight / 2;

            finalLines.forEach((line) => {
                const words = line.split(' ').filter(w => w.length > 0);
                
                const getRenderedLineWidth = (lineWords: string[]): number => {
                    let totalWidth = 0;
                    lineWords.forEach((word, index) => {
                        const isHighlighted = isWordHighlighted(word);
                        const currentFontSize = isHighlighted ? fontSize * highlightScale : fontSize;
                        ctx.font = `900 ${currentFontSize}px ${font}`;
                        totalWidth += ctx.measureText(word).width;
                        if (index < lineWords.length - 1) {
                            totalWidth += spaceWidth;
                        }
                    });
                    return totalWidth;
                };

                const lineWidth = getRenderedLineWidth(words);
                
                const isRTLFlow = align === 'right' || align === 'center';
                let lineDrawStartX: number;
                
                if (align === 'right') {
                    lineDrawStartX = startX;
                } else if (align === 'center') {
                    lineDrawStartX = startX + (lineWidth / 2);
                } else { // align === 'left'
                    lineDrawStartX = startX;
                }

                ctx.textAlign = 'left';
                let currentX = lineDrawStartX;

                for (const word of words) {
                    const isHighlighted = isWordHighlighted(word);
                    const currentFontSize = isHighlighted ? fontSize * highlightScale : fontSize;
                    ctx.font = `900 ${currentFontSize}px ${font}`;
                    const yOffset = (fontSize - currentFontSize) / 2;
                    const wordWidth = ctx.measureText(word).width;

                    const drawX = isRTLFlow ? currentX - wordWidth : currentX;
                    
                    ctx.fillStyle = isHighlighted ? highlightColor : textColor;
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = currentFontSize / 8;
                    
                    ctx.strokeText(word, drawX, startY - yOffset);
                    ctx.fillText(word, drawX, startY - yOffset);
                    
                    if (isRTLFlow) {
                        currentX -= wordWidth + spaceWidth;
                    } else {
                        currentX += wordWidth + spaceWidth;
                    }
                }
                 startY += lineHeight;
            });

            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => reject(new Error('Failed to load background image'));
    });
};

export function useCanvasRenderer(
    backgroundImageSrc: string | null,
    textOptions: TextOptions,
    debounceDelay: number = 150
) {
    const [finalImage, setFinalImage] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState<boolean>(false);
    
    const debouncedTextOptions = useDebounce(textOptions, debounceDelay);

    useEffect(() => {
        if (!backgroundImageSrc) {
            setFinalImage(null);
            return;
        }

        if (!debouncedTextOptions.text) {
            setFinalImage(backgroundImageSrc);
            return;
        }

        let isCancelled = false;
        setIsRendering(true);

        drawTextOnImageInternal(backgroundImageSrc, debouncedTextOptions)
            .then(dataUrl => {
                if (!isCancelled) {
                    setFinalImage(dataUrl);
                }
            })
            .catch(err => {
                console.error("Canvas rendering error:", err);
                if (!isCancelled) {
                    // Fallback to background image on error
                    setFinalImage(backgroundImageSrc);
                }
            })
            .finally(() => {
                if (!isCancelled) {
                    setIsRendering(false);
                }
            });
        
        return () => {
            isCancelled = true;
        };

    }, [backgroundImageSrc, debouncedTextOptions]);

    return { finalImage, isRendering };
}
