import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, PieChart, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Anasayfa' },
    { path: '/calendar', icon: Calendar, label: 'Takvim' },
    { path: '/analysis', icon: PieChart, label: 'Analiz' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-lg border-t border-white/10 px-6 py-4 pb-6 z-50 flex justify-between items-center">
      {navItems.map((item) => (
        <motion.button
          key={item.path}
          onClick={() => navigate(item.path)}
          whileTap={{ scale: 0.9 }}
          className={`flex flex-col items-center gap-1 transition-colors duration-300 relative ${
            isActive(item.path) ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {isActive(item.path) && (
            <motion.div 
               layoutId="activeTab"
               className="absolute -top-2 w-8 h-1 bg-primary rounded-full"
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}

          <motion.div
            animate={{ 
              y: isActive(item.path) ? -2 : 0,
              scale: isActive(item.path) ? 1.1 : 1
            }}
          >
            <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
          </motion.div>
          <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default BottomNav;
