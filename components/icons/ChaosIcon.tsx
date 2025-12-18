import React from 'react';

export const ChaosIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={`${className} animate-chaos-rot`}
    >
        <path 
            d="M12 12c2.5-4.5 7-4.5 7 0s-4.5 4.5-7 0-7-4.5-7 0 4.5 4.5 7 0" 
            strokeOpacity="0.8"
        />
        <path 
            d="M12 12c-2.5 4.5-7 4.5-7 0s4.5-4.5 7 0 7 4.5 7 0-4.5-4.5-7 0" 
            strokeOpacity="0.4"
            transform="rotate(45 12 12)"
        />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
);