import React from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';

const TeacherStudents = ({ user, onLogout }) => {
    const { lang } = useApp();
    const isDark = true;

    return (
        <DashboardLayout role="teacher" user={user} onLogout={onLogout}>
            <div className="max-w-5xl mx-auto animate-[fadeInUp_0.4s_ease-out]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                        <i className="fa-solid fa-users"></i>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{lang === 'ru' ? 'Список студентов' : 'Talabalar ro\'yxati'}</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            {lang === 'ru' 
                                ? 'Управление студентами и мониторинг их успеваемости.'
                                : 'Talabalarni boshqarish va ularning o\'zlashtirishini nazorat qilish.'}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-10 text-center border border-slate-700/50 shadow-xl max-w-2xl mx-auto mt-10">
                    <div className="mt-2 flex items-center justify-center gap-3 mb-2">
                        <i className="fa-solid fa-users-gear text-3xl text-indigo-500 drop-shadow-sm mb-2"></i>
                    </div>
                    <h3 className="text-xl font-black drop-shadow-sm text-white mb-2">
                        {lang === 'ru' ? 'Эта страница находится в разработке' : 'Ushbu sahifa tez kunda aktivlashadi'}
                    </h3>
                    <p className="text-slate-400">
                        {lang === 'ru' ? 'Скоро вы сможете видеть всю статистику ваших студентов здесь.' : 'Tez orada bu yerda o\'z talabalaringiz ro\'yxatini va ularning reytingini ko\'rishingiz mumkin bo\'ladi.'}
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeacherStudents;
