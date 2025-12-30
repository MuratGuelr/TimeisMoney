import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ArrowLeft, ArrowRight, Check, Clock, Calendar, DollarSign, Briefcase } from 'lucide-react';
import { formatCurrency, formatTurkishNumber, parseTurkishNumber } from '../utils/timeCalculations';

const Onboarding = () => {
  const { currentUser, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (userProfile?.profileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [userProfile, navigate]);

  // Form Data State
  const [formData, setFormData] = useState({
    monthlySalary: '',
    workingDays: 22,
    scheduleType: 'fixed', // 'fixed' | 'rotating'
    // Fixed Schedule
    fixedStart: '09:00',
    fixedEnd: '17:00',
    // Rotating Schedule
    shiftProfiles: [
       { id: 1, name: 'Sabah', start: '08:00', end: '16:00' },
       { id: 2, name: 'Akşam', start: '16:00', end: '00:00' }
    ],
    activeShiftId: 1
  });

  const updateProfile = (id, field, value) => {
    const updatedProfiles = formData.shiftProfiles.map(p => 
        p.id === id ? { ...p, [field]: value } : p
    );
    setFormData({ ...formData, shiftProfiles: updatedProfiles });
  };

  const addShiftProfile = () => {
      const newId = Math.max(...formData.shiftProfiles.map(p => p.id)) + 1;
      setFormData({
          ...formData,
          shiftProfiles: [...formData.shiftProfiles, { id: newId, name: 'Gece', start: '00:00', end: '08:00' }]
      });
  };

  const removeShiftProfile = (id) => {
      if (formData.shiftProfiles.length <= 1) return;
      setFormData({
          ...formData,
          shiftProfiles: formData.shiftProfiles.filter(p => p.id !== id),
          activeShiftId: formData.activeShiftId === id ? formData.shiftProfiles[0].id : formData.activeShiftId
      });
  };

  const calculateHourlyRate = () => {
    const salary = parseTurkishNumber(formData.monthlySalary);
    const dailySalary = salary / formData.workingDays;
    // Estimate hours based on fixed or active shift
    let dailyHours = 8;
    if (formData.scheduleType === 'fixed') {
        const start = parseInt(formData.fixedStart.split(':')[0]);
        const end = parseInt(formData.fixedEnd.split(':')[0]);
        dailyHours = end >= start ? end - start : (24 - start) + end;
    } else {
        const active = formData.shiftProfiles.find(p => p.id === formData.activeShiftId);
        if (active) {
            const start = parseInt(active.start.split(':')[0]);
            const end = parseInt(active.end.split(':')[0]);
            dailyHours = end >= start ? end - start : (24 - start) + end;
        }
    }
    return (dailySalary / dailyHours).toFixed(2);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
        const profileData = {
            monthlySalary: parseTurkishNumber(formData.monthlySalary),
            workingDays: parseInt(formData.workingDays),
            scheduleType: formData.scheduleType,
            fixedStart: formData.fixedStart,
            fixedEnd: formData.fixedEnd,
            shiftProfiles: formData.shiftProfiles,
            activeShiftId: formData.activeShiftId,
            profileComplete: true,
            createdAt: new Date().toISOString()
        };

        // Save to Firestore
        await setDoc(doc(db, 'users', currentUser.uid), profileData, { merge: true });
        
        // Update local context
        setUserProfile(profileData);
        
        navigate('/dashboard');
    } catch (error) {
        console.error("Error saving profile:", error);
    } finally {
        setLoading(false);
    }
  };

  // Step Components
  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold">Maaş Bilgileri</h2>
            <p className="text-gray-400">Dürüst olun. Bunu sadece siz görebilirsiniz.</p>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Aylık Net Maaş</label>
            <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₺</span>
                <input 
                    type="text" 
                    inputMode="decimal"
                    value={formData.monthlySalary}
                    onChange={(e) => setFormData({...formData, monthlySalary: formatTurkishNumber(e.target.value)})}
                    placeholder="25.000"
                    className="w-full bg-surface border border-white/10 rounded-xl p-4 pl-10 text-xl font-bold text-white focus:outline-none focus:border-primary transition-colors"
                    autoFocus
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Aylık Çalışma Günü</label>
            <div className="grid grid-cols-4 gap-2">
                {[20, 21, 22, 24, 26, 30].map(days => (
                    <button
                        key={days}
                        onClick={() => setFormData({...formData, workingDays: days})}
                        className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            formData.workingDays === days 
                            ? 'bg-primary border-primary text-background font-bold' 
                            : 'border-white/10 hover:bg-white/5'
                        }`}
                    >
                        {days}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
         <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                <Clock className="text-secondary" size={32} />
            </div>
            <h2 className="text-2xl font-bold">Çalışma Düzeni</h2>
            <p className="text-gray-400">Zamanınızı nasıl takip ediyorsunuz?</p>
        </div>

        <div className="flex bg-surface rounded-xl p-1 gap-1 mb-6">
            <button 
                onClick={() => setFormData({...formData, scheduleType: 'fixed'})}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    formData.scheduleType === 'fixed' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                }`}
            >
                Sabit Saatler
            </button>
             <button 
                onClick={() => setFormData({...formData, scheduleType: 'rotating'})}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    formData.scheduleType === 'rotating' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
                }`}
            >
                Vardiyalı
            </button>
        </div>

        {formData.scheduleType === 'fixed' ? (
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Başlangıç</label>
                    <input 
                        type="time" 
                        value={formData.fixedStart}
                        onChange={(e) => setFormData({...formData, fixedStart: e.target.value})}
                        className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white focus:border-secondary transition-colors"
                    />
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-400 mb-2">Bitiş</label>
                    <input 
                        type="time" 
                        value={formData.fixedEnd}
                        onChange={(e) => setFormData({...formData, fixedEnd: e.target.value})}
                        className="w-full bg-surface border border-white/10 rounded-xl p-4 text-white focus:border-secondary transition-colors"
                    />
                </div>
            </div>
        ) : (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-400">Vardiya Profilleri</label>
                     <button onClick={addShiftProfile} className="text-xs text-secondary hover:underline">+ Vardiya Ekle</button>
                </div>
                
                {formData.shiftProfiles.map((shift, index) => (
                    <div key={shift.id} className="bg-surface/50 border border-white/5 rounded-xl p-4 space-y-3 relative group">
                        <div className="flex gap-2">
                             <input 
                                type="text"
                                value={shift.name}
                                onChange={(e) => updateProfile(shift.id, 'name', e.target.value)}
                                className="flex-1 bg-transparent border-b border-transparent focus:border-white/20 outline-none text-white font-medium"
                             />
                             {formData.shiftProfiles.length > 1 && (
                                 <button onClick={() => removeShiftProfile(shift.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">Sil</button>
                             )}
                        </div>
                         <div className="grid grid-cols-2 gap-2">
                            <input 
                                type="time" 
                                value={shift.start}
                                onChange={(e) => updateProfile(shift.id, 'start', e.target.value)}
                                className="w-full bg-black/20 rounded p-2 text-sm text-gray-300"
                            />
                             <input 
                                type="time" 
                                value={shift.end}
                                onChange={(e) => updateProfile(shift.id, 'end', e.target.value)}
                                className="w-full bg-black/20 rounded p-2 text-sm text-gray-300"
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <input 
                                type="radio" 
                                name="activeShift" 
                                id={`shift-${shift.id}`}
                                checked={formData.activeShiftId === shift.id}
                                onChange={() => setFormData({...formData, activeShiftId: shift.id})}
                                className="accent-secondary"
                            />
                            <label htmlFor={`shift-${shift.id}`} className="text-xs text-gray-400 cursor-pointer select-none">Geçerli Aktif Vardiya</label>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );

  const renderStep3 = () => (
     <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                <Check className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold">Hazırsınız!</h2>
            <p className="text-gray-400">İşte kazanma potansiyeliniz.</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl p-6 border border-emerald-500/20 text-center">
            <span className="block text-sm text-emerald-400 font-medium uppercase tracking-wider mb-2">Tahmini Saatlik Ücret</span>
            <div className="text-5xl font-black text-white tracking-tight">
                {parseFloat(calculateHourlyRate()).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-2xl text-emerald-500">TL</span>
            </div>
        </div>

        <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between py-2 border-b border-white/5">
                <span>Aylık Maaş</span>
                <span className="text-white">{formData.monthlySalary} TL</span>
            </div>
             <div className="flex justify-between py-2 border-b border-white/5">
                <span>Çalışma Günü</span>
                <span className="text-white">{formData.workingDays} gün</span>
            </div>
             <div className="flex justify-between py-2 border-b border-white/5">
                <span>Günlük Maaş (Yaklaşık)</span>
                <span className="text-white">{(parseTurkishNumber(formData.monthlySalary) / formData.workingDays).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
            </div>
        </div>

     </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        {/* Progress Bar */}
        <div className="w-full max-w-md mb-8 flex gap-2">
            {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-primary' : 'bg-white/10'}`} />
            ))}
        </div>

        <div className="w-full max-w-md bg-surface border border-white/5 rounded-2xl p-6 md:p-8 shadow-2xl relative">
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStep1()}
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStep2()}
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStep3()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : null}
                    className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <ArrowLeft size={20} /> Geri
                </button>

                {step < 3 ? (
                     <button 
                        onClick={() => {
                            if (step === 1 && !formData.monthlySalary) return; // Simple validation
                            setStep(step + 1);
                        }}
                        className="bg-white text-background px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-all"
                    >
                        İleri <ArrowRight size={20} />
                    </button>
                ) : (
                    <button 
                        onClick={handleFinish}
                        disabled={loading}
                        className="bg-primary text-background px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/25"
                    >
                        {loading ? 'Kaydediliyor...' : 'Panele Başla'} <ArrowRight size={20} />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default Onboarding;
