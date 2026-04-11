import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MedZukkooApp from './components/MedZukkooApp';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import QuizTaking from './pages/QuizTaking';

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

// Temporary Role Selection screen
const LoginSelector = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
        <div className="max-w-2xl w-full text-center">
             <h1 className="text-4xl font-bold mb-4 uppercase tracking-widest"><i className="fa-solid fa-hospital text-blue-500 mr-3"></i> Tizimga Kirish</h1>
             <p className="text-slate-400 mb-10">O'z rolingizni tanlab platformaga kiring</p>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <a href="/student" className="glass-card p-10 block border-t-4 border-emerald-500 hover:shadow-emerald-500/10">
                     <i className="fa-solid fa-user-graduate text-5xl text-emerald-500 mb-6 block"></i>
                     <h2 className="text-xl font-bold mb-2">Talaba Ekraniga O'tish</h2>
                     <p className="text-sm text-slate-400">Interaktiv o'qish, testlar va XP malaka.</p>
                 </a>
                 <a href="/teacher" className="glass-card p-10 block border-t-4 border-blue-500 hover:shadow-blue-500/10">
                     <i className="fa-solid fa-user-doctor text-5xl text-blue-500 mb-6 block"></i>
                     <h2 className="text-xl font-bold mb-2">O'qituvchi Paneliga O'tish</h2>
                     <p className="text-sm text-slate-400">Kurslar, Case'lar yaratish va nazorat.</p>
                 </a>
             </div>
        </div>
    </div>
);

const App = () => {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<LoginSelector />} />
                    <Route path="/student" element={<StudentDashboard onNavigate={(mode) => window.location.href = `/app?mode=${mode}`} />} />
                    <Route path="/teacher" element={<TeacherDashboard />} />
                    
                    <Route path="/test" element={<QuizTaking onFinish={() => window.location.href = '/student'} />} />
                    
                    {/* The original duel/solo mode entry matches /app */}
                    <Route path="/app" element={<MedZukkooApp />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
};

export default App;
