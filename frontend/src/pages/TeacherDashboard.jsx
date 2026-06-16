import React, { useState } from 'react';
import { extractTextFromFile, generateMedicalContent } from '../services/aiService';
import LiveRoom from './LiveRoom';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { methodologicalQuiz, caseStudies, xrayCases } from '../data/quizQuestions';

const TeacherDashboard = ({ onNavigate, user, onLogout }) => {
  const { t, lang } = useApp();
  const isAdmin = user?.email === 'rahmonjonwarrior@gmail.com';

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedLink, setPublishedLink] = useState(null);
  const [isAutoFetchingNIH, setIsAutoFetchingNIH] = useState(false);
  const [nihFetchResult, setNihFetchResult] = useState(null);
  const [isUploadingJson, setIsUploadingJson] = useState(false);
  const [jsonUploadResults, setJsonUploadResults] = useState([]);
  const [isUploadingMultiDoc, setIsUploadingMultiDoc] = useState(false);
  const [multiDocResults, setMultiDocResults] = useState([]);
  const [multiDocProgress, setMultiDocProgress] = useState({ current: 0, total: 0, fileName: '' });
  const [progress, setProgress] = useState(0);
  const [generatedData, setGeneratedData] = useState(null);
  const [showLiveRoom, setShowLiveRoom] = useState(false);
  const [xrayImages, setXrayImages] = useState({});
  const [imageSearchModal, setImageSearchModal] = useState({ isOpen: false, idx: null, query: '', results: [], isLoading: false, searchType: 'xray' });

  const handleSearchImage = async (idx, initialQuery, type = 'xray') => {
      setImageSearchModal(prev => ({ ...prev, isOpen: true, idx, query: initialQuery, searchType: type, results: [], isLoading: true }));
      try {
          const fetchWithTimeout = async (resource, options = {}) => {
              const { timeout = 10000 } = options;
              const controller = new AbortController();
              const id = setTimeout(() => controller.abort(), timeout);
              const response = await fetch(resource, { ...options, signal: controller.signal });
              clearTimeout(id);
              return response;
          };

          // 1. Translate query to English for better Wikimedia Commons results
          let englishQuery = initialQuery;
          try {
              const transRes = await fetchWithTimeout(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(initialQuery)}`, { timeout: 5000 });
              const transData = await transRes.json();
              if (transData && transData[0] && transData[0][0] && transData[0][0][0]) {
                  englishQuery = transData[0][0][0];
              }
          } catch(err) {
              console.warn("Translation failed, using original query", err);
          }

          // 2. Search NIH Open-i (High Quality Medical Database)
          let nihResults = [];
          try {
              const nihQuery = encodeURIComponent(englishQuery);
              const nihType = type === 'xray' ? '&it=x' : ''; // 'it=x' filters specifically for X-rays in NIH Open-i
              const nihUrl = `https://openi.nlm.nih.gov/api/search?query=${nihQuery}${nihType}&m=1&n=15`;
              const nihRes = await fetchWithTimeout(nihUrl, { timeout: 10000 }); // 10s timeout
              const nihData = await nihRes.json();
              if (nihData && nihData.list) {
                  nihResults = nihData.list
                      .filter(item => item.imgLarge || item.image?.imageURL)
                      .map(item => {
                           const imgPath = item.imgLarge || item.image?.imageURL;
                           return imgPath.startsWith('http') ? imgPath : `https://openi.nlm.nih.gov${imgPath}`;
                      });
              }
          } catch(err) {
              console.warn("NIH Open-i search failed or timed out", err);
          }

          // 3. Search Wikimedia Commons (Fallback/Extra)
          let wikiResults = [];
          try {
              let finalQuery = englishQuery;
              if (type === 'xray') {
                  if (!englishQuery.toLowerCase().includes('x-ray') && !englishQuery.toLowerCase().includes('xray')) {
                      finalQuery += " x-ray";
                  }
              } else if (type === 'medical') {
                  if (!englishQuery.toLowerCase().includes('medical') && !englishQuery.toLowerCase().includes('clinical') && !englishQuery.toLowerCase().includes('disease')) {
                      finalQuery += " medical";
                  }
              }
              const searchQuery = encodeURIComponent(finalQuery);
              const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${searchQuery}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&format=json&origin=*`;
              const wikiRes = await fetchWithTimeout(wikiUrl, { timeout: 10000 }); // 10s timeout
              const wikiData = await wikiRes.json();
              if (wikiData.query && wikiData.query.pages) {
                  wikiResults = Object.values(wikiData.query.pages)
                      .map(page => page.imageinfo?.[0]?.url)
                      .filter(url => url && (url.toLowerCase().endsWith('.jpg') || url.toLowerCase().endsWith('.png') || url.toLowerCase().endsWith('.jpeg') || url.toLowerCase().endsWith('.gif')));
              }
          } catch(err) {
              console.warn("Wikimedia search failed or timed out", err);
          }

          // Merge results
          let fetchedResults = [...nihResults, ...wikiResults];
          // Remove duplicates
          fetchedResults = [...new Set(fetchedResults)];
          setImageSearchModal(prev => ({ ...prev, results: fetchedResults, isLoading: false }));
      } catch (e) {
          console.error("Image search error", e);
          setImageSearchModal(prev => ({ ...prev, isLoading: false }));
      }
  };

  const handleSelectSearchedImage = (url) => {
      if (imageSearchModal.idx !== null) {
          setXrayImages(prev => ({...prev, [imageSearchModal.idx]: url}));
      }
      setImageSearchModal({ isOpen: false, idx: null, query: '', results: [], isLoading: false });
  };

  const handleXrayImageUpload = (idx, e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setXrayImages(prev => ({...prev, [idx]: reader.result}));
          };
          reader.readAsDataURL(file);
      }
  };
  const [currentTopic, setCurrentTopic] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
      "Perelomy oporno-dvigatel., immobilizatsiya, gips texnikasi",
      "Travmy grudnoj kletki. Vyvikhi plecha",
      "Travmy taza i pozvonochnika. Anesteziya po Shkolnikovu",
      "Politravma i travmy s shokom. Reanimatsiya",
      "Gnojnye zabolevaniya kostej i sustavov (Osteomielit)",
      "Ozhogovaya bolezn' i obmorozhenie. Klinicheskaya pomosh'",
      "Zakrytye i otkrytye travmy golovnogo mozga",
      "Vidy krovotechenij i metody ostanovki (nalozhenie zhguta)"
  ];
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
  const medicalTopics = { ru: medicalTopicsRu, uz: medicalTopicsUz, en: medicalTopicsEn }[lang] || medicalTopicsUz;

  const handleGenerateFromTopic = async (topicName) => {
      setIsUploading(true);
      setCurrentTopic(topicName);
      setProgress(20);
      setErrorMsg("");
      try {
          const aiResult = await generateMedicalContent(topicName, true);
          setProgress(80);
          if (!aiResult.success) {
              setProgress(0); setIsUploading(false);
              setErrorMsg({ ru: 'ИИ не принял: ', uz: 'AI qabul qilmadi: ', en: 'AI rejected: ' }[lang] + (aiResult.message || ""));
              return;
          }
          setGeneratedData(aiResult);
          setProgress(100);
      } catch (e) {
          setProgress(0); setIsUploading(false);
          setErrorMsg(e.message || { ru: 'Ошибка ИИ анализа!', uz: 'AI tahlilida xato!', en: 'AI analysis error!' }[lang]);
      }
  };

  const handleUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      setCurrentTopic(file.name);
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
            setErrorMsg(aiResult.message || { ru: 'Системная ошибка, файл не относится к медицине!', uz: "Tizim xatosi, fayl tibbiyotga oid emas!", en: 'System error, file is not related to medicine!' }[lang]);
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
        setErrorMsg(error.message || { ru: 'Ошибка при анализе файла.', uz: 'Faylni tahlil qilishda xatolik yuz berdi.', en: 'An error occurred while analyzing the file.' }[lang]);
      }
    }
  };

  const handleSaveToPlatform = async () => {
      if (!generatedData) return;
      setIsSaving(true);
      try {
          const dataToSave = { ...generatedData };
          if (dataToSave.xrays) {
              dataToSave.xrays = dataToSave.xrays.map((x, idx) => ({
                  ...x,
                  image: xrayImages[idx] || null
              }));
          }

          const docRef = await addDoc(collection(db, 'exams'), {
              teacherId: user?.uid || 'unknown',
              teacherName: user?.displayName || user?.email || 'O\'qituvchi',
              title: currentTopic || 'Yangi Imtihon',
              createdAt: serverTimestamp(),
              data: dataToSave,
              status: 'published'
          });
          const link = `${window.location.origin}/test?id=${docRef.id}`;
          setPublishedLink(link);
          alert({ ru: 'Учебный блок успешно сохранен на платформе!', uz: "O'quv bloki platformaga muvaffaqiyatli saqlandi!", en: 'Study block successfully saved to platform!' }[lang] || "O'quv bloki platformaga muvaffaqiyatli saqlandi!");
          setProgress(0);
          setIsUploading(false);
          setGeneratedData(null);
          setXrayImages({});
      } catch (err) {
          console.error("Save error:", err);
          alert({ ru: 'Ошибка сохранения!', uz: 'Saqlashda xatolik yuz berdi!', en: 'Error saving!' }[lang] || 'Saqlashda xatolik yuz berdi!');
      } finally {
          setIsSaving(false);
      }
  };

  const handlePublishLocalBase = async () => {
      setIsPublishing(true);
      setPublishedLink(null);
      try {
          const localTests = methodologicalQuiz.map(q => ({
              ...q,
              answer: q.options.indexOf(q.correctAnswer),
              topic: q.type || "Tibbiy Amaliyot",
              explanation: q.explanation || `To'g'ri javob: ${q.correctAnswer}`
          }));
          const localXrays = xrayCases.map(x => ({
              ...x,
              answer: x.options.indexOf(x.correctAnswer),
              topic: "Rentgenogrammalar"
          }));
          const localCases = caseStudies.map(c => ({ ...c, topic: "Vaziyatli Masalalar" }));

          const payload = {
              success: true,
              tests: localTests,
              xrays: localXrays,
              cases: localCases
          };

          const docRef = await addDoc(collection(db, 'exams'), {
              teacherId: user?.uid || 'unknown',
              teacherName: user?.displayName || user?.email || 'O\'qituvchi',
              title: `Tayyor Baza: ${localTests.length} test, ${localXrays.length} rentgen, ${localCases.length} vaziyatli`,
              createdAt: serverTimestamp(),
              data: payload,
              status: 'published'
          });

          const link = `${window.location.origin}/test?id=${docRef.id}`;
          setPublishedLink(link);
      } catch (err) {
          console.error("Publish local base error:", err);
          alert({ ru: 'Ошибка загрузки базы!', uz: 'Bazani yuklashda xatolik!', en: 'Error loading the database!' }[lang]);
      } finally {
          setIsPublishing(false);
      }
  };

  const handleAutoFetchNIH = async () => {
      setIsAutoFetchingNIH(true);
      setNihFetchResult(null);
      try {
          // Fetch up to 25 items from NIH Open-i for 'orthopedics x-ray'
          const queryUrl = `https://openi.nlm.nih.gov/api/search?query=orthopedics&it=x&m=1&n=25`;
          const res = await fetch(queryUrl);
          const data = await res.json();
          
          if (!data || !data.list || data.list.length === 0) {
              throw new Error("Ma'lumot topilmadi");
          }

          const localXrays = data.list
              .filter(item => item.imgLarge || item.image?.imageURL)
              .map(item => {
                  const imgPath = item.imgLarge || item.image?.imageURL;
                  const fullImgPath = imgPath.startsWith('http') ? imgPath : `https://openi.nlm.nih.gov${imgPath}`;
                  // Clean up title and extract some basic info
                  const cleanTitle = (item.title || "Orthopedic X-Ray Case").replace(/<\/?[^>]+(>|$)/g, "");
                  const abstractText = (item.abstract || "Detailed findings not provided. Analyze the image to identify the pathology.").replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) + "...";
                  
                  return {
                      id: item.uid || Math.random().toString(),
                      title: cleanTitle,
                      image: fullImgPath,
                      question: { uz: "Ushbu rentgen tasvirida qanday asosiy patologiya kuzatilmoqda?", ru: "Какая основная патология наблюдается на этом рентгеновском снимке?", en: "What is the primary pathology observed in this X-ray?" }[lang] || "Ushbu rentgen tasvirida qanday asosiy patologiya kuzatilmoqda?",
                      options: [
                          "Normal anatomik tuzilish",
                          "Suyak sinishi (Fracture)",
                          "Bo'g'im yallig'lanishi (Arthritis)",
                          "Suyak o'smasi (Tumor)",
                          abstractText.includes('fracture') || abstractText.includes('Fracture') ? "Suyak sinishi (Fracture)" : "Noma'lum patologiya"
                      ],
                      correctAnswer: abstractText.includes('fracture') || abstractText.includes('Fracture') ? "Suyak sinishi (Fracture)" : "Normal anatomik tuzilish",
                      answer: abstractText.includes('fracture') || abstractText.includes('Fracture') ? 1 : 0,
                      topic: "Ortopediya (NIH Baza)",
                      explanation: abstractText
                  };
              });

          const payload = {
              success: true,
              tests: [],
              xrays: localXrays,
              cases: []
          };

          const docRef = await addDoc(collection(db, 'exams'), {
              teacherId: user?.uid || 'unknown',
              teacherName: user?.displayName || user?.email || 'O\'qituvchi',
              title: `Avto Baza (NIH): ${localXrays.length} ta rentgen kesh`,
              createdAt: serverTimestamp(),
              data: payload,
              status: 'published'
          });

          const link = `${window.location.origin}/test?id=${docRef.id}`;
          setNihFetchResult({ count: localXrays.length, link });
      } catch (err) {
          console.error("Auto Fetch NIH Error:", err);
          alert({ ru: 'Ошибка загрузки базы NIH!', uz: 'NIH bazasini yuklashda xatolik!', en: 'Error loading NIH database!' }[lang]);
      } finally {
          setIsAutoFetchingNIH(false);
      }
  };

  const handleMultiJsonUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      setIsUploadingJson(true);
      setJsonUploadResults([]);
      const results = [];

      for (const file of files) {
          try {
              const text = await file.text();
              const data = JSON.parse(text);

              // Normalize: support {tests, cases, xrays, practical} or array of tests
              let payload;
              if (Array.isArray(data)) {
                  payload = { success: true, tests: data };
              } else {
                  payload = { success: true, ...data };
              }

              const title = data.title || file.name.replace('.json', '');
              const testsCount = (payload.tests || []).length;
              const casesCount = (payload.cases || []).length;
              const xraysCount = (payload.xrays || []).length;

              const docRef = await addDoc(collection(db, 'exams'), {
                  teacherId: user?.uid || 'unknown',
                  teacherName: user?.displayName || user?.email || 'O\'qituvchi',
                  title: title,
                  createdAt: serverTimestamp(),
                  data: payload,
                  status: 'published'
              });

              const link = `${window.location.origin}/test?id=${docRef.id}`;
              results.push({ fileName: file.name, title, link, testsCount, casesCount, xraysCount, success: true });
          } catch (err) {
              results.push({ fileName: file.name, success: false, error: err.message });
          }
      }

      setJsonUploadResults(results);
      setIsUploadingJson(false);
      // reset input
      e.target.value = '';
  };

  // Ko'p Word/PDF fayl yuklash
  const handleMultiDocUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      setIsUploadingMultiDoc(true);
      setMultiDocResults([]);
      const results = [];

      for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setMultiDocProgress({ current: i + 1, total: files.length, fileName: file.name });
          try {
              // 1. Matn ajratish
              const text = await extractTextFromFile(file);

              // 2. AI tahlil
              const aiResult = await generateMedicalContent(text);

              if (!aiResult.success) {
                  results.push({ fileName: file.name, success: false, error: { ru: 'Медицинский текст не найден', uz: 'Tibbiy matn topilmadi', en: 'Medical text not found' }[lang] });
                  continue;
              }

              // 3. Firestore'ga saqlash
              const docRef = await addDoc(collection(db, 'exams'), {
                  teacherId: user?.uid || 'unknown',
                  teacherName: user?.displayName || user?.email || "O'qituvchi",
                  title: file.name.replace(/\.(docx|pdf|pptx)$/i, ''),
                  createdAt: serverTimestamp(),
                  data: aiResult,
                  status: 'published'
              });

              const link = `${window.location.origin}/test?id=${docRef.id}`;
              const testsCount = (aiResult.tests || []).length;
              const casesCount = (aiResult.cases || []).length;
              const xraysCount = (aiResult.xrays || []).length;
              results.push({ fileName: file.name, success: true, link, testsCount, casesCount, xraysCount });
          } catch (err) {
              results.push({ fileName: file.name, success: false, error: err.message });
          }
      }

      setMultiDocResults(results);
      setMultiDocProgress({ current: 0, total: 0, fileName: '' });
      setIsUploadingMultiDoc(false);
      e.target.value = '';
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
    <DashboardLayout role="teacher" user={user} onLogout={onLogout}>


     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 max-w-7xl mx-auto">
         <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(37,99,235,0.2)] hover:border-blue-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center"><i className="fa-solid fa-layer-group"></i></div>
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{t.tcStatsCourses}</div>
            </div>
            <div className="text-4xl font-black text-white ml-1">12</div>
         </div>
         <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(56,189,248,0.2)] hover:border-sky-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center"><i className="fa-solid fa-users"></i></div>
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{t.tcStatsStudents}</div>
            </div>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-300 ml-1">1,240</div>
         </div>
         <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(139,92,246,0.2)] hover:border-violet-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center"><i className="fa-solid fa-stethoscope"></i></div>
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{t.tcStatsCases}</div>
            </div>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-300 ml-1">45</div>
         </div>
         <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(16,185,129,0.2)] hover:border-emerald-500/40 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><i className="fa-solid fa-chart-line"></i></div>
                <div className="text-slate-400 text-xs font-black uppercase tracking-widest">{t.tcStatsMastery}</div>
            </div>
            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 ml-1">82%</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
         <div className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Glow effect background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none"></div>
            
            <h3 className="text-xl font-black text-white mb-6 border-b border-white/10 pb-4">{t.tcSectionCreate}</h3>
            <div className="space-y-6">
                {/* Topic Selection UI */}
                {!isUploading && progress === 0 && (
                    <div className="mb-6">
                        <h4 className="text-xs text-slate-400 font-black uppercase mb-4 tracking-widest"><i className="fa-solid fa-list-check mr-2 text-indigo-400"></i>{t.tcSectionTopics}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {medicalTopics.map((topic, idx) => (
                                <button key={idx} onClick={() => handleGenerateFromTopic(topic)} className="text-left bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 hover:bg-slate-800/80 p-4 rounded-2xl transition-all duration-300 group flex items-start gap-4 shadow-lg hover:-translate-y-1">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 group-hover:from-indigo-500 group-hover:to-purple-600 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 border border-white/5 transition-all shadow-inner">
                                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                                    </div>
                                    <span className="text-sm text-slate-300 group-hover:text-white font-bold pt-1.5 leading-snug">{topic}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Drag and Drop Container */}
                {!isUploading && progress === 0 && (
                    <div 
                        onClick={() => document.getElementById('file-upload').click()}
                        className={`w-full bg-slate-900/50 border-2 border-dashed ${errorMsg ? 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-white/20 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'} rounded-3xl p-10 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group mb-4 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
                        <div className="text-white font-bold text-lg mb-1">{t.tcSectionUpload}</div>
                        <div className="text-slate-400 text-sm text-center mb-4">
                            {t.tcSectionUploadDesc}
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
                                {progress < 50 ? <><i className="fa-solid fa-file-arrow-up text-blue-400 mr-2"></i> { { ru: 'Чтение файла...', uz: 'Fayl o\'qilmoqda...', en: 'Reading file...' }[lang] || 'Fayl o\'qilmoqda...' }</> :
                                 progress < 100 ? <><i className="fa-solid fa-microchip text-indigo-400 mr-2"></i> { { ru: 'Процесс ИИ Анализа...', uz: 'AI Tahlil jarayoni (Test va Flashcardlar tuzilmoqda)...', en: 'AI Analysis process...' }[lang] || 'AI Tahlil jarayoni (Test va Flashcardlar tuzilmoqda)...' }</> :
                                 <><i className="fa-solid fa-check text-emerald-400 mr-2"></i> { { ru: 'Процесс успешно завершен!', uz: 'Jarayon muvaffaqiyatli yakunlandi!', en: 'Process successfully completed!' }[lang] || 'Jarayon muvaffaqiyatli yakunlandi!' }</>}
                            </span>
                            <span className={progress === 100 ? "text-emerald-400" : "text-blue-400"}>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-3 mb-3">
                            <div className={`h-3 rounded-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] relative overflow-hidden'}`} style={{ width: `${progress}%` }}>
                                {progress < 100 && <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[pulse_1s_ease-in-out_infinite]"></div>}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 italic">
                            {progress < 30 ? ({ ru: 'Извлечение текста...', uz: 'Matn ajratilmoqda...', en: 'Extracting text...' }[lang] || 'Matn ajratilmoqda...') :
                             progress < 70 ? ({ ru: 'Разделение на логические блоки...', uz: 'Parcha-parcha mantiqiy blolklarga bo\'linmoqda...', en: 'Dividing into logical blocks...' }[lang] || 'Parcha-parcha mantiqiy blolklarga bo\'linmoqda...') :
                             progress < 100 ? ({ ru: 'Обогащение медицинскими терминами...', uz: 'Tibbiy atamalar boyitilib, mos xotira kartalari izlanmoqda...', en: 'Enriching with medical terms...' }[lang] || 'Tibbiy atamalar boyitilib, mos xotira kartalari izlanmoqda...') :
                             ({ ru: 'Все загружено на платформу! Студенты теперь могут изучать.', uz: 'Barcha platformaga yuklandi! Talabalar endi ushbu fayldan o\'rganishlari mumkin.', en: 'All uploaded to the platform! Students can now learn from this file.' }[lang] || 'Barcha platformaga yuklandi! Talabalar endi ushbu fayldan o\'rganishlari mumkin.')}
                        </p>
                        
                        {progress === 100 && (
                            <div className="mt-4 flex flex-wrap gap-3">
                                <button onClick={() => {setProgress(0); setIsUploading(false); setGeneratedData(null);}} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-white transition-colors">
                                    <i className="fa-solid fa-rotate-left mr-2"></i>{ { ru: 'Начать заново', uz: 'Yangi boshlash', en: 'Start over' }[lang] || 'Yangi boshlash' }
                                </button>
                                <button onClick={() => setShowLiveRoom(true)} className="px-5 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm text-white font-bold transition-colors shadow-lg shadow-rose-900/40">
                                    <i className="fa-solid fa-tower-broadcast mr-2 animate-pulse"></i>
                                    {{ ru: 'Live Quiz (Аудитория)', uz: 'Live Quiz', en: 'Live Quiz (Classroom)' }[lang] || 'Live Quiz'}
                                </button>
                                <button onClick={handleSaveToPlatform} disabled={isSaving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-bold transition-colors shadow-lg shadow-emerald-900/40 ml-auto">
                                    {isSaving ? <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> : <i className="fa-solid fa-cloud-arrow-up mr-2"></i>}
                                    {{ ru: 'Сохранить на Платформу', uz: 'Platformaga Saqlash', en: 'Save to Platform' }[lang] || 'Platformaga Saqlash'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Display Generated Results Preview */}
                {progress === 100 && generatedData && (
                    <div className="bg-slate-900 rounded-xl p-6 border-2 border-emerald-500 mt-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                        <h4 className="text-emerald-400 font-black mb-4 text-xl border-b border-slate-700 pb-4">
                           ✅ { { ru: '15/2/2/1 Экзаменационный Блок Готов!', uz: '15/2/2/1 Imtihon Bloki Tayyor!', en: '15/2/2/1 Exam Block Ready!' }[lang] || '15/2/2/1 Imtihon Bloki Tayyor!' }
                        </h4>
                        
                        <div className="space-y-8">
                            {/* TESTS */}
                            {generatedData.tests && (
                                <div>
                                     <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-blue-600 text-xs px-2 py-1 rounded mr-2">15 ta</span> { { ru: 'Теоретические Тесты', uz: 'Nazariy Testlar', en: 'Theoretical Tests' }[lang] || 'Nazariy Testlar' }</h5>
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
                                     <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-rose-600 text-xs px-2 py-1 rounded mr-2">2 ta</span> { { ru: 'Ситуационные Задачи', uz: 'Vaziyatli Masalalar', en: 'Case Studies' }[lang] || 'Vaziyatli Masalalar' }</h5>
                                    <div className="space-y-3">
                                        {generatedData.cases.map((c, idx) => (
                                            <div key={idx} className="bg-slate-800 p-4 rounded-lg border-l-4 border-l-rose-500">
                                                <p className="text-rose-400 font-bold text-sm mb-1">{c.title}</p>
                                                <p className="text-slate-300 text-xs italic mb-2">"{c.scenario}"</p>
                                                 <p className="text-slate-200 text-sm font-bold mb-2">{ { ru: 'В:', uz: 'S:', en: 'Q:' }[lang] || 'S:' } {c.question}</p>
                                                 <p className="text-emerald-400 text-xs bg-emerald-900/40 p-2 rounded">{ { ru: 'О:', uz: 'J:', en: 'A:' }[lang] || 'J:' } {c.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* X-RAYS */}
                            {generatedData.xrays && (
                                <div>
                                     <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-violet-600 text-xs px-2 py-1 rounded mr-2">2 ta</span> { { ru: 'Рентгенограмма', uz: 'Rentgenogramma', en: 'X-ray' }[lang] || 'Rentgenogramma' }</h5>
                                    <div className="grid grid-cols-1 gap-3">
                                        {generatedData.xrays.map((x, idx) => (
                                            <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row gap-4">
                                                <div className="flex gap-2 shrink-0">
                                                    <div className="w-16 h-16 bg-slate-700 rounded shrink-0 border border-dashed border-slate-500 overflow-hidden relative group cursor-pointer hover:border-violet-500 transition-colors">
                                                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={(e) => handleXrayImageUpload(idx, e)} />
                                                        {xrayImages[idx] ? (
                                                            <img src={xrayImages[idx]} alt="xray" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-[10px] text-center p-1 group-hover:text-violet-400">
                                                                <i className="fa-solid fa-cloud-arrow-up text-base block mb-1"></i>
                                                                Yuklash
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => handleSearchImage(idx, x.title)}
                                                        className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded border border-slate-600 text-slate-300 text-[10px] flex flex-col items-center justify-center transition-colors shrink-0"
                                                        title="Internetdan qidirish"
                                                    >
                                                        <i className="fa-solid fa-magnifying-glass text-base mb-1 text-sky-400"></i>
                                                        Qidirish
                                                    </button>
                                                </div>
                                                <div className="flex-1">
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
                                     <h5 className="text-lg font-bold text-white mb-3 flex items-center"><span className="bg-amber-600 text-xs px-2 py-1 rounded mr-2">1 ta</span> { { ru: 'Практика', uz: 'Amaliyot', en: 'Practice' }[lang] || 'Amaliyot' }</h5>
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

         <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-700 pb-3">{t.tcSectionStatsTitle}</h3>

            {/* === Ko'p Word/PDF Yuklash === */}
            <div className="mb-6 p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <i className="fa-regular fa-file-word"></i> { { ru: 'Массовая загрузка Word/PDF (ИИ)', uz: 'Ko\'p Word / PDF Yuklash (AI)', en: 'Bulk Word/PDF Upload (AI)' }[lang] || 'Ko\'p Word / PDF Yuklash (AI)' }
                </h4>
                <p className="text-slate-400 text-xs mb-4">
                    { { ru: 'Выберите несколько файлов .docx или .pdf одновременно. ИИ автоматически создаст экзамен из каждого.', uz: 'Bir vaqtda bir necha .docx yoki .pdf fayl tanlang. Har biridan AI avtomatik exam yaratadi.', en: 'Select multiple .docx or .pdf files at once. AI will automatically create an exam from each.' }[lang] || 'Bir vaqtda bir necha .docx yoki .pdf fayl tanlang. Har biridan AI avtomatik exam yaratadi.' }
                </p>

                <label className={`w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl transition-all cursor-pointer border-2 border-dashed ${isUploadingMultiDoc ? 'border-slate-600 text-slate-500 cursor-not-allowed' : 'border-blue-600 text-blue-400 hover:bg-blue-500/10'}`}>
                    {isUploadingMultiDoc ? (
                        <div className="text-center">
                            <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                            {multiDocProgress.current}/{multiDocProgress.total} — <span className="text-slate-400 italic truncate max-w-[200px] inline-block align-bottom">{multiDocProgress.fileName}</span>
                        </div>
                    ) : (
                        <><i className="fa-solid fa-plus"></i> { { ru: 'Выбрать файлы Word/PDF', uz: 'Word / PDF Fayllarni Tanlash', en: 'Select Word/PDF Files' }[lang] || 'Word / PDF Fayllarni Tanlash' }</>
                    )}
                    <input type="file" accept=".docx,.pdf,.pptx" multiple className="hidden" disabled={isUploadingMultiDoc} onChange={handleMultiDocUpload} />
                </label>

                {multiDocResults.length > 0 && (
                    <div className="mt-4 space-y-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {multiDocResults.filter(r => r.success).length}/{multiDocResults.length} { { ru: 'успешно', uz: 'ta muvaffaqiyatli', en: 'successful' }[lang] || 'ta muvaffaqiyatli' }
                        </p>
                        {multiDocResults.map((r, i) => (
                            <div key={i} className={`p-3 rounded-xl border ${r.success ? 'bg-blue-500/5 border-blue-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                                {r.success ? (
                                    <>
                                        <p className="text-blue-300 font-bold text-xs mb-1 flex items-center gap-1 truncate">
                                            <i className="fa-solid fa-check-circle text-emerald-400 shrink-0"></i> {r.fileName}
                                        </p>
                                        <p className="text-slate-500 text-[10px] mb-2">
                                            {r.testsCount > 0 && `${r.testsCount} test `}
                                            {r.casesCount > 0 && `${r.casesCount} vaziyatli `}
                                            {r.xraysCount > 0 && `${r.xraysCount} rentgen`}
                                        </p>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-slate-900 rounded-lg px-2 py-1.5 text-[10px] text-slate-300 font-mono truncate border border-slate-700">{r.link}</div>
                                            <button onClick={() => { navigator.clipboard.writeText(r.link); alert(`Nusxalandi!`); }} className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white shrink-0">
                                                <i className="fa-solid fa-copy"></i>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-rose-400 text-xs flex items-start gap-1">
                                        <i className="fa-solid fa-xmark-circle shrink-0 mt-0.5"></i>
                                        <span><b>{r.fileName}</b>: {r.error}</span>
                                    </p>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setMultiDocResults([])} className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-lg transition-colors">
                            <i className="fa-solid fa-trash mr-1"></i> { { ru: 'Очистить результаты', uz: 'Natijalarni tozalash', en: 'Clear results' }[lang] || 'Natijalarni tozalash' }
                        </button>
                    </div>
                )}
            </div>

            {/* Tayyor Baza yuklash */}
            <div className="mb-6 p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <i className="fa-solid fa-database"></i> { { ru: 'Готовая база данных', uz: 'Tayyor Ma\'lumotlar Bazasi', en: 'Ready Database' }[lang] || 'Tayyor Ma\'lumotlar Bazasi' }
                </h4>
                <p className="text-slate-400 text-xs mb-4">
                    { { ru: `Загрузить готовую базу из ${methodologicalQuiz.length} теор. тестов, ${xrayCases.length} рентгенов и ${caseStudies.length} сит. задач на платформу одним кликом и получить ссылку для студентов.`, uz: `${methodologicalQuiz.length} ta nazariy test, ${xrayCases.length} ta rentgen va ${caseStudies.length} ta vaziyatli masaladan iborat tayyor bazani bir tugma bilan platformaga yuklab, talabalar uchun havola olish.`, en: `Upload a ready database of ${methodologicalQuiz.length} theoretical tests, ${xrayCases.length} x-rays, and ${caseStudies.length} case studies to the platform with one click and get a link for students.` }[lang] || `${methodologicalQuiz.length} ta nazariy test, ${xrayCases.length} ta rentgen va ${caseStudies.length} ta vaziyatli masaladan iborat tayyor bazani bir tugma bilan platformaga yuklab, talabalar uchun havola olish.` }
                </p>
                <button
                    onClick={handlePublishLocalBase}
                    disabled={isPublishing}
                    className={`w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl transition-all shadow-lg ${
                        isPublishing
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 hover:-translate-y-0.5'
                    }`}
                >
                    {isPublishing ? (
                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Yuklanmoqda...</>
                    ) : (
                        <><i className="fa-solid fa-cloud-arrow-up"></i> Bazani Platformaga Yuklash</>
                    )}
                </button>

                {publishedLink && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <p className="text-emerald-400 font-bold text-xs mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-check-circle"></i> Muvaffaqiyatli yuklandi!
                        </p>
                        <p className="text-slate-400 text-xs mb-2">Talabalar uchun havola:</p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono truncate border border-slate-700">
                                {publishedLink}
                            </div>
                            <button
                                onClick={() => { navigator.clipboard.writeText(publishedLink); alert('Nusxalandi!'); }}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white transition-colors"
                                title="Nusxalash"
                            >
                                <i className="fa-solid fa-copy"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Auto-Fetch NIH Baza */}
            <div className="mb-6 p-5 rounded-xl bg-slate-900/40 border border-white/10 backdrop-blur-xl hover:border-violet-500/40 hover:shadow-[0_10px_30px_rgba(139,92,246,0.15)] transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.4)] animate-pulse-slow">
                        <i className="fa-solid fa-satellite-dish"></i>
                    </div>
                    <h4 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 uppercase tracking-widest">
                        { { ru: 'Авто-сбор базы (NIH Open-i)', uz: 'Avto-yig\'ish (NIH Open-i)', en: 'Auto-Fetch (NIH Open-i)' }[lang] || 'Avto-yig\'ish (NIH Open-i)' }
                    </h4>
                </div>
                <p className="text-slate-400 text-xs mb-4 ml-11">
                    { { ru: 'Автоматически собрать 25 реальных ортопедических рентгенов из открытой базы NIH и превратить их в тесты.', uz: 'AQSh Tibbiyot Milliy Kutubxonasidan (NIH) avtomatik ravishda tayyor ortopedik rentgenlarni tortib olish va testlarga aylantirish.', en: 'Automatically fetch 25 real orthopedic x-rays from the NIH open database and convert them into tests.' }[lang] || 'AQSh Tibbiyot Milliy Kutubxonasidan (NIH) avtomatik ravishda tayyor ortopedik rentgenlarni tortib olish va testlarga aylantirish.' }
                </p>
                <button
                    onClick={handleAutoFetchNIH}
                    disabled={isAutoFetchingNIH}
                    className={`w-full py-3 flex items-center justify-center gap-2 font-black text-sm rounded-xl transition-all shadow-lg ${
                        isAutoFetchingNIH
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-violet-500/30 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(139,92,246,0.4)]'
                    }`}
                >
                    {isAutoFetchingNIH ? (
                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Internetdan Qidirilmoqda...</>
                    ) : (
                        <><i className="fa-solid fa-cloud-bolt"></i> Ortopediya Bazasini Yaratish</>
                    )}
                </button>

                {nihFetchResult && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <p className="text-emerald-400 font-bold text-xs mb-2 flex items-center gap-2">
                            <i className="fa-solid fa-check-circle"></i> {nihFetchResult.count} ta rentgen muvaffaqiyatli yuklandi!
                        </p>
                        <p className="text-slate-400 text-xs mb-2">Talabalar uchun havola:</p>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono truncate border border-slate-700">
                                {nihFetchResult.link}
                            </div>
                            <button
                                onClick={() => { navigator.clipboard.writeText(nihFetchResult.link); alert('Nusxalandi!'); }}
                                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white transition-colors"
                                title="Nusxalash"
                            >
                                <i className="fa-solid fa-copy"></i>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-center h-32 opacity-40">
               <i className="fa-solid fa-chart-line text-5xl text-slate-500 mb-4"></i>
               <p className="text-slate-400">{t.tcSectionStatsDesc}</p>
            </div>
         </div>
      </div>

      {/* Image Search Modal */}
      {imageSearchModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-center bg-slate-800 gap-4">
                      <h3 className="text-white font-bold flex items-center gap-2"><i className="fa-solid fa-globe text-sky-400"></i> Internetdan Rasm Qidirish</h3>
                      <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                          <button 
                              onClick={() => setImageSearchModal(prev => ({...prev, searchType: 'xray'}))}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${imageSearchModal.searchType === 'xray' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                              <i className="fa-solid fa-x-ray mr-1"></i> X-Ray
                          </button>
                          <button 
                              onClick={() => setImageSearchModal(prev => ({...prev, searchType: 'medical'}))}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${imageSearchModal.searchType === 'medical' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                          >
                              <i className="fa-solid fa-briefcase-medical mr-1"></i> Umumiy Tibbiy
                          </button>
                      </div>
                      <button onClick={() => setImageSearchModal({ isOpen: false, idx: null, query: '', results: [], isLoading: false, searchType: 'xray' })} className="text-slate-400 hover:text-white transition-colors w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-xmark text-xl"></i>
                      </button>
                  </div>
                  <div className="p-4 flex gap-2 border-b border-slate-800 bg-slate-800/50">
                      <input 
                          type="text" 
                          value={imageSearchModal.query}
                          onChange={(e) => setImageSearchModal(prev => ({...prev, query: e.target.value}))}
                          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                          placeholder="Qidiruv so'zi..."
                          onKeyDown={(e) => { if(e.key === 'Enter') handleSearchImage(imageSearchModal.idx, imageSearchModal.query, imageSearchModal.searchType); }}
                      />
                      <button 
                          onClick={() => handleSearchImage(imageSearchModal.idx, imageSearchModal.query, imageSearchModal.searchType)}
                          className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:shadow-lg hover:shadow-sky-500/20 flex items-center gap-2"
                      >
                          <i className="fa-solid fa-magnifying-glass"></i> Qidirish
                      </button>
                  </div>
                  <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-slate-900">
                      {imageSearchModal.isLoading ? (
                          <div className="flex flex-col justify-center items-center h-48 space-y-3">
                              <i className="fa-solid fa-circle-notch fa-spin text-4xl text-sky-500"></i>
                              <p className="text-slate-400 text-sm">Internetdan qidirilmoqda...</p>
                          </div>
                      ) : imageSearchModal.results.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {imageSearchModal.results.map((url, i) => (
                                  <div 
                                      key={i} 
                                      onClick={() => handleSelectSearchedImage(url)}
                                      className="cursor-pointer bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-sky-500 hover:ring-4 hover:ring-sky-500/30 transition-all h-36 relative group"
                                  >
                                      <img src={url} alt="Search result" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                                          <span className="text-white text-xs font-bold bg-sky-600/90 px-3 py-1 rounded-full"><i className="fa-solid fa-check mr-1"></i> Tanlash</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center text-slate-500 py-12">
                              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                                  <i className="fa-solid fa-image text-3xl text-slate-600"></i>
                              </div>
                              <h4 className="text-slate-300 font-bold mb-1">Rasmlar topilmadi</h4>
                              <p className="text-xs">Boshqa so'z bilan qidirib ko'ring (masalan: "bone fracture xray")</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </DashboardLayout>
  );
};

export default TeacherDashboard;
