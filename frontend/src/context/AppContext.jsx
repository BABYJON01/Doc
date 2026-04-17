import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

// ==================== TRANSLATIONS ====================
export const translations = {
  uz: {
    // Login page
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
    // Role selector
    selectRole: "O'z rolingizni tanlang",
    studentPanel: "Talaba Ekraniga O'tish",
    studentDesc: "Testlar, darslar, reyting va AI tavsiyalari",
    teacherPanel: "O'qituvchi Paneliga O'tish",
    teacherDesc: "AI orqali imtihon yaratish, statistika va nazorat",
    logout: "Chiqish",
    loading: "Yuklanmoqda...",
    // Student Dashboard
    myResults: "Mening Natijalarim (Portfolio)",
    noResults: "Hali hech qanday imtihon topshirmadingiz.",
    mastery: "O'zlashtirish",
    // Misc
    dashboard: "Bosh sahifa",
    back: "Orqaga",
  },
  ru: {
    // Login page
    loginTitle: "Добро пожаловать",
    loginSubtitle: "Войдите через аккаунт Google для безопасного доступа к платформе.",
    loginButton: "Продолжить через Google",
    loginPrivacy: "Продолжая, вы соглашаетесь с",
    loginPrivacyLink: "Политикой конфиденциальности",
    loginPrivacyEnd: "платформы.",
    recentUsers: "Последние вошедшие студенты",
    onlineNow: "Сейчас обучаются онлайн",
    platformDesc: "Медицинская образовательная база на основе искусственного интеллекта. Интерактивные клинические случаи, диагностика и симуляторы хирургии.",
    platformBadge: "Ташкентская медицинская академия — Учебная база",
    // Role selector
    selectRole: "Выберите свою роль",
    studentPanel: "Перейти в Кабинет Студента",
    studentDesc: "Тесты, уроки, рейтинг и рекомендации ИИ",
    teacherPanel: "Перейти в Панель Преподавателя",
    teacherDesc: "Генерация экзаменов через ИИ, статистика и контроль",
    logout: "Выйти",
    loading: "Загрузка...",
    // Student Dashboard
    myResults: "Мои Результаты (Портфолио)",
    noResults: "Вы ещё не прошли ни одного экзамена.",
    mastery: "Освоение",
    // Misc
    dashboard: "Главная",
    back: "Назад",
  }
};

export const AppProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('mz_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('mz_lang') || 'uz');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
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

// Floating toolbar component — shown on every page top-right
export const AppToolbar = () => {
  const { theme, lang, toggleTheme, toggleLang } = useApp();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
      {/* Language buttons */}
      <div className="flex items-center bg-slate-800/90 dark:bg-slate-800/90 light:bg-white/90 backdrop-blur-md rounded-xl border border-slate-600/50 light:border-slate-300 shadow-lg overflow-hidden">
        <button
          onClick={() => toggleLang('uz')}
          className={`px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            lang === 'uz'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700 light:hover:bg-slate-100 light:hover:text-slate-800'
          }`}
        >
          UZ
        </button>
        <div className="w-px h-5 bg-slate-600 light:bg-slate-300"></div>
        <button
          onClick={() => toggleLang('ru')}
          className={`px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
            lang === 'ru'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700 light:hover:bg-slate-100 light:hover:text-slate-800'
          }`}
        >
          RU
        </button>
      </div>

      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-xl bg-slate-800/90 light:bg-white/90 backdrop-blur-md border border-slate-600/50 light:border-slate-300 shadow-lg flex items-center justify-center text-slate-300 light:text-slate-700 hover:text-white light:hover:text-slate-900 hover:border-blue-500 transition-all duration-200"
        title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      >
        {theme === 'dark'
          ? <i className="fa-solid fa-sun text-yellow-400"></i>
          : <i className="fa-solid fa-moon text-blue-600"></i>}
      </button>
    </div>
  );
};

export default AppContext;
