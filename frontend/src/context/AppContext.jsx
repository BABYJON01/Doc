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
  }
};

export const AppProvider = ({ children }) => {
  // Default: light. If user saved something before — use that.
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

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
      {/* Language switcher */}
      <div
        className="flex items-center rounded-xl border overflow-hidden shadow-lg"
        style={{
          background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)',
          borderColor: isDark ? 'rgba(71,85,105,0.6)' : 'rgba(203,213,225,0.8)',
        }}
      >
        <button
          onClick={() => toggleLang('uz')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200"
          style={{
            background: lang === 'uz' ? '#2563eb' : 'transparent',
            color: lang === 'uz' ? '#fff' : (isDark ? '#94a3b8' : '#475569'),
          }}
        >
          UZ
        </button>
        <div style={{ width: 1, height: 20, background: isDark ? '#475569' : '#cbd5e1' }}></div>
        <button
          onClick={() => toggleLang('ru')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200"
          style={{
            background: lang === 'ru' ? '#2563eb' : 'transparent',
            color: lang === 'ru' ? '#fff' : (isDark ? '#94a3b8' : '#475569'),
          }}
        >
          RU
        </button>
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
        title={isDark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
      >
        <i className={isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
      </button>
    </div>
  );
};

export default AppContext;
