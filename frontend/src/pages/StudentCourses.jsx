import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { useApp } from '../context/AppContext';

const StudentCourses = ({ user }) => {
    const { t, lang } = useApp();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'), limit(20));
                const snap = await getDocs(q);
                const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setExams(fetched);
            } catch (err) {
                console.error("Error fetching exams: ", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const handleStartExam = (examId) => {
        window.location.href = `/test?id=${examId}`;
    };

    if (loading) {
        return <div className="text-center p-10"><i className="fa-solid fa-circle-notch fa-spin text-3xl text-blue-500"></i></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
                <i className="fa-solid fa-layer-group text-blue-500"></i>
                {lang === 'ru' ? 'Доступные Курсы и Экзамены' : 'Mavjud Kurslar va Imtihonlar'}
            </h2>

            {exams.length === 0 ? (
                <div className="bg-slate-800 rounded-2xl p-10 text-center border border-dashed border-slate-600">
                    <i className="fa-solid fa-folder-open text-4xl text-slate-500 mb-4 opacity-50"></i>
                    <p className="text-slate-400">{lang === 'ru' ? 'Пока нет доступных экзаменов от преподавателей.' : 'Hozircha o\'qituvchilar tomonidan yuklangan imtihonlar yo\'q.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => (
                        <div key={exam.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-blue-500 transition-colors group shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-blue-500/30">
                                    {lang === 'ru' ? 'Медицина' : 'Meditsina'}
                                </span>
                                <span className="text-slate-500 text-xs">
                                    <i className="fa-regular fa-clock mr-1"></i>
                                    {exam.createdAt?.toDate().toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{exam.title}</h3>
                            <p className="text-sm text-slate-400 mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-user-doctor"></i> {exam.teacherName}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <div><span className="text-emerald-400 font-bold block text-sm">{exam.data?.tests?.length || 0}</span> Testlar</div>
                                <div className="w-px h-6 bg-slate-700"></div>
                                <div><span className="text-rose-400 font-bold block text-sm">{exam.data?.cases?.length || 0}</span> Case'lar</div>
                                <div className="w-px h-6 bg-slate-700"></div>
                                <div><span className="text-violet-400 font-bold block text-sm">{exam.data?.xrays?.length || 0}</span> Rasmlar</div>
                            </div>
                            
                            <button onClick={() => handleStartExam(exam.id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg group-hover:shadow-blue-500/25 flex items-center justify-center gap-2">
                                {lang === 'ru' ? 'Начать экзамен' : 'Imtihonni Boshlash'} <i className="fa-solid fa-play ml-1"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentCourses;
