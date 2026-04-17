import React, { useState } from 'react';
import { extractTextFromFile, generateMedicalContent } from '../services/aiService';
import LiveRoom from './LiveRoom';
import { useApp } from '../context/AppContext';

const TeacherDashboard = ({ onNavigate, user }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedData, setGeneratedData] = useState(null);
  const [showLiveRoom, setShowLiveRoom] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");

  const medicalTopics = [
      "Tayanch-harakat apparati sinishlari, Transport immobilizatsiya, Gips texnikasi",
      "Ko'krak qafasi va yelka kamari shikastlanishlari. Yelka suyagi chiqishlari",
      "Chanoq va umurtqa pog‘onasi shikastlanishlari. Shkolnikov anesteziyasi",
      "Politravma va shok bilan kechuvchi jarohatlar. Reanimatsion yordam",
      "Suyak va bo'g'im yiringli xastaliklari (Osteomiyelit)",
      "Kuyish kasalligi va sovuq urishi. Klinik yordam tamoyillari",
      "Bosh miya yopiq va ochiq jarohatlari",
      "Qon ketish turlari va qon to'xtatish (Jgut qo'yish) usullari"
  ];

  const handleGenerateFromTopic = async (topicName) => {
      setIsUploading(true);
      setProgress(20);
      setErrorMsg("");
      try {
          const aiResult = await generateMedicalContent(topicName, true);
          setProgress(80);
          if (!aiResult.success) {
              setProgress(0); setIsUploading(false);
              setErrorMsg("AI qabul qilmadi: " + (aiResult.message || ""));
              return;
          }
          setGeneratedData(aiResult);
          setProgress(100);
      } catch (e) {
          setProgress(0); setIsUploading(false);
          setErrorMsg(e.message || "AI tahlilida xato!");
      }
  };

  const handleUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      setProgress(10); 
      setErrorMsg("");

      try {
        // 1. Client-side extraction
        const text = await extractTextFromFile(file);
        setProgress(40);

        // 2. Client-side AI Generation
        const aiResult = await generateMedicalContent(text);
        setProgress(80);
        
        if (!aiResult.success) {
            setProgress(0);
            setIsUploading(false);
            setErrorMsg(aiResult.message || "Tizim xatosi, fayl tibbiyotga oid emas!");
            return;
        }

        // 3. Save to LocalStorage or Firebase (Mock for now, will connect to Firebase later)
        console.log("AI Natija:", aiResult);
        localStorage.setItem('generated_quiz', JSON.stringify(aiResult.tests || aiResult.quizzes));
        setGeneratedData(aiResult);

        setProgress(100);
      } catch (error) {
        console.error("AI Service Error:", error);
        setProgress(0);
        setIsUploading(false);
        setErrorMsg(error.message || "Faylni tahlil qilishda xatolik yuz berdi.");
      }
    }
  };

  // If live room is active, show it full-screen
  if (showLiveRoom && generatedData) {
    return (
      <LiveRoom
        user={user}
        quizData={generatedData.tests || generatedData.quizzes}
        onExit={() => setShowLiveRoom(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      <header className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700 mb-8 border-t-4 border-t-blue-500">
        <div className="flex items-center gap-4">
          <img
            src={user?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"}
            alt="Profile"
            className="w-16 h-16 rounded-full border-4 border-blue-500"
          />
          <div>
            <h1 className="text-2xl font-bold">{user?.displayName || "O'qituvchi"}</h1>
            <p className="text-slate-400">{user?.email || 'Kasbiy malaka kurslarini boshqaruv oynasi'}</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
            <button onClick={() => window.location.href = '/'} className="px-4 py-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg font-bold text-sm transition-colors">
               <i className="fa-solid fa-right-from-bracket mr-2"></i> {t.logout}
            </button>
            <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm transition-colors text-white">
               <i className="fa-solid fa-plus mr-2"></i> {lang === 'ru' ? 'Новый урок' : 'Yangi Dars'}
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 max-w-7xl mx-auto">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">{lang === 'ru' ? 'Мои курсы' : 'Mening Kurslarim'}</div>
            <div className="text-3xl font-black text-white">12</div>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">{lang === 'ru' ? 'Активные студенты' : 'Faol Talabalar'}</div>
            <div className="text-3xl font-black text-blue-400">1,240</div>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">{lang === 'ru' ? 'Клинические кейсы' : "Klinik Case'lar (Hotspot)"}</div>
            <div className="text-3xl font-black text-indigo-400">45</div>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">{lang === 'ru' ? 'Успеваемость студентов' : "Talaba O'zlashtirishi"}</div>
            <div className="text-3xl font-black text-emerald-400">82%</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
         <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-3">{lang === 'ru' ? 'Создание курса и интерактивных кейсов' : "Kurs & Interaktiv Case'lar Yaratish"}</h3>
            <div className="space-y-4">
                {/* Topic Selection UI */}
                {!isUploading && progress === 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm text-slate-400 font-bold uppercase mb-3"><i className="fa-solid fa-list-check mr-2 text-indigo-400"></i>{lang === 'ru' ? "Учебный план: Создание AI-экзамена по теме" : "O'quv Reja: Mavzu bo'yicha Ai-Imtihon yaratish"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {medicalTopics.map((topic, idx) => (
                                <button key={idx} onClick={() => handleGenerateFromTopic(topic)} className="text-left bg-slate-900 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 p-3 rounded-xl transition-all group flex items-start gap-3 shadow-lg">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-500 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 border border-slate-600 transition-colors">
                                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                                    </div>
                                    <span className="text-sm text-slate-300 group-hover:text-white font-medium pt-1 leading-snug">{topic}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Drag and Drop Container */}
                {!isUploading && progress === 0 && (
                    <div 
                        onClick={() => document.getElementById('file-upload').click()}
                        className={`w-full bg-slate-900 border-2 border-dashed ${errorMsg ? 'border-rose-500' : 'border-slate-600'} rounded-xl p-8 hover:border-blue-500 hover:bg-slate-800/80 transition-all flex flex-col items-center justify-center cursor-pointer group mb-4`}>
                        <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            accept=".docx,.pdf,.pptx"
                            onChange={handleUpload}
                        />
                        <div className="flex gap-4 mb-4">
                            <i className={`fa-regular fa-file-word text-4xl ${errorMsg ? 'text-slate-500' : 'text-blue-500'} group-hover:scale-110 transition-transform`}></i>
                            <i className={`fa-regular fa-file-pdf text-4xl ${errorMsg ? 'text-slate-500' : 'text-rose-500'} group-hover:scale-110 transition-transform`}></i>
                            <i className={`fa-regular fa-file-powerpoint text-4xl ${errorMsg ? 'text-slate-500' : 'text-orange-500'} group-hover:scale-110 transition-transform`}></i>
                        </div>
                        <div className="text-white font-bold text-lg mb-1">{lang === 'ru' ? 'Загрузите учебный материал (Drag & Drop или нажмите)' : 'Dars materialini yuklang (Drag & Drop yoki bosing)'}</div>
                        <div className="text-slate-400 text-sm text-center mb-4">
                            {lang === 'ru'
                              ? 'Перетащите файл .DOCX, .PDF или .PPTX сюда или нажмите. ИИ автоматически создаст тесты и флеш-карточки.'
                              : '.DOCX, .PDF yoki .PPTX formatidagi fayllarni shu yerga tashlang yoki ustiga bosing.\nSun\'iy intellekt matnni ajratib avtomatik Test va Flashcardlar yaratadi.'}
                        </div>

                        {errorMsg && (
                            <div className="mt-4 p-4 bg-rose-500/20 border border-rose-500 rounded-lg text-rose-400 text-sm text-center w-full shadow-inner">
                                <i className="fa-solid fa-triangle-exclamation mr-2"></i> {errorMsg}
                            </div>
                        )}
                    </div>
                )}

                {/* Progress Container */}
                {(isUploading || progress > 0) && (
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                        <div className="flex justify-between text-sm text-white font-bold mb-3">
                            <span>
                                {progress < 50 ? <><i className="fa-solid fa-file-arrow-up text-blue-400 mr-2"></i> Fayl o'qilmoqda...</> :
                                 progress < 100 ? <><i className="fa-solid fa-microchip text-indigo-400 mr-2"></i> AI Tahlil jarayoni (Test va Flashcardlar tuzilmoqda)...</> :
                                 <><i className="fa-solid fa-check text-emerald-400 mr-2"></i> Jarayon muvaffaqiyatli yakunlandi!</>}
                            </span>
                            <span className={progress === 100 ? "text-emerald-400" : "text-blue-400"}>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3 mb-3">
                            <div className={`h-3 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] relative overflow-hidden'}`} style={{ width: `${progress}%` }}>
                                {progress < 100 && <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[pulse_1s_ease-in-out_infinite]"></div>}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            {progress < 30 ? "Matn ajratilmoqda..." :
                             progress < 70 ? "Parcha-parcha mantiqiy blolklarga bo'linmoqda..." :
                             progress < 100 ? "Tibbiy atamalar boyitilib, mos xotira kartalari izlanmoqda..." :
                             "Barcha platformaga yuklandi! Talabalar endi ushbu fayldan o'rganishlari mumkin."}
                        </p>
                        
                        {progress === 100 && (
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button onClick={() => {setProgress(0); setIsUploading(false); setGeneratedData(null);}} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-white transition-colors">
                                    <i className="fa-solid fa-rotate-left mr-2"></i>Yangi fayl yuklash
                                </button>
                                <button onClick={() => setShowLiveRoom(true)} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm text-white font-bold transition-colors shadow-lg shadow-rose-900/40">
                                    <i className="fa-solid fa-tower-broadcast mr-2 animate-pulse"></i>{lang === 'ru' ? 'Начать Live Quiz (Аудитория)' : 'Live Quiz Boshlash (Auditoriya)'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Display Generated Results Preview */}
                {progress === 100 && generatedData && (
                    <div className="bg-slate-900 rounded-xl p-6 border-2 border-emerald-500 mt-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                        <h4 className="text-emerald-400 font-black mb-4 text-xl border-b border-slate-700 pb-4">
                           ✅ 15/2/2/1 Imtihon Bloki Tayyor!
                        </h4>
                        
                        <div className="space-y-8">
                            {/* TESTS */}
                            {generatedData.tests && (
                                <div>
                                    <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-blue-600 text-xs px-2 py-1 rounded mr-2">15 ta</span> Nazariy Testlar</h5>
                                    <div className="space-y-3">
                                        {generatedData.tests.map((quiz, idx) => (
                                            <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                                <p className="text-white font-bold mb-2 text-sm">{idx + 1}. {quiz.question}</p>
                                                <ul className="space-y-1 mb-2">
                                                    {quiz.options.map((opt, i) => (
                                                        <li key={i} className={`text-xs py-1 px-2 rounded ${i === quiz.answer ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'text-slate-300'}`}>
                                                            {String.fromCharCode(65 + i)}) {opt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CASES */}
                            {generatedData.cases && (
                                <div>
                                    <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-rose-600 text-xs px-2 py-1 rounded mr-2">2 ta</span> Vaziyatli Masalalar</h5>
                                    <div className="space-y-3">
                                        {generatedData.cases.map((c, idx) => (
                                            <div key={idx} className="bg-slate-800 p-4 rounded-lg border-l-4 border-l-rose-500">
                                                <p className="text-rose-400 font-bold text-sm mb-1">{c.title}</p>
                                                <p className="text-slate-300 text-xs italic mb-2">"{c.scenario}"</p>
                                                <p className="text-slate-200 text-sm font-bold mb-2">S: {c.question}</p>
                                                <p className="text-emerald-400 text-xs bg-emerald-900/40 p-2 rounded">J: {c.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* X-RAYS */}
                            {generatedData.xrays && (
                                <div>
                                    <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-violet-600 text-xs px-2 py-1 rounded mr-2">2 ta</span> Rentgenogramma</h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        {generatedData.xrays.map((x, idx) => (
                                            <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex gap-4">
                                                <div className="w-16 h-16 bg-slate-700 rounded flex items-center justify-center shrink-0 border border-dashed border-slate-500 text-slate-500 text-xs text-center p-1 cursor-pointer hover:bg-slate-600 transition-colors">
                                                    <i className="fa-solid fa-cloud-arrow-up text-lg block mb-1"></i>
                                                    Rasm yuklash
                                                </div>
                                                <div>
                                                    <p className="text-violet-400 font-bold text-sm mb-1">{x.title}</p>
                                                    <p className="text-slate-300 text-xs mb-2">{x.question}</p>
                                                    <p className="text-emerald-400 text-xs bg-emerald-900/40 p-1 px-2 rounded inline-block">To'g'ri tashxis: {x.options && x.options[x.answer] ? x.options[x.answer] : x.answer}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PRACTICAL */}
                            {generatedData.practical && (
                                <div>
                                    <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-amber-600 text-xs px-2 py-1 rounded mr-2">1 ta</span> Amaliyot</h5>
                                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                        <p className="text-amber-400 font-bold text-sm mb-3">{generatedData.practical.title}</p>
                                        <ul className="list-decimal list-inside text-xs text-slate-300 space-y-1">
                                            {generatedData.practical.steps.map((s, idx) => (
                                                <li key={idx}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
         </div>

         <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-3">{lang === 'ru' ? 'Статистика студентов' : 'Talabalar Statistikasi'}</h3>
            
            <div className="flex flex-col items-center justify-center h-48 opacity-50">
               <i className="fa-solid fa-chart-line text-5xl text-slate-500 mb-4"></i>
               <p className="text-slate-400">{lang === 'ru' ? 'Здесь будут отображаться посещаемость студентов и результаты тестов через Chart.js.' : "Bu yerda Chart.js orqali talabalarning davomati va test natijalari chiqadi."}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
