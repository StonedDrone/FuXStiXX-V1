import React from 'react';

export const DataTransferIcon: React.FC<{ className?: string }> = ({ className }) => (
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
        <rect x="4" y="4" width="4" height="4" rx="1" />
        <rect x="16" y="16" width="4" height="4" rx="1" />
        <rect x="4" y="16" width="4" height="4" rx="1" />
        <rect x="16" y="4" width="4" height="4" rx="1" />
        
        <path 
            d="M8 6h8M8 18h8M6 8v8M18 8v8" 
            strokeDasharray="4 2" 
            className="animate-data-stream" 
            strokeOpacity="0.6"
        />
        
        <circle cx="12" cy="12" r="1.5" fill="currentColor" className="animate-pulse" />
    </svg>
);