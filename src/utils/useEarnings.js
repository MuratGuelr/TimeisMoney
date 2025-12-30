import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { parseTurkishNumber } from './timeCalculations';

export const useEarnings = (userProfile, attendance = {}) => {
  const [earnings, setEarnings] = useState({
    instantEarnings: 0,
    progress: 0,
    dailySalary: 0,
    currentShift: { start: '00:00', end: '00:00' },
    isWorking: false,
    formattedEarnings: "0.00",
  });

  useEffect(() => {
    if (!userProfile) return;

    const calculateEarnings = () => {
      const now = new Date();
      // Exceptions Check
      const dateStr = format(now, 'yyyy-MM-dd');
      const attendanceData = attendance[dateStr];
      
      // Support both old string format and new object format
      let status = null;
      if (typeof attendanceData === 'string') {
        status = attendanceData;
      } else if (attendanceData && typeof attendanceData === 'object') {
        status = attendanceData.status;
      }

      // Standard Daily Salary Calc
      const monthly = parseTurkishNumber(userProfile.monthlySalary);
      const days = parseInt(userProfile.workingDays || 22);
      const dailySalary = days > 0 ? monthly / days : 0;
      
      // Determine Shift Times
      let startStr = "09:00";
      let endStr = "17:00";

      if (userProfile.scheduleType === 'fixed') {
        startStr = userProfile.fixedStart || "09:00";
        endStr = userProfile.fixedEnd || "17:00";
      } else if (userProfile.scheduleType === 'rotating' && userProfile.shiftProfiles) {
        const activeShift = userProfile.shiftProfiles.find(p => p.id === userProfile.activeShiftId);
        if (activeShift) {
          startStr = activeShift.start;
          endStr = activeShift.end;
        }
      }

      // Handle Exceptions
      if (status === 'absent') {
          setEarnings({
            instantEarnings: 0,
            progress: 0,
            dailySalary: 0, 
            currentShift: { start: startStr, end: endStr },
            isWorking: false,
            formattedEarnings: "0.00"
          });
          return;
      }

      if (status === 'paid_leave' || status === 'worked') {
          // Calculate shift duration in hours for hourly rate
          // Use logic similar to FinanceContext
          let shiftDurationHours = 8; // default
          const [sH, sM] = startStr.split(':').map(Number);
          const [eH, eM] = endStr.split(':').map(Number);
          
          let sMin = sH * 60 + sM;
          let eMin = eH * 60 + eM;
          if (eMin < sMin) eMin += 1440;
          
          const durationMins = eMin - sMin;
          if (durationMins > 0) shiftDurationHours = durationMins / 60;

          const hourlyRate = dailySalary / shiftDurationHours;
          
          let overtimePay = 0;
          if (status === 'worked' && attendanceData && typeof attendanceData === 'object') {
              const otHours = attendanceData.overtimeHours || 0;
              const otRate = attendanceData.overtimeRate || 1;
              overtimePay = otHours * hourlyRate * otRate;
          }

          setEarnings({
            instantEarnings: dailySalary + overtimePay,
            progress: 100, 
            dailySalary,
            currentShift: { start: startStr, end: endStr },
            isWorking: false, 
            formattedEarnings: (dailySalary + overtimePay).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          });
          return;
      }

      // Normal Logic
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      // Convert Shift Times to Minutes
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      
      let startTimeInMinutes = startH * 60 + startM;
      let endTimeInMinutes = endH * 60 + endM;

      // Handle Midnight Crossing
      let isOvernight = false;
      if (endTimeInMinutes < startTimeInMinutes) {
        endTimeInMinutes += 1440;
        isOvernight = true;
      }
      
      let effectiveCurrentTime = currentTimeInMinutes;
      if (isOvernight) {
         if (currentTimeInMinutes < (endH * 60 + endM)) {
             effectiveCurrentTime += 1440;
         }
      }

      // User's Math Logic
      let instantEarnings = 0;
      let progress = 0;
      let isWorking = false;

      if (effectiveCurrentTime < startTimeInMinutes) {
        // Not started yet
        instantEarnings = 0;
        progress = 0;
        isWorking = false;
      } else if (effectiveCurrentTime >= endTimeInMinutes) {
        // Shift finished
        instantEarnings = dailySalary;
        progress = 100;
        isWorking = false;
      } else {
        // Working currently
        isWorking = true;
        const totalWorkMinutes = endTimeInMinutes - startTimeInMinutes;
        const workedMinutes = effectiveCurrentTime - startTimeInMinutes;
        
        if (totalWorkMinutes > 0) {
            progress = (workedMinutes / totalWorkMinutes);
            instantEarnings = dailySalary * progress;
            progress = progress * 100; // For percentage
        }
      }

      setEarnings({
        instantEarnings,
        progress: Math.min(Math.max(progress, 0), 100),
        dailySalary,
        currentShift: { start: startStr, end: endStr },
        isWorking,
        formattedEarnings: instantEarnings.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      });
    };

    calculateEarnings();
    const interval = setInterval(calculateEarnings, 1000);

    return () => clearInterval(interval);
  }, [userProfile, attendance]);

  return earnings;
};
