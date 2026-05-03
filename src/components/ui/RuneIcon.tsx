import React from 'react';

export type StatType = 'str' | 'end' | 'dex' | 'int' | 'wis' | 'user' | 'save' | 'trash' | 'magic' | 'shield' | 'crown' | 'amulet' | 'bracelet' | 'ring' | 'shirt' | 'cloak' | 'hand' | 'belt' | 'leg' | 'boot' | 'search' | 'trophy' | 'zap';

interface RuneIconProps {
  stat: StatType;
  color?: string;
  size?: number;
  className?: string;
}

const RuneIcon: React.FC<RuneIconProps> = ({ stat, color = "currentColor", size = 24, className = "" }) => {
  // SVG Paths for "Rune-like" icons
  const paths: Record<StatType, React.ReactNode> = {
    str: ( // Sword Rune
      <path d="M14.5 2L12 5L9.5 2L2 22H5L12 14L19 22H22L14.5 2ZM12 14V22" strokeWidth="0" />
    ),
    end: ( // Shield/Mountain Rune
      <path d="M12 2L4 7V12C4 17 12 22 12 22C12 22 20 17 20 12V7L12 2ZM12 6V18M6 12H18" strokeWidth="1.5" strokeLinecap="round" />
    ),
    dex: ( // Wind/Wing Rune
      <path d="M2 12C2 12 5 2 12 2C19 2 22 12 22 12C22 12 19 22 12 22C5 22 2 12 2 12ZM12 7C14 7 15 9 15 12" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    ),
    int: ( // Eye Rune
      <g>
         <path d="M2 12C2 12 6 4 12 4C18 4 22 12 22 12C22 12 18 20 12 20C6 20 2 12 2 12Z" fill="none" strokeWidth="1.5" />
         <circle cx="12" cy="12" r="3" />
      </g>
    ),
    wis: ( // Star/Owl Rune
      <path d="M12 2L14.5 9H22L16 13.5L18.5 21L12 16.5L5.5 21L8 13.5L2 9H9.5L12 2Z" strokeWidth="1" strokeLinejoin="round" />
    ),
    user: ( // Character/User Rune
      <path d="M12 2C14.21 2 16 3.79 16 6C16 8.21 14.21 10 12 10C9.79 10 8 8.21 8 6C8 3.79 9.79 2 12 2ZM12 12C16.42 12 20 15.58 20 20V22H4V20C4 15.58 7.58 12 12 12Z" strokeWidth="1" strokeLinejoin="round" />
    ),
    save: ( // Save/Stone Tablet Rune
      <path d="M19 21H5C3.89 21 3 20.1 3 19V5C3 3.9 3.89 3 5 3H16L21 8V19C21 20.1 20.1 21 19 21ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM15 5H5V9H15V5Z" strokeWidth="1" strokeLinejoin="round" />
    ),
    trash: ( // Trash/Shatter Rune
      <path d="M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    ),
    magic: ( // Magic/Flame Rune
      <path d="M12 2C12 2 19 7 19 13C19 17 16 20 12 20C8 20 5 17 5 13C5 7 12 2 12 2Z" fill="none" strokeWidth="2" strokeLinecap="round" />
    ),
    shield: ( // Shield/Defense Rune
      <path d="M12 2L4 5V11C4 16.19 7.41 21.05 12 22C16.59 21.05 20 16.19 20 11V5L12 2Z" fill="none" strokeWidth="2" strokeLinecap="round" />
    ),
    crown: <path d="M5 21L3 9L9 13L12 3L15 13L21 9L19 21H5Z" strokeWidth="1.5" strokeLinejoin="round" />,
    amulet: <path d="M12 2L15 8L22 9L17 14L18.5 21L12 18L5.5 21L7 14L2 9L9 8L12 2Z" strokeWidth="1.5" />,
    bracelet: <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="none" strokeWidth="2" />,
    ring: <circle cx="12" cy="12" r="8" fill="none" strokeWidth="3" />,
    shirt: <path d="M20.38 3.46L16 5V2H8V5L3.62 3.46L2 7.5L6 10V22H18V10L22 7.5L20.38 3.46Z" strokeWidth="1.5" />,
    cloak: <path d="M12 2L2 22H22L12 2Z" fill="none" strokeWidth="2" />,
    hand: <path d="M18 11V6C18 4.89543 17.1046 4 16 4C14.8954 4 14 4.89543 14 6V11M14 11V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V11M10 11V6C10 4.89543 9.10457 4 8 4C6.89543 4 6 4.89543 6 6V14C6 18.4183 9.58172 22 14 22C18.4183 22 22 18.4183 22 14V11H18Z" strokeWidth="1.5" fill="none" />,
    belt: <path d="M21 7H3V17H21V7ZM12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12C15 13.6569 13.6569 15 12 15Z" strokeWidth="1.5" />,
    leg: <path d="M6 2V22H18V2H6ZM12 2V22" strokeWidth="1.5" fill="none" />,
    boot: <path d="M4 16L4 21H20V16L12 12L4 16Z" strokeWidth="1.5" />,
    search: <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z M21 21L16.65 16.65" strokeWidth="2" strokeLinecap="round" fill="none" />,
    trophy: <path d="M6 9H4.5C3.67157 9 3 8.32843 3 7.5V6.5C3 5.67157 3.67157 5 4.5 5H6M18 9H19.5C20.3284 9 21 8.32843 21 7.5V6.5C21 5.67157 20.3284 5 19.5 5H18M12 17V21M8 21H16M17 5H7V13C7 15.2091 8.79086 17 11 17H13C15.2091 17 17 15.2091 17 13V5Z" strokeWidth="1.5" fill="none" />,
    zap: <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" strokeWidth="1.5" fill="none" />
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Glow Layer */}
      <svg 
        viewBox="0 0 24 24" 
        fill={color} 
        stroke={color} 
        className="absolute inset-0 blur-[2px] opacity-60"
        style={{ width: '100%', height: '100%' }}
      >
        {paths[stat]}
      </svg>
      
      {/* Main Layer */}
      <svg 
        viewBox="0 0 24 24" 
        fill={color} 
        stroke={color}
        className="relative z-10 drop-shadow-sm"
        style={{ width: '100%', height: '100%' }}
      >
        {paths[stat]}
      </svg>
    </div>
  );
};

export default RuneIcon;