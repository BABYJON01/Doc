import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

const CATEGORIES = {
  uz: ['Travmatologiya', 'Farmakologiya', 'Anatomiya', 'Terapiya', 'Jarrohlik', 'Kardiologiya'],
  ru: ['Травматология', 'Фармакология', 'Анатомия', 'Терапия', 'Хирургия', 'Кардиология'],
  en: ['Traumatology', 'Pharmacology', 'Anatomy', 'Therapy', 'Surgery', 'Cardiology'],
};

const getDifficulty = (testCount) => {
  if (testCount >= 15) return { label: { uz: 'Qiyin', ru: 'Сложно', en: 'Hard' }, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  if (testCount >= 8) return { label: { uz: "O'rta", ru: 'Средне', en: 'Medium' }, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' };
  return { label: { uz: 'Oson', ru: 'Легко', en: 'Easy' }, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
};

const SkeletonCard = () => (
  <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="h-5 w-20 bg-slate-700 rounded-full"></div>
      <div className="h-5 w-16 bg-slate-700 rounded-full"></div>
    </div>
    <div className="h-6 w-3/4 bg-slate-700 rounded mb-2"></div>
    <div className="h-4 w-1/2 bg-slate-700 rounded mb-6"></div>
    <div className="h-10 w-full bg-slate-700 rounded-xl mb-4"></div>
    <div className="h-11 w-full bg-slate-700 rounded-xl"></div>
  </div>
);

const StudentCourses = ({ user }) => {
  const { lang } = useApp();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExams(fetched);
      } catch (err) {
        console.error('Error fetching exams: ', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const labels = {
    title: { uz: 'Kurslar va Imtihonlar', ru: 'Курсы и Экзамены', en: 'Courses & Exams' },
    empty: { uz: "Hozircha o'qituvchilar tomonidan yuklangan imtihonlar yo'q.", ru: 'Пока нет доступных экзаменов от преподавателей.', en: 'No exams available from teachers yet.' },
    startBtn: { uz: 'Boshlash', ru: 'Начать', en: 'Start' },
    tests: { uz: 'Test', ru: 'Тест', en: 'Test' },
    cases: { uz: 'Case', ru: 'Кейс', en: 'Case' },
    xrays: { uz: "Rasm", ru: 'Снимок', en: 'X-ray' },
    filterAll: { uz: 'Barchasi', ru: 'Все', en: 'All' },
    by: { uz: "tomonidan", ru: "от", en: "by" },
    estTime: { uz: 'daqiqa', ru: 'мин', en: 'min' },
  };
  const t = (key) => labels[key]?.[lang] ?? labels[key]?.uz;

  const filteredExams = filter === 'all' ? exams : exams.filter(e => (e.data?.tests?.length || 0) >= (filter === 'hard' ? 15 : filter === 'medium' ? 8 : 0) && (e.data?.tests?.length || 0) < (filter === 'medium' ? 15 : filter === 'easy' ? 8 : 999));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <i className="fa-solid fa-layer-group text-blue-400"></i>
            </div>
            {t('title')}
          </h2>
          <p className="text-slate-400 text-sm mt-1 ml-12">
            {loading ? '...' : `${exams.length} ${lang === 'ru' ? 'экзамен доступно' : lang === 'en' ? 'exams available' : 'ta imtihon mavjud'}`}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1 text-xs font-bold">
          {[['all', t('filterAll')], ['easy', '🟢'], ['medium', '🟡'], ['hard', '🔴']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg transition-all ${filter === key ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-folder-open text-3xl text-slate-500"></i>
          </div>
          <p className="text-slate-400 text-lg font-medium">{t('empty')}</p>
          <p className="text-slate-600 text-sm mt-2">
            {lang === 'ru' ? 'Преподаватель ещё не загрузил материалы.' : "O'qituvchi hali material yuklamagan."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam, idx) => {
            const testCount = exam.data?.tests?.length || 0;
            const caseCount = exam.data?.cases?.length || 0;
            const xrayCount = exam.data?.xrays?.length || 0;
            const diff = getDifficulty(testCount);
            const estMin = Math.round((testCount * 1.2 + caseCount * 2 + xrayCount * 1.5));
            const category = CATEGORIES[lang]?.[idx % CATEGORIES[lang].length] ?? 'Meditsina';

            return (
              <div
                key={exam.id}
                className="bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500/60 transition-all duration-300 group shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 flex flex-col overflow-hidden"
              >
                {/* Card top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="p-5 flex flex-col flex-1">
                  {/* Top badges row */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-1 rounded-full uppercase tracking-widest">
                      {category}
                    </span>
                    <span className={`text-[10px] font-black border px-2 py-1 rounded-full uppercase tracking-widest ${diff.color}`}>
                      {diff.label[lang] ?? diff.label.uz}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1 line-clamp-2 leading-snug group-hover:text-blue-100 transition-colors">
                    {exam.title}
                  </h3>

                  {/* Teacher */}
                  <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
                    <i className="fa-solid fa-user-doctor text-slate-600"></i>
                    {exam.teacherName} · {exam.createdAt?.toDate().toLocaleDateString()}
                  </p>

                  {/* Stats bar */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-slate-900 rounded-xl p-2.5 text-center border border-slate-700">
                      <div className="text-emerald-400 font-black text-lg leading-none">{testCount}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">{t('tests')}</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-2.5 text-center border border-slate-700">
                      <div className="text-rose-400 font-black text-lg leading-none">{caseCount}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">{t('cases')}</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-2.5 text-center border border-slate-700">
                      <div className="text-violet-400 font-black text-lg leading-none">{xrayCount}</div>
                      <div className="text-[10px] text-slate-500 font-bold mt-0.5">{t('xrays')}</div>
                    </div>
                  </div>

                  {/* Est time */}
                  {estMin > 0 && (
                    <p className="text-[10px] text-slate-600 mb-4 flex items-center gap-1">
                      <i className="fa-regular fa-clock"></i>
                      ~{estMin} {t('estTime')}
                    </p>
                  )}

                  {/* Spacer */}
                  <div className="flex-1"></div>

                  {/* Start button */}
                  <button
                    onClick={() => (window.location.href = `/test?id=${exam.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-3 rounded-xl transition-all shadow-lg group-hover:shadow-blue-500/30 flex items-center justify-center gap-2 text-sm"
                  >
                    <i className="fa-solid fa-play text-xs"></i>
                    {t('startBtn')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
