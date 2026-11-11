import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorAlert = ({ message = 'An error occurred while loading data.', onRetry, style = {} }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        color: '#fca5a5',
        margin: '1rem 0',
        gap: '1rem',
        ...style,
      }}
      role="alert"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <AlertCircle size={20} style={{ flexShrink: 0, color: 'var(--accent-danger)' }} />
        <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.2)',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
