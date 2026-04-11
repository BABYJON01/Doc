import React, { useState } from 'react';

const TeacherDashboard = ({ onNavigate, user }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [errorMsg, setErrorMsg] = useState("");

  const handleUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      setProgress(20); // Dastlabki yuklanish ko'rsatkichi
      setErrorMsg("");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8002/api/ai/process-file", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        
        if (!response.ok || data.success === false || data.error) {
            setProgress(0);
            setIsUploading(false);
            setErrorMsg(data.detail || data.message || "Tizim xatosi, fayl tibbiyotga oid emas!");
            return;
        }

        setProgress(100);
      } catch (error) {
        console.error("Backend error:", error);
        setProgress(0);
        setIsUploading(false);
        setErrorMsg("Sun'iy intellekt serveri o'chirilgan yoki ulanishda xato (Backend ishga tushmagan).");
      }
    }
  };
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
               <i className="fa-solid fa-right-from-bracket mr-2"></i> Chiqish
            </button>
            <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold text-sm transition-colors text-white">
               <i className="fa-solid fa-plus mr-2"></i> Yangi Dars
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 max-w-7xl mx-auto">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">Mening Kurslarim</div>
            <div className="text-3xl font-black text-white">12</div>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">Faol Talabalar</div>
            <div className="text-3xl font-black text-blue-400">1,240</div>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">Klinik Case'lar (Hotspot)</div>
            <div className="text-3xl font-black text-indigo-400">45</div>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-sm font-bold uppercase mb-1">Talaba O'zlashtirishi</div>
            <div className="text-3xl font-black text-emerald-400">82%</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
         <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-3">Kurs & Interaktiv Case'lar Yaratish</h3>
            <div className="space-y-4">
                
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
                        <div className="text-white font-bold text-lg mb-1">Dars materialini yuklang (Drag & Drop yoki bosing)</div>
                        <div className="text-slate-400 text-sm text-center mb-4">
                            .DOCX, .PDF yoki .PPTX formatidagi fayllarni shu yerga tashlang yoki ustiga bosing.<br/>
                            Sun'iy intellekt matnni ajratib avtomatik Test va Flashcardlar yaratadi.
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
                            <button onClick={() => {setProgress(0); setIsUploading(false);}} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-white transition-colors">Yangi fayl yuklash</button>
                        )}
                    </div>
                )}
            </div>
         </div>

         <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-3">Talabalar Statistikasi</h3>
            
            <div className="flex flex-col items-center justify-center h-48 opacity-50">
               <i className="fa-solid fa-chart-line text-5xl text-slate-500 mb-4"></i>
               <p className="text-slate-400">Bu yerda Chart.js orqali talabalarning davomati va test natijalari chiqadi.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
