import React from 'react';

export const LoadingSkeleton = ({ lines = 3, height = '1.5rem', width = '100%', style = {} }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', ...style }}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          style={{
            height,
            width: idx === lines - 1 && lines > 1 ? '60%' : width,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;
