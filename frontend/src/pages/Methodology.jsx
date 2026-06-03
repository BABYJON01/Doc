import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Methodology = () => {
    const navigate = useNavigate();
    const { lang, toggleLang } = useApp();

    const t = {
        uz: { 
            title: "Metodik Materiallar bazasi", sub: "Klinik o'quv modullari", btn: "Bilimni sinash (Quiz)",
            mainTitle: "Arterial qon bosimi va Shikastlanish metodikasi",
            mainDesc: "Vizuallashtirilgan qadam-baqadam ko'rsatmalar tizimi orqali eng asosiy amaliy fan ko'nikmalarini osongina eslab qoling.",
            examSimulator: "Imtihon Simulyatori: Tasodifiy Ko'nikma",
            examSimDesc: "\"Bilet tortish\" orqali 10 ta amaliy ko'nikmadan bittasini aralash holda tanlang va o'zlashtiring.",
            ready: "Tayyormisiz?",
            drawTicket: "Bilet Tortish",
            shuffling: "Biletlar aralashmoqda...",
            selectedSkill: "Tanlangan Ko'nikma",
            drawAnother: "Boshqa bilet tortish",
            planTitle: "Amaliy Mashg'ulotlar Rejasi (32 soat)",
            topic: "Mavzu",
            hours: "Soat",
            goToTest: "Real Testga o'tish"
        },
        ru: { 
            title: "База Методических Материалов", sub: "Клинические учебные модули", btn: "Проверить знания (Quiz)",
            mainTitle: "Методика измерения артериального давления и лечения травм",
            mainDesc: "Легко запомните основные практические навыки с помощью визуализированной пошаговой системы инструкций.",
            examSimulator: "Симулятор Экзамена: Случайный Навык",
            examSimDesc: "Выберите и освойте один из 10 практических навыков случайным образом через \"Тянуть билет\".",
            ready: "Готовы?",
            drawTicket: "Тянуть Билет",
            shuffling: "Перемешивание билетов...",
            selectedSkill: "Выбранный Навык",
            drawAnother: "Тянуть другой билет",
            planTitle: "План практических занятий (32 часа)",
            topic: "Тема",
            hours: "Часы",
            goToTest: "Перейти к реальному тесту"
        },
        en: { 
            title: "Methodological Material Base", sub: "Clinical training modules", btn: "Test Knowledge (Quiz)",
            mainTitle: "Blood Pressure & Trauma Methodology",
            mainDesc: "Easily memorize the most essential practical science skills through a visualized step-by-step instruction system.",
            examSimulator: "Exam Simulator: Random Skill",
            examSimDesc: "Select and master one of 10 practical skills randomly by \"Drawing a ticket\".",
            ready: "Are you ready?",
            drawTicket: "Draw Ticket",
            shuffling: "Shuffling tickets...",
            selectedSkill: "Selected Skill",
            drawAnother: "Draw another ticket",
            planTitle: "Practical Training Plan (32 hours)",
            topic: "Topic",
            hours: "Hours",
            goToTest: "Go to Real Test"
        }
    }[lang] || { title: "Metodik Materiallar bazasi", sub: "Klinik o'quv modullari", btn: "Bilimni sinash (Quiz)" };

    const practicalSkills = {
        uz: [
            { title: "1. Bilak sohasi jaroxatida: Norvonsimon shina", steps: ["Shina jarohatlangan qo‘lning tashqi yuzasi bo‘ylab qo‘yiladi", "Ulkaning o‘rta uchligidan kaft-barmoq bo‘g‘imigacha fiksatsiya qilinadi", "Qo‘l tirsak bo‘g‘imidan 90 daraja burchak ostida bukiladi", "Bilak supinatsiya bilan pronatsiya holati oralig‘ida turadi", "Kaft ichiga valik qo‘yiladi va kosinka yordamida bo‘yinga bog‘lanadi"] },
            { title: "2. Boldir suyaklari jaroxatida transport immobilizatsiyasi", steps: ["Standart shinalar (Kramer, Diterixs) tayyorlanadi", "Dala sharoitida og‘riqsizlantirish (analgetik) kiritiladi", "Tizza va to'piq bo'g'imlarini qamrab oluvchi to'liq o'lcham olinadi (sog'lom oyoqdan)", "Poyabzal ustidan qo'yilib, bint orqali mahkamlanadi", "Barmoqlardagi sirkulyatsiya (kapillyar javob) tekshiriladi"] },
            { title: "3. Vishnevskiy bo‘yicha vagosimpatik blokada", steps: ["Bemor chalqanchasiga yotqizilib kuraklar orasiga valik qo‘yiladi", "Bosh blokada qilinadigan joyga qarama-qarshi tomonga maksimal buriladi", "Chap qo‘l ko‘rsatkich barmog‘i bilan m.sternocleidomastoideus orqa qirrasi bosiladi", "Igna barmoq yuqori sohasidan kiritilib, umurtqalar tomon yo'naltiriladi", "0,25% novokain 30-50 ml hajmda sekin kiritiladi"] },
            { title: "4. Qovurg‘alararo blokada", steps: ["Bemorni zarur pozitsiyada (o'tirgan) ushlash", "Novokainni qovurg‘aning yuqori qirg‘og‘iga uzatish", "Sukkusiya (asorat)ni va qon tomir teshilishini aniqlash", "Havo yoxud qon kirmasligi uchun qat'iy aseptika tayyorlash", "Nafas olingandagi og'riq yo'qolganini baholash"] },
            { title: "5. Shans yoqasini qo‘yish", steps: ["To'g'ri ko'rsatma tekshiriladi (bo'yin jarohati mavjudligi)", "Shans yoqasi ensa do‘mbog‘iga qat'iy tayanishi lozim", "Ikkala so‘rg‘ichsimon o‘simtaga taqalishi nazorat asosi", "Pastdan ko‘krak qafasiga yaxshilab tayanadi", "Asab tugunlari qisilib qolishini oldini olib me'yoriy o'raladi"] },
            { title: "6. Son suyagi sinishida Diterixs shinasini qo‘yish", steps: ["Shinaning uzun (tashqi) qismi qo‘ltiq ostidan tashqi to'piqqacha qo'yiladi", "Qisqa (ichki) qismi chov burmasidan oyoq panja ostigacha o'rnatiladi", "Poyabzal kiygizilgan panjaga uchigacha bog'lanadi", "Aylanma mexanizm va tayanch yordamida oyoq engil tortiladi", "Barcha qism yumshoq bint bilan tanaga ustun holida o‘raladi"] },
            { title: "7. Yelka suyagi sinishida Kramer shinasini qo‘yish", steps: ["Kramer shinasiga qalinroq paxta qo‘yib bintlanadi va unga shakl beriladi", "Singan joyiga Sol. Novocaini 1% - 50,0ml yuboriladi", "Yelka tanaga yaqinlashtirilib, tirsak 90 daraja yig'iladi", "Shina sog'lom kurak bo'g'imidan singan barmoqlar uchigacha qoplab kelishi shart", "Kosinka bog'ichi bilan bo'yindan osib qo'yiladi"] },
            { title: "8. Chanoq suyagi singanda transport immobilizatsiyasi", steps: ["Bemor mutlaqo qattiq taxta-shchitga chalqancha yotqiziladi", "Tizza va chanoq-son bo‘g‘imlari yarim bukilgan holda tutiladi", "Tizza ostiga yumshoq qalin valik qo'yiladi (Volkovichning 'baqa' pozasi)", "Tovonlar birlashtirilib, tizzalar orasi yengil ochiladi", "Toz qismi qattiq keng kamar (prostina) bilan fiksatsiyalanadi"] },
            { title: "9. Arterial qon ketishda Jgut qo‘yish", steps: ["Zudlik bilan jgut ostiga mato (kiyim) yopiladi (ochiq teriga hargiz mumkin emas)", "Bilakdan qon ketsa yelka o'rtasiga, Boldirdan ketsa son tubiga qo'yiladi", "Jgut pulsatsiyalovchi qon favvorasi to'xtaguncha asbobda qisiladi", "Aniq vaqt (soat/minut) yozilgan xat biriktiriladi (qish-1, yoz-2 soat max)", "Amaliyotchi uni shina tagiga berkitmay har doim ko'rinarli joyga joylaydi"] },
            { title: "10. Shkolnikov bo'yicha chanoq ichi anesteziyasi", steps: ["Bemorni Volkovich (baqa) pozitsiyasi orqali yotqizish", "Spina iliaca anterior superior (Old ostki o'simta) dan 2 sm ichkarini antiseptika qilish", "Teri ustini 0.5% novokain bilan igna sanchib infiltratsiya hosil qilish", "12-15 sm bo'lgan uzun ignani chanoq ichki yuzasi bo'ylab kiritish", "0.25% li novokaindan 150ml gacha ichki fassiya ostiga asta yuborish"] }
        ],
        ru: [
            { title: "1. Травма предплечья: Лестничная шина", steps: ["Шина накладывается по наружной поверхности поврежденной руки", "Фиксируется от средней трети плеча до пястно-фалангового сустава", "Рука сгибается в локтевом суставе под углом 90 градусов", "Предплечье находится в среднем положении между супинацией и пронацией", "В ладонь вкладывается валик, рука подвешивается на косынке"] },
            { title: "2. Транспортная иммобилизация при переломе костей голени", steps: ["Подготавливаются стандартные шины (Крамера, Дитерихса)", "В полевых условиях вводится обезболивающее (анальгетик)", "Измеряется полный размер с захватом коленного и голеностопного суставов (по здоровой ноге)", "Накладывается поверх обуви и фиксируется бинтом", "Проверяется циркуляция (капиллярный ответ) на пальцах"] },
            { title: "3. Вагосимпатическая блокада по Вишневскому", steps: ["Больной укладывается на спину, под лопатки подкладывается валик", "Голова максимально поворачивается в сторону, противоположную месту блокады", "Указательным пальцем левой руки придавливается задний край m.sternocleidomastoideus", "Игла вводится выше пальца и направляется к позвонкам", "Медленно вводится 30-50 мл 0,25% новокаина"] },
            { title: "4. Межреберная блокада", steps: ["Удержание пациента в нужном положении (сидя)", "Введение новокаина по верхнему краю ребра", "Определение суккусии (осложнения) и прокола кровеносного сосуда", "Строгая асептика для предотвращения попадания воздуха или крови", "Оценка исчезновения боли при дыхании"] },
            { title: "5. Наложение воротника Шанца", steps: ["Проверяются показания (наличие травмы шеи)", "Воротник Шанца должен плотно опираться на затылочный бугор", "Основа контроля - упор в оба сосцевидных отростка", "Снизу хорошо опирается на грудную клетку", "Оборачивается умеренно во избежание ущемления нервных узлов"] },
            { title: "6. Наложение шины Дитерихса при переломе бедра", steps: ["Длинная (наружная) часть шины накладывается от подмышки до наружной лодыжки", "Короткая (внутренняя) часть устанавливается от паховой складки до подошвы", "Привязывается к стопе прямо поверх обуви", "Нога слегка вытягивается с помощью закрутки и упора", "Все части фиксируются к телу мягким бинтом"] },
            { title: "7. Наложение шины Крамера при переломе плеча", steps: ["На шину Крамера кладется слой ваты, бинтуется и ей придается форма", "В место перелома вводится Sol. Novocaini 1% - 50,0 мл", "Плечо приводится к туловищу, локоть сгибается на 90 градусов", "Шина должна покрывать от здорового плечевого сустава до кончиков пальцев поврежденной руки", "Подвешивается на шею с помощью косынки"] },
            { title: "8. Транспортная иммобилизация при переломе таза", steps: ["Пациент укладывается на спину на жесткий щит", "Коленные и тазобедренные суставы удерживаются в полусогнутом состоянии", "Под колени подкладывается мягкий толстый валик (поза 'лягушки' Волковича)", "Пятки сведены вместе, колени слегка разведены", "Тазовая часть фиксируется жестким широким ремнем (простыней)"] },
            { title: "9. Наложение жгута при артериальном кровотечении", steps: ["Под жгут немедленно подкладывается ткань (одежда) (на голую кожу категорически нельзя)", "При кровотечении из предплечья - на середину плеча, из голени - на основание бедра", "Жгут затягивается до остановки пульсирующей струи крови", "Прикрепляется записка с точным временем (зимой - 1, летом - макс. 2 часа)", "Оказывающий помощь оставляет его на видном месте, не пряча под шину"] },
            { title: "10. Внутритазовая анестезия по Школьникову", steps: ["Укладка пациента в позу Волковича (лягушки)", "Антисептическая обработка на 2 см внутрь от Spina iliaca anterior superior", "Инфильтрация кожи 0,5% новокаином с помощью иглы", "Введение длинной иглы (12-15 см) вдоль внутренней поверхности таза", "Медленное введение под внутреннюю фасцию до 150 мл 0,25% новокаина"] }
        ],
        en: [
            { title: "1. Forearm injury: Ladder splint", steps: ["The splint is placed along the outer surface of the injured arm", "It is fixed from the middle third of the shoulder to the metacarpophalangeal joint", "The arm is bent at the elbow joint at a 90-degree angle", "The forearm is in a middle position between supination and pronation", "A roller is placed in the palm, and the arm is suspended on a sling"] },
            { title: "2. Transport immobilization for shin bone fractures", steps: ["Standard splints (Kramer, Diterikhs) are prepared", "In field conditions, painkillers (analgesics) are administered", "Full size covering the knee and ankle joints is measured (on the healthy leg)", "Applied over the shoe and secured with a bandage", "Circulation in the toes (capillary refill) is checked"] },
            { title: "3. Vagosympathetic blockade according to Vishnevsky", steps: ["The patient is placed on their back, a roller is placed under the shoulder blades", "The head is maximally turned to the side opposite the blockade site", "The posterior edge of m.sternocleidomastoideus is pressed with the index finger of the left hand", "The needle is inserted above the finger and directed towards the vertebrae", "30-50 ml of 0.25% novocaine is slowly injected"] },
            { title: "4. Intercostal blockade", steps: ["Holding the patient in the required position (sitting)", "Delivery of novocaine to the upper edge of the rib", "Identification of succussion (complication) and blood vessel puncture", "Strict asepsis to prevent air or blood entry", "Assessment of pain disappearance during breathing"] },
            { title: "5. Application of a Schantz collar", steps: ["Indications are checked (presence of neck injury)", "The Schantz collar must rest firmly on the occipital protuberance", "The basis of control is the support against both mastoid processes", "It rests well on the chest from below", "It is wrapped moderately to prevent nerve node pinching"] },
            { title: "6. Application of a Diterikhs splint for femur fracture", steps: ["The long (outer) part of the splint is applied from the armpit to the outer ankle", "The short (inner) part is installed from the groin crease to the sole", "It is tied to the foot right over the shoe", "The leg is slightly stretched using the twisting mechanism and support", "All parts are fixed to the body with a soft bandage"] },
            { title: "7. Application of a Kramer splint for shoulder fracture", steps: ["A thick layer of cotton wool is placed on the Kramer splint, bandaged and shaped", "Sol. Novocaini 1% - 50.0 ml is injected into the fracture site", "The shoulder is brought close to the body, the elbow is bent at 90 degrees", "The splint must cover from the healthy shoulder joint to the fingertips of the injured arm", "It is suspended from the neck with a sling"] },
            { title: "8. Transport immobilization for pelvic fracture", steps: ["The patient is placed strictly on their back on a hard shield", "The knee and hip joints are held in a semi-bent state", "A soft thick roller is placed under the knees (Volkovich's 'frog' pose)", "The heels are brought together, the knees are slightly separated", "The pelvic area is fixed with a hard wide belt (sheet)"] },
            { title: "9. Application of a tourniquet for arterial bleeding", steps: ["Cloth (clothing) is immediately placed under the tourniquet (never on bare skin)", "For bleeding from the forearm - middle of the shoulder, from the shin - base of the thigh", "The tourniquet is tightened until the pulsating blood jet stops", "A note with the exact time (hour/minute) is attached (winter - 1, summer - max 2 hours)", "The rescuer leaves it in a visible place, not hiding it under the splint"] },
            { title: "10. Intrapelvic anesthesia according to Shkolnikov", steps: ["Placing the patient in the Volkovich (frog) position", "Antiseptic treatment 2 cm inward from the Spina iliaca anterior superior", "Skin infiltration with 0.5% novocaine using a needle", "Insertion of a long needle (12-15 cm) along the inner surface of the pelvis", "Slow injection of up to 150 ml of 0.25% novocaine under the inner fascia"] }
        ]
    }[lang] || [];

    const [randomSkill, setRandomSkill] = useState(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [completedSteps, setCompletedSteps] = useState([]);

    const handleDrawTicket = () => {
        setIsSpinning(true);
        setRandomSkill(null);
        setCompletedSteps([]);
        setTimeout(() => {
            const index = Math.floor(Math.random() * practicalSkills.length);
            setRandomSkill(practicalSkills[index]);
            setIsSpinning(false);
        }, 1500);
    };

    const toggleStep = (idx) => {
        if (completedSteps.includes(idx)) {
            setCompletedSteps(completedSteps.filter(i => i !== idx));
        } else {
            setCompletedSteps([...completedSteps, idx]);
        }
    };

    const sections = {
        uz: [
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
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">1</span><p><strong>Positio aegroti:</strong> Bemor tinch o'tirgan holatda qo'l yurak sohasida ushlab turiladi.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">2</span><p><strong>Applicatio manicae:</strong> Manjet tirsak chuqurchasidan 2-3 sm yuqorida mahkamlanadi.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">3</span><p><strong>Positio stethoscopii:</strong> Fossa cubitalisda A. brachialis tutilib, stetoskop bosiladi.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">4</span><p><strong>Inflatio & Deflatio aeris:</strong> Havo puflanadi va sekin chiqariladi. I-faza (Sistola) va V-faza (Diastola) aniqlanadi.</p></div>
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
                                     <div><h5 className="font-bold text-white text-sm">{item.title}</h5><p className="text-xs text-slate-400">{item.desc}</p></div>
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
                        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch">
                            <div className="md:flex h-full">
                                <div className="md:w-1/2 p-4 bg-black flex items-center justify-center"><img src="/assets/xray_clavicula.png" alt="X-Ray Clavicula" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" /></div>
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
                        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch flex flex-col-reverse md:flex-row">
                            <div className="md:w-1/2 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-r border-slate-700/50">
                                <h4 className="text-xl font-bold text-violet-400 mb-2">2. Boldir suyaklari ochiq jarohati</h4>
                                <p className="text-slate-300 text-sm mb-5">"Astra-rentgenologik tasvirda 'os tibia' va 'os fibula' (katta va kichik boldir) suyaklarining qattiq burchakli sinishi ko'rsatilgan. Qo'llanilishga eng zarur ortopedik taktika nima?"</p>
                                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 group">
                                    <strong className="text-emerald-400 block text-xs uppercase tracking-widest mb-1 group-hover:text-white transition-colors">To'g'ri tashxis:</strong>
                                    <span className="text-sm font-medium text-slate-200">Ilizarov tipidagi kompressiyali-distraksion apparati orqali fiksatsiya qilish.</span>
                                </div>
                            </div>
                            <div className="md:w-1/2 p-4 bg-black flex items-center justify-center"><img src="/assets/xray_tibia.png" alt="X-Ray Tibia" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" /></div>
                        </div>
                    </div>
                )
            }
        ],
        ru: [
            {
                title: "Измерение артериального давления (Тензиометрия)",
                icon: "fa-solid fa-heart-pulse text-rose-500",
                content: (
                    <div className="space-y-4">
                        <h4 className="font-bold text-emerald-400">📚 Академическая Латинская Терминология</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-sm list-disc list-inside">
                            <li><strong>Tensiometria</strong> — Измерение АД</li>
                            <li><strong>Tensiometrum</strong> — Тонометр</li>
                            <li><strong>Arteria brachialis</strong> — Плечевая артерия</li>
                            <li><strong>Fossa cubitalis</strong> — Локтевая ямка</li>
                            <li><strong>Systole / Diastole</strong> — Сокращение / расслабление сердца</li>
                            <li><strong>Toni Korotkowi</strong> — Тоны Короткова (Звуковые сигналы)</li>
                        </ul>

                        <h4 className="font-bold text-emerald-400 mt-6 pt-4 border-t border-slate-700">🩺 Пошаговая методика измерения</h4>
                        <div className="space-y-4 text-slate-300 relative pl-4 border-l-2 border-emerald-500/30">
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">1</span><p><strong>Positio aegroti:</strong> Пациент сидит спокойно, рука на уровне сердца.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">2</span><p><strong>Applicatio manicae:</strong> Манжета фиксируется на 2-3 см выше локтевой ямки.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">3</span><p><strong>Positio stethoscopii:</strong> В локтевой ямке нащупывается плечевая артерия, прикладывается стетоскоп.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">4</span><p><strong>Inflatio & Deflatio aeris:</strong> Воздух накачивается и медленно спускается. Определяются I фаза (Систола) и V фаза (Диастола).</p></div>
                        </div>
                    </div>
                )
            },
            {
                title: "Практика наложения шины (Иммобилизация)",
                icon: "fa-solid fa-bone text-sky-500",
                content: (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm">Первая медицинская транспортная иммобилизация при открытых ранах и переломах.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                             {[
                                 { title: "Analgesia", desc: "Оценка и инъекция обезболивающего" },
                                 { title: "Haemostasis", desc: "При открытой ране немедленно жгут Эсмарха" },
                                 { title: "Mensura", desc: "Измерение шины по здоровой ноге" },
                                 { title: "Protectio", desc: "Валик и слой ваты на костные выступы" },
                                 { title: "Immobilisatio", desc: "Фиксация как минимум 2-х смежных суставов" },
                                 { title: "Controlo", desc: "Капиллярный тест на кончиках пальцев после бинтования" },
                             ].map((item, id) => (
                                 <div key={id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-start gap-4 hover:border-sky-500 transition-colors">
                                     <div className="w-10 h-10 min-w-[2.5rem] bg-sky-500/10 rounded-full flex items-center justify-center text-sky-400 font-bold">0{id+1}</div>
                                     <div><h5 className="font-bold text-white text-sm">{item.title}</h5><p className="text-xs text-slate-400">{item.desc}</p></div>
                                 </div>
                             ))}
                        </div>
                    </div>
                )
            },
            {
                title: "Ситуационные Задачи (Case-Study)",
                icon: "fa-solid fa-microscope text-amber-500",
                content: (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-5 rounded-xl border-l-4 border-amber-500">
                            <h4 className="font-bold text-amber-400 text-lg mb-2">🔍 Ложная Гипертензия</h4>
                            <p className="text-slate-300 text-sm italic mb-4">"У 45-летнего тучного пациента (окружность руки 44 см) при использовании стандартной манжеты давление показало 175/105..."</p>
                            <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-400 border border-slate-700">
                                <strong>Решение:</strong> Из-за неправильного размера давление завышено на +30 мм рт.ст. Экстренное введение препаратов здесь приведет к гипотензивному коллапсу. Нужна манжета с широкой лентой.
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-rose-500/10 to-transparent p-5 rounded-xl border-l-4 border-rose-500">
                            <h4 className="font-bold text-rose-400 text-lg mb-2">🩸 Сложная Политравма</h4>
                            <p className="text-slate-300 text-sm italic mb-4">"У пострадавшего в ДТП открытый перелом голени и пульсирующее кровотечение алой кровью..."</p>
                            <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-400 border border-slate-700">
                                <strong>Алгоритм:</strong> 1. ЖГУТ 2. Обезболивание 3. Асептическая повязка 4. Транспортная шина (с захватом колена, лодыжки и таза).
                            </div>
                        </div>
                    </div>
                )
            },
            {
                title: "Анализ Рентгенограммы (X-Ray)",
                icon: "fa-solid fa-x-ray text-violet-500",
                content: (
                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch">
                            <div className="md:flex h-full">
                                <div className="md:w-1/2 p-4 bg-black flex items-center justify-center"><img src="/assets/xray_clavicula.png" alt="X-Ray Clavicula" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" /></div>
                                <div className="md:w-1/2 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-700/50">
                                    <h4 className="text-xl font-bold text-violet-400 mb-2">1. Характер перелома ключицы</h4>
                                    <p className="text-slate-300 text-sm mb-5">"Глядя на представленное рентгенологическое изображение, как вы клинически опишете изменение в этой кости?"</p>
                                    <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 group">
                                        <strong className="text-emerald-400 block text-xs uppercase tracking-widest mb-1 group-hover:text-white transition-colors">Правильный диагноз:</strong>
                                        <span className="text-sm font-medium text-slate-200">Перелом со смещением костных отломков по продольной оси (дислокация)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch flex flex-col-reverse md:flex-row">
                            <div className="md:w-1/2 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-r border-slate-700/50">
                                <h4 className="text-xl font-bold text-violet-400 mb-2">2. Открытая травма костей голени</h4>
                                <p className="text-slate-300 text-sm mb-5">"Астра-рентгенологическое изображение показывает жесткий угловой перелом большеберцовой и малоберцовой костей. Какая ортопедическая тактика наиболее необходима для применения?"</p>
                                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 group">
                                    <strong className="text-emerald-400 block text-xs uppercase tracking-widest mb-1 group-hover:text-white transition-colors">Правильный диагноз:</strong>
                                    <span className="text-sm font-medium text-slate-200">Фиксация с помощью компрессионно-дистракционного аппарата типа Илизарова.</span>
                                </div>
                            </div>
                            <div className="md:w-1/2 p-4 bg-black flex items-center justify-center"><img src="/assets/xray_tibia.png" alt="X-Ray Tibia" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" /></div>
                        </div>
                    </div>
                )
            }
        ],
        en: [
            {
                title: "Blood Pressure Measurement (Tensiometria)",
                icon: "fa-solid fa-heart-pulse text-rose-500",
                content: (
                    <div className="space-y-4">
                        <h4 className="font-bold text-emerald-400">📚 Academic Latin Terminology</h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-sm list-disc list-inside">
                            <li><strong>Tensiometria</strong> — Blood pressure measurement</li>
                            <li><strong>Tensiometrum</strong> — Tonometer</li>
                            <li><strong>Arteria brachialis</strong> — Brachial artery</li>
                            <li><strong>Fossa cubitalis</strong> — Cubital fossa</li>
                            <li><strong>Systole / Diastole</strong> — Heart contraction / relaxation</li>
                            <li><strong>Toni Korotkowi</strong> — Korotkoff sounds (Audio signals)</li>
                        </ul>

                        <h4 className="font-bold text-emerald-400 mt-6 pt-4 border-t border-slate-700">🩺 Step-by-step measurement methodology</h4>
                        <div className="space-y-4 text-slate-300 relative pl-4 border-l-2 border-emerald-500/30">
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">1</span><p><strong>Positio aegroti:</strong> The patient sits quietly, arm held at heart level.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">2</span><p><strong>Applicatio manicae:</strong> The cuff is fixed 2-3 cm above the cubital fossa.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">3</span><p><strong>Positio stethoscopii:</strong> The brachial artery is felt in the cubital fossa, the stethoscope is applied.</p></div>
                            <div className="relative"><span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-slate-900">4</span><p><strong>Inflatio & Deflatio aeris:</strong> Air is pumped and slowly released. Phase I (Systole) and Phase V (Diastole) are determined.</p></div>
                        </div>
                    </div>
                )
            },
            {
                title: "Splinting Practice (Immobilisatio)",
                icon: "fa-solid fa-bone text-sky-500",
                content: (
                    <div className="space-y-4">
                        <p className="text-slate-300 text-sm">First medical transport immobilization in open wounds and fractures.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                             {[
                                 { title: "Analgesia", desc: "Assessment and painkiller injection" },
                                 { title: "Haemostasis", desc: "Immediate Esmarch tourniquet if open wound" },
                                 { title: "Mensura", desc: "Measuring the splint on the healthy leg" },
                                 { title: "Protectio", desc: "Roller and cotton layer on bone protrusions" },
                                 { title: "Immobilisatio", desc: "Fixation of at least 2 adjacent joints" },
                                 { title: "Controlo", desc: "Capillary test on fingertips after bandaging" },
                             ].map((item, id) => (
                                 <div key={id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-start gap-4 hover:border-sky-500 transition-colors">
                                     <div className="w-10 h-10 min-w-[2.5rem] bg-sky-500/10 rounded-full flex items-center justify-center text-sky-400 font-bold">0{id+1}</div>
                                     <div><h5 className="font-bold text-white text-sm">{item.title}</h5><p className="text-xs text-slate-400">{item.desc}</p></div>
                                 </div>
                             ))}
                        </div>
                    </div>
                )
            },
            {
                title: "Situational Tasks (Case-Study)",
                icon: "fa-solid fa-microscope text-amber-500",
                content: (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-5 rounded-xl border-l-4 border-amber-500">
                            <h4 className="font-bold text-amber-400 text-lg mb-2">🔍 False Hypertension</h4>
                            <p className="text-slate-300 text-sm italic mb-4">"In a 45-year-old obese patient (arm circumference 44 cm), when using a standard cuff, the pressure showed 175/105..."</p>
                            <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-400 border border-slate-700">
                                <strong>Solution:</strong> Due to the wrong size, the pressure is overestimated by +30 mmHg. Emergency administration of drugs here will lead to hypotensive collapse. A cuff with a wide band is needed.
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-rose-500/10 to-transparent p-5 rounded-xl border-l-4 border-rose-500">
                            <h4 className="font-bold text-rose-400 text-lg mb-2">🩸 Complex Polytrauma</h4>
                            <p className="text-slate-300 text-sm italic mb-4">"A car accident victim has an open shin fracture and a pulsating jet of bright red blood..."</p>
                            <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-400 border border-slate-700">
                                <strong>Algorithm:</strong> 1. TOURNIQUET 2. Pain relief 3. Aseptic bandage 4. Transport splint (covering knee, ankle, and pelvis).
                            </div>
                        </div>
                    </div>
                )
            },
            {
                title: "Radiograph Analysis (X-Ray)",
                icon: "fa-solid fa-x-ray text-violet-500",
                content: (
                    <div className="space-y-8">
                        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch">
                            <div className="md:flex h-full">
                                <div className="md:w-1/2 p-4 bg-black flex items-center justify-center"><img src="/assets/xray_clavicula.png" alt="X-Ray Clavicula" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" /></div>
                                <div className="md:w-1/2 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-700/50">
                                    <h4 className="text-xl font-bold text-violet-400 mb-2">1. Nature of clavicle fracture</h4>
                                    <p className="text-slate-300 text-sm mb-5">"Looking at the presented X-ray image, how would you clinically describe the change in this bone?"</p>
                                    <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 group">
                                        <strong className="text-emerald-400 block text-xs uppercase tracking-widest mb-1 group-hover:text-white transition-colors">Correct diagnosis:</strong>
                                        <span className="text-sm font-medium text-slate-200">Fracture with displacement of bone fragments along the longitudinal axis (dislocation)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-lg items-stretch flex flex-col-reverse md:flex-row">
                            <div className="md:w-1/2 p-6 flex flex-col justify-center border-t md:border-t-0 md:border-r border-slate-700/50">
                                <h4 className="text-xl font-bold text-violet-400 mb-2">2. Open injury of lower leg bones</h4>
                                <p className="text-slate-300 text-sm mb-5">"The Astra-radiological image shows a severe angular fracture of the tibia and fibula. What orthopedic tactic is most necessary to apply?"</p>
                                <div className="bg-emerald-900/40 p-4 rounded-xl border border-emerald-500/30 group">
                                    <strong className="text-emerald-400 block text-xs uppercase tracking-widest mb-1 group-hover:text-white transition-colors">Correct diagnosis:</strong>
                                    <span className="text-sm font-medium text-slate-200">Fixation using an Ilizarov-type compression-distraction apparatus.</span>
                                </div>
                            </div>
                            <div className="md:w-1/2 p-4 bg-black flex items-center justify-center"><img src="/assets/xray_tibia.png" alt="X-Ray Tibia" className="max-w-full max-h-72 object-contain rounded-xl shadow-2xl border border-slate-700/50 hover:scale-105 transition-transform cursor-zoom-in" /></div>
                        </div>
                    </div>
                )
            }
        ]
    }[lang] || [];

    const syllabus = {
        uz: [
            { id: 1, title: "Tayanch–harakat apparati sinishlari va chiqishlarini tashxislash, Transport immobilizatsiya, Gips texnikasi.", hours: "4 s" },
            { id: 2, title: "Ko‘krak qafasi va yelka kamari shikastlanishlari. Yelka suyagi va bo'g'imi chiqishlari.", hours: "4 s" },
            { id: 3, title: "Umurtqa pog‘onasi shikastlari. Chanoq va son suyaklarini sinishlari.", hours: "4 s" },
            { id: 4, title: "Tizza bo‘g‘imi shikastlanishlari: menisklar, boldir va oshiq bo‘g‘imi jarohatlari.", hours: "4 s" },
            { id: 5, title: "Politravma diagnostikasi. Travmatik shok profilaktikasi va davolash algoritmlari.", hours: "4 s" },
            { id: 6, title: "Son tug‘ma chiqishlari, bo‘yin mushakli qiyshiqligi. Maymoqlik etiologiyasi, klinikasi va diagnostikasi.", hours: "4 s" },
            { id: 7, title: "Skolioz: klinikasi, tasnifi va davolashi. Oyoq o‘qi deformatsiyalari xususiyatlari.", hours: "4 s" },
            { id: 8, title: "Travmatologik va ortopedik bemorlarni reabilitatsiyasi. Amputatsiyaga ko‘rsatmalar va zamonaviy protezlash.", hours: "4 s" }
        ],
        ru: [
            { id: 1, title: "Диагностика переломов и вывихов опорно-двигательного аппарата, транспортная иммобилизация, гипсовая техника.", hours: "4 ч" },
            { id: 2, title: "Травмы грудной клетки и плечевого пояса. Вывихи плечевой кости и сустава.", hours: "4 ч" },
            { id: 3, title: "Травмы позвоночника. Переломы костей таза и бедра.", hours: "4 ч" },
            { id: 4, title: "Травмы коленного сустава: мениски, травмы голени и голеностопного сустава.", hours: "4 ч" },
            { id: 5, title: "Диагностика политравмы. Алгоритмы профилактики и лечения травматического шока.", hours: "4 ч" },
            { id: 6, title: "Врожденные вывихи бедра, мышечная кривошея шеи. Этиология, клиника и диагностика косолапости.", hours: "4 ч" },
            { id: 7, title: "Сколиоз: клиника, классификация и лечение. Особенности деформаций оси ног.", hours: "4 ч" },
            { id: 8, title: "Реабилитация травматологических и ортопедических больных. Показания к ампутации и современное протезирование.", hours: "4 ч" }
        ],
        en: [
            { id: 1, title: "Diagnosis of fractures and dislocations of the musculoskeletal system, transport immobilization, plaster technique.", hours: "4 h" },
            { id: 2, title: "Injuries of the chest and shoulder girdle. Dislocations of the humerus and shoulder joint.", hours: "4 h" },
            { id: 3, title: "Spinal injuries. Fractures of the pelvic and thigh bones.", hours: "4 h" },
            { id: 4, title: "Knee joint injuries: menisci, injuries of the lower leg and ankle joint.", hours: "4 h" },
            { id: 5, title: "Polytrauma diagnosis. Algorithms for prevention and treatment of traumatic shock.", hours: "4 h" },
            { id: 6, title: "Congenital hip dislocations, muscular torticollis of the neck. Etiology, clinic and diagnosis of clubfoot.", hours: "4 h" },
            { id: 7, title: "Scoliosis: clinic, classification and treatment. Features of leg axis deformities.", hours: "4 h" },
            { id: 8, title: "Rehabilitation of traumatological and orthopedic patients. Indications for amputation and modern prosthetics.", hours: "4 h" }
        ]
    }[lang] || [];

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
                            <h1 className="text-xl md:text-2xl font-bold">🩺 {t.title}</h1>
                            <p className="text-sm text-emerald-400">{t.sub}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center rounded-xl overflow-hidden border border-slate-600 bg-slate-900">
                            {['uz', 'ru', 'en'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => toggleLang(l)}
                                    className={`px-3 py-1.5 text-xs font-bold uppercase transition-colors ${lang === l ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => navigate('/test')} className="hidden md:flex bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg font-bold items-center transition-colors">
                            <i className="fa-solid fa-play mr-2"></i> {t.btn}
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Container */}
            <main className="max-w-5xl mx-auto mt-10 px-6 space-y-10">
                
                {/* Introduction */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black mb-4">{t.mainTitle}</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto">{t.mainDesc}</p>
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
                                {t.examSimulator}
                             </h3>
                             <p className="text-sm text-slate-400 mt-1">{t.examSimDesc}</p>
                         </div>
                     </div>
                     <div className="p-8 flex flex-col items-center justify-center min-h-[300px] border-t-2 border-indigo-500/20">
                         {!randomSkill && !isSpinning && (
                             <div className="text-center">
                                 <i className="fa-solid fa-dice-d20 text-6xl text-slate-600 mb-6 drop-shadow-lg"></i>
                                 <h4 className="text-xl text-slate-300 font-bold mb-6">{t.ready}</h4>
                                 <button 
                                     onClick={handleDrawTicket} 
                                     className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105"
                                 >
                                     <i className="fa-solid fa-hand-pointer mr-2"></i> {t.drawTicket}
                                 </button>
                             </div>
                         )}

                         {isSpinning && (
                             <div className="text-center animate-pulse">
                                 <div className="text-blue-500 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                 <p className="text-slate-400 font-bold tracking-widest uppercase">{t.shuffling}</p>
                             </div>
                         )}

                         {randomSkill && !isSpinning && (
                             <div className="w-full max-w-3xl animate-[fadeIn_0.5s_ease-out]">
                                 <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative">
                                     <span className="absolute -top-4 left-6 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">{t.selectedSkill}</span>
                                     
                                     <h4 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4 mt-2 text-center md:text-left">
                                         {randomSkill.title}
                                     </h4>
                                     
                                     <div className="space-y-4">
                                         {randomSkill.steps.map((step, idx) => {
                                             const isCompleted = completedSteps.includes(idx);
                                             return (
                                                 <div 
                                                     key={idx} 
                                                     onClick={() => toggleStep(idx)}
                                                     className={`flex gap-4 items-start p-3 rounded-xl border transition-all cursor-pointer select-none group ${
                                                         isCompleted 
                                                             ? 'bg-emerald-900/20 border-emerald-500/50' 
                                                             : 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-700'
                                                     }`}
                                                 >
                                                     <div className={`w-8 h-8 rounded-full font-black flex items-center justify-center shrink-0 transition-colors ${
                                                         isCompleted
                                                             ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                                             : 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/40'
                                                     }`}>
                                                         {isCompleted ? <i className="fa-solid fa-check"></i> : idx + 1}
                                                     </div>
                                                     <p className={`pt-1 text-sm md:text-base transition-colors ${
                                                         isCompleted ? 'text-emerald-400 opacity-70 line-through' : 'text-slate-300'
                                                     }`}>
                                                         {step}
                                                     </p>
                                                 </div>
                                             );
                                         })}
                                     </div>

                                     <div className="mt-8 flex justify-center border-t border-slate-800 pt-6">
                                         <button 
                                             onClick={handleDrawTicket} 
                                             className="bg-slate-700 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-xl transition-all flex items-center gap-2"
                                         >
                                             <i className="fa-solid fa-rotate-right"></i> {t.drawAnother}
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
                            {t.planTitle}
                         </h3>
                     </div>
                     <div className="p-6 overflow-x-auto">
                         <table className="w-full text-left border-collapse min-w-[600px]">
                             <thead>
                                 <tr className="border-b border-slate-700 text-sm text-slate-400 uppercase">
                                     <th className="pb-3 px-4 w-12">№</th>
                                     <th className="pb-3 px-4">{t.topic}</th>
                                     <th className="pb-3 px-4 text-center w-24">{t.hours}</th>
                                 </tr>
                             </thead>
                             <tbody className="text-sm font-medium text-slate-200">
                                 {syllabus.map((item, idx) => (
                                     <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                         <td className="py-4 px-4 text-emerald-400 text-center">{item.id}</td>
                                         <td className="py-4 px-4 text-slate-300">{item.title}</td>
                                         <td className="py-4 px-4 text-center text-slate-400">{item.hours}</td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </section>

                <div className="flex justify-center mt-12 mb-8">
                    <button onClick={() => navigate('/test')} className="group flex flex-col items-center gap-2 hover:scale-105 transition-transform">
                        <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] group-hover:bg-emerald-500 transition-colors">
                            <i className="fa-solid fa-rocket text-3xl text-white ml-1"></i>
                        </div>
                        <span className="font-bold text-emerald-400 uppercase tracking-widest text-sm">{t.goToTest}</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Methodology;
