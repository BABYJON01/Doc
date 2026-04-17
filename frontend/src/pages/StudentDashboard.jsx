import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy, collectionGroup } from 'firebase/firestore';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import LiveQuiz from './LiveQuiz';
import { useApp } from '../context/AppContext';

const StudentDashboard = ({ onNavigate, user }) => {
  const { t, lang } = useApp();

  const [xpHistory, setXpHistory] = useState([
    { day: 'Dush', xp: 1200 },
    { day: 'Sesh', xp: 1900 },
    { day: 'Chor', xp: 1700 },
    { day: 'Pay', xp: 2500 },
    { day: 'Jum', xp: 2100 }
  ]);
  const [proficiency, setProficiency] = useState([
    { subject: 'Kardiologiya', score: 85 },
    { subject: 'Farmakologiya', score: 45 },
    { subject: 'Anatomiya', score: 92 }
  ]);
  const [pinInput, setPinInput] = useState('');
  const [activePin, setActivePin] = useState(null);
  const [pinError, setPinError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [studentHistory, setStudentHistory] = useState([]);

  useEffect(() => {
    // Load local test history
    const history = JSON.parse(localStorage.getItem('student_history')) || [];
    setStudentHistory(history);

    const fetchData = async () => {
      if (!user?.uid) return;
      try {
        // Fetch real stats from Firestore if they exist
        const q = query(collection(db, "user_stats"), where("userId", "==", user.uid), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          if (data.xpHistory) setXpHistory(data.xpHistory);
          if (data.proficiency) setProficiency(data.proficiency);
        }

        // Fetch session history: find rooms where this user participated
        try {
          const sessionsSnap = await getDocs(
            query(collectionGroup(db, 'players'), where('__name__', '==', user.uid))
          );
          // Fallback: query leaderboard for past scores
          const lbSnap = await getDocs(
            query(collection(db, 'leaderboard'), where('__name__', '==', user.uid))
          );
          // We'll store sessions as array from the rooms/{any}/players/{uid}
          setSessions(sessionsSnap.docs.map(d => ({
            ...d.data(),
            pin: d.ref.parent.parent.id,
            id: d.id,
          })));
        } catch (sErr) {
          console.warn('Session history fetch error:', sErr);
        }

      } catch (err) {
        console.error("Firebase statistika xatoligi:", err);
      }
    };
    fetchData();
  }, [user]);

  const handleJoinLiveQuiz = () => {
    const cleaned = pinInput.replace(/\s/g, '');
    if (cleaned.length !== 6 || isNaN(cleaned)) {
      setPinError('PIN 6 ta raqamdan iborat bo\'lishi kerak!');
      return;
    }
    setPinError('');
    setActivePin(cleaned);
  };

  // If live quiz is active, show it full screen
  if (activePin) {
    return (
      <LiveQuiz
        user={user}
        roomPin={activePin}
        onFinish={() => { setActivePin(null); setPinInput(''); }}
      />
    );
  }


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 mb-20">
      {/* Header Profile & Stats */}
      <header className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mb-8 relative">
        <div className="flex items-center gap-4">
          <img
            src={user?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"}
            alt="Profile"
            className="w-16 h-16 rounded-full border-4 border-emerald-500 shadow-[0_0_15px_rgba(5,150,105,0.4)]"
          />
          <div>
            <h1 className="text-2xl font-bold">{user?.displayName || 'Talaba'}</h1>
            <p className="text-slate-400">{user?.email || ''}</p>
          </div>
        </div>
        
        <div className="flex gap-6 items-center">
          <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg font-bold text-sm transition-colors mr-4">
            <i className="fa-solid fa-right-from-bracket mr-2"></i> Chiqish
          </button>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Malaka Darajasi</p>
            <div className="text-2xl font-black text-blue-400 flex justify-center items-center gap-2">
              <i className="fa-solid fa-star"></i> 7-Daraja
            </div>
          </div>
          <div className="text-center border-l border-slate-600 pl-6">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Umumiy XP</p>
            <div className="text-2xl font-black text-emerald-400 flex justify-center items-center gap-2">
              <i className="fa-solid fa-fire"></i> 14,250
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* Left Column - Stats & Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* XP Growth Chart */}
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <i className="fa-solid fa-chart-line text-emerald-500"></i> Haftalik XP O'sishi
                </h3>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={xpHistory}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                         <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                         <YAxis stroke="#94a3b8" fontSize={12} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ color: '#10b981' }}
                         />
                         <Line type="monotone" dataKey="xp" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Proficiency Radar */}
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                   <i className="fa-solid fa-brain text-blue-500"></i> Fanlar bo'yicha mahorat
                </h3>
                <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={proficiency}>
                         <PolarGrid stroke="#334155" />
                         <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                         <Radar name="Skor" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-4"><i className="fa-solid fa-graduation-cap text-emerald-500 mr-2"></i> Mening Natijalarim (Portfolio)</h2>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 mb-8">
            {studentHistory.length > 0 ? (
                studentHistory.map((history, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-2xl p-5 border-l-4 border-emerald-500 shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded uppercase tracking-widest">{history.date}</span>
                                <h3 className="text-base font-bold text-white mt-1 leading-tight">{history.topic}</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-emerald-400">{history.score}<span className="text-slate-500 text-sm font-bold">/{history.total}</span></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest">
                                <span>O'zlashtirish</span>
                                <span>{history.percent}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${history.percent}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="bg-slate-800/50 rounded-2xl p-8 border border-dashed border-slate-700 text-center text-slate-500">
                    <i className="fa-solid fa-file-medical mb-3 text-3xl opacity-50 block"></i>
                    <p className="font-medium text-sm">Hali hech qanday imtihon topshirmadingiz.</p>
                </div>
            )}
          </div>

          {/* New Methodology Component Link */}
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl p-6 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] mt-8 flex justify-between items-center group cursor-pointer hover:border-blue-400 transition-all" onClick={() => window.location.href = '/methodology'}>
            <div>
               <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                 <i className="fa-solid fa-book-medical text-blue-400 group-hover:animate-bounce"></i> Metodik O'quv Materiallari
               </h3>
               <p className="text-sm text-blue-200/70">Arterial bosim o'lchash, Immobilizatsiya va Case-Study qo'llanmalari. (Bosib kiring)</p>
            </div>
            <div className="w-12 h-12 min-w-[3rem] rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
               <i className="fa-solid fa-arrow-right text-xl -rotate-45 group-hover:rotate-0 transition-transform"></i>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mt-8 mb-4"><i className="fa-solid fa-microscope text-emerald-500 mr-2"></i> Klinik Trening (Gamification)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => onNavigate('duel')} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-indigo-500 transition-colors text-left flex flex-col group">
               <i className="fa-solid fa-network-wired text-2xl text-indigo-400 mb-3 group-hover:scale-110 transition-transform origin-left"></i>
               <span className="font-bold text-lg text-white mb-1">Konsilium Rejimi (Duel)</span>
               <span className="text-slate-400 text-sm">Real vaqtda raqiblar bilan tasviriy diagnostika kuchi.</span>
            </button>
            <button className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-emerald-500 transition-colors text-left flex flex-col group">
               <i className="fa-solid fa-stethoscop text-2xl text-emerald-400 mb-3 group-hover:scale-110 transition-transform origin-left"></i>
               <span className="font-bold text-lg text-white mb-1">Yangi Case'lar</span>
               <span className="text-slate-400 text-sm">Mustaqil ravishda kunlik klinik keyslarni yechish (+50 XP).</span>
            </button>
          </div>
        </div>

        {/* Right Column - Gamification & AI */}
        <div className="space-y-6">
          {/* Live Quiz PIN Join Box */}
          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-800 rounded-2xl p-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-6">
            <h3 className="font-bold text-white mb-2 text-center text-lg">
               <i className="fa-solid fa-tower-broadcast text-emerald-400 mr-2 animate-pulse"></i> Live Quiz'ga ulanish
            </h3>
            <p className="text-xs text-slate-400 mb-4 text-center">
              O'qituvchi aytgan 6 xonali maxsus PIN kodni kiriting va poygaga qo'shiling.
            </p>
            <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-2 shadow-inner">
               <input 
                 type="text" 
                 value={pinInput}
                 onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                 placeholder="6 xonali PIN" 
                 className="flex-1 bg-transparent px-4 py-3 text-center text-2xl font-black text-emerald-400 tracking-[0.2em] outline-none w-full"
               />
            </div>
            {pinError && <p className="text-rose-400 text-xs text-center mb-2 font-bold">{pinError}</p>}
            <button 
              onClick={handleJoinLiveQuiz}
              disabled={pinInput.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 font-bold transition-all shadow-lg"
            >
              Ulanish <i className="fa-solid fa-arrow-right ml-1"></i>
            </button>
          </div>

          {/* Session History */}
          {sessions.length > 0 && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg mb-6">
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest"><i className="fa-solid fa-clock-rotate-left mr-2"></i> O'tgan sessiyalar</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {sessions.sort((a,b) => b.score - a.score).map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-700">
                    <div>
                      <div className="text-sm font-bold text-slate-300">PIN: {s.pin || 'Noma\'lum'}</div>
                      <div className="text-xs text-slate-500">{s.correct || 0} ta to'g'ri javob</div>
                    </div>
                    <div className="text-emerald-400 font-bold">+{s.score || 0} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="font-bold text-white mb-4 border-b border-slate-700 pb-3 flex justify-between items-center">
               <span><i className="fa-solid fa-layer-group text-rose-400 mr-2"></i> AI Flashcards (Xotira)</span>
               <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded">Yangi</span>
            </h3>
            <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-rose-500 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all relative overflow-hidden group">
               <div className="absolute top-0 right-0 bg-rose-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg">24 ta karta</div>
               <h4 className="text-lg font-bold text-slate-200 mb-2">Aritmologiya Asoslari</h4>
               <p className="text-xs text-slate-400 mb-4 line-clamp-2">"Leksiya 4: Yurak urish buzilishlari.docx" asosida AI tuzgan xotira kartalari.</p>
               <button onClick={() => window.location.href = '/test'} className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold py-2 px-6 rounded-full transition-colors opacity-90 group-hover:opacity-100">
                  Takrorlashni Boshlash
               </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
            <h3 className="font-bold text-white mb-4 text-center"><i className="fa-solid fa-medal text-yellow-400 mr-2"></i> So'nggi Yutuqlar</h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-yellow-500 transition-colors">
                  <div className="flex items-center gap-3">
                     <i className="fa-solid fa-shield-cat text-2xl text-yellow-500"></i>
                     <span className="text-sm font-bold text-slate-300">Diagnostika Ustasi</span>
                  </div>
                  <span className="text-xs text-emerald-400">+500 XP</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-rose-500 transition-colors">
                  <div className="flex items-center gap-3">
                     <i className="fa-solid fa-fire text-2xl text-rose-500"></i>
                     <span className="text-sm font-bold text-slate-300">7 kun uzluksiz!</span>
                  </div>
                  <span className="text-xs text-emerald-400">+1000 XP</span>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;

