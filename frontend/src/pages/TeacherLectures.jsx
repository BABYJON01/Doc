import React from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';

const medicalTopicsUz = [
    "Tayanch-harakat apparati sinishlari, Transport immobilizatsiya, Gips texnikasi",
    "Ko'krak qafasi va yelka kamari shikastlanishlari. Yelka suyagi chiqishlari",
    "Chanoq va umurtqa pog‘onasi shikastlanishlari. Shkolnikov anesteziyasi",
    "Politravma va shok bilan kechuvchi jarohatlar. Reanimatsion yordam",
    "Suyak va bo'g'im yiringli xastaliklari (Osteomiyelit)",
    "Kuyish kasalligi va sovuq urishi. Klinik yordam tamoyillari",
    "Bosh miya yopiq va ochiq jarohatlari",
    "Qon ketish turlari va qon to'xtatish (Jgut qo'yish) usullari"
];

const medicalTopicsRu = [
    "Переломы опорно-двигательного аппарата, иммобилизация, гипсовая техника",
    "Травмы грудной клетки. Вывихи плеча",
    "Травмы таза и позвоночника. Анестезия по Школьникову",
    "Политравма и травмы с шоком. Реанимация",
    "Гнойные заболевания костей и суставов (Остеомиелит)",
    "Ожоговая болезнь и обморожение. Клиническая помощь",
    "Закрытые и открытые травмы головного мозга",
    "Виды кровотечений и методы остановки (наложение жгута)"
];

const TeacherLectures = ({ user, onLogout }) => {
    const { t, lang, theme } = useApp();
    const medicalTopicsEn = [
        "Musculoskeletal fractures, transport immobilization, plaster technique",
        "Chest and shoulder girdle injuries. Shoulder dislocations",
        "Pelvic and spinal injuries. Shkolnikov anesthesia",
        "Polytrauma and shock injuries. Resuscitation",
        "Purulent diseases of bones and joints (Osteomyelitis)",
        "Burn disease and frostbite. Principles of clinical care",
        "Closed and open brain injuries",
        "Types of bleeding and methods of stopping (tourniquet application)"
    ];

    const topics = { ru: medicalTopicsRu, uz: medicalTopicsUz, en: medicalTopicsEn }[lang] || medicalTopicsUz;
    const isDark = true; // Always dark to match dashboard background

    const handleTopicClick = (topic) => {
        alert({ ru: `Раздел "${topic}" пока находится в разработке.`, uz: `"${topic}" bo'limi ustida ishlanmoqda.`, en: `Section "${topic}" is under development.` }[lang] || `"${topic}" bo'limi ustida ishlanmoqda.`);
    };

    return (
        <DashboardLayout role="teacher" user={user} onLogout={onLogout}>
            <div className="max-w-5xl mx-auto animate-[fadeInUp_0.4s_ease-out]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                        <i className="fa-solid fa-folder-open"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{ { ru: 'Темы по учебному плану (Лекции)', uz: "O'quv rejasidagi mavzular (Ma'ruzalar)", en: 'Syllabus Topics (Lectures)' }[lang] || "O'quv rejasidagi mavzular (Ma'ruzalar)" }</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            { { ru: 'Выберите тему для просмотра лекций и добавления материалов.', uz: "Ma'ruzalarni ko'rish yoki yangi fayl biriktirish uchun mavzuni tanlang.", en: 'Select a topic to view lectures and add materials.' }[lang] || "Ma'ruzalarni ko'rish yoki yangi fayl biriktirish uchun mavzuni tanlang." }
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topics.map((topic, index) => (
                        <div 
                            key={index} 
                            onClick={() => handleTopicClick(topic)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer group shadow-lg ${
                                isDark 
                                    ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700/50 hover:border-blue-500/50 hover:shadow-blue-500/10' 
                                    : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-blue-500/20'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-black text-slate-500 bg-slate-800 border border-slate-700 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-sm leading-snug mb-3 transition-colors ${isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                        {topic}
                                    </h3>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                            { { ru: 'Активно', uz: 'Faol', en: 'Active' }[lang] || 'Faol' }
                                        </span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 group-hover:bg-blue-500/20 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                                            { { ru: 'Подробнее', uz: 'Batafsil', en: 'Details' }[lang] || 'Batafsil' } <i className="fa-solid fa-arrow-right ml-1"></i>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeacherLectures;
