import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { extractTextFromFile } from '../services/aiService';

const parseDocumentTests = (text) => {
    const tests = [];
    // Matnni "\n 1. " yoki "\n1)" kabi raqamlanishlaridan kesamiz
    const blocks = text.split(/\n\s*(?:\d+[\.\)])\s+/).filter(b => b.trim() !== "");
    
    // Agar split ishlamasa (chunki fayl boshida raqam bo'lsa), birinchi elementni tozalaymiz
    let startingIndex = 0;
    if (blocks.length > 0 && !text.match(/^\s*\d+[\.\)]/)) {
        // Fayl boshida sarlavha yoki boshqa yozuvlar bo'lishi mumkin, ularni tashlaymiz
        startingIndex = 1; 
    }
    
    for (let idx = startingIndex; idx < blocks.length; idx++) {
        const block = blocks[idx];
        const lines = block.split('\n').map(l => l.trim()).filter(l => l !== "");
        if (lines.length < 3) continue; // Kamida bitta savol va ikkita javob bo'lishi kerak
        
        let question = lines[0];
        let options = [];
        let correctAnswerIndex = -1;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            // "A) Javob", "+B) Javob", "*C) Javob", "a. Javob" larni qidiradi
            const optMatch = line.match(/^([\+\*]?)\s*[a-zA-Zа-яА-Я][\.\)]\s*(.*)$/);
            if (optMatch) {
                const isCorrect = optMatch[1] === '+' || optMatch[1] === '*';
                const optText = optMatch[2];
                options.push(optText);
                if (isCorrect) correctAnswerIndex = options.length - 1;
            } else if (line.toLowerCase().startsWith('javob:') || line.toLowerCase().startsWith('otvet:') || line.toLowerCase().startsWith('answer:')) {
                // "Javob: B" formatini o'qiydi
                const ansStr = line.split(':')[1].trim().toLowerCase();
                const charCode = ansStr.charCodeAt(0);
                if (charCode >= 97 && charCode <= 100) { // a, b, c, d
                    correctAnswerIndex = charCode - 97;
                }
            } else {
                // Agar hech qanday option topilmasa va bu savolning davomi bo'lsa
                if (options.length === 0) {
                    question += " " + line;
                }
            }
        }
        
        // Agar to'g'ri javob topilmasa, avtomatik 0-chi javobni oladi
        if (correctAnswerIndex === -1 && options.length > 0) {
            correctAnswerIndex = 0;
        }
        
        // Agar eng kamida 2 ta javob topilsa, testni qabul qilamiz
        if (options.length >= 2) {
            tests.push({
                question: question,
                options: options,
                answer: correctAnswerIndex,
                topic: "Tayyor Test Baza"
            });
        }
    }
    return tests;
};

