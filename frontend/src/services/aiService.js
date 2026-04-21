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
