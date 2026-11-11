import React from 'react';

export const StatCard = ({
  icon: Icon,
  title,
  value,
  subtext,
  badgeText,
  badgeType = 'default',
  accentColor = 'var(--accent-primary)',
}) => {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
        {Icon && (
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: 'var(--radius-md)',
              background: `rgba(99, 102, 241, 0.12)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {value}
        </span>
        {badgeText && (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              background:
                badgeType === 'success'
                  ? '#ecfdf5'
                  : badgeType === 'warning'
                  ? '#fef3c7'
                  : badgeType === 'danger'
                  ? '#fef2f2'
                  : '#eef2ff',
              border:
                badgeType === 'success'
                  ? '1px solid #a7f3d0'
                  : badgeType === 'warning'
                  ? '1px solid #fde68a'
                  : badgeType === 'danger'
                  ? '1px solid #fecaca'
                  : '1px solid #c7d2fe',
              color:
                badgeType === 'success'
                  ? '#065f46'
                  : badgeType === 'warning'
                  ? '#92400e'
                  : badgeType === 'danger'
                  ? '#991b1b'
                  : '#3730a3',
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtext && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{subtext}</p>}
    </div>
  );
};

export default StatCard;
