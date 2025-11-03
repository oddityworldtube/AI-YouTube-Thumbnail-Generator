// types.ts

export enum AppStep {
  Initial,
  Analyzing,
  StrategyReady,
  GeneratingBackground,
  ImageReady,
}

export interface TitleSuggestion {
  title: string;
  score: number;
  reason: string;
}

export interface GroundingSource {
    web: {
        uri: string;
        title: string;
    }
}

export interface AnalysisResult {
  summary: string;
  titles: TitleSuggestion[];
  description: string;
  tags: string[];
  hashtags: string[];
  sources?: GroundingSource[];
}

export interface ScriptResult {
    script: string;
    score: number;
    reason: string;
    wordCount: number;
}

export type TextAlignment = 'left' | 'center' | 'right';
export type SupportedFont = 'Cairo' | 'Tajawal' | 'Changa' | 'Amiri' | 'Reem Kufi' | 'Lemonada';
export type ArtStyle = 'Realistic' | 'Artistic' | 'Minimalist' | 'Cartoon';

export interface TextPosition {
  x: number; // 0 to 1 (percentage)
  y: number; // 0 to 1 (percentage)
}

export interface TextOptions {
    text: string;
    position: TextPosition;
    align: TextAlignment;
    font: SupportedFont;
    fontSize: number; // Pixel value
    textColor: string;
    strokeColor: string;
    highlightedWords: string[];
    highlightColor: string;
    highlightScale: number;
    lineHeightScale: number;
}

// New types for state management and history
export interface HistoryItem {
    id: string; // Unique ID, e.g., timestamp
    date: string;
    article: string;
    analysisResult: AnalysisResult;
}

export interface AppState {
    step: AppStep;
    article: string;
    isTrendingTopic: boolean;
    analysisResult: AnalysisResult | null;
    editedSummary: string;
    artStyle: ArtStyle;
    backgroundImages: string[];
    selectedBackgroundImage: string | null;
    textOptions: TextOptions;
    shortTitles: TitleSuggestion[];
    scriptResult: ScriptResult | null;
    minWordCount: string;
    activeScriptTitle: string | null;
    error: string | null;
}
