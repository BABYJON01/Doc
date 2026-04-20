import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import {
    doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection
} from 'firebase/firestore';
import { useApp } from '../context/AppContext';

// ── Confetti mini animatsion component ──────────────────────
const ConfettiPop = ({ show }) => {
    if (!show) return null;
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-sm animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-${Math.random() * 20}%`,
                        background: colors[Math.floor(Math.random() * colors.length)],
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: `${1 + Math.random()}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}
        </div>
    );
};

// ── Floating score badge ─────────────────────────────────────
const FloatingScore = ({ show, isCorrect }) => {
    if (!show) return null;
    return (
        <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                       text-5xl font-black pointer-events-none animate-float-up"
            style={{ color: isCorrect ? '#10b981' : '#f43f5e' }}
        >
            {isCorrect ? '+100' : '0'}
        </div>
    );
};

// ── Countdown Timer ──────────────────────────────────────────
const Timer = ({ seconds, total }) => {
    const pct = (seconds / total) * 100;
    const color = pct > 50 ? '#10b981' : pct > 25 ? '#f59e0b' : '#f43f5e';
    const shadow = pct > 50
        ? '0 0 20px rgba(16,185,129,0.5)'
        : pct > 25
        ? '0 0 20px rgba(245,158,11,0.5)'
        : '0 0 20px rgba(244,63,94,0.5)';

    return (
        <div className="flex flex-col items-center">
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-4 transition-all duration-300"
                style={{ borderColor: color, color, boxShadow: shadow }}
            >
                {seconds}
            </div>
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">sek</div>
        </div>
    );
};

