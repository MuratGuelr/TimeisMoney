import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { calculateTimeCost, formatCurrency } from '../utils/timeCalculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { useEarnings } from '../utils/useEarnings';

const Analytics = () => {
  const { transactions, userSettings, attendance, calculateTotalEarned } = useFinance();
  const { userProfile } = useAuth();
  const { instantEarnings } = useEarnings(userProfile, attendance);

  // Color Palette for Chart
  const CATEGORY_COLORS = {
    'Yeme-İçme': '#10B981', // Emerald - Food
    'Market': '#34D399', // Light Emerald - Groceries
    'Ulaşım': '#3B82F6', // Blue - Transport
    'Araç': '#60A5FA', // Light Blue - Car
    'Alışveriş': '#F59E0B', // Amber - Shopping
    'Konut': '#8B5CF6', // Purple - Housing
    'Faturalar': '#A78BFA', // Light Purple - Bills
    'Eğlence': '#EC4899', // Pink - Entertainment
    'Sağlık': '#EF4444', // Red - Health
    'Bakım': '#F472B6', // Light Pink - Personal
    'Finans': '#6366F1', // Indigo - Finance
    'Genel': '#6B7280', // Gray - General
    'Diğer': '#6B7280'
  };

  const DEFAULT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  // Group transactions by Category
  const groupedData = transactions.reduce((acc, t) => {
    // Fallback to 'Genel' if no category
    const key = t.category || 'Genel'; 
    if (!acc[key]) {
      acc[key] = { name: key, value: 0, color: CATEGORY_COLORS[key] || DEFAULT_COLORS[Object.keys(acc).length % DEFAULT_COLORS.length] };
    }
    acc[key].value += t.amount;
    return acc;
  }, {});

  const data = Object.values(groupedData).sort((a, b) => b.value - a.value);

  // Calculate Total Hours Worked for these expenses
  const totalSpent = data.reduce((sum, item) => sum + item.value, 0);
  
  // Dynamic Income: Past Earned Days + Today's Progress
  const pastEarned = calculateTotalEarned();
  const totalIncome = pastEarned + instantEarnings;
  const netBalance = totalIncome - totalSpent;

  const totalHoursWorked = userSettings.hourlyRate > 0 
      ? (totalSpent / userSettings.hourlyRate).toFixed(1) 
      : 0;

  return (
    <div className="min-h-screen bg-background text-white pb-32 pt-8 px-6">
      <h2 className="text-3xl font-black font-mono tracking-tighter mb-8 text-center uppercase">
        SİSTEM ANALİZİ
      </h2>

      {transactions.length === 0 ? (
         <div className="flex flex-col items-center justify-center h-64 opacity-30 font-mono">
            <span>[VERİ AKIŞI YOK]</span>
         </div>
      ) : (
        <>
            {/* FINANCIAL SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surfaceHighlight/30 border border-white/5 p-4 rounded-2xl text-center"
                >
                    <span className="block text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1">Toplam Kazanç</span>
                    <span className="text-sm font-bold text-white whitespace-nowrap">{formatCurrency(totalIncome)}</span>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-error/5 border border-error/10 p-4 rounded-2xl text-center"
                >
                    <span className="block text-[8px] text-error/60 font-bold uppercase tracking-widest mb-1">Harcama</span>
                    <span className="text-sm font-bold text-error whitespace-nowrap">-{formatCurrency(totalSpent)}</span>
                </motion.div>
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`p-4 rounded-2xl text-center border ${netBalance >= 0 ? 'bg-primary/5 border-primary/10' : 'bg-red-500/5 border-red-500/10'}`}
                >
                    <span className="block text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Net Kalan</span>
                    <span className={`text-sm font-bold whitespace-nowrap ${netBalance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {formatCurrency(netBalance)}
                    </span>
                </motion.div>
            </div>
            {/* HOLOGRAPHIC CHART */}
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full h-[320px] py-6"
            >
                {/* Background Grid for technical feel */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none rounded-2xl border border-white/5" />
                
                <div className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1500}
                        animationBegin={200}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.5)" />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '0px', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value) => formatCurrency(value)}
                    />
                    </PieChart>
                </ResponsiveContainer>
                </div>

                {/* Center Label HUD */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-gray-500 font-mono text-[10px] tracking-widest uppercase mb-1">ZAMAN MALİYETİ</span>
                    <motion.span 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-4xl font-mono font-bold text-white"
                    >
                        {parseInt(totalHoursWorked)}s
                    </motion.span>
                </div>
            </motion.div>

            {/* DATA BREAKDOWN LIST */}
            <div className="space-y-3 mt-8">
                {data.map((item, index) => (
                    <motion.div 
                        key={item.name} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-3 border-b border-white/5 font-mono group hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                             {/* Digital Marker */}
                             <div className="w-1 h-3" style={{ backgroundColor: item.color }}></div>
                             <div>
                                 <p className="text-white text-sm font-bold uppercase tracking-wider">{item.name}</p>
                                 <p className="text-[10px] text-gray-500">KATEGORİ {index + 1}</p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-white font-bold">{formatCurrency(item.value)}</p>
                             <p className="text-[10px] text-error">
                                 ⚠️ {calculateTimeCost(item.value, userSettings.hourlyRate)} MESAİ
                             </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
