import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const DashboardLayout = ({ children, role, user, onLogout }) => {
    const { theme } = useApp();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Derived styles based on theme
    const bgClass = theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
    const sidebarBg = theme === 'dark' ? 'bg-slate-900 border-r border-slate-800' : 'bg-white border-r border-slate-200 shadow-sm';
    const headerBg = theme === 'dark' ? 'bg-slate-900/80 border-b border-slate-800' : 'bg-white/80 border-b border-slate-200 shadow-sm';
    
    const adminMenu = [
        { name: 'Dashboard', icon: 'fa-solid fa-chart-pie', path: '/admin' },
        { name: 'O\'qituvchilar', icon: 'fa-solid fa-chalkboard-user', path: '/admin/teachers' },
        { name: 'Tizim Jurnali', icon: 'fa-solid fa-clipboard-list', path: '/admin/logs' },
    ];
    
    const teacherMenu = [
        { name: 'Dashboard', icon: 'fa-solid fa-house', path: '/teacher' },
        { name: 'Ma\'ruzalar', icon: 'fa-solid fa-folder-open', path: '/teacher/lectures' },
        { name: 'Testlar', icon: 'fa-solid fa-list-check', path: '/teacher/tests' },
        { name: 'Talabalar', icon: 'fa-solid fa-users', path: '/teacher/students' },
        { name: 'Profil', icon: 'fa-solid fa-user-doctor', path: '/teacher/profile' },
    ];
    
    const menu = role === 'admin' ? adminMenu : teacherMenu;
    
    const isActive = (path) => window.location.pathname === path;

    // Close notifications when clicking outside (simple hack)
    const toggleNotifications = () => setShowNotifications(!showNotifications);

    return (
        <div className={`flex h-screen overflow-hidden ${bgClass} font-sans transition-colors duration-300`}>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            
            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out ${sidebarBg} flex flex-col`}>
                <div className="p-6 flex items-center gap-3">
                    <img src="/assets/tma_logo.png" alt="Logo" className="w-10 h-10 drop-shadow-md" />
                    <div>
                        <h2 className="text-xl font-black tracking-tight" style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>Med-Zukkoo</h2>
                        <span className="text-[10px] uppercase font-bold tracking-widest text-blue-500">{role === 'admin' ? 'Super Admin' : 'O\'qituvchi'}</span>
                    </div>
                </div>
                
                <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
                    {menu.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => { window.location.href = item.path; }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold 
                            ${isActive(item.path) 
                                ? theme === 'dark' ? 'bg-blue-600/10 text-blue-400 font-bold' : 'bg-blue-50 text-blue-600 font-bold'
                                : theme === 'dark' ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                        >
                            <i className={`${item.icon} w-5 text-center ${isActive(item.path) ? 'text-blue-500' : 'opacity-70'}`}></i>
                            {item.name}
                        </button>
                    ))}
                </nav>
                
                <div className="p-4 border-t border-slate-700/30">
                    <button 
                        onClick={onLogout}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-colors font-bold text-sm
                        ${theme === 'dark' ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400' : 'bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600'}`}
                    >
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>Chiqish</span>
                    </button>
                </div>
            </aside>
            
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10 w-full">
                {/* Header */}
                <header className={`h-16 flex items-center justify-between px-6 backdrop-blur-md ${headerBg} sticky top-0 z-30`}>
                    <div className="flex items-center gap-3">
                        <button 
                            className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-lg ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <i className="fa-solid fa-bars"></i>
                        </button>
                        <h1 className="text-lg font-bold truncate hidden sm:block">
                            {menu.find(m => isActive(m.path))?.name || 'Dashboard'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 relative">
                        {/* Language switcher */}
                        <div className={`hidden sm:flex items-center rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
                            {['uz', 'ru', 'en'].map(l => (
                                <button
                                    key={l}
                                    onClick={() => window.localStorage.setItem('mz_lang', l) || window.location.reload()}
                                    className={`px-2 sm:px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${localStorage.getItem('mz_lang') === l || (!localStorage.getItem('mz_lang') && l === 'uz') ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200')}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => {
                                const newTheme = theme === 'dark' ? 'light' : 'dark';
                                window.localStorage.setItem('mz_theme', newTheme);
                                window.location.reload();
                            }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-yellow-500 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-blue-600 border border-slate-200'}`}
                        >
                            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>
                    
                        {/* Notifications */}
                        <div className="relative">
                            <button onClick={toggleNotifications} className={`p-2 w-9 h-9 flex items-center justify-center rounded-full relative cursor-pointer hidden sm:flex ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700' : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'}`}>
                                <i className="fa-regular fa-bell"></i>
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900"></span>
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                    <div className={`absolute right-0 mt-3 w-72 rounded-2xl shadow-2xl z-50 overflow-hidden border animate-[fadeInUp_0.2s_ease-out] ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                                        <div className={`p-4 border-b font-bold text-sm ${theme === 'dark' ? 'border-slate-800 text-white' : 'border-slate-100 text-slate-800'}`}>
                                            Bildirishnomalar <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">Yangi</span>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto">
                                            <div className={`p-4 border-b flex gap-3 hover:bg-slate-500/5 transition-colors cursor-pointer ${theme === 'dark' ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>
                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                                    <i className="fa-solid fa-file-pdf text-xs"></i>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold leading-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Yangi ma'ruza yuklandi</p>
                                                    <p className="text-[10px] mt-1 opacity-80">AI muvaffaqiyatli 15 ta test savolini ajratib oldi.</p>
                                                    <p className="text-[9px] text-emerald-500 font-bold mt-1">2 daqiqa oldin</p>
                                                </div>
                                            </div>
                                            
                                            <div className={`p-4 flex gap-3 hover:bg-slate-500/5 transition-colors cursor-pointer ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                                                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
                                                    <i className="fa-solid fa-users text-xs"></i>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold leading-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Yangi guruh ulandi</p>
                                                    <p className="text-[10px] mt-1 opacity-80">43 kishi Live Quiz oynasida sizni kutmoqda.</p>
                                                    <p className="text-[9px] text-blue-500 font-bold mt-1">Kecha</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`p-3 text-center text-xs font-bold cursor-pointer transition-colors ${theme === 'dark' ? 'bg-slate-800/50 hover:bg-slate-800 text-blue-400' : 'bg-slate-50 hover:bg-slate-100 text-blue-600'}`}>
                                            Barchasini o'qilgan deb belgilash
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-700/30">
                            <img 
                                src={user?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} 
                                alt="User" 
                                className="w-9 h-9 rounded-full border-2 border-emerald-500 object-cover" 
                            />
                            <div className="hidden md:block text-sm">
                                <p className="font-bold cursor-default" style={{ color: theme === 'dark' ? '#fff' : '#0f172a' }}>{user?.displayName?.split(' ')[0]}</p>
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-20">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