// ── Podium Component ─────────────────────────────────────────
const Podium = ({ players }) => {
    const top3 = players.slice(0, 3);
    const order = [1, 0, 2]; // Silver, Gold, Bronze visual order
    const heights = ['h-20', 'h-32', 'h-14'];
    const medals = ['🥈', '🥇', '🥉'];
    const colors = ['from-slate-400 to-slate-500', 'from-yellow-400 to-amber-500', 'from-amber-600 to-orange-700'];

    return (
        <div className="flex items-end justify-center gap-2 mb-8 mt-4">
            {order.map((rank, idx) => {
                const p = top3[rank];
                if (!p) return null;
                return (
                    <div key={rank} className="flex flex-col items-center animate-bounce-in" style={{ animationDelay: `${idx * 0.15}s` }}>
                        <div className="text-3xl mb-2">{medals[idx]}</div>
                        <div className="text-xs font-bold text-white mb-1 text-center max-w-[70px] truncate">{p.name}</div>
                        <div className="text-xs font-black text-emerald-400 mb-2">{p.score || 0} pts</div>
                        <div
                            className={`w-20 ${heights[idx]} bg-gradient-to-t ${colors[idx]} rounded-t-xl flex items-start justify-center pt-2`}
                        >
                            <span className="text-white font-black text-lg">{rank + 1}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
const QUIZ_TIME = 20; // seconds per question

const LiveQuiz = ({ user, roomPin, onFinish }) => {
    const { t } = useApp();
    const [roomData, setRoomData] = useState(null);
    const [status, setStatus] = useState('joining');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [answers, setAnswers] = useState({});
    const [players, setPlayers] = useState([]);
    const [localFinished, setLocalFinished] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);
    const [showConfetti, setShowConfetti] = useState(false);
    const [showFloatScore, setShowFloatScore] = useState(false);
    const [lastCorrect, setLastCorrect] = useState(false);
    const timerRef = useRef(null);

    const userName = user?.displayName || user?.email?.split('@')[0] || 'Talaba';

    // ── Register player ──────────────────────────────────────
    useEffect(() => {
        if (!roomPin || !user) return;
        const joinRoom = async () => {
            try {
                const roomRef = doc(db, 'rooms', roomPin);
                const roomSnap = await new Promise(resolve => {
                    const unsub = onSnapshot(roomRef, snap => { resolve(snap); unsub(); });
                });
                if (!roomSnap.exists()) { setError(t.roomNotFound); return; }
                const data = roomSnap.data();
                if (data.status === 'finished') { setError(t.gameAlreadyOver); return; }
                setRoomData(data);
                await setDoc(doc(db, `rooms/${roomPin}/players`, user.uid), {
                    name: userName,
                    score: 0,
                    correct: 0,
                    answers: {},
                    joinedAt: serverTimestamp(),
                }, { merge: true });
                setStatus(data.status === 'lobby' ? 'lobby' : 'active');
            } catch (e) {
                setError(t.connectionError);
                console.error(e);
            }
        };
        joinRoom();
    }, [roomPin, user]);

    // ── Listen room changes ──────────────────────────────────
    useEffect(() => {
        if (!roomPin) return;
        const unsubscribe = onSnapshot(doc(db, 'rooms', roomPin), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoomData(data);
            if (data.status === 'active' && status === 'lobby') setStatus('active');
            if (data.status === 'finished' && !localFinished) setStatus('finished');
            if (data.mode === 'classic' && data.currentQuestion !== undefined) {
                setCurrentQuestion(data.currentQuestion);
                setSelectedOption(null);
                setIsAnswered(false);
                setTimeLeft(QUIZ_TIME);
            }
        });
        return () => unsubscribe();
    }, [roomPin, status, localFinished]);

    // ── Listen players ───────────────────────────────────────
    useEffect(() => {
        if (!roomPin) return;
        const unsubscribe = onSnapshot(collection(db, `rooms/${roomPin}/players`), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            setPlayers(list);
        });
        return () => unsubscribe();
    }, [roomPin]);

    // ── Countdown Timer ──────────────────────────────────────
    useEffect(() => {
        if (status !== 'active' || isAnswered) return;
        clearInterval(timerRef.current);
        setTimeLeft(QUIZ_TIME);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Auto answer as wrong on timeout
                    if (!isAnswered) handleAnswer(-1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [currentQuestion, status]);

    // ── Answer handler ───────────────────────────────────────
    const handleAnswer = async (idx) => {
        if (isAnswered || !roomData) return;
        clearInterval(timerRef.current);

        const quizData = roomData.quizData;
        const q = quizData[currentQuestion];
        const isCorrect = idx === q.answer;

        setSelectedOption(idx);
        setIsAnswered(true);
        setLastCorrect(isCorrect);

        const newAnswers = { ...answers, [currentQuestion]: idx };
        const timeBonus = Math.floor((timeLeft / QUIZ_TIME) * 50); // up to 50 bonus pts for speed
        const earnedScore = isCorrect ? 100 + timeBonus : 0;
        const newScore = score + earnedScore;
        const newCorrect = isCorrect ? correctCount + 1 : correctCount;

        setAnswers(newAnswers);
        setScore(newScore);
        setCorrectCount(newCorrect);

        // Animations
        setShowFloatScore(true);
        setTimeout(() => setShowFloatScore(false), 1200);
        if (isCorrect) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1800);
        }

        if (user.uid) {
            await updateDoc(doc(db, `rooms/${roomPin}/players`, user.uid), {
                score: newScore,
                correct: newCorrect,
                answers: newAnswers,
                lastAnsweredAt: serverTimestamp(),
            });
        }
    };

    // ── Next question ────────────────────────────────────────
    const handleNext = () => {
        if (!roomData) return;
        const nextQ = currentQuestion + 1;
        if (nextQ >= roomData.quizData.length) {
            if (user.uid) {
                updateDoc(doc(db, `rooms/${roomPin}/players`, user.uid), {
                    finishedAt: serverTimestamp(),
                    status: 'finished',
                });
            }
            setLocalFinished(true);
            setStatus('finished');
        } else {
            setCurrentQuestion(nextQ);
            setSelectedOption(null);
            setIsAnswered(false);
            setTimeLeft(QUIZ_TIME);
        }
    };

    // ── My rank ──────────────────────────────────────────────
    const myRank = players.findIndex(p => p.id === user?.uid) + 1;

    // ════════════════════════════════════════════════════════
    // ERROR
    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-3">{error}</h2>
                    <button onClick={onFinish} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">
                        {t.back}
                    </button>
                </div>
            </div>
        );
    }

    // ── LOADING ──────────────────────────────────────────────
    if (!roomData) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">PIN: {roomPin} …</p>
                </div>
            </div>
        );
    }

    // ━━━━━━━━━━━━━━━━━━━ LOBBY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (status === 'lobby') {
        return (
            <div className="min-h-screen font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>

                {/* Glow bg */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* Logo */}
                <div className="flex items-center gap-3 mb-10">
                    <img src="/assets/tma_logo.png" alt="TMA" className="w-12 h-12 rounded-full border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                    <div>
                        <div className="text-white font-black text-xl tracking-tight">Med-Zukkoo</div>
                        <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Live Quiz</div>
                    </div>
                </div>

                <div className="text-center max-w-md w-full">
                    <div className="relative mb-8">
                        <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center mx-auto animate-pulse">
                            <i className="fa-solid fa-hourglass-half text-4xl text-emerald-400"></i>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">{t.waitingForTeacher}</h1>

                    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-4 backdrop-blur">
                        <div className="text-slate-400 text-sm mb-1">{t.yourName}:</div>
                        <div className="text-2xl font-bold text-white">{userName}</div>
                        <div className="mt-3 text-xs font-mono text-slate-500">PIN: {roomPin}</div>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 backdrop-blur">
                        <div className="text-slate-400 text-sm mb-3">
                            {t.waitingRoom} ({players.length} {t.persons}):
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {players.map((p, i) => (
                                <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${p.id === user?.uid ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-slate-700 text-slate-300'}`}>
                                    {p.name} {p.id === user?.uid ? `(${t.youLabel})` : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const quizData = roomData.quizData;

    // ━━━━━━━━━━━━━━━━━━━ FINISHED ━━━━━━━━━━━━━━━━━━━━━━━━━
    if (status === 'finished') {
        return (
            <div className="min-h-screen font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <ConfettiPop show={true} />

                <div className="max-w-xl w-full text-center z-10">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <img src="/assets/tma_logo.png" alt="TMA" className="w-10 h-10 rounded-full border-2 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.4)]" />
                        <span className="text-white font-black text-lg">Med-Zukkoo Live Quiz</span>
                    </div>

                    <div className="text-5xl mb-2">
                        {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎉'}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-1">{t.quizFinished}</h1>
                    <p className="text-slate-400 mb-6">{t.resultSaved}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {[
                            { label: t.yourScore, value: score, color: 'text-emerald-400' },
                            { label: t.correct, value: `${correctCount}/${quizData.length}`, color: 'text-blue-400' },
                            { label: t.rank, value: `#${myRank || '?'}`, color: 'text-yellow-400' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 backdrop-blur">
                                <div className={`text-3xl font-black ${color} mb-1`}>{value}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-widest">{label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Podium */}
                    {players.length >= 2 && <Podium players={players} />}

                    {/* Full leaderboard */}
                    <div className="bg-slate-800/80 border border-slate-700 rounded-2xl overflow-hidden mb-6 backdrop-blur">
                        <div className="bg-slate-700/50 px-5 py-3 border-b border-slate-700">
                            <h3 className="font-bold text-white">{t.finalRanking}</h3>
                        </div>
                        {players.slice(0, 10).map((p, i) => (
                            <div key={p.id} className={`flex items-center justify-between px-5 py-3 border-b border-slate-700/50 transition-colors ${p.id === user?.uid ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : 'hover:bg-slate-700/30'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                    <span className={`font-bold ${p.id === user?.uid ? 'text-emerald-400' : 'text-white'}`}>
                                        {p.name} {p.id === user?.uid ? `(${t.youLabel})` : ''}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-white">{p.score || 0}</div>
                                    <div className="text-[10px] text-slate-500">{p.correct || 0} {t.correct?.toLowerCase()}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={onFinish} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/50">
                        <i className="fa-solid fa-arrow-left mr-2"></i>{t.backToStudent}
                    </button>
                </div>
            </div>
        );
    }

    // ━━━━━━━━━━━━━━━━━━━ ACTIVE ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const q = quizData[currentQuestion];
    const isClassic = roomData.mode === 'classic';

    // ── CLASSIC MODE ─────────────────────────────────────────
    if (isClassic) {
        const colors = ['bg-red-600 hover:bg-red-500', 'bg-blue-600 hover:bg-blue-500', 'bg-emerald-600 hover:bg-emerald-500', 'bg-yellow-500 hover:bg-yellow-400'];
        const icons = ['▲', '◆', '●', '■'];
        return (
            <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
                <ConfettiPop show={showConfetti} />
                <FloatingScore show={showFloatScore} isCorrect={lastCorrect} />

                {/* Header */}
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <img src="/assets/tma_logo.png" alt="TMA" className="w-8 h-8 rounded-full border border-blue-400/40" />
                        <div>
                            <span className="text-xs text-slate-400 uppercase tracking-widest">PIN: {roomPin}</span>
                            <div className="font-bold text-white">{t.questionOf} {currentQuestion + 1} / {quizData.length}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Timer seconds={timeLeft} total={QUIZ_TIME} />
                        <div className="text-right">
                            <div className="text-xs text-slate-400">{t.yourScore}</div>
                            <div className="text-xl font-black text-emerald-400">{score}</div>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5">
                    <div
                        className="h-1.5 bg-blue-500 transition-all duration-500"
                        style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                    />
                </div>

                {/* Waiting bar */}
                {!isAnswered && (
                    <div className="bg-slate-700/80 text-center py-2 text-sm text-slate-300 border-b border-slate-600">
                        <i className="fa-solid fa-eye mr-2 text-blue-400"></i>
                        {t.readQuestion}
                    </div>
                )}

                {/* Answer buttons */}
                <div className="flex-1 grid grid-cols-2 gap-4 p-6">
                    {q.options.map((opt, i) => {
                        let cls = `${colors[i]} rounded-2xl p-6 text-white font-bold text-xl flex flex-col items-center justify-center gap-3 transition-all text-center shadow-lg `;
                        if (isAnswered) {
                            if (i === q.answer) cls += 'ring-4 ring-white scale-105 shadow-2xl';
                            else if (i === selectedOption) cls += 'opacity-40 grayscale';
                            else cls += 'opacity-30';
                        } else {
                            cls += 'hover:scale-105 active:scale-95';
                        }
                        return (
                            <button
                                key={i}
                                disabled={isAnswered}
                                onClick={() => handleAnswer(i)}
                                className={cls}
                            >
                                <span className="text-3xl">{icons[i]}</span>
                                <span className="text-base">{opt}</span>
                                {isAnswered && i === q.answer && <i className="fa-solid fa-check text-2xl"></i>}
                                {isAnswered && i === selectedOption && i !== q.answer && <i className="fa-solid fa-xmark text-2xl"></i>}
                            </button>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div className="p-6 bg-slate-800 border-t border-slate-700 text-center">
                        <p className="text-slate-300 text-sm mb-2">
                            {selectedOption === q.answer
                                ? <span className="text-emerald-400 font-bold"><i className="fa-solid fa-check mr-2"></i>{t.correctAnswer}</span>
                                : <span className="text-rose-400 font-bold"><i className="fa-solid fa-xmark mr-2"></i>{t.wrongAnswer}</span>
                            }
                        </p>
                        <p className="text-slate-500 text-xs">{t.waitForNext}</p>
                    </div>
                )}
            </div>
        );
    }

    // ── RACE MODE ─────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans flex">
            <ConfettiPop show={showConfetti} />
            <FloatingScore show={showFloatScore} isCorrect={lastCorrect} />

            {/* Main Quiz */}
            <div className="flex-1 p-6 overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <img src="/assets/tma_logo.png" alt="TMA" className="w-8 h-8 rounded-full border border-blue-400/40" />
                        <div>
                            <span className="text-xs text-slate-400 uppercase tracking-widest">🚀 Race • PIN {roomPin}</span>
                            <div className="text-lg font-bold text-white">{t.questionOf} {currentQuestion + 1} / {quizData.length}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Timer seconds={timeLeft} total={QUIZ_TIME} />
                        <div className="text-right">
                            <div className="text-xs text-slate-400">{t.yourScore}</div>
                            <div className="text-2xl font-black text-emerald-400">{score}</div>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-white mb-6 leading-relaxed">{q.question}</h3>

                    <div className="space-y-3 mb-6">
                        {q.options.map((opt, i) => {
                            let cls = 'w-full text-left p-5 rounded-xl border-2 font-bold transition-all duration-200 ';
                            if (!isAnswered) {
                                cls += selectedOption === i
                                    ? 'border-blue-500 bg-blue-500/10 text-white scale-[1.01]'
                                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700 hover:scale-[1.01]';
                            } else {
                                if (i === q.answer) cls += 'border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]';
                                else if (i === selectedOption) cls += 'border-rose-500 bg-rose-500/10 text-rose-400';
                                else cls += 'border-slate-800 bg-slate-800 text-slate-600 opacity-40';
                            }
                            return (
                                <button key={i} disabled={isAnswered} onClick={() => handleAnswer(i)} className={cls}>
                                    <span className="mr-3 text-slate-500">{String.fromCharCode(65 + i)}.</span>
                                    {opt}
                                    {isAnswered && i === q.answer && <i className="fa-solid fa-check float-right text-emerald-400 mt-1"></i>}
                                    {isAnswered && i === selectedOption && i !== q.answer && <i className="fa-solid fa-xmark float-right text-rose-400 mt-1"></i>}
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 mb-4">
                            <p className={`font-bold mb-2 text-sm ${lastCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                                <i className={`fa-solid ${lastCorrect ? 'fa-check' : 'fa-xmark'} mr-2`}></i>
                                {lastCorrect ? t.correctAnswer : t.wrongAnswer}
                            </p>
                            {q.explanation && (
                                <>
                                    <p className="text-blue-400 font-bold mb-1 text-xs">
                                        <i className="fa-solid fa-robot mr-2"></i>AI Explanation:
                                    </p>
                                    <p className="text-slate-300 text-sm leading-relaxed">{q.explanation}</p>
                                </>
                            )}
                            <button onClick={handleNext} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-95">
                                {currentQuestion + 1 < quizData.length ? `${t.questionOf} ${currentQuestion + 2} →` : t.quizFinished}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Sidebar Leaderboard */}
            <div className="w-64 bg-slate-800 border-l border-slate-700 p-4 hidden md:flex flex-col overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-ranking-star text-yellow-400"></i>
                    {t.liveRanking}
                </h3>
                <div className="space-y-2 flex-1">
                    {players.map((p, i) => (
                        <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${p.id === user?.uid ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-900/70 hover:bg-slate-700/50'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base w-6 text-center flex-shrink-0">
                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-slate-500 font-bold">#{i + 1}</span>}
                                </span>
                                <span className={`text-sm font-bold truncate ${p.id === user?.uid ? 'text-emerald-400' : 'text-slate-300'}`}>{p.name}</span>
                            </div>
                            <span className="text-sm font-black text-white ml-2 flex-shrink-0">{p.score || 0}</span>
                        </div>
                    ))}
                </div>
                {/* My rank badge */}
                {myRank > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700 text-center">
                        <div className="text-slate-400 text-xs mb-1">{t.rank}</div>
                        <div className="text-2xl font-black text-yellow-400">#{myRank}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveQuiz;
