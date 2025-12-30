import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useEarnings } from '../utils/useEarnings';
import { LogOut, User, DollarSign, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTurkishNumber, formatCurrency } from '../utils/timeCalculations';

import TransactionList from '../components/TransactionList';
import VoiceInput from '../components/VoiceInput';
import LiveTicker from '../components/LiveTicker';
import StatCard from '../components/StatCard';

const Dashboard = () => {
  const { userProfile, logout } = useAuth();
  const { transactions, attendance, calculateTotalEarned, updateAttendance } = useFinance();
  const { 
    instantEarnings, 
    progress, 
    dailySalary, 
    isWorking, 
    currentShift 
  } = useEarnings(userProfile, attendance);

  // Auto-save attendance when shift is done
  useEffect(() => {
      if (progress >= 100) {
          const todayStr = new Date().toLocaleDateString('en-CA');
          // Only update if not already marked (to avoid loops/writes)
          if (!attendance[todayStr]) {
              updateAttendance(todayStr, 'worked');
          }
      }
  }, [progress, attendance, updateAttendance]);

  // Calculate stats for cards
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalEarned = calculateTotalEarned() + instantEarnings;
  const netWorth = totalEarned - totalSpent;
  
  // Total hours could be derived from transactions' timeCost strings or recalculate
  const totalMinutesSpent = transactions.reduce((sum, t) => {
    // timeCost is usually "Xh Ym"
    const match = t.timeCost.match(/(\d+)s\s*(\d+)d/); // Assuming "Xs Yd" format based on prev logic
    // Actually calculateTimeCost returns string. Let's check timeCalculations.js
    return sum;
  }, 0);
  // Simpler: totalSpent / hourlyRate
  const totalHoursSpent = userProfile?.monthlySalary ? (totalSpent / (parseFloat(userProfile.monthlySalary) / parseInt(userProfile.workingDays || 22) / 8)).toFixed(1) : 0;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-background text-white pb-32 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

       {/* Header / HUD Top */}
       <header className="p-5 pt-5 flex justify-between items-start z-20 relative">
            <div>
                <motion.h1 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl font-mono font-black tracking-tighter text-white/90 leading-none"
                >
                    {timeStr}
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.2 }}
                    className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mt-1 ml-1"
                >
                    Sistem Aktif
                </motion.p>
            </div>
            <div className="flex gap-2">
                 <Link to="/profile" className="w-10 h-10 rounded-full bg-surfaceHighlight border border-white/5 flex items-center justify-center hover:border-primary/50 transition-colors group">
                    <User size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                 </Link>
                <button onClick={logout} className="w-10 h-10 rounded-full bg-surfaceHighlight border border-white/5 flex items-center justify-center hover:border-error/50 transition-colors group">
                    <LogOut size={18} className="text-gray-400 group-hover:text-error transition-colors" />
                </button>
            </div>
        </header>

        <main className="p-4 space-y-5 z-10 relative">
            {/* COCKPIT / ENGINE SECTION */}
            <section className="relative py-0">
                 <div className="relative flex flex-col items-center justify-center text-center">
                    
                    {/* Status Label */}
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-4 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border backdrop-blur-md ${isWorking ? 'bg-primary/10 border-primary text-primary animate-pulse-slow' : 'bg-surfaceHighlight border-white/10 text-gray-500'}`}
                    >
                        {isWorking ? '● Çalışılıyor' : '○ Beklemede'}
                    </motion.div>

                    {/* MAIN NUMBER */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        <motion.div 
                            animate={isWorking ? { 
                                y: [0, -4, 0],
                            } : {}}
                            transition={{ 
                                duration: 4, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            className="flex items-baseline justify-center font-mono font-black tracking-tighter text-5xl sm:text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl"
                        >
                             <LiveTicker value={instantEarnings} suffix="₺" />
                        </motion.div>
                        {/* Glow Effect behind number */}
                        {isWorking && (
                            <motion.div 
                                animate={{ opacity: [0.1, 0.3, 0.1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute inset-0 bg-primary/20 blur-3xl -z-10" 
                            />
                        )}
                    </motion.div>

                    {dailySalary > 0 ? (
                        <p className="text-concrete text-xs font-mono mt-2 flex items-center gap-2">
                            HEDEF: <span className="text-white font-bold">{dailySalary.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL</span>
                        </p>
                    ) : (
                         <Link to="/profile" className="text-red-400 text-xs font-mono mt-2 flex items-center gap-2 animate-pulse hover:text-red-300">
                            ⚠️ MAAŞ AYARLANMADI - DÜZENLE
                        </Link>
                    )}

                     {/* Progress Bar (Tactical) */}
                     <div className="w-full max-w-xs mt-8 h-2 bg-surfaceHighlight rounded-full overflow-hidden relative border border-white/5">
                        <motion.div 
                            className="h-full bg-primary relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear", duration: 1 }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white box-shadow-[0_0_10px_white]" />
                        </motion.div>
                     </div>
                     <div className="w-full max-w-xs flex justify-between text-[10px] font-mono text-gray-600 mt-2">
                         <span>{currentShift.start}</span>
                         <span>{Math.round(progress)}%</span>
                         <span>{currentShift.end}</span>
                     </div>
                 </div>
            </section>

            {/* STATS GRID */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard 
                    title="MESAİ MALİYETİ" 
                    value={`${totalHoursSpent}s`} 
                    icon={Clock} 
                    delay={0.2} 
                    type="neutral"
                />
                <StatCard 
                    title="NET DEĞER" 
                    value={formatCurrency(netWorth)} 
                    icon={DollarSign} 
                    delay={0.4} 
                    type={netWorth < 0 ? "warning" : "highlight"}
                />
            </div>
            
            {/* Brutalist Divider */}
            <div className="flex items-center gap-4 opacity-30 py-4">
                 <div className="h-[1px] bg-white flex-1" />
                 <span className="text-[10px] font-mono uppercase tracking-widest">KAYITLAR</span>
                 <div className="h-[1px] bg-white flex-1" />
            </div>

            <TransactionList />
        </main>
        

    </div>
  );
};

export default Dashboard;
