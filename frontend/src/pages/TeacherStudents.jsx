import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const TeacherStudents = ({ user, onLogout }) => {
    const { lang } = useApp();
    const isDark = true;
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // We will fetch all users from latest_users
        const q = query(collection(db, "latest_users"), orderBy("lastLogin", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersList = [];
            snapshot.forEach(docSnap => {
                usersList.push({ id: docSnap.id, ...docSnap.data() });
            });
            // Filter out the teacher themselves if we want, or admins
            // For now, let's just show everyone except maybe the current teacher
            setStudents(usersList.filter(u => u.id !== user?.uid && u.id !== 'yI5G0yZ8Bbd9yL1t3gS6i5bWqY12')); // excluding admin hardcode
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching students:", err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleToggleBlock = async (studentId, currentStatus, studentName) => {
        if (window.confirm(lang === 'ru' ? `Изменить статус доступа для ${studentName}?` : `${studentName} ning test yechish huquqini o'zgartirmoqchimisiz?`)) {
            try {
                await updateDoc(doc(db, "latest_users", studentId), {
                    isBlocked: !currentStatus
                });
            } catch (err) {
                console.error("Error updating block status", err);
                alert("Xatolik yuz berdi!");
            }
        }
    };

    const isOnline = (lastLogin) => {
        if (!lastLogin) return false;
        const now = new Date();
        const loginTime = lastLogin.toDate();
        const diffMinutes = (now - loginTime) / (1000 * 60);
        return diffMinutes <= 15; // Online if active in last 15 mins
    };

    const formatLastActive = (lastLogin) => {
        if (!lastLogin) return "Noma'lum";
        return lastLogin.toDate().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

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
                                ? 'Управление студентами, онлайн статус и доступ к тестам.'
                                : 'Talabalarni boshqarish, faollik nazorati va testlarga ruxsat berish.'}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-slate-700/50 shadow-xl mb-8">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4 flex justify-between items-center">
                        <span>
                            <i className="fa-solid fa-users-viewfinder text-indigo-500 mr-2"></i> 
                            {lang === 'ru' ? 'Все зарегистрированные пользователи' : 'Barcha ro\'yxatdan o\'tganlar'}
                        </span>
                        <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400 border border-slate-700">
                            Jami: {students.length}
                        </span>
                    </h3>
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center py-10">
                            <i className="fa-solid fa-circle-notch fa-spin text-3xl text-slate-500 mb-3"></i>
                            <p className="text-slate-400 text-sm">Talabalar yuklanmoqda...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700/50">
                            <i className="fa-regular fa-id-badge text-4xl text-slate-600 mb-3 block"></i>
                            <p className="text-slate-400 text-sm">Hali hech kim ro'yxatdan o'tmagan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                            {students.map((student) => {
                                const online = isOnline(student.lastLogin);
                                const blocked = student.isBlocked === true;
                                return (
                                    <div key={student.id} className={`bg-slate-800/50 border transition-all p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group ${blocked ? 'border-rose-500/30 hover:border-rose-500/60' : 'border-slate-700 hover:border-slate-500'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={student.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} alt="Avatar" className={`w-12 h-12 rounded-full border-2 object-cover ${online ? 'border-emerald-500' : 'border-slate-600'}`} />
                                                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-white text-base">{student.displayName || "Noma'lum"}</h4>
                                                    {blocked && <span className="bg-rose-500/10 text-rose-500 text-[9px] px-2 py-0.5 rounded uppercase font-black border border-rose-500/20">Bloklangan</span>}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                                    <span><i className="fa-solid fa-clock mr-1"></i> {online ? <span className="text-emerald-400 font-bold">Hozir Onlayn</span> : formatLastActive(student.lastLogin)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                                            <button 
                                                onClick={() => handleToggleBlock(student.id, blocked, student.displayName)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-lg ${
                                                    blocked 
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-500/25' 
                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white hover:shadow-rose-500/25'
                                                }`}
                                            >
                                                {blocked ? (
                                                    <><i className="fa-solid fa-unlock"></i> Ruxsat berish</>
                                                ) : (
                                                    <><i className="fa-solid fa-lock"></i> Bloklash (Test)</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TeacherStudents;
