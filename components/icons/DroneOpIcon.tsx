import React from 'react';

export const DroneOpIcon: React.FC<{ className?: string }> = ({ className }) => (
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
        <path d="M12 2v20M2 12h20" strokeOpacity="0.3" />
        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2" />
        
        {/* Rotors */}
        <g className="animate-rotor-spin origin-center">
            <rect x="10" y="2" width="4" height="1" fill="currentColor" />
            <rect x="10" y="21" width="4" height="1" fill="currentColor" />
            <rect x="2" y="10" width="1" height="4" fill="currentColor" />
            <rect x="21" y="10" width="1" height="4" fill="currentColor" />
        </g>
        
        <path d="M7 7l10 10M7 17l10-10" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
);