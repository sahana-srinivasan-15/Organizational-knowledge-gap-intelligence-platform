import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BrainCircuit,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Briefcase,
  Award,
  Users2,
  CheckCircle2,
} from 'lucide-react';
import ErrorAlert from '../components/common/ErrorAlert';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preloadedEmail = new URLSearchParams(location.search).get('email');

  const [selectedRole, setSelectedRole] = useState('EMPLOYEE'); // 'EMPLOYEE' | 'MENTOR' | 'MANAGER' | 'ADMIN'
  const [email, setEmail] = useState(preloadedEmail || 'david.junior@orgkgi.dev');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();

  const isExpired = new URLSearchParams(location.search).get('expired') === 'true';

  // Role metadata and quick credentials options
  const roleConfigs = {
    EMPLOYEE: {
      title: 'Employee Workspace',
      description: 'Access your personalized learning roadmap, skill gap radar, and verified certificates.',
      icon: UserCheck,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      borderColor: '#C7D2FE',
      defaultEmail: 'david.junior@orgkgi.dev',
      presetAccounts: [
        { name: 'David Kim', email: 'david.junior@orgkgi.dev', title: 'Junior Backend Engineer' },
        { name: 'Maya Patel', email: 'maya.patel@orgkgi.dev', title: 'Frontend Engineer' },
        { name: 'Marcus Vance', email: 'marcus.vance@orgkgi.dev', title: 'Cloud Infrastructure Engineer' },
        { name: 'Priya Raman', email: 'priya.raman@orgkgi.dev', title: 'Graduate Engineer' },
      ],
    },
    MENTOR: {
      title: 'Mentor Hub',
      description: 'Guide assigned mentees, review weak areas, set milestone objectives, and host live interactive classes.',
      icon: Award,
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      borderColor: '#DDD6FE',
      defaultEmail: 'mentor.alex@orgkgi.dev',
      presetAccounts: [
        { name: 'Alex Morgan', email: 'mentor.alex@orgkgi.dev', title: 'Lead Engineering Mentor' },
        { name: 'David Kim (Verified Mentor)', email: 'david.junior@orgkgi.dev', title: 'Employee & Verified Domain Mentor' },
        { name: 'Priya Sharma', email: 'priya.sharma@orgkgi.dev', title: 'System Architecture Mentor' },
        { name: 'Liam Chen', email: 'liam.chen@orgkgi.dev', title: 'PostgreSQL & Docker Mentor' },
        { name: 'Elena Rostova', email: 'elena.ai@orgkgi.dev', title: 'AI & Data Science Mentor' },
        { name: 'Alex Morgan (Principal)', email: 'alex.senior@orgkgi.dev', title: 'Senior Principal Architect & Mentor' },
      ],
    },
    MANAGER: {
      title: 'Engineering Management',
      description: 'Review department readiness matrix, approve course requests, assign mentors, and provision employees.',
      icon: Briefcase,
      color: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      defaultEmail: 'manager.eng@orgkgi.dev',
      presetAccounts: [
        { name: 'Sarah Jenkins', email: 'manager.eng@orgkgi.dev', title: 'Engineering Department Manager' },
      ],
    },
    ADMIN: {
      title: 'Platform Administration',
      description: 'Manage user directory, RBAC authorization roles, curriculum catalog, and enterprise governance.',
      icon: ShieldCheck,
      color: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      defaultEmail: 'admin@orgkgi.dev',
      presetAccounts: [
        { name: 'Marcus Admin', email: 'admin@orgkgi.dev', title: 'System Administrator' },
      ],
    },
  };

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    const config = roleConfigs[roleKey];
    if (config) {
      setEmail(config.defaultEmail);
      setPassword('Password@123');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password, selectedRole);
      navigate('/welcome');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentConfig = roleConfigs[selectedRole] || roleConfigs.EMPLOYEE;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        padding: '2rem 1.5rem',
        backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(99, 102, 241, 0.12), transparent 70%)',
      }}
    >
      <div style={{ maxWidth: '520px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(99, 102, 241, 0.35)',
              marginBottom: '0.85rem',
            }}
          >
            <BrainCircuit size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em', color: '#0F172A' }}>
            Org Knowledge Gap Platform
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            Select your role and enter credentials to sign in
          </p>
        </div>

        {isExpired && (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorAlert message="Your session has expired. Please sign in again." />
          </div>
        )}

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <ErrorAlert message={error} />
          </div>
        )}

        {/* Card Form */}
        <div
          className="glass-card"
          style={{
            padding: '2rem',
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
            borderRadius: '1rem',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* 1. Enter Corporate Email */}
            <div>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
              >
                Corporate Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@orgkgi.dev"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem 0.7rem 2.4rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* 2. Password */}
            <div>
              <label
                htmlFor="password"
                style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
                />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem 0.7rem 2.4rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#ffffff',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* 3. Select Role */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.15rem' }}>
              <div style={{ marginBottom: '0.65rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Select Role
                </label>
              </div>

              {/* 4 Primary Role Selector Buttons - Unified Consistent Brand Color */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { id: 'EMPLOYEE', label: 'Employee', icon: UserCheck },
                  { id: 'MENTOR', label: 'Mentor', icon: Award },
                  { id: 'MANAGER', label: 'Manager', icon: Briefcase },
                  { id: 'ADMIN', label: 'Admin', icon: ShieldCheck },
                ].map((r) => {
                  const isSelected = selectedRole === r.id;
                  const RoleIcon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleRoleSelect(r.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        padding: '0.65rem 0.35rem',
                        borderRadius: '0.5rem',
                        border: isSelected ? '2px solid #4F46E5' : '1px solid #CBD5E1',
                        backgroundColor: isSelected ? '#EEF2FF' : '#ffffff',
                        color: isSelected ? '#4F46E5' : '#475569',
                        fontWeight: isSelected ? 700 : 600,
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.15)' : 'none',
                      }}
                    >
                      <RoleIcon size={18} color={isSelected ? '#4F46E5' : '#64748B'} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.8rem',
                borderRadius: '0.5rem',
                background: '#4F46E5',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.925rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                marginTop: '0.5rem',
                opacity: isSubmitting ? 0.7 : 1,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isSubmitting ? 'Authenticating...' : `Sign In to Portal (${selectedRole[0] + selectedRole.slice(1).toLowerCase()})`}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
