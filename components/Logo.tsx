import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} overflow-visible`}
      aria-hidden="true"
    >
      <g stroke="currentColor">
        {/* Outer Ring - Spins Slowly */}
        <g className="origin-center animate-spin-slow opacity-60" style={{ transformBox: 'fill-box' }}>
             <circle cx="50" cy="50" r="48" strokeWidth="0.3" opacity="0.5" strokeDasharray="2 6" />
             <circle cx="50" cy="50" r="44" strokeWidth="0.5" opacity="0.3" />
             {/* Cardinal Dots */}
             <circle cx="50" cy="2" r="1.5" fill="currentColor" opacity="0.8" />
             <circle cx="50" cy="98" r="1.5" fill="currentColor" opacity="0.8" />
             <circle cx="2" cy="50" r="1.5" fill="currentColor" opacity="0.8" />
             <circle cx="98" cy="50" r="1.5" fill="currentColor" opacity="0.8" />
        </g>
        
        {/* Middle Ring - Spins Reverse */}
        <g className="origin-center animate-spin-reverse-slow opacity-80" style={{ transformBox: 'fill-box' }}>
            <circle cx="50" cy="50" r="38" strokeWidth="0.6" opacity="0.6" />
            <path d="M50 15 L80 80 H20 Z" strokeWidth="0.3" opacity="0.4" />
            <path d="M50 85 L20 20 H80 Z" strokeWidth="0.3" opacity="0.4" />
        </g>
        
        {/* Inner Core - Breathes/Pulses STRONGLY with Golden Glow */}
        <g className="origin-center animate-pulse-slow text-mystic-gold" style={{ transformBox: 'fill-box' }}>
            {/* Diamond Shape */}
            <path d="M50 12 L88 50 L50 88 L12 50 Z" strokeWidth="1.2" fill="rgba(212, 175, 55, 0.1)" stroke="currentColor" opacity="0.9" />
            
            {/* Inner Square */}
            <rect x="36" y="36" width="28" height="28" strokeWidth="0.8" opacity="0.8" transform="rotate(45 50 50)" stroke="currentColor" />
            
            {/* Center Point - The Eye */}
            <circle cx="50" cy="50" r="4" fill="currentColor" />
        </g>
      </g>
    </svg>
  );
};