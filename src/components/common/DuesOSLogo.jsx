import React from 'react';

/**
 * DuesOS Brand Logo Component
 * Reference: Screen 6779701571765549511
 * Golden dual-stroke geometric 'D' icon with 'DuesOS' wordmark
 */
export function DuesOSLogo({ 
  variant = 'light', // 'light' for dark navbars (white text), 'dark' for light backgrounds (dark text)
  size = 'md',        // 'sm', 'md', 'lg'
  showWordmark = true,
  className = '' 
}) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-base font-semibold',
    md: 'text-xl font-bold tracking-tight',
    lg: 'text-2xl font-bold tracking-tight'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric 'D' Ribbon Logo */}
      <svg 
        className={`${iconSizes[size]} flex-shrink-0`} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="duesGoldGradient" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FBBF24" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="duesInnerFlow" x1="12" y1="12" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FEF3C7" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        
        {/* Outer Ribbon Loop */}
        <path
          d="M8 8C8 5.79086 9.79086 4 12 4H20C28.8366 4 36 11.1634 36 20C36 28.8366 28.8366 36 20 36H12C9.79086 36 8 34.2091 8 32V8Z"
          stroke="url(#duesGoldGradient)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Inner Counter-Flow Ribbon forming 'D' core */}
        <path
          d="M16 14C16 12.8954 16.8954 12 18 12H20C24.4183 12 28 15.5817 28 20C28 24.4183 24.4183 28 20 28H18C16.8954 28 16 27.1046 16 26V14Z"
          fill="url(#duesInnerFlow)"
        />
        
        {/* Dynamic Forward Pulse Bar */}
        <circle cx="20" cy="20" r="2.5" fill="#151D1C" />
      </svg>

      {showWordmark && (
        <span className={`${textSizes[size]} ${variant === 'light' ? 'text-white' : 'text-on-background'} font-sans`}>
          Dues<span className="text-brand-gold">OS</span>
        </span>
      )}
    </div>
  );
}

export default DuesOSLogo;