const TeacherTests = ({ user, onLogout }) => {
    const { t, lang, theme } = useApp();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState([]);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleBulkTestUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadResults([]);
        
        try {
            let testsArray = [];
            const fileNameLower = file.name.toLowerCase();

            if (fileNameLower.endsWith(".json")) {
                const text = await file.text();
                const data = JSON.parse(text); 
                
                if (Array.isArray(data)) {
                    testsArray = data;
                } else if (data.tests && Array.isArray(data.tests)) {
                    testsArray = data.tests;
                } else {
                    throw new Error("JSON faylida testlar topilmadi (array yoki {tests: []} kutilmoqda).");
                }
            } else if (fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".pdf")) {
                // Word yoki PDF dan matn ajratib olish
                const text = await extractTextFromFile(file);
                testsArray = parseDocumentTests(text);
            } else {
                throw new Error("Faqat .json, .docx yoki .pdf fayllarni yuklashingiz mumkin.");
            }

            const totalTests = testsArray.length;
            if (totalTests === 0) throw new Error("Testlar ro'yxati bo'sh!");

            // Chunk the tests into groups of 500 to avoid Firestore 1MB document limit
            const chunkSize = 500;
            const chunks = [];
            for (let i = 0; i < totalTests; i += chunkSize) {
                chunks.push(testsArray.slice(i, i + chunkSize));
            }

            setProgress({ current: 0, total: chunks.length });
            
            let successCount = 0;
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const title = `Baza: ${file.name} (Qism ${i + 1}/${chunks.length})`;
                
                const payload = {
                    success: true,
                    tests: chunk
                };

                const docRef = await addDoc(collection(db, 'exams'), {
                    teacherId: user?.uid || 'unknown',
                    teacherName: user?.displayName || user?.email || "O'qituvchi",
                    title: title,
                    createdAt: serverTimestamp(),
                    data: payload,
                    status: 'published'
                });

                const link = `${window.location.origin}/test?id=${docRef.id}`;
                setUploadResults(prev => [...prev, {
                    title: title,
                    link: link,
                    testsCount: chunk.length,
                    success: true
                }]);
                
                successCount += chunk.length;
                setProgress({ current: i + 1, total: chunks.length });
            }

            alert(lang === 'ru' ? `Успешно загружено ${successCount} тестов!` : `Muvaffaqiyatli ${successCount} ta test yuklandi!`);
            
        } catch (err) {
            console.error("Bulk upload error:", err);
            setUploadResults([{ title: file.name, success: false, error: err.message }]);
        } finally {
            setIsUploading(false);
            e.target.value = ''; // reset file input
        }
    };

    return (
        <DashboardLayout role="teacher" user={user} onLogout={onLogout}>
            <div className="max-w-5xl mx-auto animate-[fadeInUp_0.4s_ease-out]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                        <i className="fa-solid fa-list-check"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{lang === 'ru' ? 'База тестов' : 'Testlar bazasi'}</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {lang === 'ru' 
                                ? 'Управляйте тестами и загружайте массово (JSON).'
                                : 'Testlarni boshqarish va ommaviy yuklash (JSON formatida).'}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl mb-8">
                    <h3 className="text-lg font-bold text-white mb-2">{lang === 'ru' ? 'Массовая загрузка (до 3000 тестов)' : 'Ommaviy yuklash (3000 tagacha test)'}</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        {lang === 'ru' 
                            ? 'Выберите JSON, Word (.docx) или PDF файл с вопросами. Система автоматически разобьет их на части (по 500 тестов) для безопасности загрузки.'
                            : 'Testlar bilan to\'la JSON, Word (.docx) yoki PDF faylini tanlang. Tizim avtomatik ravishda testlarni o\'qib, 500 tadan bo\'lib bazaga yuklaydi.'}
                    </p>

                    <label className={`w-full py-10 flex flex-col items-center justify-center gap-3 font-bold text-sm rounded-2xl transition-all cursor-pointer border-2 border-dashed ${isUploading ? 'border-slate-600 bg-slate-800/50 cursor-not-allowed' : 'border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/5'}`}>
                        {isUploading ? (
                            <>
                                <i className="fa-solid fa-circle-notch fa-spin text-4xl text-emerald-500 mb-2"></i>
                                <span className="text-emerald-400">Yuklanmoqda... {progress.current} / {progress.total} qism</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-cloud-arrow-up text-4xl text-emerald-500 mb-2"></i>
                                <span className="text-emerald-400 text-lg">JSON, Word yoki PDF faylni tanlang</span>
                                <span className="text-slate-500 text-xs mt-1">.json, .docx yoki .pdf formatidagi tayyor testlar</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            accept=".json,.docx,.pdf" 
                            className="hidden" 
                            disabled={isUploading} 
                            onChange={handleBulkTestUpload} 
                        />
                    </label>

                    {uploadResults.length > 0 && (
                        <div className="mt-8 space-y-3">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Yuklash natijalari:</h4>
                            {uploadResults.map((res, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${res.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                    <div>
                                        <p className={`font-bold text-sm ${res.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {res.success ? <><i className="fa-solid fa-check-circle mr-2"></i> {res.title}</> : <><i className="fa-solid fa-triangle-exclamation mr-2"></i> Xatolik</>}
                                        </p>
                                        {res.success ? (
                                            <p className="text-xs text-slate-400 mt-1">{res.testsCount} ta test joylandi</p>
                                        ) : (
                                            <p className="text-xs text-rose-300 mt-1">{res.error}</p>
                                        )}
                                    </div>
                                    {res.success && (
                                        <button onClick={() => {navigator.clipboard.writeText(res.link); alert("Havola nusxalandi!")}} className="text-emerald-400 hover:text-white hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 transition-all">
                                            Nusxa olish
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeacherTests;
