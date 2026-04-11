import React, { useState, useEffect } from 'react';
import InteractiveHotspot from './InteractiveHotspot';
import DuelMode from './DuelMode';

// Mock DB for MVP
const MOCK_CASE = {
  id: 1,
  title: "Klinik Holat: Kardiologiya (EKG & Rentgen)",
  description: "Bemor 55 yoshda, ko'krak qafasida sanchuvchi og'riq va havo yetishmasligi bilan murojaat qildi. Rasmda bemorning tizza bo'g'imi rentgeni (tasodifan olingan) ko'rsatilgan. Asosiy e'tibor tizza suyaklarining o'zgarishida.",
  // Using a valid generic medical placeholder image for mock
  imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", 
  targetHotspot: { x: 45, y: 55, radius: 10, name: "Osteofit o'choqlari" }
};

const INITIAL_USER = {
  name: "Dr. Alisher",
  level: 3,
  xp: 1450,
  specialty: "Umumiy amaliyot shifokori"
};

const MedZukkooApp = () => {
  const [user, setUser] = useState(INITIAL_USER);
  const [currentCase, setCurrentCase] = useState(MOCK_CASE);
  const [activeMode, setActiveMode] = useState('menu'); // 'menu', 'solo', 'duel'
  const [gameState, setGameState] = useState('playing'); // 'playing', 'feedback'
  const [userClick, setUserClick] = useState(null);
  const [scoreResult, setScoreResult] = useState(null);

  // Fuzzy Scoring Logic
  const calculateFuzzyScore = (clickX, clickY, target) => {
    // Distance formula
    const dx = clickX - target.x;
    const dy = clickY - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Fuzzy logic rules:
    // Distance < target.radius: 100% (Exact hit)
    // Distance < target.radius * 2: 70% (Close but not exact - "Yaqinlashdingiz")
    // Distance < target.radius * 4: 40% (Partial understanding - "Qisman to'g'ri")
    // Else: 0% 
    
    let score = 0;
    let message = "";
    let type = "";

    if (distance <= target.radius) {
      score = 100;
      message = "Ajoyib! Tashxis to'liq tasdiqlandi.";
      type = "success";
    } else if (distance <= target.radius * 2) {
      score = 70;
      message = "Yaqin keldingiz, o'choq biroz boshqa joyda.";
      type = "warning";
    } else if (distance <= target.radius * 4) {
      score = 40;
      message = "To'qima to'g'ri topildi, lekin o'choq bu yerda emas.";
      type = "warning";
    } else {
      score = 0;
      message = "Noto'g'ri tashxis. Patalogiya aniqlanmadi.";
      type = "error";
    }

    return { score, message, type, distance, clickPos: { x: clickX, y: clickY } };
  };

  const handleImageClick = (coords) => {
    if (gameState !== 'playing') return;
    
    setUserClick(coords);
    const result = calculateFuzzyScore(coords.x, coords.y, currentCase.targetHotspot);
    setScoreResult(result);
    setGameState('feedback');
    
    // Update dashboard XP based on score
    if (result.score > 0) {
      setUser(prev => ({
        ...prev,
        xp: prev.xp + result.score
      }));
    }
  };

  const handleNextCase = () => {
    setGameState('playing');
    setUserClick(null);
    setScoreResult(null);
    // In real app, load next case from backend
  };

  if (activeMode === 'duel') {
      return <DuelMode onExit={() => setActiveMode('menu')} />;
  }

  if (activeMode === 'menu') {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-10 font-sans text-slate-100">
                <div className="max-w-4xl w-full">
                   <div className="text-center mb-12">
                       <h1 className="text-4xl font-light tracking-tight mb-4 text-white uppercase"><i className="fa-solid fa-hospital text-blue-500 mr-3"></i> Klinik Tahlil <span className="font-bold text-blue-500">Platformasi</span></h1>
                       <p className="text-lg text-slate-400">Tibbiy ta'lim va diagnostik malakani oshirish tizimi</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Solo Mode */}
                       <div 
                           className="glass-card p-8 cursor-pointer border-t-4 border-emerald-500 hover:shadow-emerald-500/10 transition-shadow"
                           onClick={() => setActiveMode('solo')}
                       >
                           <i className="fa-solid fa-microscope text-3xl text-emerald-500 mb-6 block"></i>
                           <h2 className="text-xl font-bold mb-2">Amaliy Mashg'ulot (Klinik Holatlar)</h2>
                           <p className="text-slate-400 text-sm leading-relaxed">Bemorlarning tasviriy diagnostikasi (X-Ray, MRT, KT) ustida ishlash. Mutaxassislik bo'yicha malaka indeksi (XP) ni mustaqil oshiring.</p>
                       </div>
                       
                       {/* Duel Mode */}
                       <div 
                           className="glass-card p-8 cursor-pointer border-t-4 border-indigo-500 hover:shadow-indigo-500/10 transition-shadow relative overflow-hidden"
                           onClick={() => setActiveMode('duel')}
                       >
                           <i className="fa-solid fa-network-wired text-3xl text-indigo-400 mb-6 block drop-shadow-md"></i>
                           <h2 className="text-xl font-bold mb-2 text-white">Konsilium Rejimi (Klinik Duel)</h2>
                           <p className="text-slate-400 text-sm leading-relaxed">Boshqa mutaxassislar bilan real vaqt rejimida bitta tibbiy holat ustida tortishish. Patologiyani aniq baholash orqali oliy natijani qayd eting.</p>
                       </div>
                   </div>
               </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 pb-20">
      
      {/* Header Dashboard Focus */}
      <header className="max-w-6xl mx-auto glass-panel rounded-2xl p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-user-doctor text-2xl text-white"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-['Outfit']">{user.name}</h1>
            <p className="text-slate-400 text-sm font-medium">{user.specialty} • Lvl {user.level}</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <button onClick={() => setActiveMode('menu')} className="px-4 py-2 border border-slate-700 bg-slate-800 rounded-xl hover:bg-slate-700 text-sm font-medium transition-colors">
              <i className="fa-solid fa-arrow-left mr-2"></i> Ortga
          </button>
          
          <div className="text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Joriy Reyting</p>
            <div className="text-3xl font-extrabold text-gradient">{user.xp} XP</div>
          </div>
          <div className="h-12 w-px bg-slate-700"></div>
          <div className="text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Fanlar Radar</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-xs font-bold">Kardio</span>
              <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-xs font-bold">Nevro</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              <h2 className="text-xl font-bold font-['Outfit']text-white">Yangi Topshiriq</h2>
            </div>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">{currentCase.title}</h3>
            <p className="text-slate-300 leading-relaxed text-sm">
              {currentCase.description}
            </p>
            
            <div className="mt-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
               <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2"><i className="fa-solid fa-bullseye text-blue-500 mr-2"></i>Sizning Vazifangiz:</p>
               <p className="text-sm text-slate-200">Rasm ustida patologiya joylashgan markazni (<span className="text-blue-400 font-bold">{currentCase.targetHotspot.name}</span>) sichqoncha yordamida aniq belgilang.</p>
            </div>
          </div>

          {/* Feedback Card (Visual Scoring) */}
          {gameState === 'feedback' && scoreResult && (
            <div className={`glass-card p-6 border-l-4 ${
              scoreResult.type === 'success' ? 'border-l-emerald-500' :
              scoreResult.type === 'warning' ? 'border-l-amber-500' :
              'border-l-rose-500'
            }`}>
              <h3 className="text-lg font-bold mb-2">Tahlil Natijasi</h3>
              <div className="text-4xl font-extrabold mb-2 text-white">
                {scoreResult.score}% <span className="text-sm font-normal text-slate-400">aniqlik</span>
              </div>
              <p className="text-sm font-medium text-slate-300 mb-4">{scoreResult.message}</p>
              
              <button 
                onClick={handleNextCase}
                className="w-full btn-primary"
              >
                Keyingi Holat <i className="fa-solid fa-arrow-right ml-2"></i>
              </button>
            </div>
          )}
        </div>

        {/* Right Column - Interactive InteractiveHotspot */}
        <div className="lg:col-span-2">
            <InteractiveHotspot 
              imageUrl={currentCase.imageUrl}
              hotSpots={gameState === 'feedback' ? [currentCase.targetHotspot] : []} // Show the correct answer only in feedback mode
              onImageClick={handleImageClick}
            />

            {/* Display User's Click marker if they clicked */}
            {userClick && gameState === 'feedback' && (
              <div className="mt-4 glass-panel p-4 rounded-xl flex items-center justify-between text-sm text-slate-300">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white"></div> Sizning belgilashingiz
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div> Asl o'choq
                </div>
              </div>
            )}
        </div>

      </main>
    </div>
  );
};

export default MedZukkooApp;
