import React from 'react';
import { useNavigate } from 'react-router-dom';

const Methodology = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Arterial qon bosimini o'lchash (Tensiometria)",
            icon: "fa-solid fa-heart-pulse text-rose-500",
            content: (
                <div className="space-y-4">
                    <h4 className="font-bold text-emerald-400">📚 Akademik Lotin Terminologiyasi</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-sm list-disc list-inside">
                        <li><strong>Tensiometria</strong> — Qon bosimini o'lchash</li>
                        <li><strong>Tensiometrum</strong> — Tonometr</li>
                        <li><strong>Arteria brachialis</strong> — Yelka arteriyasi</li>
                        <li><strong>Fossa cubitalis</strong> — Tirsak chuqurchasi</li>
                        <li><strong>Systole / Diastole</strong> — Yurakning qisqarishi / bo'shashishi</li>
                        <li><strong>Toni Korotkowi</strong> — Korotkov tonlari (Ovozli signallar)</li>
                    </ul>

                    <h4 className="font-bold text-emerald-400 mt-6 pt-4 border-t border-slate-700">🩺 Bosqichma-bosqich o'lchash metodikasi</h4>
                    <div className="space-y-4 text-slate-300 relative pl-4 border-l-2 border-emerald-500/30">
                        <div className="relative">
                            <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">1</span>
                            <p><strong>Positio aegroti:</strong> Bemor tinch o'tirgan holatda qo'l yurak sohasida ushlab turiladi.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">2</span>
                            <p><strong>Applicatio manicae:</strong> Manjet tirsak chuqurchasidan 2-3 sm yuqorida mahkamlanadi.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">3</span>
                            <p><strong>Positio stethoscopii:</strong> Fossa cubitalisda A. brachialis tutilib, stetoskop bosiladi.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">4</span>
                            <p><strong>Inflatio & Deflatio aeris:</strong> Havo puflanadi va sekin chiqariladi. I-faza (Sistola) va V-faza (Diastola) aniqlanadi.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Shina qo'yish amaliyati (Immobilisatio)",
            icon: "fa-solid fa-bone text-sky-500",
            content: (
                <div className="space-y-4">
                    <p className="text-slate-300 text-sm">Ochiq jarohat va suyak sinishlarida birinchi tibbiy transport immobilizatsiyasi.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                         {[
                             { title: "Analgesia", desc: "Baholash va og'riqsizlantirish inyeksiyasi" },
                             { title: "Haemostasis", desc: "Ochiq yara bo'lsa darhol Esmarch jguti" },
                             { title: "Mensura", desc: "Sog'lom oyoq bo'yicha shinani o'lchash" },
                             { title: "Protectio", desc: "Suyak bo'rtoqlariga valik va paxta qatlami" },
                             { title: "Immobilisatio", desc: "Kamida 2 ta yon atrofdagi bo'g'imni qotirish" },
                             { title: "Controlo", desc: "Bintlangach barmoq uchida kapillyar tekshiruvi" },
                         ].map((item, id) => (
                             <div key={id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-start gap-4 hover:border-sky-500 transition-colors">
                                 <div className="w-10 h-10 min-w-[2.5rem] bg-sky-500/10 rounded-full flex items-center justify-center text-sky-400 font-bold">0{id+1}</div>
                                 <div>
                                     <h5 className="font-bold text-white text-sm">{item.title}</h5>
                                     <p className="text-xs text-slate-400">{item.desc}</p>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
            )
        },
        {
            title: "Vaziyatli Masalalar (Case-Study)",
            icon: "fa-solid fa-microscope text-amber-500",
            content: (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-5 rounded-xl border-l-4 border-amber-500">
                        <h4 className="font-bold text-amber-400 text-lg mb-2">🔍 Yolg'on Gipertenziya</h4>
                        <p className="text-slate-300 text-sm italic mb-4">"45 yoshli semiz bemorga (qol aylanasi 44sm) standart manjet ishlatilganda bosim 175/105 ko'rsatdi..."</p>
                        <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-400 border border-slate-700">
                            <strong>Yechim:</strong> Noto'g'ri o'lcham tufayli bosim +30 mmHg baland ko'rsatadi. Bu yerda dorilarni shoshilinch yuborish gipotenziv kollapsga olib keladi. Keng tasmalik manjet kerak.
                        </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-rose-500/10 to-transparent p-5 rounded-xl border-l-4 border-rose-500">
                        <h4 className="font-bold text-rose-400 text-lg mb-2">🩸 Murakkab Politravma</h4>
                        <p className="text-slate-300 text-sm italic mb-4">"YTH jabrlanuvchisida ochiq boldir sinishi va pulsatsiyalanuvchi qip-qizil qon oqimi..."</p>
                        <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-400 border border-slate-700">
                            <strong>Algoritm:</strong> 1. JGUT 2. Og'riqsizlantirish 3. Aseptik bog'lam 4. Transport shinasi (tizza, to'piq va chanoqni qamrab).
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
            {/* Header */}
            <header className="bg-slate-800 p-6 shadow-xl border-b border-slate-700 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-slate-700 hover:bg-emerald-500 transition-colors flex items-center justify-center">
                           <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold">🩺 Metodik Materiallar bazasi</h1>
                            <p className="text-sm text-emerald-400">Klinik o'quv modullari</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/test')} className="hidden md:flex bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg font-bold items-center transition-colors">
                        <i className="fa-solid fa-play mr-2"></i> Bilimni sinash (Quiz)
                    </button>
                </div>
            </header>

            {/* Content Container */}
            <main className="max-w-5xl mx-auto mt-10 px-6 space-y-10">
                
                {/* Introduction */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black mb-4">Arterial qon bosimi va Shikastlanish metodikasi</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">Vizuallashtirilgan qadam-baqadam ko'rsatmalar tizimi orqali eng asosiy amaliy fan ko'nikmalarini osongina eslab qoling.</p>
                </div>

                {/* Info Blocks */}
                {sections.map((sec, idx) => (
                    <section key={idx} className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                        <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex items-center gap-3">
                             <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-600 shadow-inner">
                                <i className={`text-2xl ${sec.icon}`}></i>
                             </div>
                             <h3 className="text-xl font-bold">{sec.title}</h3>
                        </div>
                        <div className="p-6 md:p-8">
                             {sec.content}
                        </div>
                    </section>
                ))}

                {/* Practical Table */}
                <section className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-2xl">
                     <div className="bg-slate-900/50 p-6 border-b border-slate-700">
                         <h3 className="text-xl font-bold flex items-center gap-3">
                            <i className="fa-solid fa-calendar-days text-indigo-400"></i>
                            Amaliy Mashg'ulotlar Rejasi (32 soat)
                         </h3>
                     </div>
                     <div className="p-6 overflow-x-auto">
                         <table className="w-full text-left border-collapse min-w-[600px]">
                             <thead>
                                 <tr className="border-b border-slate-700 text-sm text-slate-400 uppercase">
                                     <th className="pb-3 px-4 w-12">№</th>
                                     <th className="pb-3 px-4">Mavzu</th>
                                     <th className="pb-3 px-4 text-center w-24">Soat</th>
                                 </tr>
                             </thead>
                             <tbody className="text-sm font-medium text-slate-200">
                                 <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">1</td>
                                     <td className="py-4 px-4 text-slate-300">Tayanch–harakat apparati sinishlari va chiqishlarini tashxislash, Transport immobilizatsiya, Gips texnikasi.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
                                 </tr>
                                 <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">2</td>
                                     <td className="py-4 px-4 text-slate-300">Ko‘krak qafasi va yelka kamari shikastlanishlari. Yelka suyagi va bo'g'imi chiqishlari.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
                                 </tr>
                                 <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">3</td>
                                     <td className="py-4 px-4 text-slate-300">Umurtqa pog‘onasi shikastlari. Chanoq va son suyaklarini sinishlari.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
                                 </tr>
                                 <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">4</td>
                                     <td className="py-4 px-4 text-slate-300">Tizza bo‘g‘imi shikastlanishlari: menisklar, boldir va oshiq bo‘g‘imi jarohatlari.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
                                 </tr>
                                 <tr className="hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">...</td>
                                     <td className="py-4 px-4 text-slate-500 italic">Qolgan 4 ta mavzu ham amaliy kurs asosida 4 soatdan o'tiladi (Jadval uzluksizligi).</td>
                                     <td className="py-4 px-4 text-center text-slate-400">-</td>
                                 </tr>
                             </tbody>
                         </table>
                     </div>
                </section>

                <div className="flex justify-center mt-12 mb-8">
                    <button onClick={() => navigate('/test')} className="group flex flex-col items-center gap-2 hover:scale-105 transition-transform">
                        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] group-hover:bg-emerald-500 transition-colors">
                            <i className="fa-solid fa-rocket text-3xl text-white ml-1"></i>
                        </div>
                        <span className="font-bold text-emerald-400 uppercase tracking-widest text-sm">Real Testga o'tish</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Methodology;
