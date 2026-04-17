import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection
} from 'firebase/firestore';

const LiveQuiz = ({ user, roomPin, onFinish }) => {
    const [roomData, setRoomData] = useState(null);
    const [status, setStatus] = useState('joining'); // joining → lobby → active → finished
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [answers, setAnswers] = useState({});
    const [players, setPlayers] = useState([]);
    const [localFinished, setLocalFinished] = useState(false);
    const [error, setError] = useState('');

    const userName = user?.displayName || user?.email?.split('@')[0] || 'Talaba';

    // Register player in room on mount
    useEffect(() => {
        if (!roomPin || !user) return;

        const joinRoom = async () => {
            try {
                const roomRef = doc(db, 'rooms', roomPin);
                const roomSnap = await new Promise(resolve => {
                    const unsub = onSnapshot(roomRef, snap => {
                        resolve(snap);
                        unsub();
                    });
                });

                if (!roomSnap.exists()) {
                    setError('Xona topilmadi. PIN kodni tekshiring.');
                    return;
                }

                const data = roomSnap.data();
                if (data.status === 'finished') {
                    setError('Bu o\'yin allaqachon tugagan.');
                    return;
                }

                setRoomData(data);

                // Register this player
                await setDoc(doc(db, `rooms/${roomPin}/players`, user.uid), {
                    name: userName,
                    score: 0,
                    correct: 0,
                    answers: {},
                    joinedAt: serverTimestamp(),
                }, { merge: true });

                setStatus(data.status === 'lobby' ? 'lobby' : 'active');
            } catch (e) {
                setError('Xonaga ulashda muammo bo\'ldi.');
                console.error(e);
            }
        };

        joinRoom();
    }, [roomPin, user]);

    // Listen to room changes
    useEffect(() => {
        if (!roomPin) return;
        const unsubscribe = onSnapshot(doc(db, 'rooms', roomPin), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setRoomData(data);

            if (data.status === 'active' && status === 'lobby') {
                setStatus('active');
            }
            if (data.status === 'finished') {
                if (!localFinished) setStatus('finished');
            }
            // Classic mode: teacher pushes next question
            if (data.mode === 'classic' && data.currentQuestion !== undefined) {
                setCurrentQuestion(data.currentQuestion);
                setSelectedOption(null);
                setIsAnswered(false);
            }
        });
        return () => unsubscribe();
    }, [roomPin, status, localFinished]);

    // Listen to players for leaderboard
    useEffect(() => {
        if (!roomPin) return;
        const unsubscribe = onSnapshot(collection(db, `rooms/${roomPin}/players`), (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            setPlayers(list);
        });
        return () => unsubscribe();
    }, [roomPin]);

    const handleAnswer = async (idx) => {
        if (isAnswered || !roomData) return;

        const quizData = roomData.quizData;
        const q = quizData[currentQuestion];
        const isCorrect = idx === q.answer;

        setSelectedOption(idx);
        setIsAnswered(true);

        const newAnswers = { ...answers, [currentQuestion]: idx };
        const newScore = isCorrect ? score + 100 : score;
        const newCorrect = isCorrect ? correctCount + 1 : correctCount;

        setAnswers(newAnswers);
        setScore(newScore);
        setCorrectCount(newCorrect);

        // Update Firebase
        await updateDoc(doc(db, `rooms/${roomPin}/players`, user.uid), {
            score: newScore,
            correct: newCorrect,
            answers: newAnswers,
            lastAnsweredAt: serverTimestamp(),
        });
    };

    const handleNext = () => {
        if (!roomData) return;
        const nextQ = currentQuestion + 1;

        if (nextQ >= roomData.quizData.length) {
            // Save final result with timestamp
            updateDoc(doc(db, `rooms/${roomPin}/players`, user.uid), {
                finishedAt: serverTimestamp(),
                status: 'finished',
            });
            setLocalFinished(true);
            setStatus('finished');
        } else {
            setCurrentQuestion(nextQ);
            setSelectedOption(null);
            setIsAnswered(false);
        }
    };

    // === ERROR ===
    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-3">{error}</h2>
                    <button onClick={onFinish} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors">
                        Qaytish
                    </button>
                </div>
            </div>
        );
    }

    // === LOADING ===
    if (!roomData) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Xonaga ulanilmoqda... PIN: {roomPin}</p>
                </div>
            </div>
        );
    }

    // === LOBBY  ===
    if (status === 'lobby') {
        return (
            <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="relative mb-8">
                        <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] flex items-center justify-center mx-auto animate-pulse">
                            <i className="fa-solid fa-hourglass-half text-4xl text-emerald-400"></i>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold mb-3">Xonaga muvaffaqiyatli kirdingiz!</h1>
                    <p className="text-slate-400 mb-6">O'qituvchi o'yinni boshlaganini kuting...</p>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
                        <div className="text-slate-400 text-sm mb-2">Sizning ismingiz:</div>
                        <div className="text-2xl font-bold text-white">{userName}</div>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                        <div className="text-slate-400 text-sm mb-3">Kutish zalida ({players.length} kishi):</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {players.map((p, i) => (
                                <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${p.id === user.uid ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                    {p.name} {p.id === user.uid ? '(Siz)' : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const quizData = roomData.quizData;

    // === FINISHED ===
    if (status === 'finished') {
        const myRank = players.findIndex(p => p.id === user.uid) + 1;
        return (
            <div className="min-h-screen bg-slate-900 text-white font-sans p-6 flex flex-col items-center justify-center">
                <div className="max-w-xl w-full text-center">
                    <div className="text-6xl mb-4">
                        {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎉'}
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Test Yakunlandi!</h1>
                    <p className="text-slate-400 mb-8">Sizning natijangiz saqlab qo'yildi</p>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                            <div className="text-3xl font-black text-emerald-400 mb-1">{score}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest">Ball</div>
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                            <div className="text-3xl font-black text-blue-400 mb-1">{correctCount}/{quizData.length}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest">To'g'ri</div>
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
                            <div className="text-3xl font-black text-yellow-400 mb-1">#{myRank || '?'}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest">O'rin</div>
                        </div>
                    </div>

                    {/* Top 5 leaderboard */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mb-6">
                        <div className="bg-slate-700/50 px-5 py-3 border-b border-slate-700">
                            <h3 className="font-bold text-white">Yakuniy Reyting</h3>
                        </div>
                        {players.slice(0, 5).map((p, i) => (
                            <div key={p.id} className={`flex items-center justify-between px-5 py-3 border-b border-slate-700/50 ${p.id === user.uid ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                    <span className={`font-bold ${p.id === user.uid ? 'text-emerald-400' : 'text-white'}`}>
                                        {p.name} {p.id === user.uid ? '(Siz)' : ''}
                                    </span>
                                </div>
                                <span className="font-black text-white">{p.score || 0}</span>
                            </div>
                        ))}
                    </div>

                    <button onClick={onFinish} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                        Talaba paneliga qaytish
                    </button>
                </div>
            </div>
        );
    }

    // === ACTIVE ===
    const q = quizData[currentQuestion];
    const isClassic = roomData.mode === 'classic';

    // Classic mode: only show buttons for student
    if (isClassic) {
        const colors = ['bg-red-600 hover:bg-red-500', 'bg-blue-600 hover:bg-blue-500', 'bg-emerald-600 hover:bg-emerald-500', 'bg-yellow-500 hover:bg-yellow-400'];
        const icons = ['▲', '◆', '●', '■'];
        return (
            <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
                {/* Header */}
                <div className="bg-slate-800 px-6 py-4 flex justify-between items-center border-b border-slate-700">
                    <div>
                        <span className="text-xs text-slate-400 uppercase tracking-widest">PIN: {roomPin}</span>
                        <div className="font-bold text-white">Savol {currentQuestion + 1} / {quizData.length}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Ball</div>
                        <div className="text-xl font-black text-emerald-400">{score}</div>
                    </div>
                </div>

                {/* Waiting bar */}
                {!isAnswered && (
                    <div className="bg-slate-700 text-center py-2 text-sm text-slate-300">
                        <i className="fa-solid fa-eye mr-2 text-blue-400"></i>
                        Savolni katta ekrandan o'qing va javobni tanlang
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
                                ? <span className="text-emerald-400 font-bold"><i className="fa-solid fa-check mr-2"></i>To'g'ri! +100 ball</span>
                                : <span className="text-rose-400 font-bold"><i className="fa-solid fa-xmark mr-2"></i>Xato! 0 ball</span>
                            }
                        </p>
                        <p className="text-slate-500 text-xs">O'qituvchi keyingi savolga o'tishini kuting...</p>
                    </div>
                )}
            </div>
        );
    }

    // Race mode: full question visible on student device
    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans flex">
            {/* Main Quiz */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                    <div>
                        <span className="text-xs text-slate-400 uppercase tracking-widest">🚀 Erkin Poyga • PIN {roomPin}</span>
                        <div className="text-lg font-bold text-white">Savol {currentQuestion + 1} / {quizData.length}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-400">Ballingiz</div>
                        <div className="text-2xl font-black text-emerald-400">{score}</div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="mb-4">
                        <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-6 leading-relaxed">{q.question}</h3>

                    <div className="space-y-3 mb-6">
                        {q.options.map((opt, i) => {
                            let cls = 'w-full text-left p-5 rounded-xl border-2 font-bold transition-all ';
                            if (!isAnswered) {
                                cls += selectedOption === i
                                    ? 'border-blue-500 bg-blue-500/10 text-white'
                                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700';
                            } else {
                                if (i === q.answer) cls += 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
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
                            <p className="text-blue-400 font-bold mb-2 text-sm"><i className="fa-solid fa-robot mr-2"></i>Groq AI Izohi:</p>
                            <p className="text-slate-300 text-sm leading-relaxed">{q.explanation}</p>
                            <button onClick={handleNext} className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                                {currentQuestion + 1 < quizData.length ? 'Keyingi Savol →' : 'Testni Tugatish'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Sidebar Leaderboard */}
            <div className="w-64 bg-slate-800 border-l border-slate-700 p-4 hidden md:block overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    <i className="fa-solid fa-ranking-star text-yellow-400 mr-2"></i>Jonli Reyting
                </h3>
                <div className="space-y-2">
                    {players.map((p, i) => (
                        <div key={p.id} className={`flex items-center justify-between p-2 rounded-lg ${p.id === user.uid ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-900/70'}`}>
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-slate-500 w-5">#{i + 1}</span>
                                <span className={`text-sm font-bold truncate ${p.id === user.uid ? 'text-emerald-400' : 'text-slate-300'}`}>{p.name}</span>
                            </div>
                            <span className="text-sm font-black text-white ml-2">{p.score || 0}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LiveQuiz;
