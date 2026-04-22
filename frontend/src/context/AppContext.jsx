import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AppContext = createContext(null);

// ==================== TRANSLATIONS ====================
export const translations = {
  uz: {
    // ── Auth ──────────────────────────────────────────
    loginTitle: "Xush kelibsiz",
    loginSubtitle: "Boshlash uchun Google akkauntingiz orqali xavfsiz tizimga kiring.",
    loginButton: "Google orqali davom etish",
    loginTabStudent: "Talaba",
    loginTabTeacher: "O'qituvchi",
    loginSubtitleGoogle: "Google akkaunt bilan tezkor kirish",
    loginSubtitleTeacher: "Tizimga O'qituvchi sifatida kiring",
    emailPlaceholder: "Pochta (Login)",
    passwordPlaceholder: "Parol",
    loginAction: "KIRISH",
    loginErrorCredentials: "Pochta yoki parol noto'g'ri!",
    loginErrorSystem: "Xatolik yuz berdi: ",
    loginPrivacy: "Davom etish orqali siz platformaning",
    loginPrivacyLink: "Maxfiylik Siyosati",
    loginPrivacyEnd: "ga rozi bo'lasiz.",
    recentUsers: "Oxirgi kirgan talabalar",
    onlineNow: "Ayni damda onlayn o'rganmoqda",
    platformDesc: "Sun'iy intellektga asoslangan kelajak tibbiyot o'quv bazasi. Travmatologiya, klinik holatlar, tasviriy diagnostika va xirurgiya simulyatorlari.",
    platformBadge: "Toshkent Tibbiyot Akademiyasi O'quv Bazasi",
    platformTitle: "Platformasi",
    selectRole: "O'z rolingizni tanlang",
    studentPanel: "Talaba Ekraniga O'tish",
    studentDesc: "Testlar, darslar, reyting va AI tavsiyalari",
    teacherPanel: "O'qituvchi Paneliga O'tish",
    teacherDesc: "AI orqali imtihon yaratish, statistika va nazorat",
    logout: "Chiqish",
    loading: "Yuklanmoqda...",

    // ── Teacher Dashboard ─────────────────────────────
    tcStatsCourses: "MENING KURSLARIM",
    tcStatsStudents: "FAOL TALABALAR",
    tcStatsCases: "KLINIK CASE'LAR",
    tcStatsMastery: "TALABA O'ZLASHTIRISHI",
    tcSectionCreate: "Kurs & Interaktiv Case'lar Yaratish",
    tcSectionTopics: "O'QUV REJA: MAVZU BO'YICHA AI-IMTIHON YARATISH",
    tcSectionStatsTitle: "Talabalar Statistikasi",
    tcSectionStatsDesc: "Bu yerda Chart.js orqali talabalarning davomati va test natijalari chiqadi.",
    tcSectionUpload: "Dars materialini yuklang (Drag & Drop yoki bosing)",
    tcSectionUploadDesc: ".DOCX, .PDF yoki .PPTX formatidagi fayllarni shu yerga tashlang yoki ustiga bosing. Sun'iy intellekt matnni ajratib avtomatik Test va Flashcardlar yaratadi.",

    // ── Student Dashboard ─────────────────────────────
    myResults: "Mening Natijalarim (Portfolio)",
    noResults: "Hali hech qanday imtihon topshirmadingiz.",
    mastery: "O'zlashtirish",
    dashboard: "Bosh sahifa",
    back: "Orqaga",
    switchToTeacher: "O'qituvchi",
    switchToStudent: "Talaba",
    levelLabel: "Daraja",

    // Charts
    weeklyXP: "Haftalik XP O'sishi",
    subjectMastery: "Fanlar bo'yicha mahorat",

    // Portfolio
    portfolioTitle: "Mening Natijalarim (Portfolio)",

    // Methodology
    methodologyTitle: "Travmatologiya qo'llanmalari",
    methodologyDesc: "Suyak sinishlari, Immobilizatsiya, Transport ko'tarish va Klinik Case-Study materiallari. (Bosib kiring)",

    // Clinical Training
    clinicalTitle: "Klinik Trening (Gamification)",
    duelMode: "Konsilium Rejimi (Duel)",
    duelDesc: "Real vaqtda raqiblar bilan travma tasviriy diagnostikasi.",
    newCases: "Yangi Travma Case'lari",
    newCasesDesc: "Mustaqil kunlik travma klinik keyslarni yechish (+50 XP).",

    // Flashcards
    flashcardsTitle: "AI Flashcards (Xotira)",
    flashcardsNew: "Yangi",
    flashcardsCount: "32 ta karta",
    flashcardsTopicTitle: "Travmatologiya Asoslari",
    flashcardsTopicDesc: "\"Tayanch-harakat apparati sinishlari va immobilizatsiya\" mavzusi bo'yicha AI tuzgan xotira kartalari.",
    flashcardsStart: "Takrorlashni Boshlash",

    // Achievements
    achievementsTitle: "So'nggi Yutuqlar",
    achievement1: "Travma Diagnostikasi Ustasi",
    achievement2: "7 kun uzluksiz!",

    // Sessions
    pastSessions: "O'tgan sessiyalar",
    correctAnswers: "ta to'g'ri javob",
    unknownPin: "Noma'lum",

    // Live Quiz
    liveQuizTitle: "Live Quiz'ga ulanish",
    liveQuizDesc: "O'qituvchi aytgan 6 xonali maxsus PIN kodni kiriting va poygaga qo'shiling.",
    liveQuizJoin: "Ulanish",
    liveQuizPinPlaceholder: "6 xonali PIN",
    liveQuizPinError: "PIN 6 ta raqamdan iborat bo'lishi kerak!",
    waitingForTeacher: "O'qituvchi o'yinni boshlaganini kuting...",
    yourName: "Sizning ismingiz",
    waitingRoom: "Kutish zalida",
    persons: "kishi",
    questionOf: "Savol",
    yourScore: "Ballingiz",
    correct: "To'g'ri",
    rank: "O'rin",
    quizFinished: "Test Yakunlandi!",
    resultSaved: "Sizning natijangiz saqlab qo'yildi",
    finalRanking: "Yakuniy Reyting",
    backToStudent: "Talaba paneliga qaytish",
    readQuestion: "Savolni katta ekrandan o'qing va javobni tanlang",
    waitForNext: "O'qituvchi keyingi savolga o'tishini kuting...",
    correctAnswer: "To'g'ri! +100 ball",
    wrongAnswer: "Xato! 0 ball",
    liveRanking: "Jonli Reyting",
    timeLeft: "Vaqt",
    roomNotFound: "Xona topilmadi. PIN kodni tekshiring.",
    gameAlreadyOver: "Bu o'yin allaqachon tugagan.",
    connectionError: "Xonaga ulashda muammo bo'ldi.",
    youLabel: "Siz",
    points: "ball",
  },

  ru: {
    // ── Auth ──────────────────────────────────────────
    loginTitle: "Добро пожаловать",
    loginSubtitle: "Войдите через аккаунт Google для безопасного доступа к платформе.",
    loginButton: "Продолжить через Google",
    loginTabStudent: "Студент",
    loginTabTeacher: "Преподаватель",
    loginSubtitleGoogle: "Быстрый вход через Google аккаунт",
    loginSubtitleTeacher: "Войдите в систему как Преподаватель",
    emailPlaceholder: "Почта (Логин)",
    passwordPlaceholder: "Пароль",
    loginAction: "ВОЙТИ",
    loginErrorCredentials: "Неверная почта или пароль!",
    loginErrorSystem: "Произошла ошибка: ",
    loginPrivacy: "Продолжая, вы соглашаетесь с",
    loginPrivacyLink: "Политикой конфиденциальности",
    loginPrivacyEnd: "платформы.",
    recentUsers: "Последние вошедшие студенты",
    onlineNow: "Сейчас обучаются онлайн",
    platformDesc: "Медицинская образовательная база на основе ИИ. Травматология, клинические случаи, лучевая диагностика и симуляторы хирургии.",
    platformBadge: "Ташкентская медицинская академия — Учебная база",
    platformTitle: "Платформа",
    selectRole: "Выберите свою роль",
    studentPanel: "Перейти в Кабинет Студента",
    studentDesc: "Тесты, уроки, рейтинг и рекомендации ИИ",
    teacherPanel: "Перейти в Панель Преподавателя",
    teacherDesc: "Генерация экзаменов через ИИ, статистика и контроль",
    logout: "Выйти",
    loading: "Загрузка...",

    // ── Teacher Dashboard ─────────────────────────────
    tcStatsCourses: "МОИ КУРСЫ",
    tcStatsStudents: "АКТИВНЫЕ СТУДЕНТЫ",
    tcStatsCases: "КЛИНИЧЕСКИЕ КЕЙСЫ",
    tcStatsMastery: "УСПЕВАЕМОСТЬ СТУДЕНТОВ",
    tcSectionCreate: "Создание курсов и интерактивных кейсов",
    tcSectionTopics: "УЧЕБНЫЙ ПЛАН: СОЗДАНИЕ ИИ-ЭКЗАМЕНА ПО ТЕМАМ",
    tcSectionStatsTitle: "Статистика студентов",
    tcSectionStatsDesc: "Здесь будет отображаться посещаемость и результаты тестов.",
    tcSectionUpload: "Загрузите учебный материал (Drag & Drop или нажмите)",
    tcSectionUploadDesc: "Перетащите файлы .DOCX, .PDF или .PPTX сюда. Искусственный интеллект автоматически создаст тесты и флэш-карточки.",

    // ── Student Dashboard ─────────────────────────────
    myResults: "Мои Результаты (Портфолио)",
    noResults: "Вы ещё не прошли ни одного экзамена.",
    mastery: "Освоение",
    dashboard: "Главная",
    back: "Назад",
    switchToTeacher: "Преподаватель",
    switchToStudent: "Студент",
    levelLabel: "Уровень",

    // Charts
    weeklyXP: "Недельный рост XP",
    subjectMastery: "Успеваемость по дисциплинам",

    // Portfolio
    portfolioTitle: "Мои Результаты (Портфолио)",

    // Methodology
    methodologyTitle: "Пособия по травматологии",
    methodologyDesc: "Переломы костей, иммобилизация, транспортировка и клинические разборы. (Нажмите для входа)",

    // Clinical Training
    clinicalTitle: "Клинический тренинг (геймификация)",
    duelMode: "Режим Консилиума (Дуэль)",
    duelDesc: "Лучевая диагностика травм в реальном времени против соперника.",
    newCases: "Новые травма-кейсы",
    newCasesDesc: "Ежедневные клинические разборы травматологии самостоятельно (+50 XP).",

    // Flashcards
    flashcardsTitle: "AI Флэш-карточки (Память)",
    flashcardsNew: "Новое",
    flashcardsCount: "32 карточки",
    flashcardsTopicTitle: "Основы травматологии",
    flashcardsTopicDesc: "ИИ-карточки по теме «Переломы ОДА, транспортная иммобилизация и гипсовая техника».",
    flashcardsStart: "Начать повторение",

    // Achievements
    achievementsTitle: "Последние достижения",
    achievement1: "Мастер диагностики травм",
    achievement2: "7 дней без перерыва!",

    // Sessions
    pastSessions: "Прошедшие сессии",
    correctAnswers: "правильных ответов",
    unknownPin: "Неизвестно",

    // Live Quiz
    liveQuizTitle: "Подключиться к Live Quiz",
    liveQuizDesc: "Введите 6-значный PIN от преподавателя и присоединитесь к гонке.",
    liveQuizJoin: "Подключиться",
    liveQuizPinPlaceholder: "6-значный PIN",
    liveQuizPinError: "PIN должен состоять из 6 цифр!",
    waitingForTeacher: "Ожидайте начала игры от преподавателя...",
    yourName: "Ваше имя",
    waitingRoom: "В зале ожидания",
    persons: "чел.",
    questionOf: "Вопрос",
    yourScore: "Ваши очки",
    correct: "Правильно",
    rank: "Место",
    quizFinished: "Тест завершён!",
    resultSaved: "Ваш результат сохранён",
    finalRanking: "Итоговый рейтинг",
    backToStudent: "Вернуться в кабинет студента",
    readQuestion: "Читайте вопрос с большого экрана и выберите ответ",
    waitForNext: "Ожидайте следующего вопроса от преподавателя...",
    correctAnswer: "Верно! +100 очков",
    wrongAnswer: "Неверно! 0 очков",
    liveRanking: "Живой рейтинг",
    timeLeft: "Время",
    roomNotFound: "Комната не найдена. Проверьте PIN.",
    gameAlreadyOver: "Эта игра уже завершена.",
    connectionError: "Проблема подключения к комнате.",
    youLabel: "Вы",
    points: "очков",
  },

  en: {
    // ── Auth ──────────────────────────────────────────
    loginTitle: "Welcome Back",
    loginSubtitle: "Sign in securely with your Google account to get started.",
    loginButton: "Continue with Google",
    loginTabStudent: "Student",
    loginTabTeacher: "Teacher",
    loginSubtitleGoogle: "Fast sign in with Google account",
    loginSubtitleTeacher: "Sign in as a Teacher",
    emailPlaceholder: "Email (Login)",
    passwordPlaceholder: "Password",
    loginAction: "SIGN IN",
    loginErrorCredentials: "Invalid email or password!",
    loginErrorSystem: "An error occurred: ",
    loginPrivacy: "By continuing, you agree to the platform's",
    loginPrivacyLink: "Privacy Policy",
    loginPrivacyEnd: ".",
    recentUsers: "Recently joined students",
    onlineNow: "Currently learning online",
    platformDesc: "AI-powered medical education hub. Traumatology, interactive clinical cases, imaging diagnostics and surgery simulators.",
    platformBadge: "Tashkent Medical Academy — Learning Hub",
    platformTitle: "Platform",
    selectRole: "Choose your role",
    studentPanel: "Go to Student Dashboard",
    studentDesc: "Quizzes, lessons, leaderboard & AI recommendations",
    teacherPanel: "Go to Teacher Panel",
    teacherDesc: "AI-powered exam creation, statistics & monitoring",
    logout: "Sign Out",
    loading: "Loading...",

    // ── Teacher Dashboard ─────────────────────────────
    tcStatsCourses: "MY COURSES",
    tcStatsStudents: "ACTIVE STUDENTS",
    tcStatsCases: "CLINICAL CASES",
    tcStatsMastery: "STUDENT MASTERY",
    tcSectionCreate: "Create Courses & Interactive Cases",
    tcSectionTopics: "SYLLABUS: CREATE AI-EXAM BY TOPIC",
    tcSectionStatsTitle: "Student Statistics",
    tcSectionStatsDesc: "Attendance and test results will be displayed here.",
    tcSectionUpload: "Upload Course Material (Drag & Drop or click)",
    tcSectionUploadDesc: "Drop .DOCX, .PDF, or .PPTX files here. The Artificial Intelligence will automatically create Tests and Flashcards.",

    // ── Student Dashboard ─────────────────────────────
    myResults: "My Results (Portfolio)",
    noResults: "You haven't taken any exams yet.",
    mastery: "Mastery",
    dashboard: "Home",
    back: "Back",
    switchToTeacher: "Teacher",
    switchToStudent: "Student",
    levelLabel: "Level",

    // Charts
    weeklyXP: "Weekly XP Growth",
    subjectMastery: "Proficiency by Subject",

    // Portfolio
    portfolioTitle: "My Results (Portfolio)",

    // Methodology
    methodologyTitle: "Traumatology Study Guides",
    methodologyDesc: "Bone fractures, immobilization, patient transport & clinical case studies. (Click to enter)",

    // Clinical Training
    clinicalTitle: "Clinical Training (Gamification)",
    duelMode: "Consilium Mode (Duel)",
    duelDesc: "Real-time trauma imaging diagnostics against opponents.",
    newCases: "New Trauma Cases",
    newCasesDesc: "Solve daily traumatology clinical cases independently (+50 XP).",

    // Flashcards
    flashcardsTitle: "AI Flashcards (Memory)",
    flashcardsNew: "New",
    flashcardsCount: "32 cards",
    flashcardsTopicTitle: "Fundamentals of Traumatology",
    flashcardsTopicDesc: "AI-generated flashcards on \"Musculoskeletal fractures, transport immobilization & plaster casting\".",
    flashcardsStart: "Start Review",

    // Achievements
    achievementsTitle: "Recent Achievements",
    achievement1: "Trauma Diagnostics Master",
    achievement2: "7-day streak!",

    // Sessions
    pastSessions: "Past Sessions",
    correctAnswers: "correct answers",
    unknownPin: "Unknown",

    // Live Quiz
    liveQuizTitle: "Join Live Quiz",
    liveQuizDesc: "Enter the 6-digit PIN from your teacher and join the race.",
    liveQuizJoin: "Join",
    liveQuizPinPlaceholder: "6-digit PIN",
    liveQuizPinError: "PIN must be exactly 6 digits!",
    waitingForTeacher: "Waiting for your teacher to start the game...",
    yourName: "Your name",
    waitingRoom: "In waiting room",
    persons: "players",
    questionOf: "Question",
    yourScore: "Your Score",
    correct: "Correct",
    rank: "Rank",
    quizFinished: "Quiz Finished!",
    resultSaved: "Your result has been saved",
    finalRanking: "Final Leaderboard",
    backToStudent: "Back to Student Dashboard",
    readQuestion: "Read the question on the big screen and choose your answer",
    waitForNext: "Wait for the teacher to advance to the next question...",
    correctAnswer: "Correct! +100 points",
    wrongAnswer: "Wrong! 0 points",
    liveRanking: "Live Leaderboard",
    timeLeft: "Time",
    roomNotFound: "Room not found. Check your PIN.",
    gameAlreadyOver: "This game has already ended.",
    connectionError: "Problem connecting to the room.",
    youLabel: "You",
    points: "pts",
  }
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('mz_theme') || 'light');
  const [lang, setLang] = useState(() => localStorage.getItem('mz_lang') || 'uz');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('mz_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('mz_lang', lang);
  }, [lang]);

  const t = translations[lang];
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang = (newLang) => setLang(newLang);

  return (
    <AppContext.Provider value={{ theme, lang, t, toggleTheme, toggleLang }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};

// ==================== FLOATING TOOLBAR ====================
export const AppToolbar = ({ user, role, onLogout }) => {
  const { theme, lang, toggleTheme, toggleLang } = useApp();
  const isDark = theme === 'dark';
  
  // Use location hook to re-render based on route changes properly
  const location = useLocation();
  const path = location.pathname;

  if (path.startsWith('/admin') || path.startsWith('/teacher') || path.startsWith('/student') || path.startsWith('/test') || path.startsWith('/methodology')) {
    return null;
  }

  const langs = [
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
      {/* User Session Info (If Logged In) */}
      {user && (
         <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl border shadow-lg mr-1 animate-[fadeInLeft_0.5s_ease-out]"
              style={{
                background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
                borderColor: isDark ? 'rgba(71,85,105,0.5)' : 'rgba(203,213,225,0.7)',
              }}>
             <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-emerald-500 shadow-sm" />
             <div className="flex flex-col items-start hidden sm:flex pr-1">
                 <span className="text-sm font-bold leading-tight" style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{user.displayName}</span>
                 <div className="flex items-center gap-2 mt-0.5">
                     <span className={`text-[9px] px-1.5 rounded-full font-bold uppercase tracking-widest ${role === 'admin' ? 'bg-purple-500/20 text-purple-400' : role === 'teacher' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>{role === 'admin' ? 'Super Admin' : role === 'teacher' ? "O'qituvchi" : 'Talaba'}</span>
                     <span className="text-[10px]" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>{user.email}</span>
                 </div>
             </div>
             <div className="w-px h-6 mx-1" style={{ background: isDark ? '#475569' : '#cbd5e1' }}></div>
             <button onClick={onLogout} className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all text-sm" title="Chiqish">
                 <i className="fa-solid fa-right-from-bracket"></i>
             </button>
         </div>
      )}

      {/* Logo badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border shadow-lg"
        style={{
          background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(71,85,105,0.5)' : 'rgba(203,213,225,0.7)',
        }}
      >
        <img src="/assets/tma_logo.png" alt="TMA" className="w-7 h-7 object-contain rounded-full border border-blue-400/40" />
        <span className="text-[10px] font-black tracking-widest hidden sm:block"
          style={{ color: isDark ? '#94a3b8' : '#475569' }}>
          MED-ZUKKOO
        </span>
      </div>

      {/* Language switcher UZ | RU | EN */}
      <div
        className="flex items-center rounded-xl border overflow-hidden shadow-lg"
        style={{
          background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(71,85,105,0.6)' : 'rgba(203,213,225,0.8)',
        }}
      >
        {langs.map((l, idx) => (
          <React.Fragment key={l.code}>
            {idx > 0 && (
              <div style={{ width: 1, height: 20, background: isDark ? '#475569' : '#cbd5e1' }} />
            )}
            <button
              onClick={() => toggleLang(l.code)}
              className="px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200"
              style={{
                background: lang === l.code ? '#2563eb' : 'transparent',
                color: lang === l.code ? '#fff' : (isDark ? '#94a3b8' : '#475569'),
              }}
            >
              {l.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Dark / Light toggle */}
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 border"
        style={{
          background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(71,85,105,0.6)' : 'rgba(203,213,225,0.8)',
          color: isDark ? '#facc15' : '#2563eb',
        }}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        <i className={isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
      </button>
    </div>
  );
};

export default AppContext;
