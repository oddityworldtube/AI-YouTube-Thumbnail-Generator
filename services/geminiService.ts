// services/geminiService.ts

/**
 * هذا الملف يحتوي على جميع الخدمات المتعلقة بالتفاعل مع Google GenAI API.
 * يتضمن وظائف لتحليل المقالات، إنشاء صور مصغرة، وتوليد عناوين قصيرة.
 * كل دالة هنا تتطلب مفتاح API لتمريره، مما يسمح بالإدارة الديناميكية للمفاتيح.
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisResult, ArtStyle, TitleSuggestion, ScriptResult } from '../types';
import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai";

// ====================================================================================
// النماذج
// ====================================================================================

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_GENERATION_MODEL = "imagen-4.0-generate-001";

// ====================================================================================
// الـ Prompts المحسّنة (Optimized Prompts) - (No changes here)
// ====================================================================================

function ANALYZE_ARTICLE_PROMPT(article: string) {
    return `
أنت استراتيجي محتوى فيروسي (Viral Content Strategist) وخبير في علم النفس التسويقي، وتعمل مع أكبر صناع المحتوى على يوتيوب. مهمتك هي تحليل المقال التالي بدقة وتحويله إلى حزمة بيانات وصفية متكاملة ومحسّنة لتحقيق أقصى نسبة نقر إلى ظهور (CTR) وأعلى مدة مشاهدة (Watch Time). المخرجات يجب أن تكون باللغة العربية.

# الفلسفة الأساسية:
كل جزء من البيانات الوصفية يجب أن يعمل بتناغم مع الأجزاء الأخرى لخلق "فجوة فضول" لا تقاوم، مما يجبر المشاهد على النقر.

# المخرجات المطلوبة:
// FIX: Escaped backticks in the prompt to prevent TypeScript parsing errors.
النتيجة يجب أن تكون كائن JSON واحد صالح وموجود داخل وسم \`\`\`json ... \`\`\` ويحتوي على المفاتيح التالية بالضبط:
1.  'summary': ملخص دقيق باللغة الإنجليزية من جملة واحدة فقط. هذا الملخص هو **"الموجز الفني"** للمخرج البصري. يجب أن يصف مشهدًا سينمائيًا رمزيًا، مع تحديد العاطفة الأساسية (مثل: الدهشة، الغموض، الانتصار) والعناصر البصرية الرئيسية. يجب أن يكون خاليًا تمامًا من أي نص مقترح. مثال: "A lone astronaut touches a mysterious, glowing alien artifact on a desolate planet, conveying a mood of awe and cautious discovery."
2.  'titles': مصفوفة من 5 اقتراحات لعناوين فيديو يوتيوب باللغة العربية. كل اقتراح يجب أن يكون كائنًا يحتوي على:
    - 'title' (string): عنوان جذاب ومحسّن لمحركات البحث (SEO). يجب أن يمثل العنوان استراتيجية نفسية مختلفة (مثل: سؤال مباشر، وعد بنتيجة، تحدي لمعتقد شائع).
    - 'score' (number): تقييم من 100 لقدرة العنوان على إيقاف التمرير (Scroll-Stopping Power)، بناءً على الوضوح، القوة العاطفية، وعمق فجوة الفضول التي يخلقها.
    - 'reason' (string): شرح موجز لسبب فعالية العنوان، مع تحديد الاستراتيجية النفسية المستخدمة.
3.  'description': وصف فيديو يوتيوب احترافي (150-200 كلمة). يجب أن:
    - يبدأ بـ "خطاف" قوي في أول سطرين لجذب الانتباه (Attention).
    - يثير الاهتمام (Interest) ويخلق الرغبة (Desire) لمعرفة المزيد.
    - يدمج بشكل طبيعي أهم 2-3 كلمات مفتاحية من الوسوم.
    - ينتهي بدعوة قوية لاتخاذ إجراء (Action - CTA)، مثل "شاهد الآن لتكتشف الحقيقة" أو "شاركنا رأيك في التعليقات".
    - يتضمن قالبًا مقترحًا للطوابع الزمنية (Timestamps) لزيادة التفاعل.
4.  'tags': مصفوفة من 10-15 كلمة مفتاحية استراتيجية. يجب أن تمزج بين:
    - وسوم عامة (Broad tags) لجذب جمهور واسع.
    - وسوم متخصصة وطويلة (Long-tail tags) لاستهداف دقيق.
    - وسوم ذات صلة دلالية (Semantic tags) تفهمها خوارزميات يوتيوب.
5.  'hashtags': مصفوفة من 3 هاشتاجات قوية ومؤثرة، واحدة عامة واثنتان متخصصتان.

# المقال للتحليل:
---
${article}
---`;
}

function GENERATE_IMAGEN_THUMBNAIL_PROMPT(summary: string, artStyle: ArtStyle) {
    return `Generate a symbolic and cinematic 4K thumbnail image representing this core concept: "${summary}".
    Artistic Style: ${artStyle}.
    Key Directives:
    - Focus on abstract and metaphorical visuals rather than literal depictions.
    - Composition must be dynamic with dramatic, high-contrast cinematic lighting.
    - Use bold, saturated colors to evoke a powerful emotion (e.g., mystery, revelation, tension).
    - **Crucially, ensure significant negative space is available on one side** for text overlay.
    - The image must be completely free of any text, letters, or logos.
    - The final image must be professional, compelling, and have a 16:9 aspect ratio.`;
}

function GENERATE_SHORT_TITLES_PROMPT(summary:string) {
    return `
أنت خبير إعلانات (Copywriter) من الطراز العالمي، متخصص في "علم النفس العصبي للكتابة المقنعة". مهمتك هي صياغة 10 "عناوين مصغرة" (Thumbnail Titles) تعمل كمحفزات نفسية فورية.

تخيل أن هذه الكلمات القليلة ستوضع بخط ضخم فوق صورة سينمائية مذهلة. يجب أن يخلق التآزر بين الصورة والنص فضولًا لا يطاق.

# ملخص المفهوم:
"${summary}"

# التعليمات:
قم بتوليد 10 عناوين قصيرة جدًا (2-4 كلمات) باللغة العربية، باستخدام مجموعة متنوعة من المحفزات النفسية.
- **التنوع:** يجب أن تستخدم كل مرة تكتيكًا مختلفًا: التناقض الصادم، الخوف من فوات الشيء (FOMO)، الوعد بنتيجة ضخمة، تحدي معتقد شائع، السر المجهول، الإلحاح الزمني.
- **القوة:** يجب أن تكون كل كلمة مختارة بعناية لتحقيق أقصى تأثير عاطفي.
- **الوضوح:** رغم الغموض، يجب أن يكون العنوان مرتبطًا بالموضوع.

# المخرجات المطلوبة:
مصفوفة JSON صالحة تحتوي على 10 كائنات. كل كائن يجب أن يحتوي على:
- 'title' (string): العنوان المصغر القصير والمثير.
- 'score' (number): تقييم من 100 لقدرته على إيقاف التمرير وخلق دافع للنقر.
- 'reason' (string): شرح نفسي موجز لسبب فعالية العنوان، مع **تسمية المبدأ النفسي** المستخدم (مثال: "يستخدم مبدأ التنافر المعرفي لإثارة حيرة المشاهد.").

# مثال على المخرجات المطلوبة:
[
  {"title": "الخطأ القاتل", "score": 96, "reason": "يستخدم محفز الخوف والفضول لمعرفة خطأ فادح قد نرتكبه جميعًا."},
  {"title": "السر انكشف", "score": 94, "reason": "يستغل رغبة الإنسان الفطرية في معرفة المعلومات السرية والمخفية."},
  {"title": "وداعاً للفقر", "score": 92, "reason": "يقدم وعدًا بتحول جذري، مستهدفًا أمنية عميقة لدى الجمهور."}
]`;
}

function GET_HIGHLIGHT_KEYWORD_PROMPT(title: string) {
    return `
From the following Arabic YouTube title, identify and return ONLY the single most impactful, emotionally resonant, and visually interesting word or a very short two-word phrase (maximum 2 words). This word should be the best candidate for being highlighted visually on a thumbnail to grab attention. Your response must be a single, valid JSON object with one key: "keyword".

Title: "${title}"
`;
}

function GENERATE_VOICEOVER_SCRIPT_PROMPT(title: string, description: string, tags: string[], minWordCount: number) {
    return `
# الشخصية:
أنت كاتب اسكربتات محترف وخبير في علم نفس المشاهد على يوتيوب. مهمتك هي تحويل البيانات الوصفية التالية إلى اسكربت صوتي جذاب ومكتوب خصيصًا ليُسمع، وليس ليُقرأ، وموجه لجمهور يوتيوب العام.

# البيانات الأساسية للمحتوى:
- **العنوان الرئيسي:** ${title}
- **الوصف:** ${description}
- **الكلمات المفتاحية:** ${tags.join(', ')}
- **الحد الأدنى لعدد الكلمات:** ${minWordCount}

# القواعد الصارمة (يجب الالتزام بها حرفيًا):
1.  **الخطّاف (The Hook):** يجب أن تبدأ أول 10-15 ثانية بـ 'خطاف' قوي لا يقاوم. استخدم سؤالاً صادماً، أو حقيقة غريبة، أو وعداً جريئاً لجعل المشاهد يلتزم بمتابعة الفيديو. هذا هو أهم جزء.
2.  **مكتوب ليُسمع:** استخدم جملاً قصيرة ومباشرة. تجنب الكلمات المعقدة. خاطب المشاهد مباشرة بـ 'أنت'. استخدم أسئلة بلاغية لإبقاء المشاهد متفاعلاً. يجب أن يكون السرد سلساً وانسيابياً كأنه حديث طبيعي.
3.  **نص نظيف 100%:** الناتج يجب أن يكون النص الصوتي فقط. **ممنوع تمامًا** كتابة أي توجيهات بصرية (مثل: 'تظهر صورة لـ...') أو مؤثرات صوتية (مثل: '[موسيقى تصويرية حماسية]'). النص يجب أن يكون جاهزاً مباشرة للتحويل إلى صوت.
4.  **الالتزام بالمدخلات:** ابنِ الاسكربت ليكون متوافقًا تمامًا مع العنوان والوصف والكلمات المفتاحية المقدمة.
5.  **التقييم الذاتي:** بعد كتابة الاسكربت، قم بتقييم عملك من 100 بناءً على قوة الخطاف، وسلاسة السرد، والالتزام بالقواعد. كن ناقداً صارماً وموضوعياً. يجب أن يكون التقييم فوق 95% فقط إذا كان الخطاف استثنائيًا بحق.

# المخرجات المطلوبة:
كائن JSON واحد صالح يحتوي على المفاتيح التالية بالضبط:
- 'script' (string): النص الكامل للتعليق الصوتي.
- 'wordCount' (number): العدد الفعلي لكلمات الاسكربت المكتوب.
- 'score' (number): تقييمك الرقمي من 100.
- 'reason' (string): شرح موجز (جملة واحدة) لسبب منحك هذا التقييم، مع التركيز على جودة الخطاف.
`;
}

const getAIClient = (apiKey: string) => new GoogleGenAI({ apiKey });

// ====================================================================================
// الخدمات المصدرة (Exported Services)
// ====================================================================================

export const analyzeArticle = async (article: string, useSearchGrounding: boolean, apiKey: string): Promise<AnalysisResult> => {
    const ai = getAIClient(apiKey);
    const promptText = ANALYZE_ARTICLE_PROMPT(article);
    const request: GenerateContentParameters = {
        model: TEXT_MODEL,
        contents: [{ parts: [{text: promptText}] }],
        config: {},
    };

    if (useSearchGrounding) {
        request.config = { tools: [{ googleSearch: {} }] };
    } else {
         request.config = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    titles: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                score: { type: Type.NUMBER },
                                reason: { type: Type.STRING }
                            },
                            required: ["title", "score", "reason"]
                        }
                    },
                    description: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["summary", "titles", "description", "tags", "hashtags"],
            },
        };
    }

    const response: GenerateContentResponse = await ai.models.generateContent(request);
    const text = response.text;
    let jsonString = text;
    
    if (useSearchGrounding) {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            jsonString = match[1];
        }
    }
    
    try {
        const analysisData = JSON.parse(jsonString);
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { ...analysisData, sources };
    } catch (parseError) {
        console.error("Error parsing AI response JSON in analyzeArticle:", jsonString);
        throw new Error("فشل تحليل استجابة الذكاء الاصطناعي. قد تكون البيانات غير صالحة.");
    }
};

export const generateThumbnailBackground = async (summary: string, artStyle: ArtStyle, apiKey: string): Promise<string[]> => {
    const ai = getAIClient(apiKey);
    const response = await ai.models.generateImages({
        model: IMAGE_GENERATION_MODEL,
        prompt: GENERATE_IMAGEN_THUMBNAIL_PROMPT(summary, artStyle),
        config: {
            numberOfImages: 3,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
            negativePrompt: "Avoid depicting identifiable people, political symbols, specific government entities, controversial events, violence, or direct conflict. Focus on symbolism and abstract concepts.",
        },
    });
    
    const imagesData = response.generatedImages?.map(img => img.image?.imageBytes).filter(Boolean) as string[];

    if (imagesData && imagesData.length > 0) {
        return imagesData;
    }

    const errorMessage = `فشلت عملية إنشاء الصورة. قد يكون المحتوى مخالفًا لسياسات الأمان. حاول تعديل "ملخص توجيه الصورة" ليكون أكثر حيادية.`;
    throw new Error(errorMessage);
};

export const generateShortTitles = async (summary: string, apiKey: string): Promise<TitleSuggestion[]> => {
    const ai = getAIClient(apiKey);
    const promptText = GENERATE_SHORT_TITLES_PROMPT(summary);
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        score: { type: Type.NUMBER },
                        reason: { type: Type.STRING }
                    },
                    required: ["title", "score", "reason"]
                },
                description: "مصفوفة من اقتراحات العناوين المصغرة مع تقييمها."
            }
        },
    });

    const jsonString = response.text;
    try {
        return JSON.parse(jsonString);
    } catch (parseError) {
        console.error("Error parsing AI response JSON in generateShortTitles:", jsonString);
        throw new Error("فشل تحليل استجابة الذكاء الاصطناعي. قد تكون البيانات غير صالحة.");
    }
};

export const getHighlightKeyword = async (title: string, apiKey: string): Promise<string> => {
     if (!title || !title.trim()) {
        return '';
    }
    const ai = getAIClient(apiKey);
    const promptText = GET_HIGHLIGHT_KEYWORD_PROMPT(title);
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING }
                },
                required: ["keyword"]
            }
        },
    });
    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    return result.keyword || '';
};

export const generateVoiceoverScript = async (title: string, description: string, tags: string[], minWordCount: number, apiKey: string): Promise<ScriptResult> => {
    const ai = getAIClient(apiKey);
    const promptText = GENERATE_VOICEOVER_SCRIPT_PROMPT(title, description, tags, minWordCount);
    const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{ parts: [{ text: promptText }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    script: { type: Type.STRING },
                    wordCount: { type: Type.NUMBER },
                    score: { type: Type.NUMBER },
                    reason: { type: Type.STRING },
                },
                required: ["script", "wordCount", "score", "reason"],
            },
        },
    });
    
    const jsonString = response.text;
    try {
        return JSON.parse(jsonString);
    } catch (parseError) {
         console.error("Error parsing AI response JSON in generateVoiceoverScript:", jsonString);
        throw new Error("فشل تحليل استجابة الذكاء الاصطناعي للاسكربت.");
    }
};
