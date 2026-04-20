import Groq from "groq-sdk";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";

// Set worker for PDF.js - pointing to a CDN for ease of use in Vercel
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

let groq = null;

const getGroq = () => {
    if (!groq && GROQ_API_KEY) {
        groq = new Groq({
            apiKey: GROQ_API_KEY,
            dangerouslyAllowBrowser: true
        });
    }
    return groq;
};


/**
 * Extracts text from DOCX, PDF files directly in the browser.
 */
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
            const pageText = textContent.items.map(item => item.str).join(" ");
            fullText += pageText + "\n";
        }
        return fullText;
    } else {
        throw new Error("Faqat .docx va .pdf fayllar qo'llab-quvvatlanadi.");
    }
};

/**
 * Validates medical context and generates Quiz/Exam Bundle using Groq Llama-3.
 */
export const generateMedicalContent = async (inputData, isTopic = false) => {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY topilmadi. .env faylini tekshiring.");
    }

    try {
        const client = getGroq();
        if (!client) throw new Error("Groq clientni ishga tushirib bo'lmadi.");

        let promptContent = "";
        if (isTopic) {
            promptContent = `Qat'iy ravishda faqatgina ushbu tibbiy mavzuga e'tibor qarating: "${inputData}". O'zingizning chuqur tibbiy bilimlaringizdan foydalanib ushbu mavzu bo'yicha imtihon to'plamini yarating. Diqqat: Savollar takrorlanmasin.`;
        } else {
            promptContent = `Qat'iy ravishda faqatgina ushbu yuklangan matnga e'tibor qarating: "${inputData.slice(0, 4000)}". Agar bu matn umuman tibbiyotga bog'liq bo'lmasa, return {"success": false, "message": "Not medical context"}. Agar bog'liq bo'lsa, xuddi shu matn asosida imtihon to'plamini yarating. Diqqat: Barcha savollar mutlaqo turlicha va xilma-xil bo'lishi shart!`;
        }

        const chatCompletion = await client.chat.completions.create({

            messages: [
                {
                    role: "system",
                    content: `You are an expert Clinical Medicine AI evaluator.
                    Your task is to generate a Medical Exam Bundle strictly in JSON format.
                    The bundle MUST exactly follow the 15/2/2/1 structural format:
                    - EXACTLY 15 multiple-choice questions (tests). IMPORTANT: EVERY SINGLE QUESTION MUST BE 100% UNIQUE. DO NOT REPEAT ANY CONCEPT OR QUESTION TEXT!
                    - EXACTLY 2 situational clinical case studies (cases)
                    - EXACTLY 2 X-ray diagnostic scenarios (xrays)
                    - EXACTLY 1 practical manual skill step-by-step procedure (practical)

                    Use Uzbek language for all content. ONLY return a valid JSON object matching this exact structure:
                    {
                       "success": true,
                       "tests": [ {"question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "..."} ],
                       "cases": [ {"title": "...", "scenario": "...", "question": "...", "answer": "..."} ],
                       "xrays": [ {"title": "...", "question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "...", "image": "/assets/xray_placeholder.png"} ],
                       "practical": { "title": "...", "steps": ["step 1", "step 2", "step 3"] }
                    }`
                },
                {
                    role: "user",
                    content: promptContent
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.6
        });

        const response = JSON.parse(chatCompletion.choices[0].message.content);
        return response;
    } catch (error) {
        console.error("Groq AI Error:", error);
        throw new Error("AI tahlilida xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    }
};
