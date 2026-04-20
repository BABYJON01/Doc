import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

// ==================== TRANSLATIONS ====================
export const translations = {
  uz: {
    loginTitle: "Xush kelibsiz",
    loginSubtitle: "Boshlash uchun Google akkauntingiz orqali xavfsiz tizimga kiring.",
    loginButton: "Google orqali davom etish",
    loginPrivacy: "Davom etish orqali siz platformaning",
    loginPrivacyLink: "Maxfiylik Siyosati",
    loginPrivacyEnd: "ga rozi bo'lasiz.",
    recentUsers: "Oxirgi kirgan talabalar",
    onlineNow: "Ayni damda onlayn o'rganmoqda",
    platformDesc: "Sun'iy intellektga asoslangan kelajak tibbiyot o'quv bazasi. Interaktiv klinik holatlar, tashxislash va xirurgiya simulyatorlari.",
    platformBadge: "Toshkent Tibbiyot Akademiyasi O'quv Bazasi",
    platformTitle: "Platformasi",
    selectRole: "O'z rolingizni tanlang",
    studentPanel: "Talaba Ekraniga O'tish",
    studentDesc: "Testlar, darslar, reyting va AI tavsiyalari",
    teacherPanel: "O'qituvchi Paneliga O'tish",
    teacherDesc: "AI orqali imtihon yaratish, statistika va nazorat",
    logout: "Chiqish",
    loading: "Yuklanmoqda...",
    myResults: "Mening Natijalarim (Portfolio)",
    noResults: "Hali hech qanday imtihon topshirmadingiz.",
    mastery: "O'zlashtirish",
    dashboard: "Bosh sahifa",
    back: "Orqaga",
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
    loginTitle: "Добро пожаловать",
    loginSubtitle: "Войдите через аккаунт Google для безопасного доступа к платформе.",
    loginButton: "Продолжить через Google",
    loginPrivacy: "Продолжая, вы соглашаетесь с",
    loginPrivacyLink: "Политикой конфиденциальности",
    loginPrivacyEnd: "платформы.",
    recentUsers: "Последние вошедшие студенты",
    onlineNow: "Сейчас обучаются онлайн",
    platformDesc: "Медицинская образовательная база на основе ИИ. Интерактивные клинические случаи, диагностика и симуляторы хирургии.",
    platformBadge: "Ташкентская медицинская академия — Учебная база",
    platformTitle: "Платформа",
    selectRole: "Выберите свою роль",
    studentPanel: "Перейти в Кабинет Студента",
    studentDesc: "Тесты, уроки, рейтинг и рекомендации ИИ",
    teacherPanel: "Перейти в Панель Преподавателя",
    teacherDesc: "Генерация экзаменов через ИИ, статистика и контроль",
    logout: "Выйти",
    loading: "Загрузка...",
    myResults: "Мои Результаты (Портфолио)",
    noResults: "Вы ещё не прошли ни одного экзамена.",
    mastery: "Освоение",
    dashboard: "Главная",
    back: "Назад",
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
    loginTitle: "Welcome Back",
    loginSubtitle: "Sign in securely with your Google account to access the platform.",
    loginButton: "Continue with Google",
    loginPrivacy: "By continuing, you agree to the platform's",
    loginPrivacyLink: "Privacy Policy",
    loginPrivacyEnd: ".",
    recentUsers: "Recently joined students",
    onlineNow: "Currently learning online",
    platformDesc: "AI-powered medical education hub. Interactive clinical cases, diagnostics, and surgery simulators.",
    platformBadge: "Tashkent Medical Academy — Learning Hub",
    platformTitle: "Platform",
    selectRole: "Choose your role",
    studentPanel: "Go to Student Dashboard",
    studentDesc: "Quizzes, lessons, leaderboard & AI recommendations",
    teacherPanel: "Go to Teacher Panel",
    teacherDesc: "AI-powered exam creation, statistics & monitoring",
    logout: "Sign Out",
    loading: "Loading...",
    myResults: "My Results (Portfolio)",
    noResults: "You haven't taken any exams yet.",
    mastery: "Mastery",
    dashboard: "Home",
    back: "Back",
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
export const AppToolbar = () => {
  const { theme, lang, toggleTheme, toggleLang } = useApp();
  const isDark = theme === 'dark';

  const langs = [
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
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
