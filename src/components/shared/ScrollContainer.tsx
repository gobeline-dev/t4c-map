import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

const ScrollContainer: React.FC<ScrollContainerProps> = ({ 
  children, 
  className = "", 
  containerClassName = "" 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100); // Small delay to ensure children are rendered
    window.addEventListener('resize', checkScroll);
    return () => {
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [children]);

  return (
    <div className={`relative group/scroll-nav min-w-0 ${containerClassName}`}>
      {/* Left Fade/Arrow */}
      <AnimatePresence>
        {showLeftArrow && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-0 top-0 bottom-0 w-8 z-20 pointer-events-none md:hidden flex items-center justify-start bg-gradient-to-r from-slate-900 to-transparent pl-0.5"
          >
            <ChevronLeft size={16} className="text-amber-500 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right Fade/Arrow */}
      <AnimatePresence>
        {showRightArrow && (
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-0 top-0 bottom-0 w-8 z-20 pointer-events-none md:hidden flex items-center justify-end bg-gradient-to-l from-slate-900 to-transparent pr-0.5"
          >
            <ChevronRight size={16} className="text-amber-500 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className={`overflow-x-auto no-scrollbar scroll-smooth ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default ScrollContainer;
