interface OrnamentDividerProps {
  variant?: 'diamond' | 'triple' | 'rune' | 'wave';
}

const OrnamentDivider = ({ variant = 'diamond' }: OrnamentDividerProps) => {
  const center = {
    diamond: (
      <svg viewBox="0 0 24 24" className="w-3 h-3 text-amber-500/30" fill="currentColor">
        <path d="M12 2L22 12L12 22L2 12Z" />
      </svg>
    ),
    triple: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 8 8" className="w-1.5 h-1.5 text-amber-500/20" fill="currentColor">
          <path d="M4 0L8 4L4 8L0 4Z" />
        </svg>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-500/40" fill="currentColor">
          <path d="M12 2L22 12L12 22L2 12Z" />
        </svg>
        <svg viewBox="0 0 8 8" className="w-1.5 h-1.5 text-amber-500/20" fill="currentColor">
          <path d="M4 0L8 4L4 8L0 4Z" />
        </svg>
      </div>
    ),
    rune: (
      <svg viewBox="0 0 32 16" className="w-8 h-4 text-amber-500/30" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 8L16 2L24 8L16 14Z" />
        <circle cx="16" cy="8" r="2" fill="currentColor" />
      </svg>
    ),
    wave: (
      <svg viewBox="0 0 40 12" className="w-10 h-3 text-amber-500/25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 6C6 2 10 10 14 6C18 2 22 10 26 6C30 2 34 10 38 6" />
      </svg>
    ),
  };

  return (
    <div className="flex items-center gap-4 py-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-500/20" />
      {center[variant]}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-500/20" />
    </div>
  );
};

export default OrnamentDivider;
