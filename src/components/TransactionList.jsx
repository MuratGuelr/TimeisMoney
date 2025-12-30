import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatTurkishNumber, parseTurkishNumber, calculateTimeCost } from '../utils/timeCalculations';
import { Clock, Trash2, Edit2, X, Check } from 'lucide-react';

const TransactionList = () => {
  const { transactions, deleteTransaction, editTransaction, userSettings } = useFinance();
  const [editingId, setEditingId] = useState(null);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({ title: '', amount: '', category: '' });

  const handleEditClick = (t) => {
      setEditingId(t.id);
      setEditForm({ title: t.title, amount: formatTurkishNumber(t.amount), category: t.category || 'General' });
  };

  const handleSaveEdit = () => {
      if (!editForm.amount || !editForm.title) return;
      editTransaction(editingId, parseTurkishNumber(editForm.amount), editForm.title, editForm.category);
      setEditingId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
  };
  
  // Helper to get time cost dynamically
  const getTimeCost = (t) => {
      if (userSettings && userSettings.hourlyRate > 0) {
          // If we have a valid rate now, show the "current" cost
          // Import calculateTimeCost inside or assume it's imported at top
          // (It is imported in line 3: import { ..., calculateTimeCost } from ...)
          // Note: line 3 in original file does NOT import calculateTimeCost?
          // Let's create a local helper or fix imports. Checks show it's NOT imported in line 3.
          // We need to fix imports first. 
          // For now, I will add the logic assuming I fix imports in a previous step or here?
          // I will assume I need to calculate it manually here or use the imported one.
          // Wait, I need to check imports. Line 3: import { formatCurrency, formatTurkishNumber, parseTurkishNumber } from '../utils/timeCalculations';
          // It is missing calculateTimeCost.
          return calculateTimeCost(t.amount, userSettings.hourlyRate);
      }
      return t.timeCost || "0dk";
  };

  if (transactions.length === 0) {
    return (
        <div className="text-center py-10 opacity-40 font-mono text-sm">
            <p>[VERİ TESPİT EDİLEMEDİ]</p>
            <p className="text-[10px] mt-2 tracking-widest uppercase">Veri girmek için sesli komut başlatın</p>
        </div>
    );
  }

  return (
    <div className="pb-32 space-y-2">
        {transactions.map((t) => {
          const displayTimeCost = getTimeCost(t);
          
          return (
          <div key={t.id} className="relative group">
            {editingId === t.id ? (
                // Edit Mode (Brutalist Input)
                <div className="bg-surfaceHighlight border border-primary/50 p-4 flex gap-2 items-center animate-glitch">
                    <div className="flex-1 space-y-2">
                        <input 
                            type="text" 
                            value={editForm.title}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full bg-background text-white font-mono p-2 text-sm border border-white/10 focus:border-primary outline-none uppercase"
                            placeholder="BAŞLIK"
                            autoFocus
                        />
                         <input 
                            type="text" 
                            value={editForm.category}
                            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                            className="w-full bg-background text-xs text-secondary p-2 border border-white/5 focus:border-primary outline-none uppercase"
                            placeholder="KATEGORİ"
                        />
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: formatTurkishNumber(e.target.value)})}
                            className="w-full bg-background text-white font-mono p-2 text-sm border border-white/10 focus:border-primary outline-none"
                            placeholder="TUTAR"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                         <button onClick={handleSaveEdit} className="p-3 bg-primary text-black hover:bg-white transition-colors">
                            <Check size={16} strokeWidth={3} />
                         </button>
                         <button onClick={() => setEditingId(null)} className="p-3 bg-surface border border-white/10 text-gray-400 hover:text-white transition-colors">
                            <X size={16} />
                         </button>
                    </div>
                </div>
            ) : (
                // View Mode (Tactical Row)
                <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold font-sans tracking-wide uppercase text-sm sm:text-base">
                                {t.title}
                            </span>
                             {t.category && t.category !== 'General' && (
                                <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 border border-white/10 text-gray-500 uppercase tracking-wider">
                                    {t.category}
                                </span>
                            )}
                        </div>
                        
                        {/* WARNING BADGE */}
                         <div className="flex items-center gap-1 text-xs font-mono text-error/80 mt-0.5">
                            <span className="bg-error/10 border border-error/20 px-1 rounded-sm flex items-center gap-1">
                                ⚠️ {displayTimeCost} ÇALIŞMA
                            </span>
                             <span className="opacity-30 mx-1">|</span>
                             <span className="opacity-40">{formatDate(t.date)}</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-error font-mono font-bold text-lg tracking-tight">
                            -{formatCurrency(t.amount)}
                        </span>
                        
                        {/* Action Buttons (Visible on Hover/Focus) */}
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEditClick(t)} 
                                className="text-gray-500 hover:text-primary transition-colors"
                            >
                                <Edit2 size={14} />
                            </button>
                            <button 
                                onClick={() => deleteTransaction(t.id)} 
                                className="text-gray-500 hover:text-error transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )})}
    </div>
  );
};

export default TransactionList;
