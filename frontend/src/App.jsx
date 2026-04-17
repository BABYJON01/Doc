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

import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

// Refactored LoginSelector with Firebase Auth
const LoginSelector = ({ user }) => {
    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
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
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
            <div className="max-w-2xl w-full text-center">
                 <h1 className="text-4xl font-bold mb-4 uppercase tracking-widest"><i className="fa-solid fa-hospital text-blue-500 mr-3"></i> Tizimga Kirish</h1>
                 <p className="text-slate-400 mb-10">Google akkauntingiz orqali xavfsiz autorizatsiyadan o'ting</p>
                 
                 {!user ? (
                     <div className="bg-slate-800 p-10 rounded-2xl border border-slate-700 max-w-sm mx-auto shadow-2xl">
                         <i className="fa-brands fa-google text-6xl text-slate-300 mb-6 block"></i>
                         <h2 className="text-xl font-bold mb-6">Tibbiyot Bazasiga Kirish</h2>
                         <button onClick={handleGoogleLogin} className="w-full py-4 px-6 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-lg transition-colors flex items-center justify-center shadow-lg">
                             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 mr-3" alt="Google Logo"/>
                             Google orqali kirish
                         </button>
                     </div>
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

