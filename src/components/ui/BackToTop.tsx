import { useState, useEffect } from 'react';
import type { RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

interface BackToTopProps {
  scrollRef: RefObject<HTMLDivElement>;
}

const BackToTop = ({ scrollRef }: BackToTopProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      setVisible(el.scrollTop > 400);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{
            opacity: { duration: 0.2 },
            scale: { duration: 0.2 },
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 glass-card rounded-xl border border-amber-500/20 text-amber-500 p-3 shadow-2xl hover:border-amber-500/50 hover:scale-110 active:scale-95 transition-all group"
          aria-label="Retour en haut"
        >
          <ChevronUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-xl border border-amber-500/10 animate-ping opacity-20 pointer-events-none" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
