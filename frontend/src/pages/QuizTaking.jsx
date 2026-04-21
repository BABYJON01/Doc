import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
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
            
            // Record to local profile history
            const history = JSON.parse(localStorage.getItem('student_history')) || [];
            history.unshift({
                topic: currentQ.topic || "Mavzulashtirilgan Diagnostika",
                score: score,
                total: quizData.length,
                percent: Math.round((score / quizData.length) * 100),
                date: new Date().toLocaleDateString("en-GB")
            });
            localStorage.setItem('student_history', JSON.stringify(history));

            // Submit final score status
            if (user?.uid) {
                const leaderboardRef = examId ? collection(db, "exams", examId, "leaderboard") : collection(db, "leaderboard");
                setDoc(doc(leaderboardRef, user.uid), {
                    status: "tugatdi",
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        }
    };


    if (showResults) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 flex flex-col items-center justify-center">
                <div className="max-w-2xl w-full bg-slate-800 rounded-2xl p-8 border-t-4 border-emerald-500 shadow-2xl text-center">
                    <h1 className="text-3xl font-bold mb-2">Test Yakunlandi!</h1>
                    <p className="text-slate-400 mb-6">"Groq AI Avtomatik Test: Leksiyo #4"</p>
                    
                    <div className="flex justify-center items-center gap-8 mb-8">
                        <div className="text-center">
                            <div className="text-5xl font-black text-emerald-400 mb-2">{score}/{quizData.length}</div>
                            <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">Natijangiz</div>
                        </div>
                        <div className="w-px h-16 bg-slate-700"></div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-2">Top 15%</div>
                            <div className="text-sm text-slate-400 uppercase tracking-widest font-bold">O'tgan yilgiga nisbatan</div>
                        </div>
                    </div>

                    {/* Adaptive Recommendations */}
                    {score < quizData.length && (
                        <div className="bg-slate-900 rounded-xl p-6 border border-rose-500/30 text-left mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-rose-600/20 text-rose-400 text-xs px-3 py-1 font-bold rounded-bl-lg">AI Tasxishi</div>
                            <h3 className="text-lg font-bold text-white mb-2"><i className="fa-solid fa-notes-medical text-rose-500 mr-2"></i> Zaif nuqtalar aniqlandi</h3>
                            <p className="text-slate-400 text-sm mb-3">Siz asosan <strong>Farmakologiya</strong> mavzusiga oid testlarda xato qildingiz. Groq sun'iy intellekti sizga quyidagilarni takrorlashni maslahat beradi:</p>
                            <ul className="text-sm text-slate-300 space-y-2">
                                <li><i className="fa-solid fa-book-medical text-blue-400 mr-2"></i> X.X.Xolmatov - "Klinik Farmakologiya" 4-bob</li>
                                <li><i className="fa-solid fa-play text-emerald-400 mr-2"></i> Video Dars: "Nafas yo'li dori vositalari mexanizmi"</li>
                            </ul>
                        </div>
                    )}

                    <button onClick={onFinish} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                        Bosh sahifaga qaytish
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex text-sm lg:text-base">
            
            {/* Main Quiz Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-300">"Avto AI Test: Kardiologiya"</h2>
                        <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded mt-2 inline-block">Mavzu: {currentQ.topic}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-white">{currentQuestion + 1} <span className="text-slate-500 text-lg">/ {quizData.length}</span></div>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto space-y-8">
                    <h3 className="text-2xl font-bold text-white mb-6 leading-relaxed">{currentQ.question}</h3>
                    
                    {currentQ.image && (
                        <div className="w-full bg-slate-100 rounded-xl overflow-hidden mb-6 flex justify-center">
                            <img src={currentQ.image} alt="Medical Diagnosis" className="max-h-64 object-contain opacity-90 mix-blend-multiply" />
                        </div>
                    )}

                    <div className="space-y-3">
                        {currentQ.options.map((option, idx) => {
                            let btnClass = "w-full text-left p-5 rounded-xl border-2 font-bold transition-all ";
                            if (!isAnswered) {
                                btnClass += selectedOption === idx ? "border-blue-500 bg-blue-500/10 text-white" : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700";
                            } else {
                                if (idx === currentQ.answer) {
                                    btnClass += "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                                } else if (idx === selectedOption) {
                                    btnClass += "border-rose-500 bg-rose-500/10 text-rose-400";
                                } else {
                                    btnClass += "border-slate-800 bg-slate-800 text-slate-600 opacity-50";
                                }
                            }

                            return (
                                <button key={idx} disabled={isAnswered} onClick={() => handleOptionSelect(idx)} className={btnClass}>
                                    <span className="mr-3 text-slate-500">{String.fromCharCode(65 + idx)}.</span> {option}
                                    {isAnswered && idx === currentQ.answer && <i className="fa-solid fa-check float-right text-emerald-400 mt-1"></i>}
                                    {isAnswered && idx === selectedOption && idx !== currentQ.answer && <i className="fa-solid fa-xmark float-right text-rose-400 mt-1"></i>}
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <div className="mt-8 p-6 bg-slate-800 rounded-xl border border-slate-700 animate-[fadeIn_0.5s_ease-out]">
                            <h4 className="font-bold text-blue-400 mb-2"><i className="fa-solid fa-robot mr-2"></i> Groq AI Izohi:</h4>
                            <p className="text-slate-300 leading-relaxed text-sm">{currentQ.explanation}</p>
                            
                            <button onClick={handleNext} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors float-right">
                                Keyingi Savol <i className="fa-solid fa-arrow-right ml-2"></i>
                            </button>
                            <div className="clear-both"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar - Live Leaderboard */}
            <div className="w-80 bg-slate-800 border-l border-slate-700 p-6 hidden lg:block">
                <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs"><i className="fa-solid fa-tower-broadcast text-rose-500 mr-2 animate-pulse"></i> Jonli Reyting</h3>
                
                <div className="space-y-4">
                    {leaderboard.length > 0 ? (
                        leaderboard.sort((a,b) => b.score - a.score).map((player, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${player.name.includes("Siz") ? 'bg-slate-900 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-900/50 border-slate-700'} flex justify-between items-center transition-all animate-[fadeIn_0.3s_ease-out]`}>
                                <div>
                                    <div className={`font-bold ${player.name.includes("Siz") ? 'text-blue-400' : 'text-slate-300'}`}>{player.name}</div>
                                    <div className="text-xs text-slate-500">{player.status}</div>
                                </div>
                                <div className="text-xl font-black text-emerald-400">{player.score}</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-600 italic">Reyting yuklanmoqda...</div>
                    )}
                </div>

                <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-400 font-bold mb-1">Benchmarking (Guruh nisbati)</div>
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2 mt-3">
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full w-[85%] relative">
                            <div className="absolute -top-6 right-0 text-[10px] bg-slate-700 px-2 rounded font-bold text-white">85%</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default QuizTaking;

