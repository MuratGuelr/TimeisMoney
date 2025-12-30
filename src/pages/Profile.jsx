import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { formatTurkishNumber, parseTurkishNumber } from '../utils/timeCalculations';

const Profile = () => {
    const { userProfile, setUserProfile, currentUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        monthlySalary: '',
        workingDays: 22,
        scheduleType: 'fixed',
        fixedStart: '',
        fixedEnd: '',
        shiftProfiles: [],
        activeShiftId: 1
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                monthlySalary: formatTurkishNumber(userProfile.monthlySalary) || '',
                workingDays: userProfile.workingDays || 22,
                scheduleType: userProfile.scheduleType || 'fixed',
                fixedStart: userProfile.fixedStart || '09:00',
                fixedEnd: userProfile.fixedEnd || '17:00',
                shiftProfiles: userProfile.shiftProfiles || [],
                activeShiftId: userProfile.activeShiftId || 1
            });
        }
    }, [userProfile]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                monthlySalary: parseTurkishNumber(formData.monthlySalary)
            };
            await updateDoc(doc(db, 'users', currentUser.uid), dataToSave);
            setUserProfile({ ...userProfile, ...dataToSave });
            navigate('/dashboard');
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-white p-6 pb-24">
            <header className="flex items-center gap-4 mb-8">
                <Link to="/dashboard" className="p-2 bg-surface rounded-full hover:bg-white/10 transition">
                    <ArrowLeft size={20} className="text-gray-300" />
                </Link>
                <h1 className="text-xl font-bold">Profil & Ayarlar</h1>
            </header>

            <div className="space-y-8">
                 {/* Google Account Info */}
                 <div className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-white/5">
                    <div className="relative">
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profile" className="w-16 h-16 rounded-full border-2 border-primary object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/50 text-primary font-bold text-2xl">
                                {currentUser?.displayName?.charAt(0) || "U"}
                            </div>
                        )}
                         <div className="absolute -bottom-1 -right-1 bg-[#4285F4] p-1 rounded-full border border-surface">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z"/></svg>
                         </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">{currentUser?.displayName || "Kullanıcı"}</h2>
                        <p className="text-sm text-gray-400 font-mono">{currentUser?.email}</p>
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#4285F4]/10 text-[#4285F4] text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[#4285F4]/20">
                            Google Hesabı Bağlı
                        </div>
                    </div>
                </div>

                {/* Financials */}
                <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Finansal Bilgiler</h2>
                    <div className="bg-surface rounded-2xl border border-white/5 p-4 space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Aylık Net Maaş (TL)</label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={formData.monthlySalary}
                                onChange={(e) => setFormData({...formData, monthlySalary: formatTurkishNumber(e.target.value)})}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-primary transition-colors outline-none"
                            />
                        </div>
                        <div>
                             <label className="block text-sm text-gray-400 mb-2">Çalışma Günleri / Ay</label>
                            <input  
                                type="number" 
                                value={formData.workingDays}
                                onChange={(e) => setFormData({...formData, workingDays: e.target.value})}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-primary transition-colors outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Schedule */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Çalışma Takvimi</h2>
                        <select 
                            value={formData.scheduleType}
                            onChange={(e) => setFormData({...formData, scheduleType: e.target.value})}
                            className="bg-surface border border-white/10 rounded-lg px-2 py-1 text-xs outline-none"
                        >
                            <option value="fixed">Sabit Saatler</option>
                            <option value="rotating">Vardiyalı</option>
                        </select>
                    </div>

                    <div className="bg-surface rounded-2xl border border-white/5 p-4 space-y-4">
                        {formData.scheduleType === 'fixed' ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">Başlangıç</label>
                                    <input  
                                        type="time" 
                                        value={formData.fixedStart}
                                        onChange={(e) => setFormData({...formData, fixedStart: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary transition-colors outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-2">Bitiş</label>
                                    <input  
                                        type="time" 
                                        value={formData.fixedEnd}
                                        onChange={(e) => setFormData({...formData, fixedEnd: e.target.value})}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-primary transition-colors outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-xs text-gray-500">Vardiya isimlerini ve saatlerini düzenleyebilir, aktif olanı seçebilirsiniz.</p>
                                {formData.shiftProfiles.map((shift, index) => (
                                    <div 
                                        key={shift.id} 
                                        className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
                                            formData.activeShiftId === shift.id 
                                            ? 'bg-primary/10 border-primary' 
                                            : 'bg-black/20 border-white/5 hover:bg-black/30'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <input 
                                                type="text"
                                                value={shift.name}
                                                onChange={(e) => {
                                                    const updated = formData.shiftProfiles.map(s => s.id === shift.id ? {...s, name: e.target.value} : s);
                                                    setFormData({...formData, shiftProfiles: updated});
                                                }}
                                                className="bg-transparent border-b border-transparent focus:border-white/20 outline-none text-white font-bold flex-1"
                                            />
                                            <div 
                                                onClick={() => setFormData({...formData, activeShiftId: shift.id})}
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${formData.activeShiftId === shift.id ? 'border-primary bg-primary' : 'border-white/20'}`}
                                            >
                                                {formData.activeShiftId === shift.id && <div className="w-2 h-2 rounded-full bg-background"></div>}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 uppercase">Başlangıç</label>
                                                <input 
                                                    type="time" 
                                                    value={shift.start}
                                                    onChange={(e) => {
                                                        const updated = formData.shiftProfiles.map(s => s.id === shift.id ? {...s, start: e.target.value} : s);
                                                        setFormData({...formData, shiftProfiles: updated});
                                                    }}
                                                    className="w-full bg-black/30 rounded-lg p-2 text-xs text-white border border-white/5"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 uppercase">Bitiş</label>
                                                <input 
                                                    type="time" 
                                                    value={shift.end}
                                                    onChange={(e) => {
                                                        const updated = formData.shiftProfiles.map(s => s.id === shift.id ? {...s, end: e.target.value} : s);
                                                        setFormData({...formData, shiftProfiles: updated});
                                                    }}
                                                    className="w-full bg-black/30 rounded-lg p-2 text-xs text-white border border-white/5"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={() => {
                                        const newId = Math.max(0, ...formData.shiftProfiles.map(s => s.id)) + 1;
                                        setFormData({
                                            ...formData, 
                                            shiftProfiles: [...formData.shiftProfiles, { id: newId, name: 'Yeni Vardiya', start: '00:00', end: '08:00' }]
                                        });
                                    }}
                                    className="w-full p-3 border border-dashed border-white/10 rounded-xl text-xs text-gray-500 hover:text-white hover:border-white/20 transition-all"
                                >
                                    + Vardiya Profili Ekle
                                </button>
                            </div>
                        )}
                    </div>
                </section>
                
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-emerald-400 text-background font-bold p-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                    <Save size={20} /> {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>
        </div>
    );
};

export default Profile;
