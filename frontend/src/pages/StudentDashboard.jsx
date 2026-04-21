import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, collectionGroup } from 'firebase/firestore';

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

const StudentDashboard = ({ onNavigate, user, onLogout }) => {
  const { t, lang } = useApp();
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

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('student_history')) || [];
    setStudentHistory(history);

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
            query(collectionGroup(db, 'players'), where('__name__', '==', user.uid))
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
  }, [user]);

  const handleJoinLiveQuiz = () => {
    const cleaned = pinInput.replace(/\s/g, '');
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
            <div className="bg-slate-800 rounded-2xl p-10 text-center border border-slate-700 shadow-xl max-w-2xl mx-auto mt-10">
                <i className="fa-solid fa-ranking-star text-6xl text-blue-500 mb-6 drop-shadow-lg"></i>
                <h2 className="text-2xl font-bold text-white mb-2">{lang === 'ru' ? 'Ваши Достижения' : 'Sizning Yutuqlaringiz'}</h2>
                <p className="text-slate-400">{lang === 'ru' ? 'Эта страница находится в разработке.' : 'Ushbu sahifa tez kunda aktivlashadi.'}</p>
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
                                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
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
            <div className="mb-6 p-5 rounded-2xl flex items-center gap-4 border border-slate-700/60 shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.8) 100%)' }}>
                {user?.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full border-2 border-blue-500/60 shrink-0" />
                  : <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-blue-400 text-xl shrink-0"><i className="fa-solid fa-user-graduate"></i></div>
                }
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-white text-base sm:text-lg truncate">
                    {lang === 'ru' ? 'Добро пожаловать,' : 'Xush kelibsiz,'} {user?.displayName?.split(' ')[0] || 'Talaba'}! 👋
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm">
                    {lang === 'ru' ? 'Продолжайте обучение с того места, где остановились.' : 'Avval to\'xtatgan joyingizdan davom eting.'}
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
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex items-center gap-4 hover:border-blue-500/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 text-xl group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-layer-group"></i>
                  </div>
                  <div>
                      <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{lang === 'ru' ? 'Сдано Тестов' : 'Yechilgan Testlar'}</h4>
                      <p className="text-xl font-black text-white">{studentHistory.length || 0}</p>
                  </div>
              </div>
              
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex items-center gap-4 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xl group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-fire"></i>
                  </div>
                  <div>
                      <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{lang === 'ru' ? 'Опыт (XP)' : 'Jami tajriba (XP)'}</h4>
                      <p className="text-xl font-black text-emerald-400">1,250</p>
                  </div>
              </div>
              
              <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg flex items-center gap-4 hover:border-violet-500/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 text-xl group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-brain"></i>
                  </div>
                  <div>
                      <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{lang === 'ru' ? 'Успеваемость' : 'O\'rtacha Natia'}</h4>
                      <p className="text-xl font-black text-white">82%</p>
                  </div>
              </div>
          </div>

          {/* ── Portfolio ───────────────────────────────── */}
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-graduation-cap text-emerald-500"></i>
            {t.portfolioTitle}
          </h2>

          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {studentHistory.length > 0 ? (
              studentHistory.map((history, idx) => (
                <div key={idx} className="bg-slate-800 rounded-2xl p-5 border-l-4 border-emerald-500 shadow-md">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded uppercase tracking-widest">
                        {history.date}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1 leading-tight">{history.topic}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-emerald-400">
                        {history.score}<span className="text-slate-500 text-sm font-bold">/{history.total}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-widest">
                      <span>{t.mastery}</span>
                      <span>{history.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${history.percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-dashed border-slate-700 text-center text-slate-500">
                <i className="fa-solid fa-file-medical mb-3 text-3xl opacity-50 block"></i>
                <p className="font-medium text-sm">{t.noResults}</p>
              </div>
            )}
          </div>

          {/* ── Methodology Banner ──────────────────────── */}
          <div
            className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl p-6 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)] mt-6 flex justify-between items-center group cursor-pointer hover:border-blue-400 transition-all"
            onClick={() => window.location.href = '/methodology'}
          >
            <div>
              <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <i className="fa-solid fa-bone text-blue-400 group-hover:animate-bounce"></i>
                {t.methodologyTitle}
              </h3>
              <p className="text-sm text-blue-200/70">{t.methodologyDesc}</p>
            </div>
            <div className="w-12 h-12 min-w-[3rem] rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <i className="fa-solid fa-arrow-right text-xl -rotate-45 group-hover:rotate-0 transition-transform"></i>
            </div>
          </div>

          {/* ── Clinical Training ───────────────────────── */}
          <h2 className="text-xl font-bold text-white mt-6 flex items-center gap-2">
            <i className="fa-solid fa-stethoscope text-emerald-500"></i>
            {t.clinicalTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('duel')}
              className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all text-left flex flex-col group"
            >
              <i className="fa-solid fa-network-wired text-2xl text-indigo-400 mb-3 group-hover:scale-110 transition-transform origin-left"></i>
              <span className="font-bold text-lg text-white mb-1">{t.duelMode}</span>
              <span className="text-slate-400 text-sm">{t.duelDesc}</span>
            </button>
            <button
              onClick={() => window.location.href = '/test'}
              className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all text-left flex flex-col group"
            >
              <i className="fa-solid fa-person-falling-burst text-2xl text-emerald-400 mb-3 group-hover:scale-110 transition-transform origin-left"></i>
              <span className="font-bold text-lg text-white mb-1">{t.newCases}</span>
              <span className="text-slate-400 text-sm">{t.newCasesDesc}</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────── */}
        <div className="space-y-6">

          {/* ── Live Quiz PIN ──────────────────────────── */}
          <div
            className="rounded-2xl border border-emerald-500/30 overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)]"
            style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.3) 0%, rgba(30,41,59,0.9) 100%)' }}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-500/20 bg-emerald-600/10">
              <img src="/assets/tma_logo.png" alt="TMA" className="w-9 h-9 rounded-full border border-emerald-400/40" />
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <i className="fa-solid fa-tower-broadcast text-emerald-400 animate-pulse text-sm"></i>
                  {t.liveQuizTitle}
                </h3>
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Med-Zukkoo Live</div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-400 mb-4 text-center">{t.liveQuizDesc}</p>
              <div
                className="flex rounded-xl overflow-hidden mb-2 shadow-inner border transition-all"
                style={{
                  background: 'rgba(15,23,42,0.8)',
                  borderColor: pinInput.length === 6 ? '#10b981' : '#334155',
                  boxShadow: pinInput.length === 6 ? '0 0 15px rgba(16,185,129,0.25)' : 'none',
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder={t.liveQuizPinPlaceholder}
                  className="flex-1 bg-transparent px-4 py-3 text-center text-2xl font-black tracking-[0.3em] outline-none w-full"
                  style={{ color: pinInput.length === 6 ? '#10b981' : '#94a3b8' }}
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
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-slate-400"></i>
                {t.pastSessions}
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {sessions.sort((a, b) => b.score - a.score).map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-900 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-slate-300">PIN: {s.pin || t.unknownPin}</div>
                      <div className="text-xs text-slate-500">{s.correct || 0} {t.correctAnswers}</div>
                    </div>
                    <div className="text-emerald-400 font-black">+{s.score || 0} XP</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI Flashcards (Travmatologiya) ─────────── */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <h3 className="font-bold text-white mb-4 border-b border-slate-700 pb-3 flex justify-between items-center">
              <span>
                <i className="fa-solid fa-layer-group text-rose-400 mr-2"></i>
                {t.flashcardsTitle}
              </span>
              <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded-full border border-rose-500/30">
                {t.flashcardsNew}
              </span>
            </h3>
            <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-rose-500 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] transition-all relative overflow-hidden group">
              {/* Card count badge */}
              <div className="absolute top-0 right-0 bg-rose-600 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                {t.flashcardsCount}
              </div>
              {/* Topic icon */}
              <div className="w-14 h-14 bg-rose-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-rose-600/40 transition-colors">
                <i className="fa-solid fa-bone text-3xl text-rose-400"></i>
              </div>
              <h4 className="text-lg font-bold text-slate-100 mb-2">{t.flashcardsTopicTitle}</h4>
              <p className="text-xs text-slate-400 mb-5 line-clamp-2 leading-relaxed">{t.flashcardsTopicDesc}</p>
              <button
                onClick={() => window.location.href = '/test'}
                className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold py-2.5 px-8 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-900/40"
              >
                {t.flashcardsStart}
              </button>
            </div>
          </div>

          {/* ── Achievements ────────────────────────────── */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-lg">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <i className="fa-solid fa-medal text-yellow-400"></i>
              {t.achievementsTitle}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-yellow-500/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                    <i className="fa-solid fa-shield-halved text-xl text-yellow-500"></i>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-200 block">{t.achievement1}</span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'uz' ? 'Travma tashxisida 90%+ natija' : lang === 'ru' ? 'Результат 90%+ по диагностике травм' : '90%+ score in trauma diagnostics'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">+500 XP</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-rose-500/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/20 transition-colors">
                    <i className="fa-solid fa-fire text-xl text-rose-500"></i>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-200 block">{t.achievement2}</span>
                    <span className="text-[10px] text-slate-500">
                      {lang === 'uz' ? 'Har kuni platformada faol' : lang === 'ru' ? 'Активен каждый день на платформе' : 'Active on platform every day'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">+1000 XP</span>
              </div>
            </div>
          </div>

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
