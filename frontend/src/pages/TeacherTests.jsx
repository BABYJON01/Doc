import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { extractTextFromFile } from '../services/aiService';

const parseDocumentTests = (text) => {
    const tests = [];
    
    // 1. Aggressively break options stuck together (PDF-to-Word artifacts like "deficiency:A. Hyper" or "flexionB. Knee")
    // Looks for: (lowercase/number/punctuation) + (optional space) + (A-E or 1-9 marker) + (optional space) + (Uppercase or Number)
    let processedText = text.replace(/([a-zа-я0-9\?\!\%\:\;\,\.\>\]\)])\s*([A-Ea-eА-Еа-еСс]\s*[\.\)]\s*[A-ZА-Я0-9])/g, '$1\n$2');
    processedText = processedText.replace(/([a-zа-я0-9\?\!\%\:\;\,\.\>\]\)])\s*([1-9]\s*[\.\)]\s*[A-ZА-Я0-9])/g, '$1\n$2');
    
    // 2. Also keep the whitespace-based breaker for options separated by tabs or 2+ spaces
    processedText = processedText.replace(/(?:\t|\s{2,})([a-zA-Zа-яА-Я\d]\s*[\.\)\-\:\/\]]\s)/g, '\n$1');
    
    const lines = processedText.split('\n').map(l => l.trim());
    
    let ct = { question: "", options: [], correctAnswerIndex: -1, complexAnswerStr: null, inlineCorrectNumbers: [], allInlineNumbers: [] };
    let pushed = false;
    let lastQuestionNumber = 0;
    
    const flushTest = () => {
        if (ct.options.length < 2 && ct.allInlineNumbers.length < 2 && !ct.complexAnswerStr) {
            // Reconstruct all text in case one option was accidentally matched
            let allText = ct.question;
            for (let opt of ct.options) allText += "\n" + opt;
            
            const qLines = allText.split('\n');
            if (qLines.length > 1) {
                const hasStar = qLines.some(l => l.trim().endsWith('*') || l.trim().startsWith('*'));
                if (hasStar) {
                    ct.question = qLines[0];
                    ct.options = [];
                    ct.correctAnswerIndex = -1;
                    
                    let correctIndices = [];
                    for (let k = 1; k < qLines.length; k++) {
                        let optText = qLines[k].trim();
                        if (!optText) continue;
                        
                        // Clean accidental markers if they exist
                        optText = optText.replace(/^([A-Ea-eА-Еа-еСс]|\d+)\s*[\.\)\-\:\/\]]\s*/, '');
                        
                        let isCorrect = false;
                        if (optText.endsWith('*')) {
                            isCorrect = true;
                            optText = optText.slice(0, -1).trim();
                        } else if (optText.startsWith('*')) {
                            isCorrect = true;
                            optText = optText.slice(1).trim();
                        }
                        
                        ct.options.push(optText);
                        if (isCorrect) {
                            correctIndices.push(ct.options.length - 1);
                            ct.correctAnswerIndex = ct.options.length - 1;
                        }
                    }
                    
                    if (correctIndices.length > 1) {
                        ct.question += '\n\n' + ct.options.map((opt, idx) => `${idx + 1}) ${opt}`).join('\n');
                        ct.allInlineNumbers = [];
                        ct.inlineCorrectNumbers = [];
                        for (let idx = 0; idx < ct.options.length; idx++) {
                            ct.allInlineNumbers.push((idx + 1).toString());
                        }
                        for (let idx of correctIndices) {
                            ct.inlineCorrectNumbers.push((idx + 1).toString());
                        }
                        ct.options = [];
                    }
                }
            }
        }
        
        if (ct.inlineCorrectNumbers.length > 0) {
            const uniqueCorrectNumbers = [...new Set(ct.inlineCorrectNumbers)].sort((a,b) => parseInt(a)-parseInt(b));
            const correctCombo = uniqueCorrectNumbers.join(", ");
            const distractors = new Set();
            distractors.add(correctCombo);
            let attempts = 0;
            while(distractors.size < 4 && attempts < 100) {
                const shuffledNumbers = [...new Set(ct.allInlineNumbers)].sort(() => 0.5 - Math.random());
                const randomCombo = shuffledNumbers.slice(0, uniqueCorrectNumbers.length).sort((a,b) => parseInt(a)-parseInt(b)).join(", ");
                distractors.add(randomCombo);
                attempts++;
            }
            while(distractors.size < 4) { distractors.add(correctCombo + " (" + distractors.size + ")"); }
            const optionsArray = Array.from(distractors).sort(() => 0.5 - Math.random());
            tests.push({ question: ct.question, options: optionsArray, answer: optionsArray.indexOf(correctCombo), topic: "Tayyor Test Baza" });
            pushed = true;
        } else if (ct.complexAnswerStr) {
            const distractors = new Set();
            distractors.add(ct.complexAnswerStr);
            let attempts = 0;
            while(distractors.size < 4 && attempts < 100) {
                let shuf = ct.complexAnswerStr;
                if (ct.complexAnswerStr.match(/\d+[а-яa-z]/i)) {
                    const letters = ct.complexAnswerStr.match(/[а-яa-z]/gi) || [];
                    if (letters.length > 1) {
                        const shuffledLetters = [...letters].sort(() => 0.5 - Math.random());
                        let j = 0;
                        shuf = ct.complexAnswerStr.replace(/[а-яa-z]/gi, () => shuffledLetters[j++]);
                    }
                } else {
                    const digits = ct.complexAnswerStr.match(/\d/g) || [];
                    if (digits.length > 1) {
                        const shuffledDigits = [...digits].sort(() => 0.5 - Math.random());
                        let j = 0;
                        shuf = ct.complexAnswerStr.replace(/\d/g, () => shuffledDigits[j++]);
                    }
                }
                if (shuf !== ct.complexAnswerStr) distractors.add(shuf);
                attempts++;
            }
            while(distractors.size < 4) { distractors.add(ct.complexAnswerStr + " (" + distractors.size + ")"); }
            const optionsArray = Array.from(distractors).sort(() => 0.5 - Math.random());
            tests.push({ question: ct.question, options: optionsArray, answer: optionsArray.indexOf(ct.complexAnswerStr), topic: "Tayyor Test Baza" });
            pushed = true;
        } else if (ct.options.length >= 2) {
            if (ct.correctAnswerIndex === -1) ct.correctAnswerIndex = 0;
            const correctOptionText = ct.options[ct.correctAnswerIndex];
            const shuffledOptions = [...ct.options].sort(() => 0.5 - Math.random());
            tests.push({ question: ct.question, options: shuffledOptions, answer: shuffledOptions.indexOf(correctOptionText), topic: "Tayyor Test Baza" });
            pushed = true;
        }
        
        if (pushed) {
            ct = { question: "", options: [], correctAnswerIndex: -1, complexAnswerStr: null, inlineCorrectNumbers: [], allInlineNumbers: [] };
            pushed = false;
        }
    };
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        if (line === "") {
            // Empty line means paragraph break. Safe flush if a test is fully read.
            if (ct.options.length >= 2 || ct.allInlineNumbers.length >= 2) {
                flushTest();
            }
            continue;
        }
        
        const ansLineMatch = line.match(/^(?:javob|otvet|answer|жавоб|тўғри жавоб)[^\wа-я]*(.*)$/i);
        if (ansLineMatch) {
            let ansContent = ansLineMatch[1].trim().replace(/[\.;]+$/, '').trim();
            if (ansContent.length === 1 && ansContent.match(/^[A-Ea-eА-Еа-еСс]$/)) {
                let idx = -1;
                const c = ansContent.toLowerCase();
                if (c === 'a' || c === 'а') idx = 0;
                else if (c === 'b' || c === 'б' || c === 'в') idx = 1; // Cyrillic В looks like B
                else if (c === 'c' || c === 'с') idx = 2; // Cyrillic С looks like C
                else if (c === 'd' || c === 'д') idx = 3;
                else if (c === 'e' || c === 'е') idx = 4;
                
                if (idx !== -1) ct.correctAnswerIndex = idx;
            } else if (ansContent.match(/^[\d\s,;]+$/) && (ansContent.includes(',') || ansContent.includes(';'))) {
                const numbers = ansContent.match(/\d+/g);
                if (numbers) ct.inlineCorrectNumbers.push(...numbers);
            } else {
                ct.complexAnswerStr = ansContent;
            }
            flushTest(); // Javob line always terminates a test
            continue;
        }
        
        const optMatch = line.match(/^([\+\*]?)\s*(?:[a-zA-Zа-яА-Я])\s*[\.\)\-\:\/\]]\s*(.*)$/);
        const pmOptMatch = line.match(/^([\+\-])\s*(.*)$/);
        const numOptMatch = line.match(/^([\+\*]?)\s*(\d+)\s*[\.\)\-\:\/\]]\s*(.*)$/);
        
        let isOption = !!(optMatch || pmOptMatch || numOptMatch);

        let isNewQuestion = false;
        const isQuestionMarker = line.match(/^\s*(?:\d+\s*[\.\)\-\:\/\]]|#)\s*/);
        
        if (isQuestionMarker) {
            if (ct.options.length > 0) {
                isNewQuestion = true;
            } else if (ct.allInlineNumbers.length > 0) {
                if (line.match(/^\s*#\s*/)) {
                    isNewQuestion = true;
                } else {
                    const numMatch = line.match(/^\s*(\d+)\s*[\.\)\-\:\/\]]/);
                    if (numMatch) {
                        const num = parseInt(numMatch[1]);
                        const expectedNextOption = parseInt(ct.allInlineNumbers[ct.allInlineNumbers.length - 1]) + 1;
                        if (num !== expectedNextOption) {
                            isNewQuestion = true;
                        } else {
                            let isNextLineOption1 = false;
                            for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                                if (lines[j].trim() === "") continue;
                                if (lines[j].match(/^([\+\*]?)\s*1\s*[\.\)\-\:\/\]]\s*/)) {
                                    isNextLineOption1 = true;
                                }
                                break;
                            }
                            if (isNextLineOption1) {
                                isNewQuestion = true;
                            }
                        }
                    }
                }
            } else {
                const currentQNumMatch = line.match(/^\s*(\d+)\s*[\.\)\-\:\/\]]/);
                if (currentQNumMatch) {
                    const currentNum = parseInt(currentQNumMatch[1]);
                    // If the line starts with a number > 1, it's a new question.
                    // (Numbered options inside a question always start at 1).
                    if (currentNum > 1) {
                        isNewQuestion = true;
                    }
                }
            }
        } else if (ct.options.length >= 2 || ct.allInlineNumbers.length >= 2) {
            if (isOption) {
                // It IS an option. But is it a RESTART of the option sequence? (e.g. A) or 1) )
                if (optMatch) {
                    const letterMatch = line.match(/^[^\wа-яА-Я]*([a-zA-Zа-яА-Я])/);
                    if (letterMatch) {
                        const letterStr = letterMatch[1].toUpperCase();
                        if (letterStr === 'A' || letterStr === 'А') isNewQuestion = true;
                    }
                } else if (numOptMatch) {
                    const numMatchStart = line.match(/^[^\d]*(\d+)/);
                    if (numMatchStart) {
                        const num = parseInt(numMatchStart[1]);
                        if (num === 1) isNewQuestion = true;
                    }
                }
            }
        }
        
        if (isNewQuestion) {
            flushTest();
        }
        
        if (ct.question === "" && ct.options.length === 0 && ct.allInlineNumbers.length === 0 && !isOption) {
             const qNumMatch = line.match(/^\s*(\d+)\s*[\.\)\-\:\/\]]/);
             if (qNumMatch) {
                 lastQuestionNumber = parseInt(qNumMatch[1]);
             }
             ct.question = line.replace(/^\s*(?:\d+[\.\)]|#)\s*/, '');
             continue;
        }
        
        if (optMatch) {
            const isCorrect = optMatch[1] === '+' || optMatch[1] === '*';
            ct.options.push(optMatch[2]);
            if (isCorrect) ct.correctAnswerIndex = ct.options.length - 1;
        } else if (pmOptMatch) {
            const isCorrect = pmOptMatch[1] === '+';
            ct.options.push(pmOptMatch[2]);
            if (isCorrect) ct.correctAnswerIndex = ct.options.length - 1;
        } else if (numOptMatch) {
            ct.question += "\n" + line.replace(/[\+\*]/g, '').trim();
            const optNum = numOptMatch[2];
            ct.allInlineNumbers.push(optNum);
            if (numOptMatch[1] === '*' || numOptMatch[1] === '+' || line.includes('*') || (line.includes('+') && !line.includes(',+'))) {
                ct.inlineCorrectNumbers.push(optNum);
            }
        } else {
            if (ct.options.length === 0 && ct.allInlineNumbers.length === 0) {
                ct.question += "\n" + line;
            } else if (ct.options.length > 0) {
                ct.options[ct.options.length - 1] += "\n" + line;
            } else {
                ct.question += "\n" + line;
            }
        }
    }
    
    flushTest();
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
    const [showResultsExam, setShowResultsExam] = useState(null);
    const [examResultsData, setExamResultsData] = useState([]);
    const [isLoadingResults, setIsLoadingResults] = useState(false);

    const handleViewResults = async (exam) => {
        setShowResultsExam(exam);
        setIsLoadingResults(true);
        try {
            const leaderboardRef = collection(db, "exams", exam.id, "leaderboard");
            const q = query(leaderboardRef, orderBy("score", "desc"));
            const snap = await getDocs(q);
            const results = [];
            snap.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            setExamResultsData(results);
        } catch (error) {
            console.error("Error fetching results:", error);
        } finally {
            setIsLoadingResults(false);
        }
    };

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

    const [debugText, setDebugText] = useState(null);

    const handleBulkTestUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadResults([]);
        setDebugText(null);
        
        try {
            let testsArray = [];
            const fileNameLower = file.name.toLowerCase();

            if (fileNameLower.endsWith(".docx") || fileNameLower.endsWith(".pdf") || fileNameLower.endsWith(".pptx")) {
                const text = await extractTextFromFile(file);
                setDebugText(text); // Save raw text for debugging
                testsArray = parseDocumentTests(text);
            } else {
                throw new Error("Faqat .docx, .pdf yoki .pptx fayllarni yuklashingiz mumkin.");
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
                    status: 'hidden'
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

    const handleDownloadDebug = () => {
        if (!debugText) return;
        const blob = new Blob([debugText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "mammoth_extracted_debug.txt";
        a.click();
    };

    const handleDeleteExam = async (examId, title) => {
        if (window.confirm({ ru: `Вы уверены, что хотите удалить "${title}"?`, uz: `Haqiqatan ham "${title}" nomli bazani o'chirmoqchimisiz?`, en: `Are you sure you want to delete "${title}"?` }[lang] || `Haqiqatan ham "${title}" nomli bazani o'chirmoqchimisiz?`)) {
            try {
                await deleteDoc(doc(db, 'exams', examId));
                setMyExams(prev => prev.filter(e => e.id !== examId));
            } catch (err) {
                console.error("Error deleting exam:", err);
                alert({ ru: 'Ошибка при удалении!', uz: 'O\'chirishda xatolik yuz berdi!', en: 'Error deleting!' }[lang] || "O'chirishda xatolik yuz berdi!");
            }
        }
    };

    const handleEditTitle = async (examId, currentTitle) => {
        const newTitle = window.prompt({ ru: 'Введите новое название:', uz: 'Yangi nomni kiriting:', en: 'Enter new title:' }[lang] || 'Yangi nomni kiriting:', currentTitle);
        if (newTitle && newTitle.trim() !== "" && newTitle !== currentTitle) {
            try {
                await updateDoc(doc(db, 'exams', examId), { title: newTitle.trim() });
                setMyExams(prev => prev.map(e => e.id === examId ? { ...e, title: newTitle.trim() } : e));
            } catch (err) {
                console.error("Error updating exam title:", err);
                alert({ ru: 'Ошибка при обновлении!', uz: 'Yangilashda xatolik!', en: 'Error updating!' }[lang] || "Yangilashda xatolik!");
            }
        }
    };

    const handleToggleStatus = async (examId, currentStatus, examTitle) => {
        const newStatus = currentStatus === 'published' ? 'hidden' : 'published';
        try {
            await updateDoc(doc(db, 'exams', examId), { status: newStatus });
            setMyExams(prev => prev.map(e => e.id === examId ? { ...e, status: newStatus } : e));
            
            if (newStatus === 'published') {
                await addDoc(collection(db, 'notifications'), {
                    title: { ru: "Новый тест открыт!", uz: "Yangi test ochildi!", en: "New test opened!" }[lang] || "Yangi test ochildi!",
                    desc: { ru: `Тест "${examTitle}" теперь доступен для студентов.`, uz: `O'qituvchi "${examTitle}" testiga ruxsat berdi.`, en: `Test "${examTitle}" is now available for students.` }[lang] || `O'qituvchi "${examTitle}" testiga ruxsat berdi.`,
                    type: 'upload',
                    targetRole: 'student',
                    createdAt: serverTimestamp()
                });
            }
        } catch (err) {
            console.error("Error updating exam status:", err);
            alert({ ru: 'Ошибка при изменении статуса!', uz: 'Holatni o\'zgartirishda xatolik yuz berdi!', en: 'Error changing status!' }[lang] || "Holatni o'zgartirishda xatolik yuz berdi!");
        }
    };

    const handleSetLimit = async (examId, currentLimit, totalTests) => {
        const input = window.prompt({ ru: `Введите количество вопросов для теста (Макс: ${totalTests}):`, uz: `Talabalarga beriladigan savollar sonini kiriting (Maksimal: ${totalTests}):`, en: `Enter the number of questions for the test (Max: ${totalTests}):` }[lang] || `Talabalarga beriladigan savollar sonini kiriting (Maksimal: ${totalTests}):`, currentLimit || totalTests);
        if (input !== null) {
            const limit = parseInt(input);
            if (!isNaN(limit) && limit > 0) {
                try {
                    await updateDoc(doc(db, 'exams', examId), { limit: limit });
                    setMyExams(prev => prev.map(e => e.id === examId ? { ...e, limit: limit } : e));
                } catch (err) {
                    console.error("Error updating limit:", err);
                    alert({ ru: 'Ошибка при установке лимита!', uz: 'Cheklovni o\'rnatishda xatolik!', en: 'Error setting limit!' }[lang] || "Cheklovni o'rnatishda xatolik!");
                }
            } else {
                alert({ ru: "Пожалуйста, введите правильное число!", uz: "Iltimos, to'g'ri son kiriting!", en: "Please enter a valid number!" }[lang] || "Iltimos, to'g'ri son kiriting!");
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
                        <h2 className="text-2xl font-black text-white">{ { ru: 'База тестов', uz: 'Testlar bazasi', en: 'Tests Database' }[lang] || 'Testlar bazasi' }</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        { { ru: 'Управляйте тестами и загружайте массово (Word, PDF, PPTX).', uz: 'Testlarni boshqarish va ommaviy yuklash (Word, PDF, PPTX formatida).', en: 'Manage tests and upload in bulk (Word, PDF, PPTX).' }[lang] || 'Testlarni boshqarish va ommaviy yuklash (Word, PDF, PPTX formatida).' }
                    </p>
                </div>
            </div>

            {/* YUKLASH BO'LIMI */}
            <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl mb-8">
                <h3 className="text-lg font-bold text-white mb-2">{ { ru: 'Массовая загрузка (до 3000 тестов)', uz: 'Ommaviy yuklash (3000 tagacha test)', en: 'Bulk upload (up to 3000 tests)' }[lang] || 'Ommaviy yuklash (3000 tagacha test)' }</h3>
                <p className="text-slate-400 text-sm mb-6">
                    { { ru: 'Выберите Word (.docx), PDF или PPTX файл с вопросами. Система автоматически разобьет их на части (по 500 тестов) для безопасности загрузки.', uz: 'Testlar bilan to\'la Word (.docx), PDF yoki PPTX faylini tanlang. Tizim avtomatik ravishda testlarni o\'qib, 500 tadan bo\'lib bazaga yuklaydi.', en: 'Select a Word (.docx), PDF or PPTX file full of questions. The system will automatically split them into parts (500 tests each) for safe upload.' }[lang] || 'Testlar bilan to\'la Word (.docx), PDF yoki PPTX faylini tanlang. Tizim avtomatik ravishda testlarni o\'qib, 500 tadan bo\'lib bazaga yuklaydi.' }
                </p>

                    <label className={`w-full py-10 flex flex-col items-center justify-center gap-3 font-bold text-sm rounded-2xl transition-all cursor-pointer border-2 border-dashed ${isUploading ? 'border-slate-600 bg-slate-800/50 cursor-not-allowed' : 'border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-500/5'}`}>
                        {isUploading ? (
                            <>
                                <i className="fa-solid fa-circle-notch fa-spin text-4xl text-emerald-500 mb-2"></i>
                                <span className="text-emerald-400">{ { ru: 'Загрузка...', uz: 'Yuklanmoqda...', en: 'Uploading...' }[lang] || 'Yuklanmoqda...' } {progress.current} / {progress.total}</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-cloud-arrow-up text-4xl text-emerald-500 mb-2"></i>
                                <span className="text-emerald-400 text-lg">{ { ru: 'Выберите файл Word, PDF или PPTX', uz: 'Word, PDF yoki PPTX faylini tanlang', en: 'Select Word, PDF or PPTX file' }[lang] || 'Word, PDF yoki PPTX faylini tanlang' }</span>
                                <span className="text-slate-500 text-xs mt-1">{ { ru: 'готовые тесты в формате .docx, .pdf или .pptx', uz: '.docx, .pdf yoki .pptx formatidagi tayyor testlar', en: 'ready-made tests in .docx, .pdf or .pptx format' }[lang] || '.docx, .pdf yoki .pptx formatidagi tayyor testlar' }</span>
                            </>
                        )}
                        <input 
                            type="file" 
                            accept=".docx,.pdf,.pptx" 
                            className="hidden" 
                            disabled={isUploading} 
                            onChange={handleBulkTestUpload} 
                        />
                    </label>

                    {uploadResults.length > 0 && (
                        <div className="mt-8 space-y-3">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">{ { ru: 'Результаты загрузки:', uz: 'Yuklash natijalari:', en: 'Upload results:' }[lang] || 'Yuklash natijalari:' }</h4>
                            {uploadResults.map((res, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${res.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                    <div>
                                        <p className={`font-bold text-sm ${res.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {res.success ? <><i className="fa-solid fa-check-circle mr-2"></i> {res.title}</> : <><i className="fa-solid fa-triangle-exclamation mr-2"></i> { { ru: 'Ошибка', uz: 'Xatolik', en: 'Error' }[lang] || 'Xatolik' }</>}
                                        </p>
                                        {res.success ? (
                                            <p className="text-xs text-slate-400 mt-1">{res.testsCount} { { ru: 'тестов размещено', uz: 'ta test joylandi', en: 'tests placed' }[lang] || 'ta test joylandi' }</p>
                                        ) : (
                                            <p className="text-xs text-rose-300 mt-1">{res.error}</p>
                                        )}
                                    </div>
                                    {res.success && (
                                        <button onClick={() => {navigator.clipboard.writeText(res.link); alert({ ru: 'Ссылка скопирована!', uz: 'Havola nusxalandi!', en: 'Link copied!' }[lang] || "Havola nusxalandi!")}} className="text-emerald-400 hover:text-white hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 transition-all">
                                            { { ru: 'Копировать', uz: 'Nusxa olish', en: 'Copy' }[lang] || 'Nusxa olish' }
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            {debugText && (
                                <button 
                                    onClick={handleDownloadDebug}
                                    className="w-full mt-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl py-3 px-4 font-semibold transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-bug"></i>
                                    { { ru: 'Скачать LOG файл для анализа ошибок (Debug)', uz: 'Xatoliklarni tahlil qilish uchun LOG faylni yuklab olish (Debug)', en: 'Download LOG file for error analysis (Debug)' }[lang] || 'Xatoliklarni tahlil qilish uchun LOG faylni yuklab olish (Debug)' }
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* MENING TESTLARIM BO'LIMI */}
                <div className="bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl mb-8">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4">
                        <i className="fa-solid fa-folder-open text-blue-500 mr-2"></i> 
                        { { ru: 'Мои тесты', uz: 'Mening Testlarim', en: 'My Tests' }[lang] || 'Mening Testlarim' }
                    </h3>
                    
                    {isLoadingExams ? (
                        <div className="flex flex-col items-center py-10">
                            <i className="fa-solid fa-circle-notch fa-spin text-3xl text-slate-500 mb-3"></i>
                            <p className="text-slate-400 text-sm">{ { ru: 'Загрузка тестов...', uz: 'Testlar yuklanmoqda...', en: 'Loading tests...' }[lang] || 'Testlar yuklanmoqda...' }</p>
                        </div>
                    ) : myExams.length === 0 ? (
                        <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <i className="fa-regular fa-folder-open text-4xl text-slate-600 mb-3 block"></i>
                            <p className="text-slate-400 text-sm">{ { ru: 'Тесты еще не загружены.', uz: 'Hali hech qanday test yuklanmagan.', en: 'No tests uploaded yet.' }[lang] || 'Hali hech qanday test yuklanmagan.' }</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {myExams.map((exam) => (
                                <div key={exam.id} className="bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-white text-base">{exam.title}</h4>
                                            <button onClick={() => handleEditTitle(exam.id, exam.title)} className="text-slate-500 hover:text-blue-400 text-xs px-2" title={ { ru: 'Изменить имя', uz: 'Nomini o\'zgartirish', en: 'Change name' }[lang] || 'Nomini o\'zgartirish' }>
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-400">
                                            <span><i className="fa-solid fa-calendar-alt mr-1"></i> {exam.createdAt ? new Date(exam.createdAt.toMillis()).toLocaleDateString() : ({ ru: 'Новый', uz: 'Yangi', en: 'New' }[lang] || 'Yangi')}</span>
                                            <span><i className="fa-solid fa-list-check mr-1"></i> {exam.data?.tests?.length || 0} { { ru: 'вопросов', uz: 'ta savol', en: 'questions' }[lang] || 'ta savol' }</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                                        <button 
                                            onClick={() => handleToggleStatus(exam.id, exam.status || 'hidden', exam.title)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                exam.status === 'published' 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white' 
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-white'
                                            }`}
                                            title={ { ru: 'Включить/выключить видимость', uz: 'Talabalarga ko\'rinishini yoqish/o\'chirish (Dopusk)', en: 'Toggle visibility for students' }[lang] || 'Talabalarga ko\'rinishini yoqish/o\'chirish (Dopusk)' }
                                        >
                                            <i className={`fa-solid ${exam.status === 'published' ? 'fa-eye' : 'fa-eye-slash'} mr-1`}></i> 
                                            {exam.status === 'published' ? ({ ru: 'Открыт', uz: 'Ochiq', en: 'Open' }[lang] || 'Ochiq') : ({ ru: 'Закрыт', uz: 'Yopiq', en: 'Closed' }[lang] || 'Yopiq')}
                                        </button>
                                        <button 
                                            onClick={() => handleSetLimit(exam.id, exam.limit, exam.data?.tests?.length || 0)}
                                            className="px-3 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg text-xs font-bold border border-purple-500/30 transition-all"
                                            title={ { ru: 'Установить количество вопросов', uz: 'Talabaga tushadigan savollar sonini belgilash', en: 'Set number of questions for students' }[lang] || 'Talabaga tushadigan savollar sonini belgilash' }
                                        >
                                            <i className="fa-solid fa-filter mr-1"></i> {exam.limit ? `Limit: ${exam.limit}` : ({ ru: 'Лимит', uz: 'Cheklov', en: 'Limit' }[lang] || 'Cheklov')}
                                        </button>
                                        <button 
                                            onClick={() => setSelectedExam(exam)}
                                            className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold border border-blue-500/30 transition-all"
                                        >
                                            <i className="fa-solid fa-eye mr-1"></i> { { ru: 'Посмотреть', uz: 'Ko\'rish', en: 'View' }[lang] || 'Ko\'rish' }
                                        </button>
                                        <button 
                                            onClick={() => handleViewResults(exam)}
                                            className="px-3 py-1.5 bg-violet-500/10 text-violet-400 hover:bg-violet-500 hover:text-white rounded-lg text-xs font-bold border border-violet-500/30 transition-all"
                                            title={ { ru: 'Посмотреть результаты студентов', uz: 'Talabalar natijalarini ko\'rish', en: 'View student results' }[lang] || 'Talabalar natijalarini ko\'rish' }
                                        >
                                            <i className="fa-solid fa-chart-simple mr-1"></i> { { ru: 'Результаты', uz: 'Natijalar', en: 'Results' }[lang] || 'Natijalar' }
                                        </button>
                                        <button 
                                            onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/test?id=${exam.id}`); alert({ ru: 'Ссылка скопирована!', uz: 'Havola nusxalandi!', en: 'Link copied!' }[lang] || "Havola nusxalandi!")}} 
                                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/30 transition-all"
                                        >
                                            <i className="fa-solid fa-link mr-1"></i> { { ru: 'Получить ссылку', uz: 'Link olish', en: 'Get link' }[lang] || 'Link olish' }
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
                                <p className="text-slate-400 text-center py-10">{ { ru: 'Вопросы не найдены в этой базе.', uz: 'Bu bazada savollar topilmadi.', en: 'No questions found in this base.' }[lang] || 'Bu bazada savollar topilmadi.' }</p>
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

            {/* Exam Results Modal */}
            {showResultsExam && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <h3 className="font-bold text-white text-lg pr-4">{ { ru: 'Результаты Теста', uz: 'Test Natijalari', en: 'Test Results' }[lang] || 'Test Natijalari' }</h3>
                                <p className="text-xs text-slate-400 mt-1">{showResultsExam.title}</p>
                            </div>
                            <button onClick={() => setShowResultsExam(null)} className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-900">
                            {isLoadingResults ? (
                                <div className="flex justify-center items-center py-10">
                                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-slate-500"></i>
                                </div>
                            ) : examResultsData.length === 0 ? (
                                <p className="text-slate-400 text-center py-10">
                                    <i className="fa-solid fa-ghost text-4xl mb-4 block opacity-50"></i>
                                    { { ru: 'Пока ни один студент не решил этот тест.', uz: 'Hozircha hech qanday talaba bu testni yechmagan.', en: 'No student has solved this test yet.' }[lang] || 'Hozircha hech qanday talaba bu testni yechmagan.' }
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {examResultsData.map((res, i) => (
                                        <div key={i} className="flex justify-between items-center p-4 bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/40">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-base">{res.displayName || 'Noma\'lum Talaba'}</div>
                                                    <div className="text-xs text-slate-400">{res.email || ''} • {res.updatedAt ? new Date(res.updatedAt.toDate()).toLocaleString('en-GB') : ''}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-emerald-400">{res.score || 0} <span className="text-sm text-slate-500">/ {res.total || 0}</span></div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{res.percent || 0}% { { ru: 'Усвоение', uz: 'O\'zlashtirish', en: 'Mastery' }[lang] || 'O\'zlashtirish' }</div>
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
