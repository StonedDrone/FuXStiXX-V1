import React from 'react';

export const BatteryIcon: React.FC<{ className?: string, isCharging?: boolean }> = ({ className, isCharging }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={className}
    >
        <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
        <line x1="23" y1="13" x2="23" y2="11"></line>
        {isCharging && <polyline points="8 12 12 8 12 16 16 12"></polyline>}
    </svg>
);
