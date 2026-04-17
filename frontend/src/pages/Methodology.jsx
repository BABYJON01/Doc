import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Methodology = () => {
    const navigate = useNavigate();

    const practicalSkills = [
        {
            title: "1. Bilak sohasi jaroxatida: Norvonsimon shina",
            steps: [
                "Shina jarohatlangan qo‘lning tashqi yuzasi bo‘ylab qo‘yiladi",
                "Ulkaning o‘rta uchligidan kaft-barmoq bo‘g‘imigacha fiksatsiya qilinadi",
                "Qo‘l tirsak bo‘g‘imidan 90 daraja burchak ostida bukiladi",
                "Bilak supinatsiya bilan pronatsiya holati oralig‘ida turadi",
                "Kaft ichiga valik qo‘yiladi va kosinka yordamida bo‘yinga bog‘lanadi"
            ]
        },
        {
            title: "2. Boldir suyaklari jaroxatida transport immobilizatsiyasi",
            steps: [
                "Standart shinalar (Kramer, Diterixs) tayyorlanadi",
                "Dala sharoitida og‘riqsizlantirish (analgetik) kiritiladi",
                "Tizza va to'piq bo'g'imlarini qamrab oluvchi to'liq o'lcham olinadi (sog'lom oyoqdan)",
                "Poyabzal ustidan qo'yilib, bint orqali mahkamlanadi",
                "Barmoqlardagi sirkulyatsiya (kapillyar javob) tekshiriladi"
            ]
        },
        {
            title: "3. Vishnevskiy bo‘yicha vagosimpatik blokada",
            steps: [
                "Bemor chalqanchasiga yotqizilib kuraklar orasiga valik qo‘yiladi",
                "Bosh blokada qilinadigan joyga qarama-qarshi tomonga maksimal buriladi",
                "Chap qo‘l ko‘rsatkich barmog‘i bilan m.sternocleidomastoideus orqa qirrasi bosiladi",
                "Igna barmoq yuqori sohasidan kiritilib, umurtqalar tomon yo'naltiriladi",
                "0,25% novokain 30-50 ml hajmda sekin kiritiladi"
            ]
        },
        {
            title: "4. Qovurg‘alararo blokada",
            steps: [
                "Bemorni zarur pozitsiyada (o'tirgan) ushlash",
                "Novokainni qovurg‘aning yuqori qirg‘og‘iga uzatish",
                "Sukkusiya (asorat)ni va qon tomir teshilishini aniqlash",
                "Havo yoxud qon kirmasligi uchun qat'iy aseptika tayyorlash",
                "Nafas olingandagi og'riq yo'qolganini baholash"
            ]
        },
        {
            title: "5. Shans yoqasini qo‘yish",
            steps: [
                "To'g'ri ko'rsatma tekshiriladi (bo'yin jarohati mavjudligi)",
                "Shans yoqasi ensa do‘mbog‘iga qat'iy tayanishi lozim",
                "Ikkala so‘rg‘ichsimon o‘simtaga taqalishi nazorat asosi",
                "Pastdan ko‘krak qafasiga yaxshilab tayanadi",
                "Asab tugunlari qisilib qolishini oldini olib me'yoriy o'raladi"
            ]
        },
        {
            title: "6. Son suyagi sinishida Diterixs shinasini qo‘yish",
            steps: [
                "Shinaning uzun (tashqi) qismi qo‘ltiq ostidan tashqi to'piqqacha qo'yiladi",
                "Qisqa (ichki) qismi chov burmasidan oyoq panja ostigacha o'rnatiladi",
                "Poyabzal kiygizilgan panjaga uchigacha bog'lanadi",
                "Aylanma mexanizm va tayanch yordamida oyoq engil tortiladi",
                "Barcha qism yumshoq bint bilan tanaga ustun holida o‘raladi"
            ]
        },
        {
            title: "7. Yelka suyagi sinishida Kramer shinasini qo‘yish",
            steps: [
                "Kramer shinasiga qalinroq paxta qo‘yib bintlanadi va unga shakl beriladi",
                "Singan joyiga Sol. Novocaini 1% - 50,0ml yuboriladi",
                "Yelka tanaga yaqinlashtirilib, tirsak 90 daraja yig'iladi",
                "Shina sog'lom kurak bo'g'imidan singan barmoqlar uchigacha qoplab kelishi shart",
                "Kosinka bog'ichi bilan bo'yindan osib qo'yiladi"
            ]
        },
        {
            title: "8. Chanoq suyagi singanda transport immobilizatsiyasi",
            steps: [
                "Bemor mutlaqo qattiq taxta-shchitga chalqancha yotqiziladi",
                "Tizza va chanoq-son bo‘g‘imlari yarim bukilgan holda tutiladi",
                "Tizza ostiga yumshoq qalin valik qo'yiladi (Volkovichning 'baqa' pozasi)",
                "Tovonlar birlashtirilib, tizzalar orasi yengil ochiladi",
                "Toz qismi qattiq keng kamar (prostina) bilan fiksatsiyalanadi"
            ]
        },
        {
            title: "9. Arterial qon ketishda Jgut qo‘yish",
            steps: [
                "Zudlik bilan jgut ostiga mato (kiyim) yopiladi (ochiq teriga hargiz mumkin emas)",
                "Bilakdan qon ketsa yelka o'rtasiga, Boldirdan ketsa son tubiga qo'yiladi",
                "Jgut pulsatsiyalovchi qon favvorasi to'xtaguncha asbobda qisiladi",
                "Aniq vaqt (soat/minut) yozilgan xat biriktiriladi (qish-1, yoz-2 soat max)",
                "Amaliyotchi uni shina tagiga berkitmay har doim ko'rinarli joyga joylaydi"
            ]
        },
        {
            title: "10. Shkolnikov bo'yicha chanoq ichi anesteziyasi",
            steps: [
                "Bemorni Volkovich (baqa) pozitsiyasi orqali yotqizish",
                "Spina iliaca anterior superior (Old ostki o'simta) dan 2 sm ichkarini antiseptika qilish",
                "Teri ustini 0.5% novokain bilan igna sanchib infiltratsiya hosil qilish",
                "12-15 sm bo'lgan uzun ignani chanoq ichki yuzasi bo'ylab kiritish",
                "0.25% li novokaindan 150ml gacha ichki fassiya ostiga asta yuborish"
            ]
        }
    ];

    const [randomSkill, setRandomSkill] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);

    const handleDrawTicket = () => {
        setIsSpinning(true);
        setRandomSkill(null);
        setTimeout(() => {
            const index = Math.floor(Math.random() * practicalSkills.length);
            setRandomSkill(practicalSkills[index]);
            setIsSpinning(false);
        }, 1500); // 1.5s spinning simulation
    };

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
        },
        {
            title: "Rentgenogramma Tahlili (X-Ray)",
            icon: "fa-solid fa-x-ray text-violet-500",
            content: (
                <div className="space-y-8">
                    {/* Case 1 */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch">
                        <div className="md:flex h-full">
                            <div className="md:w-1/2 p-4 bg-black flex items-center justify-center">
                                <img src="/assets/xray_clavicula.png" alt="X-Ray Clavicula" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" />
                            </div>
                            <div className="md:w-1/2 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-700/50">
                                <h4 className="text-xl font-bold text-violet-400 mb-2">1. Umrov suyagi sinishi xarakteri</h4>
                                <p className="text-slate-300 text-sm mb-5">"Keltirilgan rentgenogramma tasviriga qarab, ushbu suyakdagi o'zgarishni qanday klinik ta'riflaysiz?"</p>
                                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 group">
                                    <strong className="text-emerald-400 block text-xs uppercase tracking-widest mb-1 group-hover:text-white transition-colors">To'g'ri tashxis:</strong>
                                    <span className="text-sm font-medium text-slate-200">Suyak bo'laklari bo'ylama o'qi bo'yicha siljib singan (dislokatsiya)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Case 2 */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch flex flex-col-reverse md:flex-row">
                        <div className="md:w-1/2 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-r border-slate-700/50">
                            <h4 className="text-xl font-bold text-violet-400 mb-2">2. Boldir suyaklari ochiq jarohati</h4>
                            <p className="text-slate-300 text-sm mb-5">"Astra-rentgenologik tasvirda 'os tibia' va 'os fibula' (katta va kichik boldir) suyaklarining qattiq burchakli sinishi ko'rsatilgan. Qo'llanilishga eng zarur ortopedik taktika nima?"</p>
                            <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 group">
                                <strong className="text-emerald-400 block text-xs uppercase tracking-widest mb-1 group-hover:text-white transition-colors">To'g'ri tashxis:</strong>
                                <span className="text-sm font-medium text-slate-200">Ilizarov tipidagi kompressiyali-distraksion apparati orqali fiksatsiya qilish.</span>
                            </div>
                        </div>
                        <div className="md:w-1/2 p-4 bg-black flex items-center justify-center">
                            <img src="/assets/xray_tibia.png" alt="X-Ray Tibia" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" />
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

                 {/* Random Skill App (Bilet) */}
                 <section className="bg-slate-800 rounded-3xl border border-slate-700 overflow-hidden shadow-xl mb-10">
                     <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
                         <div>
                             <h3 className="text-xl font-bold flex items-center gap-3">
                                <i className="fa-solid fa-ticket text-indigo-400"></i>
                                Imtihon Simulyatori: Tasodifiy Ko'nikma
                             </h3>
                             <p className="text-sm text-slate-400 mt-1">"Bilet tortish" orqali 10 ta amaliy ko'nikmadan bittasini aralash holda tanlang va o'zlashtiring.</p>
                         </div>
                     </div>
                     <div className="p-8 flex flex-col items-center justify-center min-h-[300px] border-t-2 border-indigo-500/20">
                         {!randomSkill && !isSpinning && (
                             <div className="text-center">
                                 <i className="fa-solid fa-dice-d20 text-6xl text-slate-600 mb-6 drop-shadow-lg"></i>
                                 <h4 className="text-xl text-slate-300 font-bold mb-6">Tayyormisiz?</h4>
                                 <button 
                                     onClick={handleDrawTicket} 
                                     className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105"
                                 >
                                     <i className="fa-solid fa-hand-pointer mr-2"></i> Bilet Tortish
                                 </button>
                             </div>
                         )}

                         {isSpinning && (
                             <div className="text-center animate-pulse">
                                 <div className="text-blue-500 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                 <p className="text-slate-400 font-bold tracking-widest uppercase">Biletlar aralashmoqda...</p>
                             </div>
                         )}

                         {randomSkill && !isSpinning && (
                             <div className="w-full max-w-3xl animate-[fadeIn_0.5s_ease-out]">
                                 <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
                                     <span className="absolute -top-4 left-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Tanlangan Ko'nikma</span>
                                     
                                     <h4 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4 mt-2 text-center md:text-left">
                                         {randomSkill.title}
                                     </h4>
                                     
                                     <div className="space-y-4">
                                         {randomSkill.steps.map((step, idx) => (
                                             <div key={idx} className="flex gap-4 items-start bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-700 transition-colors">
                                                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center shrink-0">
                                                     {idx + 1}
                                                 </div>
                                                 <p className="text-slate-300 pt-1 text-sm md:text-base">{step}</p>
                                             </div>
                                         ))}
                                     </div>

                                     <div className="mt-8 flex justify-center border-t border-slate-800 pt-6">
                                         <button 
                                             onClick={handleDrawTicket} 
                                             className="bg-slate-700 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-xl transition-all flex items-center gap-2"
                                         >
                                             <i className="fa-solid fa-rotate-right"></i> Boshqa bilet tortish
                                         </button>
                                     </div>
                                 </div>
                             </div>
                         )}
                     </div>
                 </section>

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
                                 <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">5</td>
                                     <td className="py-4 px-4 text-slate-300">Politravma diagnostikasi. Travmatik shok profilaktikasi va davolash algoritmlari.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
                                 </tr>
                                 <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">6</td>
                                     <td className="py-4 px-4 text-slate-300">Son tug‘ma chiqishlari, bo‘yin mushakli qiyshiqligi. Maymoqlik etiologiyasi, klinikasi va diagnostikasi.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
                                 </tr>
                                 <tr className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">7</td>
                                     <td className="py-4 px-4 text-slate-300">Skolioz: klinikasi, tasnifi va davolashi. Oyoq o‘qi deformatsiyalari xususiyatlari.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
                                 </tr>
                                 <tr className="hover:bg-slate-700/30 transition-colors">
                                     <td className="py-4 px-4 text-emerald-400 text-center">8</td>
                                     <td className="py-4 px-4 text-slate-300">Travmatologik va ortopedik bemorlarni reabilitatsiyasi. Amputatsiyaga ko‘rsatmalar va zamonaviy protezlash.</td>
                                     <td className="py-4 px-4 text-center text-slate-400">4 s</td>
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
