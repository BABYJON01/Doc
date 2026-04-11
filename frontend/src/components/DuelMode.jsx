import React, { useState, useEffect, useRef } from 'react';
import InteractiveHotspot from './InteractiveHotspot';

const MOCK_CASE = {
  id: 1,
  title: "Klinik Holat: Kardiologiya (EKG & Rentgen)",
  description: "Bemor 55 yoshda, ko'krak qafasida sanchuvchi og'riq va havo yetishmasligi bilan murojaat qildi. Rasmda bemorning tizza bo'g'imi rentgeni (tasodifan olingan) ko'rsatilgan. Asosiy e'tibor tizza suyaklarining o'zgarishida.",
  imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", 
  targetHotspot: { x: 45, y: 55, radius: 10, name: "Osteofit o'choqlari" }
};

const DuelMode = ({ onExit }) => {
  const [status, setStatus] = useState('connecting'); // connecting, waiting, playing, finished
  const [socket, setSocket] = useState(null);
  const [opponentInfo, setOpponentInfo] = useState(null);
  const [scores, setScores] = useState({ me: 0, opponent: 0 });
  const [opponentMove, setOpponentMove] = useState(null); // coordinate
  const [myMove, setMyMove] = useState(null);
  
  const wsRef = useRef(null);

  useEffect(() => {
    // In production, use wss:// or the correct backend base url
    const wsUrl = `ws://localhost:8000/api/ws/duel`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('waiting');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'waiting':
          setStatus('waiting');
          break;
        case 'match_found':
          setOpponentInfo({ name: data.opponent_id });
          setStatus('playing');
          break;
        case 'opponent_move':
          // Another player in the room clicked
          // Compare player_id to my own id OR simple if it's from backend, check if it's not the echo.
          // For MVP: assume any opponent_move event is from the opponent.
          setScores(prev => ({ ...prev, opponent: data.score }));
          setOpponentMove(data.coords);
          if (myMove) {
              // If we both moved, game finished
              setStatus('finished');
          }
          break;
        default:
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error: ', error);
      setStatus('error');
    };

    ws.onclose = () => {
      if (status !== 'finished') {
          setStatus('disconnected');
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []); // Run once on mount

  const calculateFuzzyScore = (clickX, clickY, target) => {
    const dx = clickX - target.x;
    const dy = clickY - target.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= target.radius) return 100;
    if (distance <= target.radius * 2) return 70;
    if (distance <= target.radius * 4) return 40;
    return 0;
  };

  const handleImageClick = (coords) => {
    if (status !== 'playing' || myMove !== null) return;
    
    const myScore = calculateFuzzyScore(coords.x, coords.y, MOCK_CASE.targetHotspot);
    setMyMove(coords);
    setScores(prev => ({ ...prev, me: myScore }));
    
    // Send to backend
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
            type: "click_hotspot",
            score: myScore,
            coords: coords
        }));
    }

    if (opponentMove) {
        setStatus('finished');
    }
  };

  if (status === 'connecting' || status === 'waiting') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] glass-card p-12">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                  <div className="w-20 h-20 bg-slate-800 border-[2px] border-slate-600 rounded-lg flex items-center justify-center relative z-10 shadow-lg">
                      <i className="fa-solid fa-satellite-dish text-3xl text-slate-400"></i>
                  </div>
              </div>
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-300 mb-2">{status === 'connecting' ? "Sinxronizatsiya..." : "Hamkasb qidirilmoqda..."}</h2>
              <p className="text-slate-500 text-sm">Konsilium tizimi tarmoqdagi faol mutaxassislarni izlamoqda</p>
              
              {status === 'waiting' && (
                  <div className="mt-8 flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
              )}
              <button onClick={onExit} className="mt-10 px-6 py-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">Bekor qilish</button>
          </div>
      );
  }

  if (status === 'disconnected' || status === 'error') {
      return (
         <div className="flex flex-col items-center justify-center min-h-[60vh] glass-card p-12 text-center">
             <i className="fa-solid fa-link-slash text-5xl text-rose-500 mb-6"></i>
             <h2 className="text-2xl font-bold text-white mb-2">Aloqa Uzildi</h2>
             <p className="text-slate-400 mb-6">Server bilan ulanish yopildi yoki raqib chiqib ketdi.</p>
             <button onClick={onExit} className="btn-primary">Asosiy Menyu</button>
         </div>
      );
  }

  return (
    <div className="flex flex-col h-full gap-6 max-w-6xl mx-auto">
        {/* Versus Header - Clinical Style */}
        <div className="glass-panel p-5 rounded-2xl flex justify-between items-center bg-slate-800 border border-slate-700 shadow-md relative overflow-hidden">
            <div className="flex items-center gap-4 z-10 w-[40%]">
                <div className="w-12 h-12 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-lg text-slate-300">
                    <i className="fa-solid fa-user-doctor"></i>
                </div>
                <div>
                   <div className="text-sm font-medium text-slate-400">Sizning Xulosangiz</div>
                   {myMove !== null ? <div className="text-xl font-bold text-emerald-400">{scores.me}% Aniqlik</div> : <span className="text-blue-400 text-xs animate-pulse">Tahlil qilinmoqda...</span>}
                </div>
            </div>

            <div className="z-10 bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg flex items-center justify-center text-sm font-semibold tracking-widest text-slate-400 shadow-inner">
                KONSILIUM
            </div>

            <div className="flex items-center justify-end gap-4 z-10 text-right w-[40%]">
                <div>
                   <div className="text-sm font-medium text-slate-400">{opponentInfo?.name || "Hamkasb"} Xulosasi</div>
                   {opponentMove !== null ? <div className="text-xl font-bold text-blue-400">{scores.opponent}% Aniqlik</div> : <span className="text-slate-500 text-xs animate-pulse">Kutilmoqda...</span>}
                </div>
                <div className="w-12 h-12 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-lg text-slate-300">
                    <i className="fa-solid fa-user-nurse"></i>
                </div>
            </div>
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-card p-6 border-l-4 border-indigo-500">
                    <h2 className="text-lg font-semibold text-indigo-400 flex justify-between items-center mb-1">
                        KLINIK KONSILIUM <i className="fa-solid fa-users-viewfinder"></i>
                    </h2>
                    <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest">Aktiv Holat</p>
                    
                    <h3 className="text-md font-semibold text-white mb-2">{MOCK_CASE.title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{MOCK_CASE.description}</p>
                    
                    {myMove === null ? (
                        <div className="mt-6 bg-slate-800 p-4 rounded-lg text-slate-300 text-sm text-center border border-slate-700 shadow-inner">
                            <i className="fa-solid fa-microscope text-indigo-400 mr-2 animate-pulse"></i> Patologiya o'chog'ini belgilang.
                        </div>
                    ) : status === 'playing' ? (
                        <div className="mt-6 bg-slate-800 p-4 rounded-lg text-emerald-400 text-sm font-medium text-center border border-emerald-500/20">
                            Xulosa qabul qilindi. Hamkasb kutilmoqda...
                        </div>
                    ) : null}

                    {status === 'finished' && (
                        <div className="mt-6">
                            <div className="p-5 rounded-lg text-center bg-slate-800 mb-4 border border-slate-700">
                                <h3 className="text-lg font-bold mb-2">
                                    {scores.me > scores.opponent ? <span className="text-emerald-400"><i className="fa-solid fa-check-circle mr-2"></i>Sizning xulosangiz aniqroq</span> : 
                                     scores.me < scores.opponent ? <span className="text-blue-400"><i className="fa-solid fa-info-circle mr-2"></i>Hamkasb xulosasi aniqroq</span> : 
                                     <span className="text-slate-300">Ikkala xulosa ham teng qiymatda</span>}
                                </h3>
                                <p className="text-xs text-slate-400">Malaka indeksi yangilandi.</p>
                            </div>
                            <button onClick={onExit} className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-semibold">Tahlilni Yakunlash</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-2">
                <InteractiveHotspot 
                    imageUrl={MOCK_CASE.imageUrl}
                    hotSpots={status === 'finished' ? [MOCK_CASE.targetHotspot] : []} 
                    onImageClick={handleImageClick}
                />
                
                {/* Visualizing pins if finished */}
                <div className="relative mt-2">
                    {myMove && status === 'finished' && (
                        <div className="absolute z-30 pointer-events-none" style={{ left: `${myMove.x}%`, top: `${myMove.y}%`, transform: 'translate(-50%, -50%)', marginTop: '-10px' }}>
                             <div className="flex flex-col items-center">
                                 <div className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">Sizning Xulosangiz</div>
                                 <div className="w-0.5 h-3 bg-emerald-600"></div>
                             </div>
                        </div>
                    )}
                    {opponentMove && status === 'finished' && (
                        <div className="absolute z-30 pointer-events-none" style={{ left: `${opponentMove.x}%`, top: `${opponentMove.y}%`, transform: 'translate(-50%, -50%)', marginTop: '-10px' }}>
                             <div className="flex flex-col items-center">
                                 <div className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap">Hamkasb Xulosasi</div>
                                 <div className="w-0.5 h-3 bg-blue-600"></div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default DuelMode;
