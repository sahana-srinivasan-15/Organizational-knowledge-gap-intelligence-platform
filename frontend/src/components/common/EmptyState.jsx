import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Available',
  description = 'There are currently no items to display in this view.',
  actionLabel,
  onAction,
  style = {},
}) => {
  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 2rem',
        margin: '1rem 0',
        ...style,
      }}
    >
      <div
        style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          color: 'var(--accent-primary)',
        }}
      >
        <Icon size={28} />
      </div>
      <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', fontWeight: 600 }}>{title}</h4>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', marginBottom: actionLabel ? '1.5rem' : 0 }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: 'var(--accent-primary)',
            color: '#fff',
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
