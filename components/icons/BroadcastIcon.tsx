
import React from 'react';

export const BroadcastIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
    >
        <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
        <path d="M2 12a9 9 0 0 1 8 8"></path>
        <path d="M2 16a5 5 0 0 1 4 4"></path>
        <circle cx="2" cy="20" r="1"></circle>
    </svg>
);
