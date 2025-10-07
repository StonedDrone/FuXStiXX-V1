import React from 'react';

export const WorkflowIcon: React.FC = () => (
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
    >
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
        <line x1="10" y1="6.5" x2="14" y2="6.5"></line>
        <line x1="17.5" y1="10" x2="17.5" y2="14"></line>
        <line x1="10" y1="17.5" x2="14" y2="17.5"></line>
        <line x1="6.5" y1="10" x2="6.5" y2="14"></line>
    </svg>
);