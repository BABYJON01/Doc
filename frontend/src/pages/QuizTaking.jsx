import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc, getDoc, serverTimestamp, addDoc, increment } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';

const QuizTaking = ({ onFinish, user }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [quizData, setQuizData] = useState(null);
    const [searchParams] = useSearchParams();
    const examId = searchParams.get('id');

    const userName = user?.displayName || user?.email?.split('@')[0] || "Siz";

    useEffect(() => {
        // Fetch Exam Data
        const fetchExamData = async () => {
            if (examId) {
                try {
                    const docSnap = await getDoc(doc(db, "exams", examId));
                    if (docSnap.exists()) {
                        const payload = docSnap.data().data;
                        setQuizData(payload.tests || payload.quizzes || []);
                    } else {
                        setQuizData([]);
                    }
                } catch (e) {
                    console.error("Failed to fetch exam", e);
                    setQuizData([]);
                }
            } else {
                setQuizData(JSON.parse(localStorage.getItem('generated_quiz')) || [
                    {
                        question: "Qaysi biri EKGda miokard infarktini yorqin anglatuvchi signal hisoblanadi?",
                        options: ["ST elevatsiyasi", "P tishchasi yo'qolishi", "QRS ingichkaligi", "T tishchasi inverted emas"],
                        answer: 0,
                        explanation: "Miokard shikastlanishi darhol ST segment ko'tarilishiga olib keladi. Bu o'tkir infarktning klassik belgisidir.",
                        topic: "Kardiologiya",
                        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/12_lead_ECG_of_inferior_STEMI.svg/1024px-12_lead_ECG_of_inferior_STEMI.svg.png"
                    }
                ]);
            }
        };
        fetchExamData();

        // Real-time listener for the leaderboard from Firestore, isolated by exam
        const leaderboardRef = examId ? collection(db, "exams", examId, "leaderboard") : collection(db, "leaderboard");
        const q = query(leaderboardRef, orderBy("score", "desc"), limit(10));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const players = [];
            querySnapshot.forEach((doc) => {
                players.push({ id: doc.id, ...doc.data() });
            });
            setLeaderboard(players);
        });

        return () => unsubscribe();
    }, [examId]);

    if (!quizData) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500"></i></div>;
    }

    if (quizData.length === 0) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><p>Ushbu imtihon majmuasi topilmadi (Yoki testlar yo'q).</p></div>;
    }

    const currentQ = quizData[currentQuestion];

    const updateScoreInFirebase = async (newScore) => {
        if (!user?.uid) return;
        try {
            const leaderboardRef = examId ? collection(db, "exams", examId, "leaderboard") : collection(db, "leaderboard");
            await setDoc(doc(leaderboardRef, user.uid), {
                name: userName,
                score: newScore * 100,
                status: "yechmoqda...",
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.error("Firebase Update Error:", e);
        }
    };

    const handleOptionSelect = (index) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        const isCorrect = index === currentQ.answer;
        if (isCorrect) {
            const newScore = score + 1;
            setScore(newScore);
            updateScoreInFirebase(newScore);
        }
    };

    const handleNext = () => {
        if (currentQuestion + 1 < quizData.length) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResults(true);

            // Record to Firestore instead of localStorage
            if (user?.uid) {
                const totalQ = quizData.length;
                const percent = Math.round((score / totalQ) * 100);
                const xpEarned = score * 10;
                
                // Add to student_results collection
                addDoc(collection(db, 'student_results'), {
                    userId: user.uid,
                    topic: currentQ.topic || "Mavzulashtirilgan Diagnostika",
                    score: score,
                    total: totalQ,
                    percent: percent,
                    xpEarned: xpEarned,
                    createdAt: serverTimestamp(),
                    dateText: new Date().toLocaleDateString("en-GB")
                }).catch(err => console.error("Error saving result:", err));

                // Update total stats in user_stats
                setDoc(doc(db, 'user_stats', user.uid), {
                    userId: user.uid,
                    totalXP: increment(xpEarned),
                    totalTests: increment(1),
                    totalScoreSum: increment(percent),
                    lastActive: serverTimestamp()
                }, { merge: true }).catch(err => console.error("Error updating stats:", err));

                // Submit final score status for exam leaderboard
                const leaderboardRef = examId ? collection(db, "exams", examId, "leaderboard") : collection(db, "leaderboard");
                setDoc(doc(leaderboardRef, user.uid), {
                    status: "tugatdi",
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        }
    };


    if (showResults) {
        const percent = Math.round((score / quizData.length) * 100);
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 flex flex-col items-center justify-center">
                <div className="max-w-xl w-full bg-slate-800 rounded-2xl p-6 sm:p-8 border-t-4 border-emerald-500 shadow-2xl text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-graduation-cap text-2xl text-emerald-400"></i>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1">Test Yakunlandi!</h1>
                    <p className="text-slate-400 text-sm mb-6">Natijangiz hisoblandi</p>
                    
                    <div className="flex justify-center items-center gap-6 mb-6">
                        <div className="text-center">
                            <div className="text-4xl sm:text-5xl font-black text-emerald-400 mb-1">{score}/{quizData.length}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Natijangiz</div>
                        </div>
                        <div className="w-px h-12 bg-slate-700"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-1">{percent}%</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">O'zlashtirish</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
                        <div
                            className={`h-2 rounded-full transition-all duration-700 ${percent >= 70 ? 'bg-emerald-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    {score < quizData.length && (
                        <div className="bg-slate-900 rounded-xl p-4 border border-rose-500/30 text-left mb-6">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-notes-medical text-rose-500"></i> AI Tavsiyasi
                            </h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                Groq AI tahlili: Ba'zi savollarda noto'g'ri javob tanladingiz. Mavzuni qayta ko'rib chiqishni maslahat beramiz.
                            </p>
                        </div>
                    )}

                    <button onClick={onFinish} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                        <i className="fa-solid fa-house mr-2"></i> Bosh sahifaga qaytish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col lg:flex-row text-sm">
            
            {/* Main Quiz Area */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
                    <div className="flex-1 min-w-0 mr-3">
                        <h2 className="text-sm sm:text-base font-bold text-slate-300 truncate">
                            {currentQ.topic ? `Mavzu: ${currentQ.topic}` : 'AI Test'}
                        </h2>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-xl sm:text-2xl font-black text-white">
                            {currentQuestion + 1} <span className="text-slate-500 text-base">/ {quizData.length}</span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-bold">{score} to'g'ri</div>
                    </div>
                </header>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
                    <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${((currentQuestion) / quizData.length) * 100}%` }}
                    />
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">{currentQ.question}</h3>
                    
                    {currentQ.image && (
                        <div className="w-full bg-slate-100 rounded-xl overflow-hidden flex justify-center">
                            <img src={currentQ.image} alt="Medical" className="max-h-48 sm:max-h-64 object-contain opacity-90 mix-blend-multiply" />
                        </div>
                    )}

                    <div className="space-y-2 sm:space-y-3">
                        {currentQ.options.map((option, idx) => {
                            let btnClass = "w-full text-left p-4 rounded-xl border-2 font-semibold transition-all text-sm sm:text-base ";
                            if (!isAnswered) {
                                btnClass += selectedOption === idx
                                    ? "border-blue-500 bg-blue-500/10 text-white"
                                    : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700";
                            } else {
                                if (idx === currentQ.answer) btnClass += "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                                else if (idx === selectedOption) btnClass += "border-rose-500 bg-rose-500/10 text-rose-400";
                                else btnClass += "border-slate-800 bg-slate-800 text-slate-600 opacity-40";
                            }

                            return (
                                <button key={idx} disabled={isAnswered} onClick={() => handleOptionSelect(idx)} className={btnClass}>
                                    <span className="mr-2 text-slate-500 font-black">{String.fromCharCode(65 + idx)}.</span> {option}
                                    {isAnswered && idx === currentQ.answer && <i className="fa-solid fa-check float-right text-emerald-400 mt-1"></i>}
                                    {isAnswered && idx === selectedOption && idx !== currentQ.answer && <i className="fa-solid fa-xmark float-right text-rose-400 mt-1"></i>}
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <div className="p-4 sm:p-6 bg-slate-800 rounded-xl border border-slate-700 animate-[fadeIn_0.4s_ease-out]">
                            <h4 className="font-bold text-blue-400 mb-2 text-sm"><i className="fa-solid fa-robot mr-2"></i> AI Izohi:</h4>
                            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">{currentQ.explanation}</p>
                            <button onClick={handleNext} className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm">
                                {currentQuestion + 1 < quizData.length ? <>Keyingi Savol <i className="fa-solid fa-arrow-right ml-1"></i></> : 'Yakunlash'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar — only on large screens */}
            <div className="w-72 bg-slate-800 border-l border-slate-700 p-5 hidden lg:flex flex-col">
                <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs flex items-center gap-2">
                    <i className="fa-solid fa-tower-broadcast text-rose-500 animate-pulse"></i> Jonli Reyting
                </h3>
                
                <div className="space-y-3 flex-1 overflow-y-auto">
                    {leaderboard.length > 0 ? (
                        [...leaderboard].sort((a,b) => b.score - a.score).map((player, idx) => (
                            <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center ${player.name === userName ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-900/50'}`}>
                                <div>
                                    <div className={`font-bold text-sm ${player.name === userName ? 'text-blue-400' : 'text-slate-300'}`}>
                                        #{idx+1} {player.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500">{player.status}</div>
                                </div>
                                <div className="text-lg font-black text-emerald-400">{player.score}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-600 italic text-sm">Reyting yuklanmoqda...</div>
                    )}
                </div>

                <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-700">
                    <div className="text-[10px] text-slate-400 font-bold mb-2">Guruh nisbati</div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-1.5 rounded-full w-[85%]"></div>
                    </div>
                    <div className="text-[10px] text-right text-slate-400 mt-1">85%</div>
                </div>
            </div>

            {/* Mobile bottom leaderboard strip */}
            {leaderboard.length > 0 && (
                <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-2 flex items-center gap-3 overflow-x-auto">
                    <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">
                        <i className="fa-solid fa-trophy text-yellow-500 mr-1"></i>Top:
                    </span>
                    {[...leaderboard].sort((a,b) => b.score - a.score).slice(0, 5).map((player, idx) => (
                        <div key={idx} className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold ${player.name === userName ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                            <span>#{idx+1}</span>
                            <span>{player.name.split(' ')[0]}</span>
                            <span className="text-emerald-400">{player.score}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuizTaking;

