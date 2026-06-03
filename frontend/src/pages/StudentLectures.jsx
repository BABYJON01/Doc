import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';

const lecturesUz = [
    { id: 1, title: "Tayanch-harakat apparati sinishlari, Transport immobilizatsiya, Gips texnikasi", videoId: "EuCYMa1JwHw" },
    { id: 2, title: "Ko'krak qafasi va yelka kamari shikastlanishlari. Yelka suyagi chiqishlari", videoId: "9mtKZlf6O9k" },
    { id: 3, title: "Chanoq va umurtqa pog‘onasi shikastlanishlari. Shkolnikov anesteziyasi", videoId: "ERUvPf2I3Jo" },
    { id: 4, title: "Politravma va shok bilan kechuvchi jarohatlar. Reanimatsion yordam", videoId: "asG7joCxBG8" },
    { id: 5, title: "Suyak va bo'g'im yiringli xastaliklari (Osteomiyelit)", videoId: "x4AEKDCGHpA" },
    { id: 6, title: "Kuyish kasalligi va sovuq urishi. Klinik yordam tamoyillari", videoId: "D1O9z6WJ1iQ" },
    { id: 7, title: "Bosh miya yopiq va ochiq jarohatlari", videoId: "Loc2KPwul9U" },
    { id: 8, title: "Qon ketish turlari va qon to'xtatish (Jgut qo'yish) usullari", videoId: "EmmSJxAWVKM" }
];

const lecturesRu = [
    { id: 1, title: "Переломы опорно-двигательного аппарата, иммобилизация, гипсовая техника", videoId: "EuCYMa1JwHw" },
    { id: 2, title: "Травмы грудной клетки. Вывихи плеча", videoId: "9mtKZlf6O9k" },
    { id: 3, title: "Травмы таза и позвоночника. Анестезия по Школьникову", videoId: "ERUvPf2I3Jo" },
    { id: 4, title: "Политравма и травмы с шоком. Реанимация", videoId: "asG7joCxBG8" },
    { id: 5, title: "Гнойные заболевания костей и суставов (Остеомиелит)", videoId: "0NvjPSST83I" },
    { id: 6, title: "Ожоговая болезнь и обморожение. Клиническая помощь", videoId: "D1O9z6WJ1iQ" },
    { id: 7, title: "Закрытые и открытые травмы головного мозга", videoId: "Loc2KPwul9U" },
    { id: 8, title: "Виды кровотечений и методы остановки (наложение жгута)", videoId: "EmmSJxAWVKM" }
];

const StudentLectures = ({ user, onLogout }) => {
    const { lang, theme } = useApp();
    const [selectedVideo, setSelectedVideo] = useState(null);
    const lecturesEn = [
        { id: 1, title: "Musculoskeletal fractures, transport immobilization, plaster technique", videoId: "EuCYMa1JwHw" },
        { id: 2, title: "Chest and shoulder girdle injuries. Shoulder dislocations", videoId: "9mtKZlf6O9k" },
        { id: 3, title: "Pelvic and spinal injuries. Shkolnikov anesthesia", videoId: "ERUvPf2I3Jo" },
        { id: 4, title: "Polytrauma and shock injuries. Resuscitation", videoId: "asG7joCxBG8" },
        { id: 5, title: "Purulent diseases of bones and joints (Osteomyelitis)", videoId: "x4AEKDCGHpA" },
        { id: 6, title: "Burn disease and frostbite. Principles of clinical care", videoId: "D1O9z6WJ1iQ" },
        { id: 7, title: "Closed and open brain injuries", videoId: "Loc2KPwul9U" },
        { id: 8, title: "Types of bleeding and methods of stopping (tourniquet application)", videoId: "EmmSJxAWVKM" }
    ];
    const topics = { ru: lecturesRu, uz: lecturesUz, en: lecturesEn }[lang] || lecturesUz;
    // Always use dark styles for student dashboard because the background image is dark
    const isDark = true;

    return (
        <DashboardLayout role="student" user={user} onLogout={onLogout}>
            <div className="max-w-5xl mx-auto animate-[fadeInUp_0.4s_ease-out]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                        <i className="fa-solid fa-play-circle"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">
                            {{ ru: 'Онлайн лекции и материалы', uz: 'Onlayn Video Ma\'ruzalar', en: 'Online Video Lectures' }[lang] || 'Onlayn Video Ma\'ruzalar'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {{ 
                                ru: 'Изучайте темы и просматривайте видеоуроки.', 
                                uz: 'Mavzularni o\'zlashtirish uchun biriktirilgan video va fayllarni ko\'ring.', 
                                en: 'Watch attached videos and files to master the topics.' 
                            }[lang] || 'Mavzularni o\'zlashtirish uchun biriktirilgan video va fayllarni ko\'ring.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {topics.map((topic, index) => (
                        <div 
                            key={topic.id}
                            className={`group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-lg ${
                                isDark 
                                    ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700 hover:border-rose-500/50 hover:shadow-rose-500/10' 
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
                                    { { ru: 'Тема', uz: 'Mavzu', en: 'Topic' }[lang] || 'Mavzu' } {index + 1}
                                </div>
                            </div>
                            
                            <div className="p-4 cursor-pointer" onClick={() => setSelectedVideo(topic)}>
                                <h3 className={`font-bold text-sm leading-snug line-clamp-2 ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-rose-600'} transition-colors`}>
                                    {topic.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                                    <i className="fa-solid fa-tv"></i> { { ru: 'Видеоурок', uz: 'Video darslik', en: 'Video lesson' }[lang] || 'Video darslik' }
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
                                { { ru: 'Свяжитесь с преподавателем для изменений. (Сейчас везде стоит стандартное медицинское видео)', uz: "O'zgartirish uchun o'qituvchi bilan bog'laning. (Hozircha barcha mavzularga namuna sifatida standart tibbiyot videosi qo'yilgan).", en: 'Contact the teacher for changes. (Currently, a standard medical video is set as an example for all topics).' }[lang] || "O'zgartirish uchun o'qituvchi bilan bog'laning. (Hozircha barcha mavzularga namuna sifatida standart tibbiyot videosi qo'yilgan)." }
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentLectures;
