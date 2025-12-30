import { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { calculateDailyEarnings, calculateCurrentEarnings, formatCurrency } from '../utils/timeCalculations';

const DashboardCard = () => {
  const { userSettings, transactions } = useFinance();
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [progress, setProgress] = useState(0);

  const dailyEarnings = calculateDailyEarnings(userSettings.salary, userSettings.workingDays);

  useEffect(() => {
    const updateEarnings = () => {
      const earned = calculateCurrentEarnings(dailyEarnings, userSettings.workingHours);
      setCurrentEarnings(earned);
      
      const p = dailyEarnings > 0 ? (earned / dailyEarnings) * 100 : 0;
      setProgress(Math.min(p, 100));
    };

    updateEarnings();
    const interval = setInterval(updateEarnings, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [dailyEarnings, userSettings.workingHours]);

  // Calculate Remaining Budget (Crude: Salary - Total Transactions)
  // Ideally this should filter for "This Month"
  const totalSpent = transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = userSettings.salary - totalSpent; 

  return (
    <div className="space-y-6">
      {/* Dopamine Earnings Card */}
      <div className="bg-gradient-to-br from-surface to-surfaceHighlight p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        
        <h2 className="text-gray-400 font-medium mb-1 text-sm uppercase tracking-widest">Earnings Today</h2>
        <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-white tracking-tight">{formatCurrency(currentEarnings)}</span>
            <span className="text-sm text-gray-500 font-medium">/ {formatCurrency(dailyEarnings)}</span>
        </div>

        {/* Progress Bar */}
        <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden p-0.5">
            <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${progress}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse-slow"></div>
            </div>
        </div>
        <p className="text-xs text-center text-emerald-400 mt-2 font-medium">
             You're making money right now! 🚀
        </p>
      </div>

      {/* Remaining Budget Card */}
      <div className="bg-surface p-6 rounded-3xl border border-white/5 shadow-lg flex justify-between items-center">
        <div>
            <h2 className="text-gray-400 font-medium text-xs uppercase tracking-widest mb-1">Monthly Left</h2>
            <span className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-error' : 'text-white'}`}>
                {formatCurrency(remainingBudget)}
            </span>
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-surfaceHighlight border border-white/5`}>
            <span className="text-xl">💰</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
