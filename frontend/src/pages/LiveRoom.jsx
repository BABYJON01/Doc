import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    doc, setDoc, onSnapshot, collection,
    serverTimestamp, updateDoc, deleteDoc
} from 'firebase/firestore';

// Generates a random 6-digit PIN
const generatePin = () => Math.floor(100000 + Math.random() * 900000).toString();

const LiveRoom = ({ user, quizData, onExit }) => {
    const [pin, setPin] = useState(null);
    const [mode, setMode] = useState(null); // 'classic' | 'race'
    const [roomStatus, setRoomStatus] = useState('choosing'); // choosing → lobby → active → finished
    const [players, setPlayers] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [results, setResults] = useState([]);

    // Listen to room players in real time
    useEffect(() => {
        if (!pin) return;
        const unsubscribe = onSnapshot(collection(db, `rooms/${pin}/players`), (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            setPlayers(list);
        });
        return () => unsubscribe();
    }, [pin]);

    // Listen to room status changes (for Kahoot: teacher pushes next question)
    useEffect(() => {
        if (!pin) return;
        const unsubscribe = onSnapshot(doc(db, 'rooms', pin), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            if (data.status === 'finished') {
                setRoomStatus('finished');
                fetchResults();
            }
            if (data.currentQuestion !== undefined) {
                setCurrentQuestion(data.currentQuestion);
            }
        });
        return () => unsubscribe();
    }, [pin]);

    const fetchResults = async () => {
        // Results are already live in players state
        setResults([...players]);
    };

    const handleChooseMode = async (selectedMode) => {
        try {
            const newPin = generatePin();
            setPin(newPin);
            setMode(selectedMode);

            await setDoc(doc(db, 'rooms', newPin), {
                teacherId: user?.uid || 'unknown',
                teacherName: user?.displayName || user?.email || 'O\'qituvchi',
                status: 'lobby',
                mode: selectedMode,
                quizData: quizData || [],
                currentQuestion: 0,
                createdAt: serverTimestamp(),
            });

            setRoomStatus('lobby');
        } catch (error) {
            console.error("Firebase Room Create Error:", error);
            alert("Xatolik: " + error.message);
        }
    };

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

    const handleEndGame = async () => {
        await updateDoc(doc(db, 'rooms', pin), {
            status: 'finished',
            finishedAt: serverTimestamp(),
        });
        setRoomStatus('finished');
    };

    // === CHOOSING MODE ===
    if (roomStatus === 'choosing') {
        return (
            <div className="min-h-screen bg-slate-900 text-white font-sans p-6 flex items-center justify-center">
                <div className="max-w-2xl w-full">
                    <button onClick={onExit} className="mb-8 text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors">
                        <i className="fa-solid fa-arrow-left"></i> Orqaga qaytish
                    </button>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <i className="fa-solid fa-tower-broadcast text-rose-500 animate-pulse"></i>
                        Live Test Rejimini Tanlang
                    </h1>
                    <p className="text-slate-400 mb-10">Talabalar bilan birga real vaqtda musobaqalashish rejimini tanlang</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Classic Kahoot */}
                        <button
                            onClick={() => handleChooseMode('classic')}
                            className="bg-slate-800 border-2 border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-left transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] group"
                        >
                            <div className="text-5xl mb-5">🎮</div>
                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">Klassik Kahoot</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Siz proyektor orqali savollarni katta ekranda ko'rsatasiz. Talabalar ekranida faqat <strong className="text-white">A, B, C, D</strong> tugmalar chiqadi. Keyingi savolga o'tishni <strong className="text-white">Siz boshqarasiz</strong>.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">Proyektor</span>
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">Sinxronizatsiya</span>
                            </div>
                        </button>

                        {/* Free Race */}
                        <button
                            onClick={() => handleChooseMode('race')}
                            className="bg-slate-800 border-2 border-slate-700 hover:border-rose-500 rounded-2xl p-8 text-left transition-all hover:shadow-[0_0_30px_rgba(244,63,94,0.2)] group"
                        >
                            <div className="text-5xl mb-5">🚀</div>
                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-rose-400 transition-colors">Erkin Poyga</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Siz "Start" ni bossangiz, <strong className="text-white">hamma bir paytda</strong> poyga qilib test yechadi. Kim tezroq va to'g'ri javob bersa, reytingda yuqoriga ko'tariladi.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="text-xs bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full border border-rose-500/30">Tezkorlik</span>
                                <span className="text-xs bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full border border-rose-500/30">Mustaqil poyga</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // === LOBBY ===
    if (roomStatus === 'lobby') {
        return (
            <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-12">
                        <p className="text-slate-400 uppercase tracking-widest text-sm mb-3">Talabalar shu PIN orqali kiradi</p>
                        <div className="inline-block bg-slate-800 border-2 border-emerald-500 rounded-2xl px-12 py-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                            <div className="text-7xl font-black text-emerald-400 tracking-[0.2em] font-mono">{pin}</div>
                        </div>
                        <p className="text-slate-500 mt-3 text-sm">
                            Veb-sayt: <span className="text-white font-bold">doc-i2qq.vercel.app</span> → Talaba → PIN kiriting
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Stats */}
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-center">
                            <div className="text-6xl font-black text-white mb-2">{players.length}</div>
                            <div className="text-slate-400 uppercase tracking-widest text-sm">Ulangan talabalar</div>
                        </div>
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Kutish zalida:</h3>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {players.length === 0 ? (
                                    <p className="text-slate-600 italic text-sm">Hali hech kim ulanmadi...</p>
                                ) : (
                                    players.map((p, i) => (
                                        <span key={i} className="bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-sm font-medium animate-[fadeIn_0.3s_ease-out]">
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
                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-emerald-900/50"
                        >
                            <i className="fa-solid fa-circle-play mr-2"></i>
                            O'yinni Boshlash ({players.length} talaba)
                        </button>
                        <button
                            onClick={() => setRoomStatus('choosing')}
                            className="px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                        >
                            Bekor
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // === ACTIVE (Teacher Control Panel) ===
    if (roomStatus === 'active') {
        const q = quizData[currentQuestion];
        const answeredCount = players.filter(p => p.answers && p.answers[currentQuestion] !== undefined).length;

        return (
            <div className="min-h-screen bg-slate-900 text-white font-sans flex">
                {/* Main Panel */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                        <div>
                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                                {mode === 'classic' ? '🎮 Klassik Kahoot Rejimi' : '🚀 Erkin Poyga Rejimi'}
                            </div>
                            <h2 className="text-xl font-bold text-white">Savol {currentQuestion + 1} / {quizData.length}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-black text-blue-400">{answeredCount}/{players.length}</div>
                                <div className="text-xs text-slate-500">javob berdi</div>
                            </div>
                            <span className="bg-slate-700 text-white text-sm font-bold px-4 py-2 rounded-full font-mono">PIN: {pin}</span>
                        </div>
                    </div>

                    {/* Question Display (for projector in Classic mode) */}
                    <div className="max-w-3xl mx-auto">
                        <h3 className="text-3xl font-bold text-white mb-8 leading-relaxed text-center">
                            {q.question}
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {q.options.map((opt, i) => {
                                const colors = ['bg-red-600', 'bg-blue-600', 'bg-emerald-600', 'bg-yellow-500'];
                                const icons = ['▲', '◆', '●', '■'];
                                return (
                                    <div key={i} className={`${colors[i]} rounded-xl p-5 text-white font-bold text-lg flex items-center gap-3 shadow-lg`}>
                                        <span className="text-2xl opacity-70">{icons[i]}</span>
                                        <span>{opt}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {mode === 'classic' && (
                            <button
                                onClick={handleNextQuestion}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl transition-colors"
                            >
                                {currentQuestion + 1 < quizData.length ? (
                                    <><i className="fa-solid fa-arrow-right mr-2"></i>Keyingi savolga o'tish</>
                                ) : (
                                    <><i className="fa-solid fa-flag-checkered mr-2"></i>O'yinni Yakunlash</>
                                )}
                            </button>
                        )}

                        {mode === 'race' && (
                            <button
                                onClick={handleEndGame}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-lg rounded-xl transition-colors"
                            >
                                <i className="fa-solid fa-flag-checkered mr-2"></i>O'yinni Tugatish
                            </button>
                        )}
                    </div>
                </div>

                {/* Live Leaderboard Sidebar */}
                <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 overflow-y-auto">
                    <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                        <i className="fa-solid fa-ranking-star text-yellow-400"></i>
                        Jonli Reyting
                    </h3>
                    <div className="space-y-3">
                        {players.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-700">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-500 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white text-sm truncate">{p.name}</div>
                                    <div className="text-xs text-slate-500">{p.score || 0} ball</div>
                                </div>
                            </div>
                        ))}
                        {players.length === 0 && (
                            <div className="text-center text-slate-600 py-8 text-sm italic">Hali hech kim ulanmadi</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // === FINISHED (Results) ===
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans p-6 flex flex-col items-center justify-center">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🏆</div>
                    <h1 className="text-3xl font-bold mb-2">O'yin Yakunlandi!</h1>
                    <p className="text-slate-400">Barcha natijalar Firebase'da saqlanib bo'ldi</p>
                </div>

                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-6">
                    <div className="p-4 bg-slate-700/50 border-b border-slate-700">
                        <h3 className="font-bold text-white">Yakuniy Reyting</h3>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                        {players.map((p, i) => (
                            <div key={p.id} className="flex items-center justify-between px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-yellow-500 text-slate-900' : i === 1 ? 'bg-slate-400 text-slate-900' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{p.name}</div>
                                        <div className="text-xs text-slate-400">{p.correct || 0} ta to'g'ri javob</div>
                                    </div>
                                </div>
                                <div className="text-2xl font-black text-emerald-400">{p.score || 0}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={onExit} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                    <i className="fa-solid fa-arrow-left mr-2"></i>O'qituvchi paneliga qaytish
                </button>
            </div>
        </div>
    );
};

export default LiveRoom;
