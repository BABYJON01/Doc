import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';

const lecturesUz = [
    { id: 1, title: "Tayanch-harakat apparati sinishlari, Transport immobilizatsiya, Gips texnikasi", videoId: "bOzeL4r9BGE" },
    { id: 2, title: "Ko'krak qafasi va yelka kamari shikastlanishlari. Yelka suyagi chiqishlari", videoId: "bOzeL4r9BGE" },
    { id: 3, title: "Chanoq va umurtqa pog‘onasi shikastlanishlari. Shkolnikov anesteziyasi", videoId: "bOzeL4r9BGE" },
    { id: 4, title: "Politravma va shok bilan kechuvchi jarohatlar. Reanimatsion yordam", videoId: "bOzeL4r9BGE" },
    { id: 5, title: "Suyak va bo'g'im yiringli xastaliklari (Osteomiyelit)", videoId: "bOzeL4r9BGE" },
    { id: 6, title: "Kuyish kasalligi va sovuq urishi. Klinik yordam tamoyillari", videoId: "bOzeL4r9BGE" },
    { id: 7, title: "Bosh miya yopiq va ochiq jarohatlari", videoId: "bOzeL4r9BGE" },
    { id: 8, title: "Qon ketish turlari va qon to'xtatish (Jgut qo'yish) usullari", videoId: "bOzeL4r9BGE" }
];

const lecturesRu = [
    { id: 1, title: "Переломы опорно-двигательного аппарата, иммобилизация, гипсовая техника", videoId: "bOzeL4r9BGE" },
    { id: 2, title: "Травмы грудной клетки. Вывихи плеча", videoId: "bOzeL4r9BGE" },
    { id: 3, title: "Травмы таза и позвоночника. Анестезия по Школьникову", videoId: "bOzeL4r9BGE" },
    { id: 4, title: "Политравма и травмы с шоком. Реанимация", videoId: "bOzeL4r9BGE" },
    { id: 5, title: "Гнойные заболевания костей и суставов (Остеомиелит)", videoId: "bOzeL4r9BGE" },
    { id: 6, title: "Ожоговая болезнь и обморожение. Клиническая помощь", videoId: "bOzeL4r9BGE" },
    { id: 7, title: "Закрытые и открытые травмы головного мозга", videoId: "bOzeL4r9BGE" },
    { id: 8, title: "Виды кровотечений и методы остановки (наложение жгута)", videoId: "bOzeL4r9BGE" }
];

const StudentLectures = ({ user, onLogout }) => {
    const { lang, theme } = useApp();
    const [selectedVideo, setSelectedVideo] = useState(null);
    const topics = lang === 'ru' ? lecturesRu : lecturesUz;
    const isDark = theme === 'dark';

    return (
        <DashboardLayout role="student" user={user} onLogout={onLogout}>
            <div className="max-w-6xl mx-auto animate-[fadeInUp_0.4s_ease-out]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                            <i className="fa-brands fa-youtube"></i>
                        </div>
                        <div>
                            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {lang === 'ru' ? 'Видео лекции' : 'Video Ma\'ruzalar'}
                            </h2>
                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {lang === 'ru' 
                                    ? 'Обучающие видеоматериалы по учебному плану'
                                    : 'O\'quv rejasi asosidagi maxsus video darsliklar'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {topics.map((topic, index) => (
                        <div 
                            key={topic.id}
                            className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-lg ${
                                isDark 
                                    ? 'bg-slate-900 border-slate-700 hover:border-rose-500/50 hover:shadow-rose-500/10' 
                                    : 'bg-white border-slate-200 hover:border-rose-400 hover:shadow-rose-500/20'
                            }`}
                        >
                            <div className="relative aspect-video bg-slate-800 overflow-hidden cursor-pointer" onClick={() => setSelectedVideo(topic)}>
                                {/* Fake thumbnail using YouTube high res thumbnail format */}
                                <img 
                                    src={`https://img.youtube.com/vi/${topic.videoId}/maxresdefault.jpg`} 
                                    onError={(e) => { e.target.src = `https://img.youtube.com/vi/${topic.videoId}/hqdefault.jpg`; }}
                                    alt="Video thumbnail"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center text-lg shadow-xl shadow-rose-900/50 group-hover:scale-110 transition-transform">
                                        <i className="fa-solid fa-play ml-1"></i>
                                    </div>
                                </div>
                                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md border border-slate-700">
                                    Mavzu {index + 1}
                                </div>
                            </div>
                            
                            <div className="p-4 cursor-pointer" onClick={() => setSelectedVideo(topic)}>
                                <h3 className={`font-bold text-sm leading-snug line-clamp-2 ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-rose-600'} transition-colors`}>
                                    {topic.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                                    <i className="fa-solid fa-tv"></i> Video darslik
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Video Player Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
                    <div className="w-full max-w-5xl flex flex-col items-end">
                        <button 
                            onClick={() => setSelectedVideo(null)} 
                            className="mb-4 w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors shadow-lg border border-slate-700"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                        
                        <div className="w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 aspect-video relative">
                            <iframe 
                                width="100%" 
                                height="100%" 
                                src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`} 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                                className="absolute inset-0"
                            ></iframe>
                        </div>
                        <div className="w-full mt-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 text-white">
                            <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
                            <p className="text-sm text-slate-400 mt-2">
                                O'zgartirish uchun o'qituvchi bilan bog'laning. (Hozircha barcha mavzularga namuna sifatida standart tibbiyot videosi qo'yilgan).
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentLectures;
