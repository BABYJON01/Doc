import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import LiveRoom from './LiveRoom';

const CreateLobby = ({ user, onLogout }) => {
    const { t, lang } = useApp();

    // ── States ────────────────────────────────────────────────
    const [step, setStep] = useState(1); // 1=upload, 2=preview/edit, 3=lobby
    const [wordFile, setWordFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parseError, setParseError] = useState('');

    // 20 ta test
    const [tests, setTests] = useState([]);

    // 2 ta vaziyatli
    const [cases, setCases] = useState([
        { scenario: '', question: '', options: ['', '', '', ''], answer: 0 },
        { scenario: '', question: '', options: ['', '', '', ''], answer: 0 },
    ]);

    // 2 ta rentgen
    const [xrays, setXrays] = useState([
        { image: null, question: '', options: ['', '', '', ''], answer: 0 },
        { image: null, question: '', options: ['', '', '', ''], answer: 0 },
    ]);

    const fileInputRef = useRef(null);

    // ── Word fayldan testlarni o'qish ─────────────────────────
    const handleWordUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setWordFile(file);
        setIsProcessing(true);
        setParseError('');

        try {
            const mammoth = await import('mammoth');
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;

            // Parse tests from text
            const parsed = parseTestsFromText(text);
            if (parsed.length === 0) {
                setParseError(
                    lang === 'uz' ? "Word fayldan test topilmadi. Iltimos, formatni tekshiring." :
                    lang === 'ru' ? "Тесты не найдены в файле Word. Проверьте формат." :
                    "No tests found in Word file. Please check the format."
                );
            } else {
                setTests(parsed.slice(0, 20));
                if (parsed.length < 20) {
                    setParseError(
                        lang === 'uz' ? `Faqat ${parsed.length} ta test topildi (20 ta kerak).` :
                        lang === 'ru' ? `Найдено только ${parsed.length} тестов (нужно 20).` :
                        `Only ${parsed.length} tests found (20 needed).`
                    );
                }
            }
        } catch (err) {
            console.error('Word parse error:', err);
            setParseError(
                lang === 'uz' ? "Word faylni o'qishda xatolik: " + err.message :
                lang === 'ru' ? "Ошибка чтения Word файла: " + err.message :
                "Error reading Word file: " + err.message
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Text parser: savollarni ajratish ─────────────────────
    const parseTestsFromText = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const questions = [];
        let current = null;

        for (const line of lines) {
            // Savol boshlanishi: "1." yoki "1)" yoki raqam
            const qMatch = line.match(/^(\d+)[.)]\s*(.+)/);
            // Variant: "A)" "B)" "a." "b." "*A)" (to'g'ri javob *)
            const optMatch = line.match(/^(\*?\s*[A-Da-d])[.)]\s*(.+)/);

            if (qMatch && !optMatch) {
                if (current && current.options.length >= 2) {
                    questions.push(current);
                }
                current = {
                    question: qMatch[2].trim(),
                    options: [],
                    answer: 0
                };
            } else if (optMatch && current) {
                const isCorrect = line.trim().startsWith('*');
                const optText = optMatch[2].trim();
                if (isCorrect) {
                    current.answer = current.options.length;
                }
                current.options.push(optText);
            } else if (current && current.options.length === 0) {
                // Savol davomi
                current.question += ' ' + line;
            }
        }
        if (current && current.options.length >= 2) {
            questions.push(current);
        }

        return questions;
    };

    // ── Rentgen rasm yuklash ──────────────────────────────────
    const handleXrayImageUpload = (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setXrays(prev => {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], image: reader.result };
                return copy;
            });
        };
        reader.readAsDataURL(file);
    };

    // ── Case o'zgartirish ────────────────────────────────────
    const updateCase = (idx, field, value) => {
        setCases(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };
    const updateCaseOption = (caseIdx, optIdx, value) => {
        setCases(prev => {
            const copy = [...prev];
            const opts = [...copy[caseIdx].options];
            opts[optIdx] = value;
            copy[caseIdx] = { ...copy[caseIdx], options: opts };
            return copy;
        });
    };

    // ── Xray o'zgartirish ────────────────────────────────────
    const updateXray = (idx, field, value) => {
        setXrays(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };
    const updateXrayOption = (xrayIdx, optIdx, value) => {
        setXrays(prev => {
            const copy = [...prev];
            const opts = [...copy[xrayIdx].options];
            opts[optIdx] = value;
            copy[xrayIdx] = { ...copy[xrayIdx], options: opts };
            return copy;
        });
    };

    // ── Lobbyni boshlash ─────────────────────────────────────
    const canLaunch = tests.length >= 1;

    const buildQuizData = () => {
        const allQuestions = [];

        // Testlar
        tests.forEach(t => {
            allQuestions.push({
                question: t.question,
                options: t.options,
                answer: t.answer,
                type: 'test'
            });
        });

        // Vaziyatli
        cases.forEach(c => {
            if (c.question.trim() && c.options.some(o => o.trim())) {
                allQuestions.push({
                    question: `📋 ${c.scenario}\n\n${c.question}`,
                    options: c.options.filter(o => o.trim()),
                    answer: c.answer,
                    type: 'case'
                });
            }
        });

        // Rentgen
        xrays.forEach(x => {
            if (x.question.trim() && x.options.some(o => o.trim())) {
                allQuestions.push({
                    question: x.question,
                    options: x.options.filter(o => o.trim()),
                    answer: x.answer,
                    type: 'xray',
                    image: x.image
                });
            }
        });

        return allQuestions;
    };

    // ── STEP 3: LiveRoom ─────────────────────────────────────
    if (step === 3) {
        return (
            <LiveRoom
                user={user}
                quizData={buildQuizData()}
                onExit={() => setStep(2)}
            />
        );
    }

    // ── Colors ───────────────────────────────────────────────
    const optColors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-500'];
    const optIcons = ['▲', '◆', '●', '■'];

    return (
        <DashboardLayout role="teacher" user={user} onLogout={onLogout}>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => window.location.href = '/teacher'}
                        className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <i className="fa-solid fa-gamepad text-white"></i>
                            </span>
                            {lang === 'uz' ? "Lobby Yaratish" : lang === 'ru' ? "Создать Лобби" : "Create Lobby"}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 ml-[52px]">
                            {lang === 'uz' ? "Kahoot uslubida jonli viktorina tashkil qiling" :
                             lang === 'ru' ? "Организуйте живую викторину в стиле Kahoot" :
                             "Organize a live quiz Kahoot-style"}
                        </p>
                    </div>
                </div>

                {/* Steps indicator */}
                <div className="flex items-center gap-2 mb-8">
                    {[
                        { num: 1, label: lang === 'uz' ? 'Word Yuklash' : lang === 'ru' ? 'Загрузка Word' : 'Upload Word', icon: 'fa-file-word' },
                        { num: 2, label: lang === 'uz' ? "Tekshirish va To'ldirish" : lang === 'ru' ? 'Проверка и заполнение' : 'Review & Fill', icon: 'fa-pen-to-square' },
                        { num: 3, label: lang === 'uz' ? 'Lobbyni Boshlash' : lang === 'ru' ? 'Запустить Лобби' : 'Launch Lobby', icon: 'fa-rocket' },
                    ].map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                    step >= s.num
                                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800/50 text-slate-600 border border-slate-700/50'
                                }`}
                            >
                                <i className={`fa-solid ${s.icon}`}></i>
                                <span className="hidden sm:inline">{s.label}</span>
                            </div>
                            {i < 2 && <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-emerald-500' : 'bg-slate-700'} rounded-full`}></div>}
                        </React.Fragment>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 1: Word fayl yuklash */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden ${
                                wordFile
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : 'border-slate-600 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-800/50'
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".docx"
                                className="hidden"
                                onChange={handleWordUpload}
                            />

                            {isProcessing ? (
                                <div className="relative z-10">
                                    <i className="fa-solid fa-circle-notch fa-spin text-5xl text-blue-500 mb-4 block"></i>
                                    <p className="text-white font-bold text-lg">
                                        {lang === 'uz' ? 'Word fayl tahlil qilinmoqda...' : lang === 'ru' ? 'Анализ Word файла...' : 'Analyzing Word file...'}
                                    </p>
                                </div>
                            ) : wordFile ? (
                                <div className="relative z-10">
                                    <i className="fa-solid fa-file-word text-5xl text-blue-500 mb-4 block"></i>
                                    <p className="text-white font-bold text-lg mb-1">{wordFile.name}</p>
                                    <p className="text-emerald-400 text-sm font-bold">
                                        <i className="fa-solid fa-check-circle mr-1"></i>
                                        {tests.length} {lang === 'uz' ? 'ta test topildi' : lang === 'ru' ? 'тестов найдено' : 'tests found'}
                                    </p>
                                    <p className="text-slate-500 text-xs mt-2">
                                        {lang === 'uz' ? "Boshqa fayl yuklash uchun bosing" : lang === 'ru' ? "Нажмите для загрузки другого файла" : "Click to upload another file"}
                                    </p>
                                </div>
                            ) : (
                                <div className="relative z-10">
                                    <div className="flex gap-4 justify-center mb-4">
                                        <i className="fa-regular fa-file-word text-5xl text-blue-500 group-hover:scale-110 transition-transform"></i>
                                    </div>
                                    <p className="text-white font-bold text-lg mb-2">
                                        {lang === 'uz' ? 'Word faylni yuklang' : lang === 'ru' ? 'Загрузите Word файл' : 'Upload Word file'}
                                    </p>
                                    <p className="text-slate-400 text-sm">
                                        {lang === 'uz' ? '20 ta testli .docx faylni bu yerga tashlang yoki bosing' :
                                         lang === 'ru' ? 'Перетащите или нажмите для загрузки .docx файла с 20 тестами' :
                                         'Drag & drop or click to upload .docx file with 20 tests'}
                                    </p>
                                    <div className="mt-6 p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-left max-w-md mx-auto">
                                        <p className="text-xs text-slate-400 font-bold mb-2">
                                            <i className="fa-solid fa-info-circle text-blue-400 mr-1"></i>
                                            {lang === 'uz' ? 'Word fayl formati:' : lang === 'ru' ? 'Формат Word файла:' : 'Word file format:'}
                                        </p>
                                        <pre className="text-[11px] text-slate-500 leading-relaxed">{`1. Savol matni?
A) Variant 1
*B) To'g'ri javob
C) Variant 3
D) Variant 4

2. Keyingi savol?
A) ...`}</pre>
                                        <p className="text-[10px] text-emerald-500 mt-2">* — to'g'ri javob belgisi</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {parseError && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-2">
                                <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
                                <span>{parseError}</span>
                            </div>
                        )}

                        {tests.length > 0 && (
                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-2xl transition-all shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5 hover:shadow-emerald-900/60 flex items-center justify-center gap-3"
                            >
                                <i className="fa-solid fa-arrow-right"></i>
                                {lang === 'uz' ? "Davom etish — Vaziyatli va Rentgen qo'shish" :
                                 lang === 'ru' ? "Продолжить — Добавить ситуации и рентгены" :
                                 "Continue — Add cases & x-rays"}
                            </button>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 2: Preview + Cases + X-rays */}
                {step === 2 && (
                    <div className="space-y-8">

                        {/* ── Testlar ko'rish ──────────────────── */}
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="bg-blue-600 text-xs px-3 py-1 rounded-full font-black">{tests.length}</span>
                                <i className="fa-solid fa-list-check text-blue-400"></i>
                                {lang === 'uz' ? 'Testlar' : lang === 'ru' ? 'Тесты' : 'Tests'}
                            </h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {tests.map((test, idx) => (
                                    <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-colors">
                                        <p className="text-white font-bold text-sm mb-2">
                                            <span className="text-blue-400 mr-2">{idx + 1}.</span>
                                            {test.question}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {test.options.map((opt, i) => (
                                                <div
                                                    key={i}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                                                        i === test.answer
                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                            : 'bg-slate-700/50 text-slate-400'
                                                    }`}
                                                >
                                                    <span className="font-black">{optIcons[i]}</span>
                                                    {opt}
                                                    {i === test.answer && <i className="fa-solid fa-check ml-auto text-emerald-400"></i>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── 2 ta Vaziyatli ──────────────────── */}
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-rose-500/20">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="bg-rose-600 text-xs px-3 py-1 rounded-full font-black">2</span>
                                <i className="fa-solid fa-stethoscope text-rose-400"></i>
                                {lang === 'uz' ? 'Vaziyatli Masalalar' : lang === 'ru' ? 'Ситуационные Задачи' : 'Case Studies'}
                            </h3>

                            <div className="space-y-6">
                                {cases.map((c, idx) => (
                                    <div key={idx} className="bg-slate-800/80 rounded-2xl p-5 border border-rose-500/10">
                                        <p className="text-rose-400 font-black text-sm mb-3">
                                            {lang === 'uz' ? `${idx + 1}-vaziyat` : lang === 'ru' ? `Ситуация ${idx + 1}` : `Case ${idx + 1}`}
                                        </p>
                                        <textarea
                                            value={c.scenario}
                                            onChange={e => updateCase(idx, 'scenario', e.target.value)}
                                            placeholder={lang === 'uz' ? "Vaziyat tavsifi..." : lang === 'ru' ? "Описание ситуации..." : "Case description..."}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none h-20 mb-3 transition-colors"
                                        />
                                        <input
                                            value={c.question}
                                            onChange={e => updateCase(idx, 'question', e.target.value)}
                                            placeholder={lang === 'uz' ? "Savol..." : lang === 'ru' ? "Вопрос..." : "Question..."}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500 mb-3 transition-colors"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            {c.options.map((opt, i) => (
                                                <div key={i} className="relative">
                                                    <input
                                                        value={opt}
                                                        onChange={e => updateCaseOption(idx, i, e.target.value)}
                                                        placeholder={`${String.fromCharCode(65 + i)}) Variant`}
                                                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 ${optColors[i]}`}
                                                    />
                                                    <button
                                                        onClick={() => updateCase(idx, 'answer', i)}
                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                            c.answer === i
                                                                ? 'bg-emerald-400 border-emerald-400 text-slate-900'
                                                                : 'border-white/30 text-transparent hover:border-white/60'
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-check text-[10px]"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── 2 ta Rentgen ─────────────────────── */}
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-violet-500/20">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="bg-violet-600 text-xs px-3 py-1 rounded-full font-black">2</span>
                                <i className="fa-solid fa-x-ray text-violet-400"></i>
                                {lang === 'uz' ? 'Rentgenogrammalar' : lang === 'ru' ? 'Рентгенограммы' : 'X-Rays'}
                            </h3>

                            <div className="space-y-6">
                                {xrays.map((x, idx) => (
                                    <div key={idx} className="bg-slate-800/80 rounded-2xl p-5 border border-violet-500/10">
                                        <p className="text-violet-400 font-black text-sm mb-3">
                                            {lang === 'uz' ? `${idx + 1}-rentgen` : lang === 'ru' ? `Рентген ${idx + 1}` : `X-Ray ${idx + 1}`}
                                        </p>

                                        {/* Rasm yuklash */}
                                        <div className="flex gap-4 mb-4">
                                            <label className="w-32 h-32 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-600 hover:border-violet-500 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group shrink-0 relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => handleXrayImageUpload(idx, e)}
                                                />
                                                {x.image ? (
                                                    <>
                                                        <img src={x.image} alt="xray" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <i className="fa-solid fa-camera text-white text-lg"></i>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-500 group-hover:text-violet-400 mb-1 transition-colors"></i>
                                                        <span className="text-[10px] text-slate-500 group-hover:text-violet-400 text-center px-2 transition-colors">
                                                            {lang === 'uz' ? 'Rasm yuklash' : lang === 'ru' ? 'Загрузить фото' : 'Upload image'}
                                                        </span>
                                                    </>
                                                )}
                                            </label>

                                            <div className="flex-1">
                                                <input
                                                    value={x.question}
                                                    onChange={e => updateXray(idx, 'question', e.target.value)}
                                                    placeholder={lang === 'uz' ? "Rentgen savoli..." : lang === 'ru' ? "Вопрос по рентгену..." : "X-ray question..."}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 mb-3 transition-colors"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    {x.options.map((opt, i) => (
                                                        <div key={i} className="relative">
                                                            <input
                                                                value={opt}
                                                                onChange={e => updateXrayOption(idx, i, e.target.value)}
                                                                placeholder={`${String.fromCharCode(65 + i)}) Variant`}
                                                                className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/30 ${optColors[i]}`}
                                                            />
                                                            <button
                                                                onClick={() => updateXray(idx, 'answer', i)}
                                                                className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                                    x.answer === i
                                                                        ? 'bg-emerald-400 border-emerald-400 text-slate-900'
                                                                        : 'border-white/30 text-transparent hover:border-white/60'
                                                                }`}
                                                            >
                                                                <i className="fa-solid fa-check text-[8px]"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Actions ──────────────────────────── */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-colors"
                            >
                                <i className="fa-solid fa-arrow-left mr-2"></i>
                                {lang === 'uz' ? 'Orqaga' : lang === 'ru' ? 'Назад' : 'Back'}
                            </button>

                            <button
                                onClick={() => setStep(3)}
                                disabled={!canLaunch}
                                className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-black text-lg rounded-2xl transition-all shadow-lg shadow-emerald-900/40 hover:-translate-y-0.5 hover:shadow-emerald-900/60 flex items-center justify-center gap-3 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-rocket"></i>
                                {lang === 'uz' ? `Lobbyni Boshlash (${buildQuizData().length} savol)` :
                                 lang === 'ru' ? `Запустить Лобби (${buildQuizData().length} вопросов)` :
                                 `Launch Lobby (${buildQuizData().length} questions)`}
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default CreateLobby;
