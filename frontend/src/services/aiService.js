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
 * Validates medical context and generates Quiz/Flashcards using Groq Llama-3.
 */
export const generateMedicalContent = async (text) => {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY topilmadi. .env faylini tekshiring.");
    }

    try {
        const client = getGroq();
        if (!client) throw new Error("Groq clientni ishga tushirib bo'lmadi.");

        const chatCompletion = await client.chat.completions.create({

            messages: [
                {
                    role: "system",
                    content: `You are a Medical Education AI evaluator.
                    1. Determine if the text is related to medicine, anatomy, pharmacology, or clinical practice. 
                    2. If NOT, return exactly: {"success": false, "message": "Not medical context"}.
                    3. If YES, you MUST generate EXACTLY 10 multiple-choice quizzes and EXACTLY 5 flashcards based on the text.
                       Return a JSON with: 
                       "success": true,
                       "flashcards": [{"q": "...", "a": "..."}] (strictly 5 items),
                       "quizzes": [{"question": "...", "options": ["...", "...", "...", "..."], "answer": (index 0-3), "explanation": "...", "topic": "..."}] (strictly 10 items).
                    Use Uzbek for content. Output ONLY valid JSON.`
                },
                {
                    role: "user",
                    content: text.slice(0, 4000) // Limit context size specifically for Groq free rate limit (6000 TPM)
                }
            ],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        const response = JSON.parse(chatCompletion.choices[0].message.content);
        return response;
    } catch (error) {
        console.error("Groq AI Error:", error);
        throw new Error("AI tahlilida xatolik yuz berdi.");
    }
};
