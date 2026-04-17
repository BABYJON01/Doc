import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MedZukkooApp from './components/MedZukkooApp';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import QuizTaking from './pages/QuizTaking';
import Methodology from './pages/Methodology';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI CATCHED ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-10 font-sans text-slate-100">
          <div className="bg-slate-800 rounded-2xl p-8 border-l-4 border-red-500 shadow-xl max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Xatolik yuz berdi</h1>
            <p className="text-slate-400 mb-6">Ilovada kutilmagan to'qnashuv bo'ldi.</p>
            <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors font-medium">
                Qayta yuklash
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, limit, onSnapshot, setDoc, doc, serverTimestamp } from 'firebase/firestore';

// Refactored LoginSelector with Firebase Auth
const LoginSelector = ({ user }) => {
    const [recentUsers, setRecentUsers] = React.useState([]);

    React.useEffect(() => {
        const q = query(collection(db, "latest_users"), orderBy("lastLogin", "desc"), limit(3));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = [];
            snapshot.forEach(docSnap => users.push(docSnap.data()));
            setRecentUsers(users);
        }, (error) => {
            console.warn("Recent users fetching error:", error);
        });
        return () => unsubscribe();
    }, []);

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                // Update latest user for the live widget
                await setDoc(doc(db, "latest_users", result.user.uid), {
                    displayName: result.user.displayName || "Talaba",
                    photoURL: result.user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg",
                    lastLogin: serverTimestamp()
                }, { merge: true });
            }
            // After successful popup, the Auth Listener will automatically update 'user' state
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            alert("Tizimga kirishda xatolik yuz berdi. Qayta urinib ko'ring.");
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-6 text-white font-sans">
            
            {/* Background Image / Building */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none z-0"></div>
            {/* Background Ambient Effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950/95 pointer-events-none z-0"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

            <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20 relative z-10">
                 {!user ? (
                     <>
                        {/* Hero Text Construction */}
                        <div className="md:w-1/2 text-left animate-[fadeInLeft_0.8s_ease-out]">
                            <div className="mb-6 flex items-center gap-4">
                                <img src="/assets/tma_logo.png" alt="TMA Logo" className="w-20 h-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse" />
                                <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                    Toshkent Tibbiyot Akademiyasi <br/> O'quv Bazasi
                                </div>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight tracking-tight">
                                <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">Med-Zukkoo</span><br/>
                                <span className="text-white drop-shadow-md">Platformasi</span>
                            </h1>
                            <p className="text-slate-400 text-lg sm:text-xl mb-10 leading-relaxed max-w-lg font-light">
                                Sun'iy intellektga asoslangan kelajak tibbiyot o'quv bazasi. Interaktiv klinik holatlar, tashxislash va xirurgiya simulyatorlari.
                            </p>
                            <div className="flex items-center gap-4 text-sm text-slate-400 font-medium bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50 inline-flex">
                                <div className="flex -space-x-3">
                                    {recentUsers.length > 0 ? (
                                        recentUsers.map((u, i) => (
                                            <img key={i} className="w-10 h-10 object-cover rounded-full border-2 border-slate-900 drop-shadow-md" src={u.photoURL} alt={u.displayName} title={u.displayName}/>
                                        ))
                                    ) : (
                                        <>
                                            <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://i.pravatar.cc/100?img=11" alt="Student"/>
                                            <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://i.pravatar.cc/100?img=12" alt="Student"/>
                                            <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://i.pravatar.cc/100?img=13" alt="Student"/>
                                        </>
                                    )}
                                    <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-emerald-600 flex items-center justify-center text-[11px] font-bold text-white shadow-lg">+2.4k</div>
                                </div>
                                <p>Oxirgi kirgan talabalar<br/><span className="text-emerald-400 text-xs truncate max-w-[150px] inline-block">
                                    {recentUsers.length > 0 ? recentUsers.map(u => u.displayName.split(' ')[0]).join(', ') : "Ayni damda onlayn o'rganmoqda"}
                                </span></p>
                            </div>
                        </div>

                        {/* Login Card UI */}
                        <div className="md:w-1/2 w-full max-w-md animate-[fadeInRight_0.8s_ease-out_0.2s_both]">
                            <div className="bg-slate-900/60 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-blue-900/20 relative overflow-hidden group">
                                {/* Glass shine hover effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                                
                                <div className="w-16 h-16 bg-slate-800/80 border border-slate-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                    <i className="fa-solid fa-user-doctor text-3xl text-emerald-400"></i>
                                </div>
                                
                                <h2 className="text-3xl font-bold mb-2 tracking-tight text-white">Xush kelibsiz</h2>
                                <p className="text-slate-400 text-sm mb-10 font-medium">Boshlash uchun Google akkauntingiz orqali xavfsiz tizimga kiring.</p>
                                
                                <button onClick={handleGoogleLogin} className="w-full py-4 px-6 bg-white hover:bg-slate-100 transform hover:-translate-y-1 text-slate-800 rounded-xl font-black text-sm transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-white/10 uppercase tracking-widest relative overflow-hidden">
                                    <div className="absolute inset-0 bg-slate-200 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 mr-3 relative z-10" alt="Google Logo"/>
                                    <span className="relative z-10">Google orqali davom etish</span>
                                </button>

                                <div className="mt-8 text-center text-xs text-slate-500 font-medium">
                                    Davom etish orqali siz platformaning <br/><a href="#" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Maxfiylik Siyosati</a> ga rozi bo'lasiz.
                                </div>
                            </div>
                        </div>
                     </>
                 ) : (
                     <div>
                         <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-2xl mx-auto shadow-2xl mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <img src={user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} alt="User Profile" className="w-20 h-20 rounded-full border-4 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                                <div className="text-left">
                                    <h2 className="text-2xl font-bold">{user.displayName || "Foydalanuvchi"}</h2>
                                    <p className="text-slate-400">{user.email}</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-rose-900/50">
                                <i className="fa-solid fa-right-from-bracket mr-2"></i> Chiqish
                            </button>
                         </div>

                         <h3 className="text-xl font-bold text-slate-300 mb-6 uppercase tracking-widest border-b border-slate-700 pb-2">O'z rolingizni tanlang</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <button onClick={() => window.location.href = '/student'} className="glass-card p-10 block border-t-4 border-emerald-500 hover:shadow-emerald-500/10 text-left transition-all">
                                 <i className="fa-solid fa-user-graduate text-5xl text-emerald-500 mb-6 block"></i>
                                 <h2 className="text-xl font-bold mb-2">Talaba Ekraniga O'tish</h2>
                                 <p className="text-sm text-slate-400">Interaktiv o'qish, testlar va XP malaka.</p>
                             </button>
                             <button onClick={() => window.location.href = '/teacher'} className="glass-card p-10 block border-t-4 border-blue-500 hover:shadow-blue-500/10 text-left transition-all">
                                 <i className="fa-solid fa-user-doctor text-5xl text-blue-500 mb-6 block"></i>
                                 <h2 className="text-xl font-bold mb-2">O'qituvchi Paneliga O'tish</h2>
                                 <p className="text-sm text-slate-400">Kurslar, Case'lar yaratish va nazorat.</p>
                             </button>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Firebase auth listener — persists session across page reloads
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-sans">Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginSelector user={user} />} />

                    {/* Protected routes: redirect to login if not authenticated */}
                    <Route path="/student" element={user ? <StudentDashboard onNavigate={(mode) => window.location.href = `/app?mode=${mode}`} user={user} /> : <Navigate to="/" replace />} />
                    <Route path="/teacher" element={user ? <TeacherDashboard user={user} /> : <Navigate to="/" replace />} />
                    <Route path="/test" element={user ? <QuizTaking user={user} onFinish={() => window.location.href = '/student'} /> : <Navigate to="/" replace />} />
                    <Route path="/methodology" element={user ? <Methodology /> : <Navigate to="/" replace />} />


                    {/* The original duel/solo mode entry matches /app */}
                    <Route path="/app" element={<MedZukkooApp />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
};

export default App;

