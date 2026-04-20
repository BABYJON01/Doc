import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    doc, setDoc, onSnapshot, collection,
    serverTimestamp, updateDoc
} from 'firebase/firestore';
import { useApp } from '../context/AppContext';

const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Answer progress bar ──────────────────────────────────────
const AnswerProgress = ({ answered, total }) => {
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-sm font-black text-white min-w-[60px] text-right">{answered}/{total}</span>
        </div>
    );
};

// ── Podium component ─────────────────────────────────────────
const Podium = ({ players }) => {
    const top3 = players.slice(0, 3);
    const order = [1, 0, 2];
    const heights = ['h-24', 'h-36', 'h-16'];
    const medals = ['🥈', '🥇', '🥉'];
    const colors = [
        'from-slate-400 to-slate-500',
        'from-yellow-400 to-amber-500',
        'from-amber-600 to-orange-700',
    ];
    return (
        <div className="flex items-end justify-center gap-3 mb-10 mt-4">
            {order.map((rank, idx) => {
                const p = top3[rank];
                if (!p) return null;
                return (
                    <div key={rank} className="flex flex-col items-center">
                        <div className="text-4xl mb-2 animate-bounce" style={{ animationDelay: `${idx * 0.15}s` }}>{medals[idx]}</div>
                        <div className="text-sm font-bold text-white mb-1 text-center max-w-[80px] truncate">{p.name}</div>
                        <div className="text-xs font-black text-emerald-400 mb-2">{p.score || 0} pts</div>
                        <div className={`w-24 ${heights[idx]} bg-gradient-to-t ${colors[idx]} rounded-t-2xl flex items-start justify-center pt-3 shadow-xl`}>
                            <span className="text-white font-black text-xl">{rank + 1}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
const LiveRoom = ({ user, quizData, onExit }) => {
    const { t, lang } = useApp();
    const [pin, setPin] = useState(null);
    const [mode, setMode] = useState('classic');
    const [roomStatus, setRoomStatus] = useState('initializing');
    const [players, setPlayers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [copied, setCopied] = useState(false);
    const [initError, setInitError] = useState("");

    // Initialize room directly
    useEffect(() => {
        if (roomStatus === 'initializing') {
            const initRoom = async () => {
                try {
                    console.log("🔥 initRoom triggered with mode:", mode);
                    const newPin = generatePin();
                    console.log("🔥 Generated PIN:", newPin);
                    setPin(newPin);
                    
                    const payload = {
                        teacherId: user?.uid || 'unknown',
                        teacherName: user?.displayName || user?.email || "O'qituvchi",
                        status: 'lobby',
                        mode: 'classic',
                        quizData: quizData || [],
                        currentQuestion: 0,
                        createdAt: serverTimestamp(),
                    };
                    console.log("🔥 Payload to save:", payload);

                    // Add a timeout just in case network hangs forever
                    let timerId;
                    const timeoutPromise = new Promise((_, reject) => {
                        timerId = setTimeout(() => reject(new Error("Firebase ulanish vaqti tugadi (Timeout). Tarmoq muammosi bo'lishi mumkin.")), 8000);
                    });
                    
                    await Promise.race([
                        setDoc(doc(db, 'rooms', newPin), payload),
                        timeoutPromise
                    ]);
                    clearTimeout(timerId);
                    
                    console.log("🔥 Room successfully created in Firebase!");
                    setRoomStatus('lobby');
                } catch (error) {
                    console.error("🔥 Firebase Room Create Error:", error);
                    setInitError(error.message || "Unknown error creating room");
                    setRoomStatus('error');
                }
            };
            initRoom();
        }
    }, [roomStatus, user, quizData]);

    // Listen to players
    useEffect(() => {
        if (!pin) return;
        const unsubscribe = onSnapshot(collection(db, `rooms/${pin}/players`), (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            setPlayers(list);
        });
        return () => unsubscribe();
    }, [pin]);

    // Listen to room status
    useEffect(() => {
        if (!pin) return;
        const unsubscribe = onSnapshot(doc(db, 'rooms', pin), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            if (data.status === 'finished') setRoomStatus('finished');
            if (data.currentQuestion !== undefined) setCurrentQuestion(data.currentQuestion);
        });
        return () => unsubscribe();
    }, [pin]);



    const handleStartGame = async () => {
        await updateDoc(doc(db, 'rooms', pin), {
            status: 'active',
            startedAt: serverTimestamp(),
        });
        setRoomStatus('active');
    };

    const handleNextQuestion = async () => {
        const next = currentQuestion + 1;
        if (next >= quizData.length) {
            await updateDoc(doc(db, 'rooms', pin), {
                status: 'finished',
                currentQuestion: next,
                finishedAt: serverTimestamp(),
            });
            setRoomStatus('finished');
        } else {
            await updateDoc(doc(db, 'rooms', pin), { currentQuestion: next });
            setCurrentQuestion(next);
        }
    };

    const copyPin = () => {
        navigator.clipboard.writeText(pin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (roomStatus === 'error') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-rose-500 font-bold text-xl mb-2">Live Quiz ochishda xatolik yuz berdi</h2>
                <p className="text-slate-400 mb-6 bg-slate-800 p-4 rounded-lg font-mono text-sm">{initError}</p>
                <button onClick={onExit} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">
                    Orqaga qaytish
                </button>
            </div>
        );
    }

    if (roomStatus === 'initializing') {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
    }

    // ════════════════════════════════════════════════════════
    // LOBBY
    if (roomStatus === 'lobby') {
        return (
            <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-4xl">
                    {/* Logo + mode */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <img src="/assets/tma_logo.png" alt="TMA" className="w-10 h-10 rounded-full border-2 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
                        <div>
                            <div className="font-black text-white text-lg">Med-Zukkoo Live Quiz</div>
                            <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest">
                                {mode === 'classic'
                                    ? (lang === 'uz' ? '🎮 Klassik Kahoot' : lang === 'ru' ? '🎮 Классический Kahoot' : '🎮 Classic Kahoot')
                                    : (lang === 'uz' ? '🚀 Erkin Poyga' : lang === 'ru' ? '🚀 Свободная гонка' : '🚀 Speed Race')}
                            </div>
                        </div>
                    </div>

                    {/* PIN display */}
                    <div className="text-center mb-10">
                        <p className="text-slate-400 uppercase tracking-widest text-sm mb-3">
                            {lang === 'uz' ? 'Talabalar shu PIN orqali kiradi'
                                : lang === 'ru' ? 'Студенты входят по этому PIN'
                                : 'Students join with this PIN'}
                        </p>
                        <button
                            onClick={copyPin}
                            className="inline-block bg-slate-800 border-2 border-emerald-500 rounded-2xl px-12 py-6 shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all group"
                        >
                            <div className="text-7xl font-black text-emerald-400 tracking-[0.2em] font-mono group-hover:text-emerald-300">{pin}</div>
                            <div className="text-xs text-slate-500 mt-2">
                                {copied
                                    ? <span className="text-emerald-400">✓ PIN copied!</span>
                                    : (lang === 'uz' ? 'Bosib nusxa olish' : lang === 'ru' ? 'Нажмите чтобы скопировать' : 'Click to copy')}
                            </div>
                        </button>
                        <p className="text-slate-500 mt-3 text-sm">
                            {lang === 'uz' ? 'Veb-sayt:' : lang === 'ru' ? 'Сайт:' : 'Website:'}{' '}
                            <span className="text-white font-bold">med-zukkoo.vercel.app</span>
                            {lang === 'uz' ? ' → Talaba → PIN kiriting'
                                : lang === 'ru' ? ' → Студент → Введите PIN'
                                : ' → Student → Enter PIN'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Player count */}
                        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center shadow-xl">
                            <div className="text-7xl font-black text-white mb-2 tabular-nums">{players.length}</div>
                            <div className="text-slate-400 uppercase tracking-widest text-sm">
                                {lang === 'uz' ? 'Ulangan talabalar'
                                    : lang === 'ru' ? 'Подключённые студенты'
                                    : 'Connected students'}
                            </div>
                            {/* Mini bar */}
                            <div className="mt-4">
                                <AnswerProgress answered={players.length} total={Math.max(players.length, 1)} />
                            </div>
                        </div>

                        {/* Waiting players list */}
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                                {lang === 'uz' ? 'Kutish zalida:' : lang === 'ru' ? 'В зале ожидания:' : 'Waiting room:'}
                            </h3>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {players.length === 0 ? (
                                    <p className="text-slate-600 italic text-sm">
                                        {lang === 'uz' ? 'Hali hech kim ulanmadi...'
                                            : lang === 'ru' ? 'Пока никто не подключился...'
                                            : 'No one connected yet...'}
                                    </p>
                                ) : (
                                    players.map((p, i) => (
                                        <span key={i} className="bg-slate-700 text-slate-200 px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block"></span>
                                            {p.name}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleStartGame}
                            disabled={players.length === 0}
                            className="flex-1 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-emerald-900/50 hover:shadow-emerald-900/70 hover:scale-[1.01] active:scale-95"
                        >
                            <i className="fa-solid fa-circle-play mr-2"></i>
                            {lang === 'uz' ? `O'yinni Boshlash (${players.length} talaba)`
                                : lang === 'ru' ? `Начать игру (${players.length} студентов)`
                                : `Start Game (${players.length} students)`}
                        </button>
                        <button
                            onClick={onExit}
                            className="px-6 py-5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                        >
                            {lang === 'uz' ? 'Bekor' : lang === 'ru' ? 'Отмена' : 'Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // ACTIVE — Teacher Control Panel
    if (roomStatus === 'active') {
        const q = quizData[currentQuestion];
        const answeredCount = players.filter(p => p.answers && p.answers[currentQuestion] !== undefined).length;
        const colors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-yellow-500'];
        const icons = ['▲', '◆', '●', '■'];

        return (
            <div className="min-h-screen bg-slate-900 text-white font-sans flex">
                {/* Main Panel */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                        <div className="flex items-center gap-4">
                            <img src="/assets/tma_logo.png" alt="TMA" className="w-10 h-10 rounded-full border-2 border-blue-400/40" />
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                                    {mode === 'classic' ? '🎮 Classic' : '🚀 Race'} • PIN: {pin}
                                </div>
                                <h2 className="text-xl font-bold text-white">
                                    {lang === 'uz' ? `Savol ${currentQuestion + 1} / ${quizData.length}`
                                        : lang === 'ru' ? `Вопрос ${currentQuestion + 1} / ${quizData.length}`
                                        : `Question ${currentQuestion + 1} / ${quizData.length}`}
                                </h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 mb-1">
                                {lang === 'uz' ? 'Javob berdi' : lang === 'ru' ? 'Ответили' : 'Answered'}
                            </div>
                            <div className="text-3xl font-black text-blue-400">{answeredCount}<span className="text-slate-600 text-lg">/{players.length}</span></div>
                        </div>
                    </div>

                    {/* Answer progress */}
                    <div className="mb-6">
                        <AnswerProgress answered={answeredCount} total={players.length} />
                    </div>

                    {/* Progress bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>{lang === 'uz' ? 'Progress' : lang === 'ru' ? 'Прогресс' : 'Progress'}</span>
                            <span>{Math.round(((currentQuestion + 1) / quizData.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Question */}
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-3xl font-bold text-white mb-8 leading-relaxed text-center">
                            {q.question}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {q.options.map((opt, i) => (
                                <div key={i} className={`${colors[i]} rounded-xl p-5 text-white font-bold text-lg flex items-center gap-3 shadow-lg`}>
                                    <span className="text-2xl opacity-70">{icons[i]}</span>
                                    <span>{opt}</span>
                                </div>
                            ))}
                        </div>

                        {mode === 'classic' && (
                            <button
                                onClick={handleNextQuestion}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-[1.01] active:scale-95"
                            >
                                {currentQuestion + 1 < quizData.length ? (
                                    <><i className="fa-solid fa-arrow-right mr-2"></i>
                                    {lang === 'uz' ? 'Keyingi savolga o\'tish' : lang === 'ru' ? 'Следующий вопрос' : 'Next Question'}</>
                                ) : (
                                    <><i className="fa-solid fa-flag-checkered mr-2"></i>
                                    {lang === 'uz' ? 'O\'yinni Yakunlash' : lang === 'ru' ? 'Завершить игру' : 'End Game'}</>
                                )}
                            </button>
                        )}

                        {mode === 'race' && (
                            <button
                                onClick={handleEndGame}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg rounded-xl transition-all hover:scale-[1.01] active:scale-95"
                            >
                                <i className="fa-solid fa-flag-checkered mr-2"></i>
                                {lang === 'uz' ? 'O\'yinni Tugatish' : lang === 'ru' ? 'Завершить игру' : 'End Game'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Live Leaderboard Sidebar */}
                <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
                    <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                        <i className="fa-solid fa-ranking-star text-yellow-400"></i>
                        {lang === 'uz' ? 'Jonli Reyting' : lang === 'ru' ? 'Живой рейтинг' : 'Live Leaderboard'}
                    </h3>
                    <div className="space-y-3">
                        {players.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700 transition-all hover:border-slate-600">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${i === 0 ? 'bg-yellow-500 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white text-sm truncate">{p.name}</div>
                                    <div className="text-xs text-slate-500">{p.score || 0} pts • {p.correct || 0} ✓</div>
                                </div>
                                {/* answered indicator */}
                                {p.answers && p.answers[currentQuestion] !== undefined && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" title="Answered" />
                                )}
                            </div>
                        ))}
                        {players.length === 0 && (
                            <div className="text-center text-slate-600 py-8 text-sm italic">
                                {lang === 'uz' ? 'Hali hech kim ulanmadi' : lang === 'ru' ? 'Пока никто не подключился' : 'No players yet'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════
    // FINISHED — Results with Podium
    return (
        <div className="min-h-screen font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-2xl w-full z-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <img src="/assets/tma_logo.png" alt="TMA" className="w-12 h-12 rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]" />
                    <div className="text-center">
                        <div className="font-black text-white text-xl">Med-Zukkoo Live Quiz</div>
                        <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                            {lang === 'uz' ? 'O\'yin Yakunlandi' : lang === 'ru' ? 'Игра завершена' : 'Game Over'}
                        </div>
                    </div>
                </div>

                <div className="text-center mb-4">
                    <div className="text-6xl mb-3">🏆</div>
                    <h1 className="text-3xl font-bold text-white mb-1">
                        {lang === 'uz' ? 'O\'yin Yakunlandi!' : lang === 'ru' ? 'Игра завершена!' : 'Game Finished!'}
                    </h1>
                    <p className="text-slate-400">
                        {lang === 'uz' ? `${players.length} ta talaba qatnashdi`
                            : lang === 'ru' ? `Участвовало ${players.length} студентов`
                            : `${players.length} students participated`}
                    </p>
                </div>

                {/* Podium */}
                {players.length >= 2 && <Podium players={players} />}

                {/* Full results */}
                <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden mb-6 backdrop-blur">
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700">
                        <h3 className="font-bold text-white">
                            {lang === 'uz' ? 'Yakuniy Reyting' : lang === 'ru' ? 'Итоговый рейтинг' : 'Final Leaderboard'}
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                        {players.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-700/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-yellow-500 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{p.name}</div>
                                        <div className="text-xs text-slate-400">
                                            {p.correct || 0} {lang === 'uz' ? 'ta to\'g\'ri' : lang === 'ru' ? 'верных' : 'correct'}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-emerald-400">{p.score || 0}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={onExit} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-blue-900/50">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    {lang === 'uz' ? 'O\'qituvchi paneliga qaytish'
                        : lang === 'ru' ? 'Вернуться в панель преподавателя'
                        : 'Back to Teacher Panel'}
                </button>
            </div>
        </div>
    );
};

export default LiveRoom;
