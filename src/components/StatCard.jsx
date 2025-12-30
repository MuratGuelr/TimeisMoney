import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, delay = 0, type = 'neutral' }) => {
    
    // Type-based styling
    const styles = {
        neutral: "border-white/5 bg-surfaceHighlight/30 text-gray-400",
        highlight: "border-primary/20 bg-primary/5 text-primary",
        warning: "border-error/20 bg-error/5 text-error"
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay * 0.1, ease: "backOut" }}
            className={`
                relative overflow-hidden rounded-2xl border p-6 flex flex-col items-center justify-center text-center group backdrop-blur-sm
                ${styles[type] || styles.neutral}
            `}
        >
             {/* Subtle Corner Markers (Industrial Look) */}
             <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-current opacity-50" />
             <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-current opacity-50" />

             {Icon && (
                 <div className="mb-3 opacity-80 group-hover:scale-110 transition-transform duration-300">
                     <Icon size={24} strokeWidth={1.5} />
                 </div>
             )}

             <span className="text-3xl font-mono font-bold tracking-tighter mb-1 text-white">{value}</span>
             <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-60">{title}</span>
        </motion.div>
    );
};

export default StatCard;
