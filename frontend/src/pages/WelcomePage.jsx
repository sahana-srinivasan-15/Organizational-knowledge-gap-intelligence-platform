import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const WelcomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Compute display name
  const displayName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null) ||
    (user?.email ? user.email.split('@')[0] : 'Employee');

  // Role details for badge
  const roleLabel =
    user?.role === 'ADMIN'
      ? 'Platform Administrator'
      : user?.role === 'MANAGER'
      ? 'Engineering Manager'
      : user?.role === 'MENTOR'
      ? 'Technical Mentor'
      : 'Employee / Engineer';

  const badgeClass =
    user?.role === 'ADMIN'
      ? 'badge-admin'
      : user?.role === 'MANAGER'
      ? 'badge-manager'
      : user?.role === 'MENTOR'
      ? 'badge-mentor'
      : 'badge-employee';

  // Automatically navigate to dashboard after loading completes
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: '2rem 1.5rem',
        backgroundImage:
          'radial-gradient(ellipse at 50% 35%, rgba(79, 70, 229, 0.08), transparent 65%)',
        textAlign: 'center',
      }}
    >
      {/* Floating Monogram Icon (No Box) */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '4.75rem',
            height: '4.75rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '1.75rem',
            fontWeight: 800,
            boxShadow: '0 12px 28px -6px rgba(79, 70, 229, 0.35)',
            letterSpacing: '0.02em',
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Prominent Large Heading */}
      <h1
        style={{
          fontSize: '2.75rem',
          fontWeight: 800,
          marginBottom: '0.65rem',
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          maxWidth: '800px',
        }}
      >
        Welcome back, {displayName}!
      </h1>

      {/* Role Badge */}
      <div style={{ marginBottom: '3.75rem' }}>
        <span
          className={`badge ${badgeClass}`}
          style={{
            fontSize: '0.85rem',
            padding: '0.35rem 1rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {roleLabel}
        </span>
      </div>

      {/* Flowing Dots Left-to-Right (Larger Dots, Lower Position, Extended Travel Length) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <div
          className="dots-flow-container"
          role="status"
          aria-label="Loading your dashboard"
        >
          <span className="flowing-dot" />
          <span className="flowing-dot" />
          <span className="flowing-dot" />
          <span className="flowing-dot" />
          <span className="flowing-dot" />
        </div>

        {/* Clean Loading Caption */}
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.03em',
          }}
        >
          Loading your dashboard...
        </span>
      </div>
    </div>
  );
};

export default WelcomePage;
