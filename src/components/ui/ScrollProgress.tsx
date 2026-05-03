import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

interface ScrollProgressProps {
  scrollRef: RefObject<HTMLDivElement>;
}

const ScrollProgress = ({ scrollRef }: ScrollProgressProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setProgress(max > 0 ? (scrollTop / max) * 100 : 0);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef]);

  if (progress <= 0) return null;

  return (
    <div className="sticky top-0 z-30 h-[3px] w-full bg-transparent">
      {/* Main bar */}
      <div
        className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 transition-[width] duration-150 ease-out relative"
        style={{ width: `${progress}%` }}
      >
        {/* Glowing tip */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full blur-sm opacity-80" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
      </div>

      {/* Subtle glow under the bar */}
      <div
        className="h-1 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent blur-sm transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default ScrollProgress;
