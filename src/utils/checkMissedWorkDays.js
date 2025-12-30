/**
 * checkMissedWorkDays.js
 * 
 * Kullanıcı siteye girmediği günlerde bile iş bitiş saatine ulaşıldığında
 * otomatik olarak o günün kazancını net değere eklemek için attendance'ı günceller.
 */

import { format, eachDayOfInterval, isWeekend, parseISO, startOfDay, endOfDay } from 'date-fns';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Helper: Parse date from various formats (string, Firebase Timestamp, Date)
 */
const parseDate = (dateValue) => {
  if (!dateValue) return null;
  
  // Firebase Timestamp objesi
  if (dateValue.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // String format (ISO)
  if (typeof dateValue === 'string') {
    return parseISO(dateValue);
  }
  
  // Already a Date
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  return null;
};

/**
 * Kullanıcının çalışma günlerini kontrol eder ve kaçırılan günleri otomatik olarak işaretler
 * @param {Object} userProfile - Kullanıcı profili
 * @param {Object} currentAttendance - Mevcut attendance kaydı
 * @param {string} userId - Firebase user ID
 * @returns {Object} - Güncellenmiş attendance objesi
 */
export const checkAndUpdateMissedWorkDays = async (userProfile, currentAttendance = {}, userId) => {
  if (!userProfile || !userId) {
    return currentAttendance;
  }

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // Son kontrol tarihi veya profilin oluşturulma tarihi
    const lastCheckDate = parseDate(userData.lastAutoCheckDate) 
      || parseDate(userProfile.createdAt) 
      || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Varsayılan: 7 gün önce
    
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Eğer son kontrol bugünse, işlem yapma
    if (format(lastCheckDate, 'yyyy-MM-dd') === todayStr) {
      return currentAttendance;
    }

    // Çalışma saatlerini al
    let endStr = "17:00";
    if (userProfile.scheduleType === 'fixed') {
      endStr = userProfile.fixedEnd || "17:00";
    } else if (userProfile.scheduleType === 'rotating' && userProfile.shiftProfiles) {
      const activeShift = userProfile.shiftProfiles.find(p => p.id === userProfile.activeShiftId);
      if (activeShift) {
        endStr = activeShift.end;
      }
    }

    const [endH, endM] = endStr.split(':').map(Number);
    
    // Son kontrol tarihinden bugüne kadar olan günleri kontrol et
    // Son kontrol gününden bir gün sonrasından başla (o gün zaten kontrol edildi)
    const startDate = new Date(lastCheckDate);
    startDate.setDate(startDate.getDate() + 1);
    
    // Bugün hariç (eğer mesai bitmemişse)
    const endDate = new Date(today);
    
    // Eğer bugünün mesaisi henüz bitmediyse, bugünü kontrol etme
    // Bittiyse bugünü de listeye dahil et
    if (!isWorkDayCompleted(userProfile)) {
       endDate.setDate(endDate.getDate() - 1);
    }
    
    // Eğer başlangıç > bitiş ise kontrol edilecek gün yok
    if (startDate > endDate) {
      // Sadece lastAutoCheckDate'i güncelle
      await setDoc(userRef, { lastAutoCheckDate: todayStr }, { merge: true });
      return currentAttendance;
    }

    // Kontrol edilecek günleri al
    const daysToCheck = eachDayOfInterval({ start: startDate, end: endDate });
    
    let updatedAttendance = { ...currentAttendance };
    let hasChanges = false;
    let updatedDays = [];

    for (const day of daysToCheck) {
      const dateStr = format(day, 'yyyy-MM-dd');
      
      // Zaten işaretlenmişse atla
      if (updatedAttendance[dateStr]) {
        continue;
      }
      
      // Hafta sonu kontrolü (basit yaklaşım - Cumartesi ve Pazar)
      if (isWeekend(day)) {
        continue;
      }
      
      // Bu gün bir çalışma günüydü ve iş saati bitti
      // Otomatik olarak "worked" olarak işaretle
      updatedAttendance[dateStr] = 'worked';
      hasChanges = true;
      updatedDays.push(dateStr);
    }

    // Değişiklik varsa Firebase'e kaydet
    if (hasChanges) {
      await setDoc(userRef, { 
        attendanceLog: updatedAttendance,
        lastAutoCheckDate: todayStr 
      }, { merge: true });
      
      console.log(`[AutoAttendance] ${updatedDays.length} gün otomatik olarak işaretlendi:`, updatedDays);
    } else {
      // Sadece lastAutoCheckDate'i güncelle
      await setDoc(userRef, { lastAutoCheckDate: todayStr }, { merge: true });
    }

    return updatedAttendance;
  } catch (error) {
    console.error('[AutoAttendance] Hata:', error);
    return currentAttendance;
  }
};

/**
 * Bugünün iş saatinin bitip bitmediğini kontrol eder
 * @param {Object} userProfile - Kullanıcı profili
 * @returns {boolean} - İş saati bittiyse true
 */
export const isWorkDayCompleted = (userProfile) => {
  if (!userProfile) return false;
  
  const now = new Date();
  
  // Çalışma saatlerini al
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

  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  
  const startTimeVal = startH * 60 + startM;
  const endTimeVal = endH * 60 + endM;
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();
  
  // Gece yarısı kontrolü (Örn: 22:00 - 06:00)
  if (endTimeVal < startTimeVal) {
      // Eğer şu anki saat, bitiş saatinden büyükse (örn 07:00 > 06:00) 
      // VE başlangıç saatinden küçükse (örn 07:00 < 22:00)
      // O zaman o günkü (sabah biten) mesai bitmiştir.
      if (currentTimeVal >= endTimeVal && currentTimeVal < startTimeVal) {
          return true;
      }
      return false;
  }
  
  // Normal gündüz vardiyası
  return currentTimeVal >= endTimeVal;
};
