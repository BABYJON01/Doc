import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, collectionGroup, onSnapshot, doc, orderBy } from 'firebase/firestore';

import LiveQuiz from './LiveQuiz';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import { useLocation } from 'react-router-dom';
import StudentCourses from './StudentCourses';

// ── Chart day labels per language ─────────────────────────
const dayLabels = {
  uz: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
};

// ── Proficiency subjects per language ─────────────────────
const proficiencyData = {
  uz: [
    { subject: 'Travmatologiya', score: 88 },
    { subject: 'Farmakologiya', score: 52 },
    { subject: 'Anatomiya',     score: 94 },
  ],
  ru: [
    { subject: 'Травматология', score: 88 },
    { subject: 'Фармакология',  score: 52 },
    { subject: 'Анатомия',      score: 94 },
  ],
  en: [
    { subject: 'Traumatology', score: 88 },
    { subject: 'Pharmacology', score: 52 },
    { subject: 'Anatomy',      score: 94 },
  ],
};

const StudentDashboard = ({ user, onLogout }) => {
  const { t, lang, theme } = useApp();
  const isDark = theme === 'dark';
  const isAdmin = user?.email === 'rahmonjonwarrior@gmail.com';
  const location = useLocation();
  const path = location.pathname;

  const days = dayLabels[lang] || dayLabels.uz;
  const [xpHistory] = useState([
    { day: days[0], xp: 1200 },
    { day: days[1], xp: 1900 },
    { day: days[2], xp: 1700 },
    { day: days[3], xp: 2500 },
    { day: days[4], xp: 2100 },
  ]);

  const proficiency = proficiencyData[lang] || proficiencyData.uz;

  const [pinInput,      setPinInput]      = useState('');
  const [activePin,     setActivePin]     = useState(null);
  const [pinError,      setPinError]      = useState('');
  const [sessions,      setSessions]      = useState([]);
  const [studentHistory, setStudentHistory] = useState([]);

  const [stats, setStats] = useState({ totalXP: 0, totalTests: 0, avgScore: 0 });

  useEffect(() => {
    if (!user?.uid) return;

    // Listen to real-time student history
    const resultsQuery = query(
      collection(db, 'student_results'),
      where('userId', '==', user.uid)
      // Removed orderBy to prevent missing index errors on Firebase
    );
    
    const unsubResults = onSnapshot(resultsQuery, (snapshot) => {
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudentHistory(history);
    }, (err) => console.error("Error fetching results history:", err));

    // Listen to overall user stats
    const unsubStats = onSnapshot(doc(db, 'user_stats', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const totalTests = data.totalTests || 0;
        const totalScoreSum = data.totalScoreSum || 0;
        setStats({
          totalXP: data.totalXP || 0,
          totalTests: totalTests,
          avgScore: totalTests > 0 ? Math.round(totalScoreSum / totalTests) : 0
        });
      }
    }, (err) => console.error("Error fetching user stats:", err));

    const fetchData = async () => {
      if (!user?.uid) return;
      try {
        const q = query(collection(db, 'user_stats'), where('userId', '==', user.uid), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          // user_stats loaded (future: update charts here)
        }

        try {
          const sessionsSnap = await getDocs(
            query(collectionGroup(db, 'players'), where('uid', '==', user.uid))
          );
          setSessions(sessionsSnap.docs.map(d => ({
            ...d.data(),
            pin: d.ref.parent.parent.id,
            id: d.id,
          })));
        } catch (sErr) {
          console.warn('Session history fetch error:', sErr);
        }
      } catch (err) {
        console.error('Firebase stats error:', err);
      }
    };
    fetchData();

    return () => {
      unsubResults && unsubResults();
      unsubStats && unsubStats();
    };
  }, [user]);

  const handleJoinLiveQuiz = () => {
    const cleaned = pinInput.replace(new RegExp('\\s', 'g'), '');
    if (cleaned.length !== 6 || isNaN(cleaned)) {
      setPinError(t.liveQuizPinError);
      return;
    }
    setPinError('');
    setActivePin(cleaned);
  };

  // ── Full-screen Live Quiz ────────────────────────────────
  if (activePin) {
    return (
      <LiveQuiz
        user={user}
        roomPin={activePin}
        onFinish={() => { setActivePin(null); setPinInput(''); }}
      />
    );
  }

  // ════════════════════════════════════════════════════════
  return (
    <DashboardLayout role="student" user={user} onLogout={onLogout}>
      <div className="p-4 sm:p-6 pb-20">
        
        {path === '/student/courses' && <StudentCourses user={user} />}
        
        {path === '/student/portfolio' && (
            <div className={`rounded-2xl p-10 text-center border shadow-xl max-w-2xl mx-auto mt-10 ${isDark ? 'bg-slate-800/80 backdrop-blur-xl border-slate-700/50' : 'bg-white/50 backdrop-blur-xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                <i className="fa-solid fa-ranking-star text-6xl text-blue-500 mb-6 drop-shadow-lg"></i>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{lang === 'ru' ? 'Ваши Достижения' : 'Sizning Yutuqlaringiz'}</h2>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{lang === 'ru' ? 'Эта страница находится в разработке.' : 'Ushbu sahifa tez kunda aktivlashadi.'}</p>
            </div>
        )}

        {path === '/student/live' && (
            <div className="max-w-lg mx-auto mt-10">
                <div className="rounded-2xl border border-emerald-500/30 overflow-hidden shadow-[0_0_35px_rgba(16,185,129,0.12)]" style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.4) 0%, rgba(15,23,42,0.95) 100%)' }}>
                    <div className="flex items-center gap-3 px-6 py-5 border-b border-emerald-500/20 bg-emerald-600/10">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <i className="fa-solid fa-tower-broadcast text-emerald-400 animate-pulse text-xl"></i>
                        </div>
                        <div>
                            <h2 className="font-black text-white text-lg">{t.liveQuizTitle}</h2>
                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Med-Zukkoo Live</div>
                        </div>
                    </div>
                    <div className="p-6">
                        <p className="text-sm text-slate-400 mb-6 text-center">{t.liveQuizDesc}</p>
                        <div
                            className="flex rounded-xl overflow-hidden mb-3 shadow-inner border transition-all"
                            style={{
                                background: 'rgba(15,23,42,0.8)',
                                borderColor: pinInput.length === 6 ? '#10b981' : '#334155',
                                boxShadow: pinInput.length === 6 ? '0 0 15px rgba(16,185,129,0.25)' : 'none',
                            }}
                        >
                            <input
                                type="text" inputMode="numeric"
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value.replace(new RegExp('[^0-9]', 'g'), '').slice(0, 6))}
                                placeholder={t.liveQuizPinPlaceholder}
                                className="flex-1 bg-transparent px-4 py-4 text-center text-3xl font-black tracking-[0.4em] outline-none w-full"
                                style={{ color: pinInput.length === 6 ? '#10b981' : '#94a3b8' }}
                                onKeyDown={(e) => e.key === 'Enter' && pinInput.length === 6 && handleJoinLiveQuiz()}
                            />
                        </div>
                        <div className="flex justify-center gap-2 mb-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                    i < pinInput.length ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.7)]' : 'bg-slate-700'
                                }`} />
                            ))}
                        </div>
                        {pinError && <p className="text-rose-400 text-xs text-center mb-3 font-bold">{pinError}</p>}
                        <button
                            onClick={handleJoinLiveQuiz}
                            disabled={pinInput.length !== 6}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold transition-all shadow-lg hover:shadow-emerald-900/50 flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-arrow-right-to-bracket"></i> {t.liveQuizJoin}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {path === '/student' && (
          <div className="max-w-7xl mx-auto">
            {/* Welcome Banner */}
            <div className={`mb-6 p-5 rounded-2xl flex items-center gap-4 border shadow-lg ${isDark ? 'bg-slate-800/80 backdrop-blur-xl border-slate-700/50' : 'bg-white/90 backdrop-blur-xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`} style={{ background: isDark ? 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.6) 100%)' : '' }}>
                {user?.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full border-2 border-blue-500/60 shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 text-xl shrink-0"><i className="fa-solid fa-user-graduate"></i></div>
                }
                <div className="flex-1 min-w-0">
                  <h2 className={`font-black text-base sm:text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {{ uz: 'Xush kelibsiz,', ru: 'Добро пожаловать,', en: 'Welcome,' }[lang] || 'Xush kelibsiz,'} {user?.displayName?.split(' ')[0] || 'Talaba'}! 👋
                  </h2>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {{ uz: 'Avval to\'xtatgan joyingizdan davom eting.', ru: 'Продолжайте обучение с того места, где остановились.', en: 'Continue your learning right where you left off.' }[lang] || 'Avval to\'xtatgan joyingizdan davom eting.'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 shrink-0">
                  <i className="fa-solid fa-circle text-[6px] text-emerald-400 animate-pulse"></i>
                  <span className="text-emerald-400 text-xs font-bold">{lang === 'ru' ? 'Онлайн' : 'Online'}</span>
                </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Simplified Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div className={`p-5 rounded-2xl border shadow-lg flex items-center gap-4 hover:border-blue-500/50 transition-colors cursor-pointer group ${isDark ? 'bg-slate-800/80 backdrop-blur-xl border-slate-700/50' : 'bg-white/90 backdrop-blur-xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-xl group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-layer-group"></i>
                  </div>
                  <div>
                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{{ uz: 'Yechilgan Testlar', ru: 'Завершенные тесты', en: 'Tests Completed' }[lang] || 'Yechilgan Testlar'}</h4>
                      <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.totalTests}</p>
                  </div>
              </div>
              
              <div className={`p-5 rounded-2xl border shadow-lg flex items-center gap-4 hover:border-emerald-500/50 transition-colors cursor-pointer group ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xl group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-fire"></i>
                  </div>
                  <div>
                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{{ uz: 'Jami tajriba (XP)', ru: 'Общий опыт (XP)', en: 'Total Experience (XP)' }[lang] || 'Jami tajriba (XP)'}</h4>
                      <p className="text-xl font-black text-emerald-500">{stats.totalXP.toLocaleString()}</p>
                  </div>
              </div>
              
              <div className={`p-5 rounded-2xl border shadow-lg flex items-center gap-4 hover:border-violet-500/50 transition-colors cursor-pointer group ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white/90 border-slate-200'}`}>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 text-xl group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-brain"></i>
                  </div>
                  <div>
                      <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{{ uz: 'O\'rtacha Natija', ru: 'Успеваемость', en: 'Average Score' }[lang] || 'O\'rtacha Natija'}</h4>
                      <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{stats.avgScore}%</p>
                  </div>
              </div>
          </div>

          {/* ── Portfolio ───────────────────────────────── */}
          <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <i className="fa-solid fa-graduation-cap text-emerald-500"></i>
            {t.portfolioTitle}
          </h2>

          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {studentHistory.length > 0 ? (
              studentHistory.map((history, idx) => (
                <div key={idx} className={`rounded-2xl p-5 border-l-4 border-emerald-500 shadow-md ${isDark ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md border-y border-r border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${isDark ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-600 bg-emerald-50'}`}>
                        {history.dateText || history.date || "Bugun"}
                      </span>
                      <h3 className={`text-base font-bold mt-1 leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{history.topic}</h3>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-black ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {history.score}<span className={`text-sm font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>/{history.total}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className={`flex justify-between text-[10px] mb-1 font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>{t.mastery}</span>
                      <span>{history.percent}%</span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${history.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`rounded-2xl p-8 border border-dashed text-center ${isDark ? 'bg-slate-800/50 border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-500'}`}>
                <i className="fa-solid fa-file-medical mb-3 text-3xl opacity-50 block"></i>
                <p className="font-medium text-sm">{t.noResults}</p>
              </div>
            )}
          </div>

          <div
            className={`rounded-2xl p-6 border shadow-[0_0_15px_rgba(59,130,246,0.1)] mt-6 flex justify-between items-center group cursor-pointer transition-all ${isDark ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/30 hover:border-blue-400' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-400'}`}
            onClick={() => window.location.href = '/methodology'}
          >
            <div>
              <h3 className={`text-xl font-bold mb-1 flex items-center gap-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>
                <i className={`fa-solid fa-bone group-hover:animate-bounce ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
                {t.methodologyTitle}
              </h3>
              <p className={`text-sm ${isDark ? 'text-blue-200/70' : 'text-blue-800/80'}`}>{t.methodologyDesc}</p>
            </div>
            <div className={`w-12 h-12 min-w-[3rem] rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
              <i className="fa-solid fa-arrow-right text-xl -rotate-45 group-hover:rotate-0 transition-transform"></i>
            </div>
          </div>


        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Live Quiz PIN ──────────────────────────── */}
          <div
            className={`rounded-2xl border overflow-hidden shadow-lg ${isDark ? 'border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]' : 'border-emerald-200 bg-emerald-50/50'}`}
            style={{ background: isDark ? 'linear-gradient(135deg, rgba(6,78,59,0.3) 0%, rgba(30,41,59,0.9) 100%)' : '' }}
          >
            <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-emerald-500/20 bg-emerald-600/10' : 'border-emerald-200 bg-emerald-100/50'}`}>
              <img src="/assets/tma_logo.png" alt="TMA" className="w-9 h-9 rounded-full border border-emerald-400/40" />
              <div>
                <h3 className={`font-black text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <i className="fa-solid fa-tower-broadcast text-emerald-500 animate-pulse text-sm"></i>
                  {t.liveQuizTitle}
                </h3>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Med-Zukkoo Live</div>
              </div>
            </div>
            <div className="p-5">
              <p className={`text-xs mb-4 text-center ${isDark ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>{t.liveQuizDesc}</p>
              <div
                className="flex rounded-xl overflow-hidden mb-2 shadow-inner border transition-all"
                style={{
                  background: isDark ? 'rgba(15,23,42,0.8)' : '#ffffff',
                  borderColor: pinInput.length === 6 ? '#10b981' : (isDark ? '#334155' : '#cbd5e1'),
                  boxShadow: pinInput.length === 6 ? '0 0 15px rgba(16,185,129,0.25)' : 'none',
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(new RegExp('[^0-9]', 'g'), '').slice(0, 6))}
                  placeholder={t.liveQuizPinPlaceholder}
                  className="flex-1 bg-transparent px-4 py-3 text-center text-2xl font-black tracking-[0.3em] outline-none w-full placeholder-slate-400 dark:placeholder-slate-500"
                  style={{ color: pinInput.length === 6 ? '#10b981' : (isDark ? '#94a3b8' : '#334155') }}
                  onKeyDown={(e) => e.key === 'Enter' && pinInput.length === 6 && handleJoinLiveQuiz()}
                />
              </div>
              {/* Dot indicators */}
              <div className="flex justify-center gap-1.5 mb-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                      i < pinInput.length ? 'bg-emerald-400 scale-110 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              {pinError && <p className="text-rose-400 text-xs text-center mb-2 font-bold">{pinError}</p>}
              <button
                onClick={handleJoinLiveQuiz}
                disabled={pinInput.length !== 6}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-3 font-bold transition-all shadow-lg hover:shadow-emerald-900/50 hover:scale-[1.01] active:scale-95"
              >
                {t.liveQuizJoin} <i className="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
          </div>

          {/* ── Past Sessions ──────────────────────────── */}
          {sessions.length > 0 && (
            <div className={`rounded-2xl p-6 border shadow-lg ${isDark ? 'bg-slate-800/80 backdrop-blur-xl border-slate-700/50' : 'bg-white/50 backdrop-blur-xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
              <h3 className={`font-bold mb-4 text-sm uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <i className={`fa-solid fa-clock-rotate-left ${isDark ? 'text-slate-400' : 'text-slate-500'}`}></i>
                {t.pastSessions}
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {sessions.sort((a, b) => b.score - a.score).map((s, i) => (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-lg border transition-colors ${isDark ? 'bg-slate-900 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                    <div>
                      <div className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>PIN: {s.pin || t.unknownPin}</div>
                      <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{s.correct || 0} {t.correctAnswers}</div>
                    </div>
                    <div className="text-emerald-500 font-black">+{s.score || 0} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}





        {/* end right column */}
          </div>
        </div>
        </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
