import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

const VoiceOrb = ({ isListening, onClick }) => {
  return (
    <div className="flex items-center justify-center pointer-events-auto">
        <button
            onClick={onClick}
            className="group relative w-20 h-20 flex items-center justify-center focus:outline-none"
        >
            {/* Ambient Background Aura */}
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all duration-500" />
            
            {/* Core Orb */}
            <motion.div 
                 className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-colors duration-300 ${isListening ? 'bg-primary border-primary' : 'bg-surfaceHighlight/80 border-white/10 group-hover:border-primary/50'}`}
                 whileTap={{ scale: 0.9 }}
            >
                {/* IDLE STATE: Slow Pulse/Rotate */}
                {!isListening && (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border border-dashed border-white/20"
                    />
                )}

                {/* LISTENING STATE: Chaotic Waveform Simulation */}
                {isListening && (
                    <>
                        <motion.div 
                             className="absolute inset-[-10px] border-2 border-primary rounded-full opacity-50"
                             animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                             transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                         <motion.div 
                             className="absolute inset-[-20px] border border-primary/30 rounded-full opacity-30"
                             animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        />
                    </>
                )}

                <Mic 
                    className={`relative z-20 transition-colors duration-300 ${isListening ? 'text-surface' : 'text-gray-400 group-hover:text-primary'}`} 
                    size={28} 
                    strokeWidth={isListening ? 3 : 2}
                />
            </motion.div>
        </button>
    </div>
  );
};

export default VoiceOrb;
