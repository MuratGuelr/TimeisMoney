import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X, Clock, TrendingUp, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarView = () => {
  const { attendance, updateAttendance, userSettings } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeRate, setOvertimeRate] = useState(2); // Default 2x

  const [selectedStatus, setSelectedStatus] = useState(null);

  // Helper: Get attendance data for a date
  const getAttendanceData = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const data = attendance[dateStr];
    
    // Support both old string format and new object format
    if (typeof data === 'string') {
      return { status: data, overtimeHours: 0, overtimeRate: 1 };
    }
    return data || { status: null, overtimeHours: 0, overtimeRate: 1 };
  };

  // Status Colors
  const getStatusColor = (date) => {
    const { status } = getAttendanceData(date);

    if (status === 'absent') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (status === 'paid_leave') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (status === 'worked') return 'bg-green-500/20 text-green-400 border-green-500/30';
    
    return 'hover:bg-white/5 text-gray-400';
  };

  // Calculate day earnings including overtime
  const getDayEarnings = (date) => {
    const { status, overtimeHours: ot, overtimeRate: rate } = getAttendanceData(date);
    const dailySalary = userSettings.dailySalary || (userSettings.salary / (userSettings.workingDays || 22));
    const hourlyRate = dailySalary / (userSettings.workingHours || 8);
    
    if (status === 'worked' || status === 'paid_leave') {
      const baseEarnings = dailySalary;
      const overtimeEarnings = (ot || 0) * hourlyRate * (rate || 1);
      return { base: baseEarnings, overtime: overtimeEarnings, total: baseEarnings + overtimeEarnings };
    }
    return { base: 0, overtime: 0, total: 0 };
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  });
  
  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const handleDayClick = (date) => {
    setSelectedDate(date);
    const { status, overtimeHours: ot, overtimeRate: rate } = getAttendanceData(date);
    setSelectedStatus(status);
    setOvertimeHours(ot || 0);
    setOvertimeRate(rate || 2);
  };

  const handleStatusUpdate = () => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const attendanceData = {
        status: selectedStatus,
        overtimeHours: selectedStatus === 'worked' ? overtimeHours : 0,
        overtimeRate: selectedStatus === 'worked' ? overtimeRate : 1
      };
      updateAttendance(dateStr, attendanceData);
      setSelectedDate(null);
      setOvertimeHours(0);
      setOvertimeRate(2);
      setSelectedStatus(null);
    }
  };

  // Calculate monthly summary
  const getMonthSummary = () => {
    const monthDays = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });
    
    let workedDays = 0;
    let totalEarnings = 0;
    let totalOvertime = 0;
    let overtimeEarnings = 0;
    
    for (const day of monthDays) {
      const { status, overtimeHours: ot } = getAttendanceData(day);
      if (status === 'worked' || status === 'paid_leave') {
        workedDays++;
        const earnings = getDayEarnings(day);
        totalEarnings += earnings.total;
        if (ot > 0) {
          totalOvertime += ot;
          overtimeEarnings += earnings.overtime;
        }
      }
    }
    
    return { workedDays, totalEarnings, totalOvertime, overtimeEarnings };
  };

  const summary = getMonthSummary();

  return (
    <div className="min-h-screen bg-background p-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Katılım Takvimi</h1>
        <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-white/10">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-lg text-white">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white font-medium min-w-[100px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white/10 rounded-lg text-white">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Check size={16} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Çalışılan</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.workedDays} <span className="text-sm text-gray-400">gün</span></p>
        </div>
        
        <div className="bg-surface rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Clock size={16} className="text-orange-400" />
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">Mesai</span>
          </div>
          <p className="text-2xl font-bold text-white">{summary.totalOvertime} <span className="text-sm text-gray-400">saat</span></p>
          {summary.overtimeEarnings > 0 && (
            <p className="text-xs text-orange-400 mt-1">+{Math.round(summary.overtimeEarnings).toLocaleString('tr-TR')}₺</p>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-surface rounded-3xl p-4 border border-white/5 shadow-2xl">
        {/* Week Days */}
        <div className="grid grid-cols-7 mb-4">
          {weekDays.map(d => (
            <div key={d} className="text-center text-gray-500 text-xs font-bold uppercase tracking-wider py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((date, idx) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const { status, overtimeHours: ot } = getAttendanceData(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const earnings = getDayEarnings(date);
            
            return (
              <button
                key={idx}
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                  ${!isSameMonth(date, currentMonth) ? 'opacity-30' : 'opacity-100'}
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' : ''}
                  ${getStatusColor(date)}
                  ${isToday(date) ? 'border-2 border-primary/50' : 'border border-transparent'}
                `}
              >
                <span className={`text-xs font-medium ${isToday(date) ? 'text-primary' : ''}`}>
                  {format(date, 'd')}
                </span>
                
                {earnings.total > 0 && (
                  <span className="text-[7px] font-bold mt-0.5 text-white/60">
                    +{Math.round(earnings.total).toLocaleString('tr-TR')}₺
                  </span>
                )}
                
                {/* Overtime indicator */}
                {ot > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">{ot}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-400 text-xs">Çalışıldı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-400 text-xs">Gelmedi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-400 text-xs">Ücretli İzin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">+</span>
          </div>
          <span className="text-gray-400 text-xs">Mesai</span>
        </div>
      </div>

      {/* Edit Status Modal */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-surface border-t sm:border border-white/10 w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Günü Düzenle</span>
                  <h3 className="text-white font-bold text-xl capitalize">{format(selectedDate, 'EEEE, d MMMM', { locale: tr })}</h3>
                </div>
                <button onClick={() => setSelectedDate(null)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              {/* Status Options */}
              <div className="space-y-2 mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Durum</p>
                
                <button 
                  onClick={() => setSelectedStatus('worked')}
                  className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all ${selectedStatus === 'worked' ? 'bg-green-500/10 border-green-500 text-green-400 border' : 'bg-surfaceHighlight border-white/5 text-gray-400 border hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${selectedStatus === 'worked' ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className="font-bold">Çalışıldı</span>
                  </div>
                  {selectedStatus === 'worked' && <Check size={18} />}
                </button>
                
                <button 
                  onClick={() => setSelectedStatus('absent')}
                  className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all ${selectedStatus === 'absent' ? 'bg-red-500/10 border-red-500 text-red-400 border' : 'bg-surfaceHighlight border-white/5 text-gray-400 border hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${selectedStatus === 'absent' ? 'bg-red-500' : 'bg-gray-600'}`} />
                    <span className="font-bold">Gelmedi / Ücretsiz</span>
                  </div>
                  {selectedStatus === 'absent' && <Check size={18} />}
                </button>

                <button 
                  onClick={() => setSelectedStatus('paid_leave')}
                  className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all ${selectedStatus === 'paid_leave' ? 'bg-blue-500/10 border-blue-500 text-blue-400 border' : 'bg-surfaceHighlight border-white/5 text-gray-400 border hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${selectedStatus === 'paid_leave' ? 'bg-blue-500' : 'bg-gray-600'}`} />
                    <span className="font-bold">Ücretli İzin</span>
                  </div>
                  {selectedStatus === 'paid_leave' && <Check size={18} />}
                </button>
              </div>

              {/* Overtime Section (Only visible if Worked) */}
              {selectedStatus === 'worked' && (
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={18} className="text-orange-400" />
                      <span className="text-orange-400 font-bold">Mesai (Ekstra Çalışma)</span>
                    </div>
                    
                    {/* Overtime Hours */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-400 mb-2 block">Saat</label>
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map(h => (
                          <button
                            key={h}
                            onClick={() => setOvertimeHours(h)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                              overtimeHours === h 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Overtime Rate */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-400 mb-2 block">Çarpan (Normal saatlik ücretin kaç katı)</label>
                      <div className="flex gap-2">
                        {[1.5, 2, 2.5, 3].map(r => (
                          <button
                            key={r}
                            onClick={() => setOvertimeRate(r)}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                              overtimeRate === r 
                                ? 'bg-orange-500 text-white' 
                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                          >
                            {r}x
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Overtime Preview */}
                    {overtimeHours > 0 && (
                      <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-400">Mesai Kazancı:</span>
                        <span className="text-orange-400 font-bold">
                          +{Math.round((userSettings.dailySalary / (userSettings.workingHours || 8)) * overtimeHours * overtimeRate).toLocaleString('tr-TR')}₺
                        </span>
                      </div>
                    )}
                  </div>
              )}
              
              <button
                onClick={handleStatusUpdate}
                className="w-full py-4 rounded-xl bg-primary text-background font-bold text-lg hover:opacity-90 transition-opacity"
              >
                KAYDET
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

};
export default CalendarView;

