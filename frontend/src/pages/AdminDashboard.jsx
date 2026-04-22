import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import DashboardLayout from '../components/DashboardLayout';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const AdminDashboard = ({ user, onLogout }) => {
    const { theme } = useApp();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', experience: '', photo: null });
    const [uploading, setUploading] = useState(false);
    
    // Fetch teachers
    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "teachers"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const tList = [];
            snapshot.forEach(docSnap => {
                tList.push({ id: docSnap.id, ...docSnap.data() });
            });
            setTeachers(tList);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        if (teachers.length >= 14) {
            alert("Maksimal o'qituvchilar soniga yetildi (14/14)!");
            return;
        }
        
        setUploading(true);
        try {
            // Check if email already exists
            const qMatch = query(collection(db, "teachers"), where("email", "==", formData.email.toLowerCase().trim()));
            const snap = await getDocs(qMatch);
            if (!snap.empty) {
                alert("Bu Google pochta manzili allaqachon o'qituvchi sifatida ro'yxatdan o'tdi!");
                setUploading(false);
                return;
            }

            // 1. Photo handling using Base64 encoding to bypass Firebase Storage completely!
            let photoUrl = "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg";
            if (formData.photo) {
                // Check size (max 500KB)
                if (formData.photo.size > 500000) {
                    alert("Rasm hajmi juda katta (Maksimal 500 KB). Kichikroq rasm tanlang.");
                    setUploading(false);
                    return;
                }
                const convertToBase64 = (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (error) => reject(error);
                    });
                };
                photoUrl = await convertToBase64(formData.photo);
            }
            
            // 2. Save directly to Firestore (no manual Auth user required since they login via Google)
            await addDoc(collection(db, "teachers"), {
                name: formData.name,
                email: formData.email.toLowerCase().trim(),
                subject: formData.subject,
                experience: Number(formData.experience),
                uploadsCount: 0,
                testsCount: 0,
                createdAt: serverTimestamp(),
                photoURL: photoUrl
            });
            
            setShowAddModal(false);
            setFormData({ name: '', email: '', subject: '', experience: '', photo: null });
            fetchTeachers();
            alert("O'qituvchi ruxsatnomasi muvaffaqiyatli saqlandi!");
        } catch (error) {
            console.error("Error adding teacher:", error);
            alert("O'qituvchi qo'shishda xatolik yuz berdi. Konsolni tekshiring.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Rostdan ham ushbu o'qituvchini o'chirmoqchimisiz? Уlar tizimga boshqa kirolmaydilar!")) {
            try {
                await deleteDoc(doc(db, "teachers", id));
                fetchTeachers();
            } catch (error) {
                console.error("Error deleting teacher:", error);
            }
        }
    };

    const isDark = theme === 'dark';

    return (
        <DashboardLayout role="admin" user={user} onLogout={onLogout}>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className={`text-2xl sm:text-3xl font-black mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Boshqaruv Paneli
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Tizimdagi barcha o'qituvchilar va ma'lumotlar tahlili.</p>
                </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Jami O'qituvchilar</h3>
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <i className="fa-solid fa-users"></i>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{teachers.length}</span>
                        <span className="text-sm text-slate-500 mb-1">/ 14</span>
                    </div>
                    <div className="mt-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(teachers.length / 14) * 100}%` }}></div>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yuklangan Ma'ruzalar</h3>
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <i className="fa-solid fa-file-pdf"></i>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {teachers.reduce((sum, t) => sum + (t.uploadsCount || 0), 0)}
                        </span>
                    </div>
                </div>

                <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yaratilgan Testlar</h3>
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
                            <i className="fa-solid fa-list-check"></i>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {teachers.reduce((sum, t) => sum + (t.testsCount || 0), 0)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Teachers Table Header */}
            <div className={`p-6 rounded-2xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ro'yxatdan o'tgan O'qituvchilar</h2>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        disabled={teachers.length >= 14}
                        className={`px-4 py-2 font-bold text-sm rounded-lg flex items-center gap-2 transition-all 
                        ${teachers.length >= 14 ? 'bg-slate-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'}`}
                    >
                        <i className="fa-solid fa-plus"></i> Yangi Qo'shish
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className={`text-xs uppercase border-b ${isDark ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-200'}`}>
                            <tr>
                                <th className="py-4 px-4 font-bold">O'qituvchi</th>
                                <th className="py-4 px-4 font-bold">Mutaxassislik</th>
                                <th className="py-4 px-4 font-bold text-center">Ma'ruzalar</th>
                                <th className="py-4 px-4 font-bold text-center">Testlar</th>
                                <th className="py-4 px-4 font-bold text-right">Amal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">
                                        <i className="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i>
                                    </td>
                                </tr>
                            ) : teachers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className={`text-center py-10 italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                        Hech qanday o'qituvchi topilmadi.
                                    </td>
                                </tr>
                            ) : (
                                teachers.map(t => (
                                    <tr key={t.id} className={`border-b last:border-0 hover:bg-slate-500/5 transition-colors ${isDark ? 'border-slate-800/60 text-slate-300' : 'border-slate-100 text-slate-700'}`}>
                                        <td className="py-4 px-4 flex items-center gap-3">
                                            <img src={t.photoURL || "https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-slate-600" />
                                            <div>
                                                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</p>
                                                <p className="text-xs text-slate-500">{t.email}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                                {t.subject}
                                            </span>
                                            <p className="text-xs text-slate-500 mt-1">{t.experience} yillik tajriba</p>
                                        </td>
                                        <td className="py-4 px-4 text-center font-bold">{t.uploadsCount || 0}</td>
                                        <td className="py-4 px-4 text-center font-bold text-emerald-500">{t.testsCount || 0}</td>
                                        <td className="py-4 px-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(t.id)}
                                                className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-colors"
                                                title="Tizimdan O'chirish"
                                            >
                                                <i className="fa-solid fa-trash-can text-sm"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Teacher Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl animate-[fadeInUp_0.3s_ease-out] border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-center border-b pb-4 mb-4" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Yangi O'qituvchi</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500"><i className="fa-solid fa-xmark text-xl"></i></button>
                        </div>
                        <form onSubmit={handleAddTeacher} className="space-y-4">
                            <div>
                                <label className={`block text-xs font-bold mb-1 uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>To'liq Ismi (F.I.Sh)</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Dr. Alisher Vahobov" 
                                className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`} />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1 uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Google Email Manzili</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ustoz@gmail.com" 
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`} />
                                </div>
                            </div>
                            
                            <div>
                                <label className={`block text-xs font-bold mb-1 uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Profil Rasmi Yuklash (Kichik hajmda, Maks 500 KB)</label>
                                <input type="file" accept="image/*" onChange={e => setFormData({...formData, photo: e.target.files[0]})} 
                                className={`w-full px-4 py-2 rounded-lg border text-sm transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 file:bg-blue-600/20 file:text-blue-400' : 'bg-slate-50 border-slate-300 text-slate-700 file:bg-blue-50 file:text-blue-600'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1 uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Mutaxassisligi / Fan</label>
                                    <input required type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Xirurgiya" 
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`} />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1 uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tajriba (Yil)</label>
                                    <input required type="number" min="0" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} placeholder="5" 
                                    className={`w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'}`} />
                                </div>
                            </div>
                            <button type="submit" disabled={uploading} className={`w-full mt-4 flex justify-center items-center gap-2 ${uploading ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/25`}>
                                {uploading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Saqlash va Ruxsat berish"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AdminDashboard;
