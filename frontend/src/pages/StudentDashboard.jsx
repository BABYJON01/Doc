import React from 'react';

const StudentDashboard = ({ onNavigate, user }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
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
        
        {/* Left Column - Continue Learning */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white mb-4"><i className="fa-solid fa-book-medical text-blue-500 mr-2"></i> Davom ettirish</h2>
          
          <div className="bg-slate-800 rounded-2xl p-6 border-l-4 border-blue-500 shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold text-blue-400 bg-blue-900/30 px-2 py-1 rounded uppercase tracking-wide">Kardiologiya</span>
                <h3 className="text-lg font-bold text-white mt-2">EKG Asoslari va Qochqinlar</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                <i className="fa-solid fa-heart-pulse"></i>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>O'zlashtirish</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors flex-1 text-center">
                <i className="fa-regular fa-circle-play mr-2"></i> Darsni davom ettirish
              </button>
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
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="font-bold text-white mb-4 text-center border-b border-slate-700 pb-3">
               <i className="fa-solid fa-robot text-teal-400 mr-2"></i> AI O'qituvchi Yordamchisi
            </h3>
            <p className="text-sm text-slate-400 mb-4 text-center">
              Sizga tushunarsiz bo'lgan tibbiy termin yoki kasallik patogenezini oddiy formatda so'rang.
            </p>
            <textarea 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-teal-500 h-24 resize-none mb-3"
              placeholder="Masalan: Tushuntirib bering, Atrial Fibrilatsiya o'zi asosan nimadan kelib chiqadi?"
            ></textarea>
            <button className="w-full bg-teal-600 hover:bg-teal-500 text-white rounded-lg py-2 font-medium transition-colors">
              AI dan so'rash
            </button>
          </div>

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

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="font-bold text-white mb-4 text-center"><i className="fa-solid fa-medal text-yellow-400 mr-2"></i> So'nggi Yutuqlar</h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                     <i className="fa-solid fa-shield-cat text-2xl text-yellow-500"></i>
                     <span className="text-sm font-bold text-slate-300">Diagnostika Ustasi</span>
                  </div>
                  <span className="text-xs text-emerald-400">+500 XP</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700">
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
