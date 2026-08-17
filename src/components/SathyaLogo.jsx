import React from 'react';

export default function SathyaLogo({ size = 56, className = '' }) {
  return (
    <div 
      className={`sathya-logo-wrapper ${className}`}
      style={{ 
        width: size, 
        height: size, 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden'
      }}
    >
      <img 
        src="/sathya_logo.png" 
        alt="SathyaAdmin Logo" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          display: 'block',
          borderRadius: '50%'
        }} 
      />
    </div>
  );
}
