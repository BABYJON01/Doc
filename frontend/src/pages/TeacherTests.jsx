import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { extractTextFromFile } from '../services/aiService';

const parseDocumentTests = (text) => {
    const tests = [];
    let blocks = [];
    
    // First, try to split by explicit answer lines (like "Тўғри жавоб: 1234" or "Javob: B")
    const answerRegex = /\n(?:.*(?:javob|otvet|answer|жавоб).*)/gi;
    
    if (text.match(answerRegex)) {
        const parts = text.split(/(\n.*(?:javob|otvet|answer|жавоб).*)/i);
        for (let i = 0; i < parts.length - 1; i += 2) {
            blocks.push((parts[i] + parts[i+1]).trim());
        }
        if (parts[parts.length - 1].trim()) {
            blocks.push(parts[parts.length - 1].trim());
        }
    } else if (text.match(/\n\s*\n/)) {
        // Fallback 1: Split by empty lines (paragraphs)
        blocks = text.split(/\n\s*\n/).filter(b => b.trim() !== "");
    } else {
        // Fallback 2: Split by question numbers (e.g. "\n 1. " or "\n1)")
        blocks = text.split(/\n\s*(?:\d+[\.\)])\s+/).filter(b => b.trim() !== "");
    }
    
    for (let idx = 0; idx < blocks.length; idx++) {
        let block = blocks[idx];
        // Remove starting question number or # if present
        block = block.replace(/^\s*(?:\d+[\.\)]|#)\s*/, '');
        
        const lines = block.split('\n').map(l => l.trim()).filter(l => l !== "");
        if (lines.length < 2) continue;
        
        let question = lines[0];
        let options = [];
        let correctAnswerIndex = -1;
        let complexAnswerStr = null;
        let inlineCorrectNumbers = [];
        let allInlineNumbers = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for ANY explicit answer line
            const ansLineMatch = line.match(/^(?:javob|otvet|answer|жавоб|тўғри жавоб)[^\wа-я]*(.*)$/i);
            
            if (ansLineMatch) {
                let ansContent = ansLineMatch[1].trim();
                ansContent = ansContent.replace(/[\.;]+$/, '').trim();
                
                if (ansContent.length === 1 && ansContent.match(/^[A-Da-dА-Да-д]$/)) {
                    let charCode = ansContent.toLowerCase().charCodeAt(0);
                    if (ansContent.toLowerCase() === 'а') charCode = 97;
                    else if (ansContent.toLowerCase() === 'б') charCode = 98;
                    else if (ansContent.toLowerCase() === 'в') charCode = 99;
                    else if (ansContent.toLowerCase() === 'г') charCode = 100;
                    if (charCode >= 97 && charCode <= 100) correctAnswerIndex = charCode - 97;
                } else {
                    complexAnswerStr = ansContent;
                }
                break;
            }
            
            // Check for standard options A, B, C, D
            const optMatch = line.match(/^([\+\*]?)\s*[a-zA-Zа-яА-Я][\.\)]\s*(.*)$/);
            
            // Check for simple +/- options e.g. "+фиксацию..." or "-фиксацию..."
            const pmOptMatch = line.match(/^([\+\-])\s*(.*)$/);
            
            // Check for inline numbered options (Multiple Select) e.g. "1. Teriosti emfizemasida *" or "*3. Jaroxat"
            const numOptMatch = line.match(/^([\+\*]?)\s*(\d+)[\.\)]\s*(.*)$/);
            
            if (optMatch) {
                const isCorrect = optMatch[1] === '+' || optMatch[1] === '*';
                options.push(optMatch[2]);
                if (isCorrect) correctAnswerIndex = options.length - 1;
            } else if (pmOptMatch) {
                const isCorrect = pmOptMatch[1] === '+';
                options.push(pmOptMatch[2]);
                if (isCorrect) correctAnswerIndex = options.length - 1;
            } else if (numOptMatch) {
                // It's a numbered option, append to question text so student can read it
                question += "\n" + line.replace(/[\+\*]/g, '').trim(); // hide stars from student
                
                const optNum = numOptMatch[2];
                allInlineNumbers.push(optNum);
                
                if (numOptMatch[1] === '*' || numOptMatch[1] === '+' || line.includes('*') || line.includes('+')) {
                    inlineCorrectNumbers.push(optNum);
                }
            } else {
                if (options.length === 0) {
                    question += "\n" + line;
                }
            }
        }
        
        if (inlineCorrectNumbers.length > 0) {
            // Multiple Select Test: generate combination options
            const correctCombo = inlineCorrectNumbers.sort().join(", ");
            const distractors = new Set();
            distractors.add(correctCombo);
            
            let attempts = 0;
            while(distractors.size < 4 && attempts < 100) {
                const shuffledNumbers = [...allInlineNumbers].sort(() => 0.5 - Math.random());
                const randomCombo = shuffledNumbers.slice(0, inlineCorrectNumbers.length).sort().join(", ");
                distractors.add(randomCombo);
                attempts++;
            }
            
            while(distractors.size < 4) {
                 distractors.add(correctCombo + " (" + distractors.size + ")");
            }
            
            const optionsArray = Array.from(distractors).sort(() => 0.5 - Math.random());
            const correctIdx = optionsArray.indexOf(correctCombo);
            
            tests.push({ question: question, options: optionsArray, answer: correctIdx, topic: "Tayyor Test Baza" });
            
        } else if (complexAnswerStr) {
            // Complex Test (Sequence or Matching): Generate 4 options
            const distractors = new Set();
            distractors.add(complexAnswerStr);
            let attempts = 0;
            
            while(distractors.size < 4 && attempts < 100) {
                let shuf = complexAnswerStr;
                
                if (complexAnswerStr.match(/\d+[а-яa-z]/i)) {
                    const letters = complexAnswerStr.match(/[а-яa-z]/gi) || [];
                    if (letters.length > 1) {
                        const shuffledLetters = [...letters].sort(() => 0.5 - Math.random());
                        let j = 0;
                        shuf = complexAnswerStr.replace(/[а-яa-z]/gi, () => shuffledLetters[j++]);
                    }
                } else {
                    const digits = complexAnswerStr.match(/\d/g) || [];
                    if (digits.length > 1) {
                        const shuffledDigits = [...digits].sort(() => 0.5 - Math.random());
                        let j = 0;
                        shuf = complexAnswerStr.replace(/\d/g, () => shuffledDigits[j++]);
                    }
                }
                
                if (shuf !== complexAnswerStr) distractors.add(shuf);
                attempts++;
            }
            
            while(distractors.size < 4) {
                distractors.add(complexAnswerStr + " (" + distractors.size + ")");
            }
            
            const optionsArray = Array.from(distractors).sort(() => 0.5 - Math.random());
            const correctIdx = optionsArray.indexOf(complexAnswerStr);
            
            tests.push({
                question: question,
                options: optionsArray,
                answer: correctIdx,
                topic: "Tayyor Test Baza"
            });
        } else if (options.length >= 2) {
            // Standard Test
            if (correctAnswerIndex === -1) correctAnswerIndex = 0;
            
            // Randomize options so correct answer is not always A
            const correctOptionText = options[correctAnswerIndex];
            const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
            const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);
            
            tests.push({
                question: question,
                options: shuffledOptions,
                answer: newCorrectIndex,
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
    
    // My Exams State
    const [myExams, setMyExams] = useState([]);
    const [isLoadingExams, setIsLoadingExams] = useState(true);
    const [selectedExam, setSelectedExam] = useState(null);

    const fetchMyExams = async () => {
        if (!user) return;
        setIsLoadingExams(true);
        try {
            const q = query(
                collection(db, 'exams'), 
                where("teacherId", "==", user.uid)
                // Note: without composite index, orderBy might fail, we will sort in memory
            );
            const snapshot = await getDocs(q);
            const examsData = [];
            snapshot.forEach(docSnap => {
                examsData.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Sort by createdAt descending
            examsData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA;
            });
            setMyExams(examsData);
        } catch (error) {
            console.error("Error fetching exams:", error);
        } finally {
            setIsLoadingExams(false);
        }
    };

    useEffect(() => {
        fetchMyExams();
    }, [user]);

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
                const text = await extractTextFromFile(file);
                testsArray = parseDocumentTests(text);
            } else {
                throw new Error("Faqat .json, .docx yoki .pdf fayllarni yuklashingiz mumkin.");
            }

            const totalTests = testsArray.length;
            if (totalTests === 0) throw new Error("Testlar ro'yxati bo'sh yoki format noto'g'ri!");

            const chunkSize = 500;
            const chunks = [];
            for (let i = 0; i < totalTests; i += chunkSize) {
                chunks.push(testsArray.slice(i, i + chunkSize));
            }

            setProgress({ current: 0, total: chunks.length });
            
            let successCount = 0;
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const title = chunks.length === 1 ? file.name : `${file.name} (Qism ${i + 1}/${chunks.length})`;
                
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
            fetchMyExams(); // Refresh list after upload
            
        } catch (err) {
            console.error("Bulk upload error:", err);
            setUploadResults([{ title: file.name, success: false, error: err.message }]);
        } finally {
            setIsUploading(false);
            e.target.value = ''; // reset file input
        }
    };

    const handleDeleteExam = async (examId, title) => {
        if (window.confirm(lang === 'ru' ? `Вы уверены, что хотите удалить "${title}"?` : `Haqiqatan ham "${title}" nomli bazani o'chirmoqchimisiz?`)) {
            try {
                await deleteDoc(doc(db, 'exams', examId));
                setMyExams(prev => prev.filter(e => e.id !== examId));
            } catch (err) {
                console.error("Error deleting exam:", err);
                alert("O'chirishda xatolik yuz berdi!");
            }
        }
    };

    const handleEditTitle = async (examId, currentTitle) => {
        const newTitle = window.prompt(lang === 'ru' ? 'Введите новое название:' : 'Yangi nomni kiriting:', currentTitle);
        if (newTitle && newTitle.trim() !== "" && newTitle !== currentTitle) {
            try {
                await updateDoc(doc(db, 'exams', examId), { title: newTitle.trim() });
                setMyExams(prev => prev.map(e => e.id === examId ? { ...e, title: newTitle.trim() } : e));
            } catch (err) {
                console.error("Error updating exam title:", err);
                alert("Yangilashda xatolik!");
            }
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

                {/* YUKLASH BO'LIMI */}
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

                {/* MENING TESTLARIM BO'LIMI */}
                <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl mb-8">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4">
                        <i className="fa-solid fa-folder-open text-blue-500 mr-2"></i> 
                        {lang === 'ru' ? 'Мои тесты' : 'Mening Testlarim'}
                    </h3>
                    
                    {isLoadingExams ? (
                        <div className="flex flex-col items-center py-10">
                            <i className="fa-solid fa-circle-notch fa-spin text-3xl text-slate-500 mb-3"></i>
                            <p className="text-slate-400 text-sm">Testlar yuklanmoqda...</p>
                        </div>
                    ) : myExams.length === 0 ? (
                        <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <i className="fa-regular fa-folder-open text-4xl text-slate-600 mb-3 block"></i>
                            <p className="text-slate-400 text-sm">Hali hech qanday test yuklanmagan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {myExams.map((exam) => (
                                <div key={exam.id} className="bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-white text-base">{exam.title}</h4>
                                            <button onClick={() => handleEditTitle(exam.id, exam.title)} className="text-slate-500 hover:text-blue-400 text-xs px-2" title="Nomini o'zgartirish">
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span><i className="fa-solid fa-calendar-alt mr-1"></i> {exam.createdAt ? new Date(exam.createdAt.toMillis()).toLocaleDateString() : 'Yangi'}</span>
                                            <span><i className="fa-solid fa-list-check mr-1"></i> {exam.data?.tests?.length || 0} ta savol</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setSelectedExam(exam)}
                                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold border border-blue-500/30 transition-all"
                                        >
                                            <i className="fa-solid fa-eye mr-1"></i> Ko'rish
                                        </button>
                                        <button 
                                            onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/test?id=${exam.id}`); alert("Havola nusxalandi!")}} 
                                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/30 transition-all"
                                        >
                                            <i className="fa-solid fa-link mr-1"></i> Link olish
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                                            className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold border border-rose-500/30 transition-all"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Test Preview Modal */}
            {selectedExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <h3 className="font-bold text-white text-lg truncate pr-4">{selectedExam.title}</h3>
                            <button onClick={() => setSelectedExam(null)} className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900">
                            {(!selectedExam.data?.tests || selectedExam.data.tests.length === 0) ? (
                                <p className="text-slate-400 text-center py-10">Bu bazada savollar topilmadi.</p>
                            ) : (
                                <div className="space-y-6">
                                    {selectedExam.data.tests.map((test, i) => (
                                        <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                                            <p className="text-white font-bold mb-3">{i + 1}. {test.question}</p>
                                            <div className="space-y-2">
                                                {test.options.map((opt, j) => (
                                                    <div key={j} className={`p-2 rounded-lg text-sm border ${j === test.answer ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
                                                        {String.fromCharCode(65 + j)}) {opt}
                                                        {j === test.answer && <i className="fa-solid fa-check float-right mt-0.5"></i>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TeacherTests;
