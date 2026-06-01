import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// ── PDF.js worker ─────────────────────────────────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

// ── API Keys ──────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;

// ── Shared Medical System Prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert Clinical Medicine AI evaluator.
Your task is to generate a Medical Exam Bundle strictly in JSON format.
The bundle MUST exactly follow the 15/2/2/1 structural format:
- EXACTLY 15 multiple-choice questions (tests). IMPORTANT: EVERY QUESTION MUST BE 100% UNIQUE!
- EXACTLY 2 situational clinical case studies (cases)
- EXACTLY 2 X-ray diagnostic scenarios (xrays)
- EXACTLY 1 practical manual skill step-by-step procedure (practical)

Use Uzbek language for all content. ONLY return a valid JSON object:
{
  "success": true,
  "tests": [ {"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."} ],
  "cases": [ {"title":"...","scenario":"...","question":"...","answer":"..."} ],
  "xrays": [ {"title":"...","question":"...","options":["A","B","C","D"],"answer":0,"explanation":"...","image":"/assets/xray_placeholder.png"} ],
  "practical": { "title":"...","steps":["step 1","step 2","step 3"] }
}`;

// ── Gemini Client (lazy) ──────────────────────────────────────────────────────
let geminiModel = null;
const getGemini = () => {
    if (!geminiModel && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_KEY_HERE') {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }
    return geminiModel;
};

// ── Groq Client (lazy) ────────────────────────────────────────────────────────
let groqClient = null;
const getGroq = () => {
    if (!groqClient && GROQ_API_KEY) {
        groqClient = new Groq({ apiKey: GROQ_API_KEY, dangerouslyAllowBrowser: true });
    }
    return groqClient;
};

// ── Build user prompt ─────────────────────────────────────────────────────────
const buildPrompt = (inputData, isTopic) => isTopic
    ? `Qat'iy ravishda faqatgina ushbu tibbiy mavzuga e'tibor qarating: "${inputData}". Chuqur tibbiy bilimlaringizdan foydalanib ushbu mavzu bo'yicha imtihon to'plamini yarating. Diqqat: Savollar takrorlanmasin.`
    : `Qat'iy ravishda faqatgina ushbu yuklangan matnga e'tibor qarating: "${inputData.slice(0, 4000)}". Agar bu matn umuman tibbiyotga bog'liq bo'lmasa, return {"success": false, "message": "Not medical context"}. Agar bog'liq bo'lsa, xuddi shu matn asosida imtihon to'plamini yarating. Diqqat: Barcha savollar mutlaqo turlicha bo'lishi shart!`;

// ── Gemini Generation ─────────────────────────────────────────────────────────
const generateWithGemini = async (prompt) => {
    const model = getGemini();
    if (!model) throw new Error("GEMINI_NOT_AVAILABLE");

    console.log("🤖 AI: Using Gemini...");
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.6 }
    });
    const text = result.response.text();
    return JSON.parse(text);
};

// ── Groq Generation ───────────────────────────────────────────────────────────
const generateWithGroq = async (prompt) => {
    const client = getGroq();
    if (!client) throw new Error("GROQ_NOT_AVAILABLE");

    console.log("🤖 AI: Using Groq (fallback)...");
    const chat = await client.chat.completions.create({
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user",   content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: 0.6
    });
    return JSON.parse(chat.choices[0].message.content);
};

// ── Rate-limit / quota error detector ────────────────────────────────────────
const isQuotaError = (err) => {
    const msg = (err?.message || err?.toString() || "").toLowerCase();
    return (
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("rate limit") ||
        msg.includes("resource_exhausted") ||
        msg.includes("too many requests") ||
        msg.includes("exceeded")
    );
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC: Main generate function  (Gemini ➜ Groq fallback)
// ─────────────────────────────────────────────────────────────────────────────
export const generateMedicalContent = async (inputData, isTopic = false) => {
    const prompt = buildPrompt(inputData, isTopic);

    // 1️⃣ Try Gemini
    try {
        const result = await generateWithGemini(prompt);
        return result;
    } catch (geminiErr) {
        if (geminiErr.message === "GEMINI_NOT_AVAILABLE") {
            console.info("Gemini key yo'q → to'g'ri Groq'ga o'tkazilmoqda.");
        } else if (isQuotaError(geminiErr)) {
            console.warn("⚠️ Gemini quota tugadi → Groq'ga o'tkazilmoqda...");
        } else {
            console.error("Gemini xatosi:", geminiErr.message);
            // Non-quota Gemini error → still try Groq
        }
    }

    // 2️⃣ Fallback: Groq
    try {
        const result = await generateWithGroq(prompt);
        return result;
    } catch (groqErr) {
        console.error("Groq xatosi:", groqErr.message);
        if (groqErr.message === "GROQ_NOT_AVAILABLE") {
            throw new Error("Hech qanday AI key sozlanmagan. Iltimos Gemini yoki Groq API key kiriting.");
        }
        if (isQuotaError(groqErr)) {
            throw new Error("Barcha AI xizmatlari (Gemini va Groq) limit ko'rsatdi. Keyinroq urinib ko'ring.");
        }
        throw new Error("AI tahlilida xatolik yuz berdi: " + groqErr.message);
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC: File text extraction  (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const extractTextFromFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const filename = file.name.toLowerCase();

    if (filename.endsWith(".docx")) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } else if (filename.endsWith(".pdf")) {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(" ") + "\n";
        }
        return fullText;
    } else {
        throw new Error("Faqat .docx va .pdf fayllar qo'llab-quvvatlanadi.");
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC: X-Ray Analysis (Gemini Vision with Groq Fallback)
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeXrayWithGemini = async (file) => {
    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const promptText = `Siz tajribali ortoped-travmatologsiz. Ushbu tasvirni tahlil qiling. Agar bu tibbiyotga oid rentgen (x-ray) yoki MRI tasviri bo'lmasa, faqat '-1' raqamini qaytaring. Agar u tizza yoki bo'g'im rentgeni bo'lsa, osteoartroz darajasini Kellgren-Lawrence (KL) shkalasi bo'yicha 0 dan 4 gacha baholang va faqat o'sha raqamni (0, 1, 2, 3 yoki 4) qaytaring. Javobingizda faqat bitta raqam bo'lsin, boshqa hech qanday so'z yozmang.`;

    const model = getGemini();
    if (model) {
        try {
            console.log("🤖 AI: Using Gemini Vision for X-Ray...");
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type || "image/jpeg"
                }
            };
            const result = await model.generateContent([promptText, imagePart]);
            const text = result.response.text().trim();
            
            const match = text.match(/-1|[0-4]/);
            if (match) {
                const grade = parseInt(match[0], 10);
                if (grade === -1) {
                    return { grade: -1, valid: false, source: "Gemini Vision" };
                } else {
                    return { grade: Math.max(0, Math.min(4, grade)), valid: true, source: "Gemini Vision" };
                }
            }
            return { grade: -1, valid: false, source: "Gemini Vision" };
        } catch (geminiError) {
            console.warn("Gemini Error, falling back to Groq Vision:", geminiError.message);
        }
    }

    // Fallback to Groq Vision
    console.log("🤖 AI: Using Groq Vision for X-Ray Fallback...");
    try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.2-11b-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: promptText },
                            { type: "image_url", image_url: { url: `data:${file.type || "image/jpeg"};base64,${base64Data}` } }
                        ]
                    }
                ],
                temperature: 0.1
            })
        });

        if (!groqRes.ok) {
            const errData = await groqRes.json();
            throw new Error(errData.error?.message || "Groq Vision API Error");
        }

        const groqData = await groqRes.json();
        const text = groqData.choices[0].message.content.trim();
        
        const match = text.match(/-1|[0-4]/);
        if (match) {
            const grade = parseInt(match[0], 10);
            if (grade === -1) {
                return { grade: -1, valid: false, source: "Groq Llama-3.2 Vision" };
            } else {
                return { grade: Math.max(0, Math.min(4, grade)), valid: true, source: "Groq Llama-3.2 Vision" };
            }
        }
        return { grade: -1, valid: false, source: "Groq Llama-3.2 Vision" };
    } catch (groqError) {
        console.error("Both Gemini and Groq failed:", groqError);
        throw new Error("Tarmoq band (Limit tugadi) yoki AI serverlarida xatolik. Iltimos 1 daqiqadan so'ng qayta urinib ko'ring.");
    }
};

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC: Chatbot (Gemini / Groq)
// ─────────────────────────────────────────────────────────────────────────────
export const chatWithAI = async (message, history = []) => {
    try {
        const model = getGemini();
        if (model) {
            try {
                const systemContext = `Siz Med-Zukkoo platformasining tibbiyot bo'yicha aqlli AI yordamchisisiz. Sizning vazifangiz talabalar va o'qituvchilarning tibbiyot (ayniqsa travmatologiya, ortopediya) ga oid savollariga qisqa, aniq va tushunarli javob berish. Agar savol tibbiyotga aloqador bo'lmasa, muloyimlik bilan faqat tibbiyot doirasida javob bera olishingizni ayting.`;
                
                const formattedHistory = history.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.text }],
                }));
                
                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: systemContext }] },
                        { role: 'model', parts: [{ text: "Tushundim, men tibbiy yordamchiman va tayyorman." }] },
                        ...formattedHistory
                    ]
                });
                
                const result = await chat.sendMessage([{ text: message }]);
                return { success: true, text: result.response.text().trim(), source: "Gemini" };
            } catch (geminiError) {
                console.warn("Gemini Chat Error, falling back to Groq:", geminiError.message);
            }
        }
        
        // Fallback to Groq if Gemini fails or is not available
        const messages = [
            { role: "system", content: "Siz Med-Zukkoo platformasining tibbiyot bo'yicha aqlli AI yordamchisisiz. Qisqa, aniq va foydali tibbiy javoblar bering." },
            ...history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: "user", content: message }
        ];
        
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: messages,
                temperature: 0.7
            })
        });
        const groqData = await groqRes.json();
        if (groqData.choices && groqData.choices.length > 0) {
            return { success: true, text: groqData.choices[0].message.content, source: "Groq Llama-3" };
        }
        throw new Error("Groq javob qaytarmadi.");
    } catch (e) {
        console.error("AI Chatbot Error:", e);
        return { success: false, text: "Kechirasiz, xizmatda vaqtinchalik nosozlik yuz berdi. Iltimos keyinroq urinib ko'ring." };
    }
};
