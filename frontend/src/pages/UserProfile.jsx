import React from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';

const UserProfile = ({ user, role, onLogout }) => {
    const { t, lang, theme } = useApp();
    
    return (
        <DashboardLayout role={role} user={user} onLogout={onLogout}>
            <div className="max-w-4xl mx-auto animate-[fadeInUp_0.4s_ease-out]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                        <i className="fa-solid fa-id-card"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{lang === 'ru' ? 'Профиль пользователя' : 'Foydalanuvchi profili'}</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {lang === 'ru' ? 'Ваши личные данные и настройки' : 'Shaxsiy ma\'lumotlar va sozlamalar'}
                        </p>
                    </div>
                </div>

                <div className={`rounded-3xl p-8 border shadow-2xl relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    
                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 mt-12">
                        <img 
                            src={user?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full border-4 border-slate-900 shadow-xl object-cover"
                        />
                        <div className="text-center sm:text-left mb-2">
                            <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user?.displayName || "Foydalanuvchi"}</h3>
                            <p className="text-indigo-400 font-bold tracking-widest uppercase text-sm mt-1">
                                {role === 'teacher' ? (lang === 'ru' ? 'ПРЕПОДАВАТЕЛЬ' : 'O\'QITUVCHI') : (role === 'admin' ? 'ADMIN' : (lang === 'ru' ? 'СТУДЕНТ' : 'TALABA'))}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Aloqa ma'lumotlari</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Elektron pochta</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{user?.email || "Kiritilmagan"}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Telefon raqam</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{user?.phoneNumber || "Kiritilmagan"}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Tizim holati</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Ro'yxatdan o'tgan sana</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Noma'lum"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Oxirgi kirish</p>
                                    <p className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "Noma'lum"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                        <button onClick={onLogout} className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/30 font-bold rounded-xl transition-all shadow-lg">
                            <i className="fa-solid fa-right-from-bracket mr-2"></i> Tizimdan chiqish
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default UserProfile;
