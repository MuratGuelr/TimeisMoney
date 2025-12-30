import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, PieChart, User, Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import VoiceInput from './VoiceInput';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Split items for center mic placement
  const leftItems = [
    { path: '/dashboard', icon: Home, label: 'Anasayfa' },
    { path: '/calendar', icon: Calendar, label: 'Takvim' },
  ];
  
  const rightItems = [
    { path: '/analysis', icon: PieChart, label: 'Analiz' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  const renderNavItem = (item) => {
      const active = isActive(item.path);
      return (
        <motion.button
            layout="position"
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`
                relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all duration-300 shrink-0
                ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
        >
            <item.icon size={20} className={active ? "text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]" : ""} />
            {active && <motion.div layoutId="activeDot" className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_rgba(204,255,0,0.8)]" />}
        </motion.button>
      );
  };

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none flex justify-center">
      <div className="pointer-events-auto">
        <motion.div 
            layout 
            className="
                bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50
                flex items-center gap-1 px-2 py-2 rounded-2xl
            "
        >
            <div className="flex items-center gap-1">
                {/* Left Side */}
                {leftItems.map(renderNavItem)}

                {/* CENTER MIC BUTTON */}
                <div className="mx-2 shrink-0 relative z-20">
                        <VoiceInput>
                            <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }} 
                            className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center border border-primary/50 text-white relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-all duration-500" />
                                <Mic size={24} className="relative z-10 text-primary drop-shadow-[0_0_10px_rgba(204,255,0,0.6)]" />
                            </motion.div>
                        </VoiceInput>
                </div>

                {/* Right Side */}
                {rightItems.map(renderNavItem)}
            </div>
        </motion.div>
      </div>
    </div>
  );
};


export default BottomNav;
