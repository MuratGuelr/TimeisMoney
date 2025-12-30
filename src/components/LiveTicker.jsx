import { useRef, useEffect } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";

const LiveTicker = ({ value, prefix = "", suffix = "", className = "" }) => {
  const nodeRef = useRef();
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
      if (typeof latest !== 'number') return latest;
      return new Intl.NumberFormat('tr-TR', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
      }).format(latest);
  });

  useEffect(() => {
    // If value is NaN, just set to 0 to avoid errors
    const safeValue = isNaN(value) ? 0 : Number(value);
    
    // Animate from current 'count' value to new 'safeValue'
    // Duration depends on size of jump but cap it
    const duration = 1.5; 
    
    const controls = animate(count, safeValue, { 
        duration,
        ease: "circOut" 
    });

    return () => controls.stop();
  }, [value]);

  return (
    <span className={`inline-flex items-baseline ${className}`}>
        {prefix && <span className="mr-1 opacity-60 text-[0.6em]">{prefix}</span>}
        <motion.span>{rounded}</motion.span>
        {suffix && <span className="ml-1 opacity-60 text-[0.4em]">{suffix}</span>}
    </span>
  );
};

export default LiveTicker;
