import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import LiveRoom from './LiveRoom';
import { generateMedicalContent } from '../services/aiService';

// 8 ta mavzu — uchala tilda
const TOPICS = {
    uz: [
        { id: 1, title: "Tayanch-harakat apparati sinishlari", desc: "Transport immobilizatsiya, Gips texnikasi", icon: "🦴", color: "from-blue-600 to-indigo-700" },
        { id: 2, title: "Ko'krak qafasi va yelka kamari", desc: "Yelka suyagi chiqishlari, jarohatlari", icon: "🫁", color: "from-sky-600 to-blue-700" },
        { id: 3, title: "Chanoq va umurtqa po'g'onasi", desc: "Shkolnikov anesteziyasi, shikastlanishlar", icon: "🦷", color: "from-violet-600 to-purple-700" },
        { id: 4, title: "Politravma va shok", desc: "Reanimatsion yordam, klinik tamoyillar", icon: "🚑", color: "from-rose-600 to-red-700" },
        { id: 5, title: "Suyak va bo'g'im yiringli xastaliklari", desc: "Osteomiyelit, diagnostika va davolash", icon: "🦿", color: "from-amber-600 to-orange-700" },
        { id: 6, title: "Kuyish kasalligi va sovuq urishi", desc: "Klinik yordam tamoyillari", icon: "🔥", color: "from-orange-600 to-red-600" },
        { id: 7, title: "Bosh miya jarohatlari", desc: "Yopiq va ochiq TBI, neyrotravmalar", icon: "🧠", color: "from-pink-600 to-rose-700" },
        { id: 8, title: "Qon ketish va to'xtatish", desc: "Jgut qo'yish, turli qon ketish turlari", icon: "🩸", color: "from-red-600 to-rose-800" },
    ],
    ru: [
        { id: 1, title: "Переломы ОДА", desc: "Транспортная иммобилизация, гипс", icon: "🦴", color: "from-blue-600 to-indigo-700" },
        { id: 2, title: "Травмы грудной клетки", desc: "Вывихи плеча, грудной клетки", icon: "🫁", color: "from-sky-600 to-blue-700" },
        { id: 3, title: "Травмы таза и позвоночника", desc: "Анестезия по Школникову", icon: "🦷", color: "from-violet-600 to-purple-700" },
        { id: 4, title: "Политравма и шок", desc: "Реанимация, клинические принципы", icon: "🚑", color: "from-rose-600 to-red-700" },
        { id: 5, title: "Гнойные болезни костей", desc: "Остеомиелит, диагностика, лечение", icon: "🦿", color: "from-amber-600 to-orange-700" },
        { id: 6, title: "Ожоговая болезнь и обморожение", desc: "Принципы клинической помощи", icon: "🔥", color: "from-orange-600 to-red-600" },
        { id: 7, title: "Черепно-мозговые травмы", desc: "Открытые и закрытые ЧМТ", icon: "🧠", color: "from-pink-600 to-rose-700" },
        { id: 8, title: "Кровотечения и остановка", desc: "Наложение жгута, виды кровотечений", icon: "🩸", color: "from-red-600 to-rose-800" },
    ],
    en: [
        { id: 1, title: "Musculoskeletal Fractures", desc: "Transport immobilization, plaster casts", icon: "🦴", color: "from-blue-600 to-indigo-700" },
        { id: 2, title: "Chest & Shoulder Injuries", desc: "Shoulder dislocations and fractures", icon: "🫁", color: "from-sky-600 to-blue-700" },
        { id: 3, title: "Pelvic & Spinal Injuries", desc: "Shkolnikov anesthesia", icon: "🦷", color: "from-violet-600 to-purple-700" },
        { id: 4, title: "Polytrauma & Shock", desc: "Resuscitation, clinical principles", icon: "🚑", color: "from-rose-600 to-red-700" },
        { id: 5, title: "Purulent Bone Diseases", desc: "Osteomyelitis, diagnosis, treatment", icon: "🦿", color: "from-amber-600 to-orange-700" },
        { id: 6, title: "Burn Disease & Frostbite", desc: "Clinical care principles", icon: "🔥", color: "from-orange-600 to-red-600" },
        { id: 7, title: "Brain Injuries (TBI)", desc: "Open and closed head injuries", icon: "🧠", color: "from-pink-600 to-rose-700" },
        { id: 8, title: "Bleeding & Hemostasis", desc: "Tourniquet, types of bleeding", icon: "🩸", color: "from-red-600 to-rose-800" },
    ]
};

