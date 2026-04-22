import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MedZukkooApp from './components/MedZukkooApp';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import QuizTaking from './pages/QuizTaking';
import Methodology from './pages/Methodology';
import { AppProvider, AppToolbar, useApp } from './context/AppContext';

import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc, getDocs, where, serverTimestamp } from 'firebase/firestore';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("UI CATCHED ERROR:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-10 font-sans text-slate-100">
          <div className="bg-slate-800 rounded-2xl p-8 border-l-4 border-red-500 shadow-xl max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Xatolik yuz berdi</h1>
            <p className="text-slate-400 mb-6">Ilovada kutilmagan to'qnashuv bo'ldi.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors font-medium">
                Qayta yuklash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoginSelector = ({ user, role }) => {
    const { t, theme, lang } = useApp();
    const [recentUsers, setRecentUsers] = useState([]);
    
    // Check if user is locked out from Teacher/Admin panels
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    
    // Login states
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "latest_users"), orderBy("lastLogin", "desc"), limit(3));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = [];
            snapshot.forEach(docSnap => users.push(docSnap.data()));
            setRecentUsers(users);
        }, () => {});
        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                await setDoc(doc(db, "latest_users", result.user.uid), {
                    displayName: result.user.displayName || "Talaba",
                    photoURL: result.user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
                    lastLogin: serverTimestamp()
                }, { merge: true });
            }
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Tizimga kirishda xatolik yuz berdi.");
        } finally {
            setIsLoggingIn(false);
        }
    };



    const handleLogout = async () => {
        try { await signOut(auth); } catch (error) { console.error("Logout Error:", error); }
    };

    const handleTeacherClick = () => {
        if (role === 'admin' || role === 'teacher') {
            window.location.href = '/teacher';
        } else {
            setShowAccessDenied(true);
            setTimeout(() => setShowAccessDenied(false), 5000);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-6 text-white font-sans">
            {!user ? (
                <>
                    <div className="absolute inset-0 bg-[url('/assets/tma_bg.jpg')] bg-cover bg-center bg-no-repeat opacity-100 pointer-events-none z-0"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-900/50 to-slate-900/20 pointer-events-none z-0"></div>
                </>
            ) : (
                <>
                    <div className="absolute inset-0 bg-[url('/assets/team.jpg')] bg-cover bg-center bg-no-repeat opacity-100 pointer-events-none z-0" style={{ filter: 'contrast(1.05) saturate(1.1)', imageRendering: '-webkit-optimize-contrast' }}></div>
                    <div className="absolute inset-0 bg-slate-950/40 pointer-events-none z-0"></div>
                </>
            )}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-700/20 blur-[120px] rounded-full pointer-events-none z-0"></div>

            <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20 relative z-10">
                 {!user ? (
                     <>
                        <div className="md:w-1/2 text-left animate-[fadeInLeft_0.8s_ease-out]">
                            <div className="mb-6 flex items-center gap-4">
                                <img src="/assets/tma_logo.png" alt="TMA Logo" className="w-20 h-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse" />
                                <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-[10px] uppercase font-bold tracking-widest">{t.platformBadge}</div>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-sm">Med-Zukkoo</span><br/>
                                <span className="text-white drop-shadow-md">{t.platformTitle}</span>
                            </h1>
                            <p className="text-slate-400 text-lg mb-10">{t.platformDesc}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-400 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 inline-flex">
                                <div className="flex -space-x-3">
                                    {recentUsers.length > 0 ? recentUsers.map((u, i) => <img key={i} className="w-10 h-10 object-cover rounded-full border-2 border-slate-900" src={u.photoURL}/>) : null}
                                </div>
                                <p>{t.recentUsers}<br/><span className="text-emerald-400 text-xs">Ayni damda onlayn...</span></p>
                            </div>
                        </div>

                        <div className="md:w-1/2 max-w-md animate-[fadeInRight_0.8s_ease-out_0.2s_both]">
                            <div className="bg-slate-900/60 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-700/50 shadow-2xl">
                                <div className="w-16 h-16 bg-slate-800/80 border border-slate-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg text-emerald-400 text-3xl">
                                    <i className="fa-solid fa-user-doctor"></i>
                                </div>
                                <h2 className="text-3xl font-bold mb-2">{t.loginTitle}</h2>
                                <p className="text-slate-400 text-sm mb-10">{t.loginSubtitleGoogle}</p>
                                
                                <button onClick={handleGoogleLogin} disabled={isLoggingIn} className="w-full py-4 bg-white hover:bg-slate-100 text-slate-800 flex items-center justify-center rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg hover:-translate-y-1">
                                    {isLoggingIn ? <i className="fa-solid fa-circle-notch fa-spin text-xl"></i> : (
                                        <>
                                            <svg className="w-6 h-6 mr-3" viewBox="0 0 48 48">
                                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                            </svg>
                                            Google orqali kirish
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                     </>
                 ) : (
                     <div className="w-full max-w-4xl mx-auto">
                         <div className="p-8 rounded-2xl shadow-2xl mb-8 flex items-center justify-between" style={{ background: theme==='dark' ? '#1e293b' : '#fff', border: `1px solid ${theme==='dark' ? '#334155' : '#e2e8f0'}` }}>
                            <div className="flex items-center gap-6">
                                <img src={user.photoURL} alt="User" className="w-20 h-20 rounded-full border-4 border-emerald-500" />
                                <div>
                                    <h2 className="text-2xl font-bold" style={{ color: theme==='dark' ? '#fff' : '#0f172a' }}>{user.displayName}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p style={{ color: theme==='dark' ? '#94a3b8' : '#64748b' }}>{user.email}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-widest ${role === 'admin' ? 'bg-purple-500/20 text-purple-400' : role === 'teacher' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                            {role === 'admin' ? 'Super Admin' : role === 'teacher' ? "O'qituvchi" : 'Talaba'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors">
                                <i className="fa-solid fa-right-from-bracket mr-2"></i> {t.logout}
                            </button>
                         </div>

                         {showAccessDenied && (
                             <div className="mb-6 p-4 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-400 flex items-center gap-3 animate-pulse">
                                 <i className="fa-solid fa-shield-halved text-2xl"></i>
                                 <div>
                                     <h4 className="font-bold">Kirish taqiqlangan!</h4>
                                     <p className="text-sm">Sizda O'qituvchilar paneliga kirish uchun ruxsat yo'q. Faqat admin tomonidan tasdiqlangan o'qituvchilar kira oladi.</p>
                                 </div>
                             </div>
                         )}



                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {role === 'admin' && (
                                <button onClick={() => window.location.href = '/admin'} className="p-8 block border-t-4 border-purple-500 text-left transition-all rounded-2xl shadow-xl hover:-translate-y-1" style={{ background: theme==='dark' ? 'rgba(30,41,59,0.7)' : '#fff' }}>
                                    <i className="fa-solid fa-shield-cat text-4xl text-purple-500 mb-4 block"></i>
                                    <h2 className="text-xl font-bold mb-2">Boshqaruv (Admin)</h2>
                                    <p className="text-sm opacity-70">O'qituvchilarni boshqarish va nazorat.</p>
                                </button>
                             )}
                             <button onClick={handleTeacherClick} className="p-8 block border-t-4 border-blue-500 text-left transition-all rounded-2xl shadow-xl hover:-translate-y-1" style={{ background: theme==='dark' ? 'rgba(30,41,59,0.7)' : '#fff' }}>
                                 <i className="fa-solid fa-chalkboard-teacher text-4xl text-blue-500 mb-4 block"></i>
                                 <h2 className="text-xl font-bold mb-2">{t.teacherPanel}</h2>
                                 <p className="text-sm opacity-70">{t.teacherDesc}</p>
                             </button>
                             <button onClick={() => window.location.href = '/student'} className="p-8 block border-t-4 border-emerald-500 text-left transition-all rounded-2xl shadow-xl hover:-translate-y-1" style={{ background: theme==='dark' ? 'rgba(30,41,59,0.7)' : '#fff' }}>
                                 <i className="fa-solid fa-user-graduate text-4xl text-emerald-500 mb-4 block"></i>
                                 <h2 className="text-xl font-bold mb-2">{t.studentPanel}</h2>
                                 <p className="text-sm opacity-70">{t.studentDesc}</p>
                             </button>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState('student'); // 'student', 'teacher', 'admin'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Determine Role
                const email = currentUser.email;
                if (email === 'rahmonjonwarrior@gmail.com') {
                    setRole('admin');
                } else {
                    // Check Firestore 'teachers' collection
                    try {
                        const q = query(collection(db, "teachers"), where("email", "==", email));
                        const snapshot = await getDocs(q);
                        if (!snapshot.empty) {
                            setRole('teacher');
                        } else {
                            setRole('student');
                        }
                    } catch (err) {
                        console.error('Role fetch error:', err);
                        setRole('student');
                    }
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <AppProvider>
                <BrowserRouter>
                    <AppToolbar />
                    <Routes>
                        <Route path="/" element={<LoginSelector user={user} role={role} />} />
                        
                        {/* Protected Routes */}
                        <Route path="/admin" element={(role === 'admin' && user) ? <AdminDashboard user={user} onLogout={() => signOut(auth)} /> : <Navigate to="/" replace />} />
                        <Route path="/teacher" element={((role === 'admin' || role === 'teacher') && user) ? <TeacherDashboard user={user} onLogout={() => signOut(auth)} /> : <Navigate to="/" replace />} />
                        <Route path="/student/*" element={user ? <StudentDashboard user={user} onLogout={() => signOut(auth)} /> : <Navigate to="/" replace />} />
                        <Route path="/test" element={user ? <QuizTaking user={user} onFinish={() => window.location.href = '/student'} /> : <Navigate to="/" replace />} />
                        
                        <Route path="/methodology" element={user ? <Methodology /> : <Navigate to="/" replace />} />
                        <Route path="/app" element={<MedZukkooApp />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </AppProvider>
        </ErrorBoundary>
    );
};

export default App;
