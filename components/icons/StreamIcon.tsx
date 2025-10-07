import React from 'react';

export const StreamIcon: React.FC<{ className?: string; size?: number }> = ({ className, size = 16 }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z"></path>
        <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"></path>
        <path d="M20.94 11c.46.9.7 1.9.7 3 0 1.1-.24 2.1-.7 3"></path>
        <path d="M3.06 11A11.5 11.5 0 0 1 12 4.5c1.14 0 2.24.16 3.27.45"></path>
    </svg>
);