import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrainCircuit, LogOut, User } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'badge-admin';
      case 'MANAGER':
        return 'badge-manager';
      case 'EMPLOYEE':
        return 'badge-employee';
      case 'MENTOR':
        return 'badge-mentor';
      default:
        return '';
    }
  };

  return (
    <header
      style={{
        height: '4.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '0 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Link
        to="/"
        title="Go to Home"
        style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', textDecoration: 'none', color: 'inherit' }}
      >
        <div
          style={{
            width: '2.4rem',
            height: '2.4rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(79, 70, 229, 0.25)',
          }}
        >
          <BrainCircuit size={20} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            Org Knowledge Gap Intelligence
          </h1>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
            Enterprise Competency &amp; Upskilling Platform
          </p>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user?.role && (
          <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '2.2rem',
              height: '2.2rem',
              borderRadius: 'var(--radius-full)',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
              border: '1px solid #c7d2fe',
            }}
          >
            <User size={16} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName || 'User'}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.825rem',
            fontWeight: 600,
          }}
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
