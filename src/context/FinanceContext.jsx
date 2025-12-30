import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { calculateHourlyRate, calculateTimeCost, parseTurkishNumber } from '../utils/timeCalculations';
import { useAuth } from './AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { checkAndUpdateMissedWorkDays } from '../utils/checkMissedWorkDays';

const FinanceContext = createContext();

export const useFinance = () => useContext(FinanceContext);

export const FinanceProvider = ({ children }) => {
  const { userProfile, currentUser } = useAuth();
  const missedDaysChecked = useRef(false);
  
  const [userSettings, setUserSettings] = useState(() => {
    const saved = localStorage.getItem('tim_settings');
    return saved ? JSON.parse(saved) : { salary: 0, workingDays: 5, workingHours: 8, hourlyRate: 0 };
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('tim_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (userProfile) {
        const monthly = parseTurkishNumber(userProfile.monthlySalary);
        const days = parseInt(userProfile.workingDays || 22);
        
        let dailyHours = 8;
        if (userProfile.scheduleType === 'fixed' && userProfile.fixedStart && userProfile.fixedEnd) {
             const start = parseInt(userProfile.fixedStart.split(':')[0]);
             const end = parseInt(userProfile.fixedEnd.split(':')[0]);
             dailyHours = end >= start ? end - start : (24 - start) + end;
        } else if (userProfile.scheduleType === 'rotating' && userProfile.shiftProfiles && userProfile.shiftProfiles.length > 0) {
             const shift = userProfile.shiftProfiles.find(p => p.id === userProfile.activeShiftId) || userProfile.shiftProfiles[0];
             const start = parseInt(shift.start.split(':')[0]);
             const end = parseInt(shift.end.split(':')[0]);
             dailyHours = end >= start ? end - start : (24 - start) + end;
        }

        const rate = (monthly / days / dailyHours) || 0;

        setUserSettings({
            salary: monthly,
            workingDays: days,
            workingHours: dailyHours,
            hourlyRate: rate,
            dailySalary: rate * dailyHours
        });

        if (userProfile.attendanceLog) {
          setAttendance(userProfile.attendanceLog);
        }
    }
  }, [userProfile]);

  // Otomatik olarak geçmiş çalışma günlerini kontrol et ve işaretle
  // Bu, kullanıcı siteye girmese bile kazancın net değere eklenmesini sağlar
  useEffect(() => {
    const checkMissedDays = async () => {
      if (!userProfile || !currentUser || missedDaysChecked.current) return;
      
      missedDaysChecked.current = true;
      
      try {
        const updatedAttendance = await checkAndUpdateMissedWorkDays(
          userProfile, 
          attendance, 
          currentUser.uid
        );
        
        // Eğer güncelleme varsa state'i güncelle
        if (updatedAttendance && Object.keys(updatedAttendance).length > Object.keys(attendance).length) {
          setAttendance(updatedAttendance);
          console.log('[AutoAttendance] Geçmiş günler tespit edildi ve güncellendi');
        }
      } catch (error) {
        console.error('[AutoAttendance] Geçmiş gün kontrolü hatası:', error);
      }
    };
    
    checkMissedDays();
  }, [userProfile, currentUser, attendance]);

  const calculateTotalEarned = () => {
    if (!userProfile) return 0;
    
    const monthlySalary = parseTurkishNumber(userProfile.monthlySalary);
    const workingDays = parseInt(userProfile.workingDays || 22);
    const dailySalary = (monthlySalary / workingDays) || 0;
    const hourlyRate = dailySalary / (userSettings.workingHours || 8);
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    let total = Object.entries(attendance || {}).reduce((acc, [date, data]) => {
      // Normally skip today for live calculation, but if it's already marked as worked/completed
      // and the live ticker might be reset (e.g. for next shift), we might want to count it here.
      // However, sticking to the rule: "LiveTicker handles Today".
      // If LiveTicker shows 100% (due to our other fix), then Total should NOT include it.
      if (date === todayStr) return acc;
      
      // Support both old string format and new object format
      let status, overtimeHours = 0, overtimeRate = 1;
      
      if (typeof data === 'string') {
        status = data;
      } else if (data && typeof data === 'object') {
        status = data.status;
        overtimeHours = data.overtimeHours || 0;
        overtimeRate = data.overtimeRate || 1;
      }
      
      if (status === 'worked' || status === 'paid_leave') {
        // Base daily salary
        let dayEarnings = dailySalary;
        
        // Add overtime earnings (hourlyRate * hours * multiplier)
        if (overtimeHours > 0) {
          dayEarnings += hourlyRate * overtimeHours * overtimeRate;
        }
        
        return acc + dayEarnings;
      }
      return acc;
    }, 0);

    return total;
  };

  useEffect(() => {
    localStorage.setItem('tim_settings', JSON.stringify(userSettings));
  }, [userSettings]);

  useEffect(() => {
    localStorage.setItem('tim_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const updateOnboarding = (salary, days, hours) => {
    const rate = calculateHourlyRate(salary, days, hours);
    setUserSettings({
      salary: parseTurkishNumber(salary),
      workingDays: parseInt(days),
      workingHours: parseInt(hours),
      hourlyRate: rate
    });
  };

  const addTransaction = (amount, title, category = 'General') => {
    const timeCost = calculateTimeCost(amount, userSettings.hourlyRate);
    const newTransaction = {
      id: Date.now(),
      amount: parseFloat(amount),
      title: title || 'General',
      category: category,
      date: new Date().toISOString(),
      timeCost
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const editTransaction = (id, newAmount, newTitle, newCategory) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const timeCost = calculateTimeCost(newAmount, userSettings.hourlyRate);
        return { 
            ...t, 
            amount: parseFloat(newAmount), 
            title: newTitle,
            category: newCategory || t.category || 'General',
            timeCost 
        };
      }
      return t;
    }));
  };

  const updateAttendance = async (dateStr, status) => {
    const newAttendance = { ...attendance, [dateStr]: status };
    setAttendance(newAttendance);

    if (currentUser) {
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, { attendanceLog: newAttendance }, { merge: true });
        } catch (error) {
            console.error("Error updating attendance:", error);
        }
    }
  };

  const value = {
    userSettings,
    transactions,
    attendance,
    updateOnboarding,
    addTransaction,
    deleteTransaction,
    editTransaction,
    updateAttendance,
    calculateTotalEarned
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