const CreateLobby = ({ user, onLogout }) => {
    const { lang } = useApp();

    // ── States ────────────────────────────────────────────────
    const [step, setStep] = useState(1);
    const [tab1, setTab1] = useState('ai'); // 'ai' | 'word'

    // Word
    const [wordFile, setWordFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parseError, setParseError] = useState('');

    // AI
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');
    const [aiProgress, setAiProgress] = useState('');

    // Tests
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
    const topics = TOPICS[lang] || TOPICS.uz;

    // ── AI orqali test yaratish ───────────────────────────────
    const handleGenerateAI = async (topic) => {
        setSelectedTopic(topic);
        setIsGenerating(true);
        setAiError('');
        setAiProgress(lang === 'uz' ? 'AI tahlil qilmoqda...' : lang === 'ru' ? 'ИИ анализирует...' : 'AI is analyzing...');

        try {
            setAiProgress(lang === 'uz' ? '🤖 Savollar yaratilmoqda...' : lang === 'ru' ? '🤖 Генерация вопросов...' : '🤖 Generating questions...');
            const result = await generateMedicalContent(topic.title, true);

            if (!result.success) {
                setAiError(result.message || (lang === 'uz' ? 'AI test yarata olmadi.' : lang === 'ru' ? 'ИИ не смог создать тесты.' : 'AI could not generate tests.'));
                setIsGenerating(false);
                return;
            }

            // Testlarni saqlash
            const rawTests = result.tests || [];
            setTests(rawTests.slice(0, 20));

            // AI cases ham kelsa — to'ldirish
            if (result.cases && result.cases.length > 0) {
                setCases(result.cases.slice(0, 2).map(c => ({
                    scenario: c.scenario || c.title || '',
                    question: c.question || '',
                    options: c.options || ['', '', '', ''],
                    answer: typeof c.answer === 'number' ? c.answer : 0
                })));
            }

            // AI xrays ham kelsa — savollarini to'ldirish
            if (result.xrays && result.xrays.length > 0) {
                setXrays(result.xrays.slice(0, 2).map(x => ({
                    image: x.image && !x.image.includes('placeholder') ? x.image : null,
                    question: x.question || '',
                    options: x.options || ['', '', '', ''],
                    answer: typeof x.answer === 'number' ? x.answer : 0
                })));
            }

            setAiProgress('');
            setStep(2);

        } catch (err) {
            console.error('AI generation error:', err);
            setAiError(lang === 'uz' ? 'AI xatolik: ' + err.message : lang === 'ru' ? 'Ошибка ИИ: ' + err.message : 'AI error: ' + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

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
            const parsed = parseTestsFromText(result.value);
            if (parsed.length === 0) {
                setParseError(lang === 'uz' ? "Word fayldan test topilmadi." : lang === 'ru' ? "Тесты не найдены." : "No tests found.");
            } else {
                setTests(parsed.slice(0, 20));
                if (parsed.length < 20)
                    setParseError(lang === 'uz' ? `Faqat ${parsed.length} ta test topildi.` : lang === 'ru' ? `Найдено только ${parsed.length} тестов.` : `Only ${parsed.length} tests found.`);
            }
        } catch (err) {
            setParseError(lang === 'uz' ? "Xatolik: " + err.message : lang === 'ru' ? "Ошибка: " + err.message : "Error: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Text parser ───────────────────────────────────────────
    const parseTestsFromText = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const questions = [];
        let current = null;
        for (const line of lines) {
            const qMatch = line.match(/^(\d+)[.)]\s*(.+)/);
            const optMatch = line.match(/^(\*?\s*[A-Da-d])[.)]\s*(.+)/);
            if (qMatch && !optMatch) {
                if (current && current.options.length >= 2) questions.push(current);
                current = { question: qMatch[2].trim(), options: [], answer: 0 };
            } else if (optMatch && current) {
                if (line.trim().startsWith('*')) current.answer = current.options.length;
                current.options.push(optMatch[2].trim());
            } else if (current && current.options.length === 0) {
                current.question += ' ' + line;
            }
        }
        if (current && current.options.length >= 2) questions.push(current);
        return questions;
    };

    // ── Helpers ───────────────────────────────────────────────
    const handleXrayImageUpload = (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setXrays(prev => { const c = [...prev]; c[idx] = { ...c[idx], image: reader.result }; return c; });
        reader.readAsDataURL(file);
    };
    const updateCase = (idx, field, value) => setCases(prev => { const c = [...prev]; c[idx] = { ...c[idx], [field]: value }; return c; });
    const updateCaseOption = (ci, oi, value) => setCases(prev => { const c = [...prev]; const o = [...c[ci].options]; o[oi] = value; c[ci] = { ...c[ci], options: o }; return c; });
    const updateXray = (idx, field, value) => setXrays(prev => { const c = [...prev]; c[idx] = { ...c[idx], [field]: value }; return c; });
    const updateXrayOption = (xi, oi, value) => setXrays(prev => { const c = [...prev]; const o = [...c[xi].options]; o[oi] = value; c[xi] = { ...c[xi], options: o }; return c; });

    const canLaunch = tests.length >= 1;

    const buildQuizData = () => {
        const all = [];
        tests.forEach(t => all.push({ question: t.question, options: t.options, answer: t.answer, type: 'test' }));
        cases.forEach(c => { if (c.question.trim() && c.options.some(o => o.trim())) all.push({ question: `📋 ${c.scenario}\n\n${c.question}`, options: c.options.filter(o => o.trim()), answer: c.answer, type: 'case' }); });
        xrays.forEach(x => { if (x.question.trim() && x.options.some(o => o.trim())) all.push({ question: x.question, options: x.options.filter(o => o.trim()), answer: x.answer, type: 'xray', image: x.image }); });
        return all;
    };

    // ── STEP 3: LiveRoom ─────────────────────────────────────
    if (step === 3) {
        return <LiveRoom user={user} quizData={buildQuizData()} onExit={() => setStep(2)} />;
    }

    const optColors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-amber-500'];
    const optIcons = ['▲', '◆', '●', '■'];

    return (
        <DashboardLayout role="teacher" user={user} onLogout={onLogout}>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => window.location.href = '/teacher'} className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors">
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
                            {lang === 'uz' ? "Kahoot uslubida jonli viktorina tashkil qiling" : lang === 'ru' ? "Живая викторина в стиле Kahoot" : "Organize a Kahoot-style live quiz"}
                        </p>
                    </div>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2 mb-8">
                    {[
                        { num: 1, label: lang === 'uz' ? 'Testlar' : lang === 'ru' ? 'Тесты' : 'Tests', icon: 'fa-list-check' },
                        { num: 2, label: lang === 'uz' ? "To'ldirish" : lang === 'ru' ? 'Заполнение' : 'Fill', icon: 'fa-pen-to-square' },
                        { num: 3, label: lang === 'uz' ? 'Lobby' : lang === 'ru' ? 'Лобби' : 'Lobby', icon: 'fa-rocket' },
                    ].map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${step >= s.num ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/50 text-slate-600 border border-slate-700/50'}`}>
                                <i className={`fa-solid ${s.icon}`}></i>
                                <span className="hidden sm:inline">{s.label}</span>
                            </div>
                            {i < 2 && <div className={`flex-1 h-0.5 ${step > s.num ? 'bg-emerald-500' : 'bg-slate-700'} rounded-full`}></div>}
                        </React.Fragment>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 1 */}
                {step === 1 && (
                    <div className="space-y-6">

                        {/* Tabs */}
                        <div className="flex gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-700/50">
                            <button
                                onClick={() => setTab1('ai')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${tab1 === 'ai' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-400 hover:text-white'}`}
                            >
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                {lang === 'uz' ? 'AI orqali Mavzu' : lang === 'ru' ? 'Тема через ИИ' : 'AI Topic'}
                            </button>
                            <button
                                onClick={() => setTab1('word')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${tab1 === 'word' ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-white'}`}
                            >
                                <i className="fa-regular fa-file-word"></i>
                                {lang === 'uz' ? 'Word Fayl' : lang === 'ru' ? 'Word Файл' : 'Word File'}
                            </button>
                        </div>

                        {/* ── AI TAB ── */}
                        {tab1 === 'ai' && (
                            <div>
                                {isGenerating ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                                        {/* Animated ring */}
                                        <div className="relative w-24 h-24">
                                            <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
                                            <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                            <div className="absolute inset-3 rounded-full border-4 border-t-transparent border-r-indigo-400 border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                                            <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white font-black text-lg mb-1">{selectedTopic?.icon} {selectedTopic?.title}</p>
                                            <p className="text-violet-400 text-sm font-medium animate-pulse">{aiProgress}</p>
                                            <p className="text-slate-500 text-xs mt-3">
                                                {lang === 'uz' ? '20 ta test + vaziyatli + rentgen savollar tayyorlanmoqda...' : lang === 'ru' ? 'Создаём 20 тестов + ситуации + рентгены...' : 'Creating 20 tests + cases + x-ray questions...'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 flex items-center gap-2">
                                            <i className="fa-solid fa-wand-magic-sparkles text-violet-400"></i>
                                            <p className="text-slate-300 text-sm font-bold">
                                                {lang === 'uz' ? 'Mavzuni tanlang — AI avtomatik 20 ta test yaratadi' : lang === 'ru' ? 'Выберите тему — ИИ автоматически создаст 20 тестов' : 'Select a topic — AI will auto-generate 20 tests'}
                                            </p>
                                        </div>

                                        {/* 8 ta mavzu grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {topics.map((topic) => (
                                                <button
                                                    key={topic.id}
                                                    onClick={() => handleGenerateAI(topic)}
                                                    className={`relative group text-left p-5 rounded-2xl bg-gradient-to-br ${topic.color} shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 overflow-hidden`}
                                                >
                                                    {/* Shimmer */}
                                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                                                    <div className="flex items-start gap-4 relative z-10">
                                                        <span className="text-3xl">{topic.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-black text-sm leading-snug mb-1">{topic.title}</p>
                                                            <p className="text-white/70 text-xs">{topic.desc}</p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors shrink-0">
                                                            <i className="fa-solid fa-arrow-right text-white text-xs group-hover:translate-x-0.5 transition-transform"></i>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center gap-2 relative z-10">
                                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded-full">
                                                            <i className="fa-solid fa-wand-magic-sparkles mr-1"></i>AI
                                                        </span>
                                                        <span className="text-[10px] text-white/60">20 test + 2 vaziyat + 2 rentgen</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {aiError && (
                                            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-start gap-2 mt-4">
                                                <i className="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
                                                <span>{aiError}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── WORD TAB ── */}
                        {tab1 === 'word' && (
                            <div className="space-y-4">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group relative overflow-hidden ${wordFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-600 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-800/50'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <input ref={fileInputRef} type="file" accept=".docx" className="hidden" onChange={handleWordUpload} />

                                    {isProcessing ? (
                                        <div className="relative z-10">
                                            <i className="fa-solid fa-circle-notch fa-spin text-5xl text-blue-500 mb-4 block"></i>
                                            <p className="text-white font-bold text-lg">{lang === 'uz' ? 'Tahlil qilinmoqda...' : lang === 'ru' ? 'Анализируется...' : 'Analyzing...'}</p>
                                        </div>
                                    ) : wordFile ? (
                                        <div className="relative z-10">
                                            <i className="fa-solid fa-file-word text-5xl text-blue-500 mb-4 block"></i>
                                            <p className="text-white font-bold text-lg mb-1">{wordFile.name}</p>
                                            <p className="text-emerald-400 text-sm font-bold">
                                                <i className="fa-solid fa-check-circle mr-1"></i>
                                                {tests.length} {lang === 'uz' ? 'ta test topildi' : lang === 'ru' ? 'тестов найдено' : 'tests found'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative z-10">
                                            <i className="fa-regular fa-file-word text-5xl text-blue-500 group-hover:scale-110 transition-transform mb-4 block"></i>
                                            <p className="text-white font-bold text-lg mb-2">{lang === 'uz' ? 'Word faylni yuklang' : lang === 'ru' ? 'Загрузите Word файл' : 'Upload Word file'}</p>
                                            <p className="text-slate-400 text-sm mb-4">{lang === 'uz' ? '20 ta testli .docx fayl' : lang === 'ru' ? '.docx файл с 20 тестами' : '.docx file with 20 tests'}</p>
                                            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-left max-w-sm mx-auto">
                                                <p className="text-xs text-slate-400 font-bold mb-2"><i className="fa-solid fa-info-circle text-blue-400 mr-1"></i>Format:</p>
                                                <pre className="text-[11px] text-slate-500 leading-relaxed">{`1. Savol matni?\nA) Variant 1\n*B) To'g'ri javob\nC) Variant 3\nD) Variant 4`}</pre>
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
                                    <button onClick={() => setStep(2)} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-lg rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-3">
                                        <i className="fa-solid fa-arrow-right"></i>
                                        {lang === 'uz' ? "Davom etish" : lang === 'ru' ? "Продолжить" : "Continue"}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* STEP 2 */}
                {step === 2 && (
                    <div className="space-y-8">

                        {/* Testlar */}
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="bg-blue-600 text-xs px-3 py-1 rounded-full font-black">{tests.length}</span>
                                <i className="fa-solid fa-list-check text-blue-400"></i>
                                {lang === 'uz' ? 'Testlar' : lang === 'ru' ? 'Тесты' : 'Tests'}
                                {selectedTopic && <span className="text-slate-500 text-sm font-normal ml-2">— {selectedTopic.icon} {selectedTopic.title}</span>}
                            </h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {tests.map((test, idx) => (
                                    <div key={idx} className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
                                        <p className="text-white font-bold text-sm mb-2"><span className="text-blue-400 mr-2">{idx + 1}.</span>{test.question}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {test.options.map((opt, i) => (
                                                <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${i === test.answer ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700/50 text-slate-400'}`}>
                                                    <span className="font-black">{optIcons[i]}</span>{opt}
                                                    {i === test.answer && <i className="fa-solid fa-check ml-auto text-emerald-400"></i>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Vaziyatli */}
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-rose-500/20">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="bg-rose-600 text-xs px-3 py-1 rounded-full font-black">2</span>
                                <i className="fa-solid fa-stethoscope text-rose-400"></i>
                                {lang === 'uz' ? 'Vaziyatli Masalalar' : lang === 'ru' ? 'Ситуационные Задачи' : 'Case Studies'}
                            </h3>
                            <div className="space-y-6">
                                {cases.map((c, idx) => (
                                    <div key={idx} className="bg-slate-800/80 rounded-2xl p-5 border border-rose-500/10">
                                        <p className="text-rose-400 font-black text-sm mb-3">{lang === 'uz' ? `${idx + 1}-vaziyat` : lang === 'ru' ? `Ситуация ${idx + 1}` : `Case ${idx + 1}`}</p>
                                        <textarea value={c.scenario} onChange={e => updateCase(idx, 'scenario', e.target.value)} placeholder={lang === 'uz' ? "Vaziyat tavsifi..." : lang === 'ru' ? "Описание ситуации..." : "Case description..."} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500 resize-none h-20 mb-3 transition-colors" />
                                        <input value={c.question} onChange={e => updateCase(idx, 'question', e.target.value)} placeholder={lang === 'uz' ? "Savol..." : lang === 'ru' ? "Вопрос..." : "Question..."} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-rose-500 mb-3 transition-colors" />
                                        <div className="grid grid-cols-2 gap-2">
                                            {c.options.map((opt, i) => (
                                                <div key={i} className="relative">
                                                    <input value={opt} onChange={e => updateCaseOption(idx, i, e.target.value)} placeholder={`${String.fromCharCode(65 + i)}) Variant`} className={`w-full px-4 py-3 rounded-xl text-sm font-medium text-white placeholder-white/30 focus:outline-none ${optColors[i]}`} />
                                                    <button onClick={() => updateCase(idx, 'answer', i)} className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${c.answer === i ? 'bg-emerald-400 border-emerald-400 text-slate-900' : 'border-white/30 text-transparent hover:border-white/60'}`}>
                                                        <i className="fa-solid fa-check text-[10px]"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rentgen */}
                        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-violet-500/20">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                                <span className="bg-violet-600 text-xs px-3 py-1 rounded-full font-black">2</span>
                                <i className="fa-solid fa-x-ray text-violet-400"></i>
                                {lang === 'uz' ? 'Rentgenogrammalar' : lang === 'ru' ? 'Рентгенограммы' : 'X-Rays'}
                            </h3>
                            <div className="space-y-6">
                                {xrays.map((x, idx) => (
                                    <div key={idx} className="bg-slate-800/80 rounded-2xl p-5 border border-violet-500/10">
                                        <p className="text-violet-400 font-black text-sm mb-3">{lang === 'uz' ? `${idx + 1}-rentgen` : lang === 'ru' ? `Рентген ${idx + 1}` : `X-Ray ${idx + 1}`}</p>
                                        <div className="flex gap-4 mb-4">
                                            <label className="w-32 h-32 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-600 hover:border-violet-500 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group shrink-0 relative">
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleXrayImageUpload(idx, e)} />
                                                {x.image ? (
                                                    <><img src={x.image} alt="xray" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><i className="fa-solid fa-camera text-white text-lg"></i></div></>
                                                ) : (
                                                    <><i className="fa-solid fa-cloud-arrow-up text-2xl text-slate-500 group-hover:text-violet-400 mb-1 transition-colors"></i><span className="text-[10px] text-slate-500 group-hover:text-violet-400 text-center px-2">{lang === 'uz' ? 'Rasm' : lang === 'ru' ? 'Фото' : 'Image'}</span></>
                                                )}
                                            </label>
                                            <div className="flex-1">
                                                <input value={x.question} onChange={e => updateXray(idx, 'question', e.target.value)} placeholder={lang === 'uz' ? "Rentgen savoli..." : lang === 'ru' ? "Вопрос по рентгену..." : "X-ray question..."} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 mb-3 transition-colors" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    {x.options.map((opt, i) => (
                                                        <div key={i} className="relative">
                                                            <input value={opt} onChange={e => updateXrayOption(idx, i, e.target.value)} placeholder={`${String.fromCharCode(65 + i)}) Variant`} className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-white placeholder-white/30 focus:outline-none ${optColors[i]}`} />
                                                            <button onClick={() => updateXray(idx, 'answer', i)} className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${x.answer === i ? 'bg-emerald-400 border-emerald-400 text-slate-900' : 'border-white/30 text-transparent hover:border-white/60'}`}>
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

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-colors">
                                <i className="fa-solid fa-arrow-left mr-2"></i>
                                {lang === 'uz' ? 'Orqaga' : lang === 'ru' ? 'Назад' : 'Back'}
                            </button>
                            <button onClick={() => setStep(3)} disabled={!canLaunch} className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-black text-lg rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:cursor-not-allowed">
                                <i className="fa-solid fa-rocket"></i>
                                {lang === 'uz' ? `🎮 Lobbyni Boshlash (${buildQuizData().length} savol)` : lang === 'ru' ? `🎮 Запустить Лобби (${buildQuizData().length} вопросов)` : `🎮 Launch Lobby (${buildQuizData().length} questions)`}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
};

export default CreateLobby;
