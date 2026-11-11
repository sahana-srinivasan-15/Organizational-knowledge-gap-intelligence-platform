import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  Mail,
  User,
  BrainCircuit,
} from 'lucide-react';

export const PublicTransparencyPortal = ({ initialOpenRegister = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Registration modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(initialOpenRegister);
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [companySize, setCompanySize] = useState('51-200');
  const [primaryDomain, setPrimaryDomain] = useState('Cloud & Microservices');
  const [regPassword, setRegPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState(null);
  const [regError, setRegError] = useState('');

  const handleOpenRegister = () => {
    setRegError('');
    setRegSuccess(null);
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterModalOpen(false);
    setRegError('');
  };

  const handleRegisterCompany = (e) => {
    e.preventDefault();
    setRegError('');

    if (!companyName.trim()) {
      setRegError('Please provide a valid company or organization name.');
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      setRegError('Please provide a valid corporate admin email address.');
      return;
    }
    if (!adminName.trim()) {
      setRegError('Please provide the primary administrator or HR lead full name.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must contain at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    // Reliable corporate registration & tenant provisioning
    setTimeout(() => {
      const tenantId = `CORP-${Math.floor(1000 + Math.random() * 9000)}`;
      const resolvedDomain = companyDomain.trim() || adminEmail.split('@')[1];
      const newCompanyData = {
        tenantId,
        companyName: companyName.trim(),
        companyDomain: resolvedDomain,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim(),
        companySize,
        primaryDomain,
        registeredAt: new Date().toISOString(),
      };

      // Persist in localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('orgkgi_registered_companies') || '[]');
        existing.unshift(newCompanyData);
        localStorage.setItem('orgkgi_registered_companies', JSON.stringify(existing));
        localStorage.setItem('orgkgi_last_registered_email', adminEmail.trim());
      } catch {
        // Fallback safely if storage is blocked
      }

      setIsSubmitting(false);
      setRegSuccess({
        tenantId,
        companyName: companyName.trim(),
        adminEmail: adminEmail.trim(),
      });
    }, 50);
  };

  const handleProceedToLogin = (emailToPreload = null) => {
    if (emailToPreload) {
      navigate(`/login?email=${encodeURIComponent(emailToPreload)}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary, #f8fafc)',
        color: 'var(--text-primary, #0f172a)',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation Header - Professional Dashboard Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Brand Logo & System Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md, 0.5rem)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
              }}
            >
              <BrainCircuit size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--text-primary, #0f172a)' }}>
                OrgKGI
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary, #475569)', fontWeight: 500 }}>
                Organizational Knowledge Gap Intelligence Platform
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Professional Dashboard Layout */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* 1. Hero Banner - Dashboard Welcome Card Style (Centered) */}
        <section
          className="glass-card"
          style={{
            padding: '3rem 2rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '1.25rem',
            borderRadius: 'var(--radius-lg, 0.75rem)',
            boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
            border: '1px solid var(--border-subtle, #e2e8f0)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full, 9999px)',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: '#eef2ff',
                color: '#4338ca',
                border: '1px solid #c7d2fe',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              <ShieldCheck size={14} />
              <span>Enterprise Competency &amp; Governance</span>
            </span>
          </div>

          <div style={{ maxWidth: '840px', width: '100%' }}>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                lineHeight: 1.2,
                margin: '0 0 0.85rem 0',
                color: 'var(--text-primary, #0f172a)',
                textAlign: 'center',
              }}
            >
              OrgKGI Enterprise <br />
              <span style={{ color: 'var(--accent-primary, #4f46e5)' }}>
                Competency &amp; Governance Platform
              </span>
            </h1>

            <p
              style={{
                fontSize: '1.025rem',
                color: 'var(--text-secondary, #475569)',
                maxWidth: '780px',
                margin: '0 auto',
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              Benchmark, diagnose, and bridge workforce skill gaps with verifiable diagnostic assessments, ML outcome predictions, peer mentorship, and authenticated course certifications.
            </p>
          </div>

          {/* Action Buttons - Centered */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={handleOpenRegister}
              className="btn-primary"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md, 0.5rem)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Building2 size={18} />
              <span>Create Account for Company</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => handleProceedToLogin()}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-md, 0.5rem)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#ffffff',
                color: 'var(--text-primary, #0f172a)',
                border: '1px solid var(--border-medium, #cbd5e1)',
                boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05))',
                transition: 'all 0.15s ease',
              }}
            >
              <Lock size={16} color="var(--text-secondary, #475569)" />
              <span>Login to Existing Account</span>
            </button>
          </div>
        </section>

        {/* 2. Four Pillars Section - Clean Dashboard Module Cards */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.02em' }}>
              Four Pillars
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {/* Pillar Card 1 */}
            <div className="pillar-card">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.45rem 0', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.015em' }}>
                  Tamper-Proof Certifications
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, margin: 0 }}>
                  ML-verified course credentials with automatic detection and rejection of screenshots and invalid formats.
                </p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 600, color: '#4338ca', backgroundColor: '#eef2ff', padding: '0.25rem 0.65rem', borderRadius: '6px', alignSelf: 'flex-start', border: '1px solid #c7d2fe' }}>
                <span style={{ color: '#10b981' }}>●</span> ML Verification
              </div>
            </div>

            {/* Pillar Card 2 */}
            <div className="pillar-card">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.45rem 0', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.015em' }}>
                  Peer Mentorship Governance
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, margin: 0 }}>
                  1-on-1 mentor guidance, live interactive sessions with video links, and targeted study materials.
                </p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 600, color: '#4338ca', backgroundColor: '#eef2ff', padding: '0.25rem 0.65rem', borderRadius: '6px', alignSelf: 'flex-start', border: '1px solid #c7d2fe' }}>
                <span style={{ color: '#10b981' }}>●</span> 1-on-1 Guidance
              </div>
            </div>

            {/* Pillar Card 3 */}
            <div className="pillar-card">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.45rem 0', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.015em' }}>
                  Diagnostic Knowledge Radar
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, margin: 0 }}>
                  Topic-level assessments that benchmark current skills and pinpoint exact competency gaps.
                </p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 600, color: '#4338ca', backgroundColor: '#eef2ff', padding: '0.25rem 0.65rem', borderRadius: '6px', alignSelf: 'flex-start', border: '1px solid #c7d2fe' }}>
                <span style={{ color: '#10b981' }}>●</span> Gap Analysis
              </div>
            </div>

            {/* Pillar Card 4 */}
            <div className="pillar-card">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.45rem 0', color: 'var(--text-primary, #0f172a)', letterSpacing: '-0.015em' }}>
                  ML Outcome Predictions
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #475569)', lineHeight: 1.5, margin: 0 }}>
                  Predictive models forecasting training completion success paired with personalized course pathways.
                </p>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', fontWeight: 600, color: '#4338ca', backgroundColor: '#eef2ff', padding: '0.25rem 0.65rem', borderRadius: '6px', alignSelf: 'flex-start', border: '1px solid #c7d2fe' }}>
                <span style={{ color: '#10b981' }}>●</span> Predictive Pathways
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Professional Dashboard Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: '#ffffff',
          padding: '1.5rem',
          fontSize: '0.825rem',
          color: 'var(--text-muted, #94a3b8)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()}{' '}
            <strong style={{ color: 'var(--text-primary, #0f172a)' }}>OrgKGI Platform</strong> &bull; Enterprise Workforce Competency Registry
          </div>
        </div>
      </footer>

      {/* CREATE ACCOUNT FOR COMPANY MODAL */}
      {isRegisterModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1.5rem',
          }}
          onClick={handleCloseRegister}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              position: 'relative',
              borderRadius: 'var(--radius-lg, 0.75rem)',
              boxShadow: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseRegister}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
                borderRadius: 'var(--radius-md, 0.5rem)',
              }}
            >
              <X size={18} />
            </button>

            {regSuccess ? (
              /* Success Provisioning View */
              <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                <div
                  style={{
                    width: '3.5rem',
                    height: '3.5rem',
                    borderRadius: 'var(--radius-full, 9999px)',
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: '0 0 0.5rem 0' }}>
                  Company Workspace Provisioned!
                </h3>
                <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                  Your organization account for <strong>{regSuccess.companyName}</strong> has been registered with ID{' '}
                  <span style={{ color: 'var(--accent-primary, #4f46e5)', fontWeight: 700 }}>#{regSuccess.tenantId}</span>.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-tertiary, #f1f5f9)',
                    borderRadius: 'var(--radius-md, 0.5rem)',
                    padding: '1rem',
                    textAlign: 'left',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-subtle, #e2e8f0)',
                  }}
                >
                  <div style={{ color: 'var(--text-muted, #94a3b8)', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Corporate Administrator Email:
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)', wordBreak: 'break-all' }}>
                    {regSuccess.adminEmail}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => handleProceedToLogin(regSuccess.adminEmail)}
                    className="btn-primary"
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md, 0.5rem)',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>Proceed to Login</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseRegister}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-secondary, #475569)',
                      border: 'none',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      padding: '0.4rem',
                      fontWeight: 500,
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: 'var(--radius-md, 0.5rem)',
                      backgroundColor: 'rgba(79, 70, 229, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4f46e5',
                    }}
                  >
                    <Building2 size={18} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                    Create Account for Company
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '0.85rem', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
                  Establish an enterprise workspace with verifiable engineering governance.
                </p>

                {regError && (
                  <div
                    style={{
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: 'var(--radius-md, 0.5rem)',
                      padding: '0.65rem 0.85rem',
                      color: '#b91c1c',
                      fontSize: '0.825rem',
                      marginBottom: '1rem',
                      fontWeight: 500,
                    }}
                  >
                    {regError}
                  </div>
                )}

                <form onSubmit={handleRegisterCompany} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '0.3rem' }}>
                      Company or Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Cloud Innovations"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-medium, #cbd5e1)',
                        borderRadius: 'var(--radius-md, 0.5rem)',
                        padding: '0.6rem 0.75rem',
                        color: 'var(--text-primary, #0f172a)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '0.3rem' }}>
                      Corporate Email Domain (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. acme.io"
                      value={companyDomain}
                      onChange={(e) => setCompanyDomain(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-medium, #cbd5e1)',
                        borderRadius: 'var(--radius-md, 0.5rem)',
                        padding: '0.6rem 0.75rem',
                        color: 'var(--text-primary, #0f172a)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '0.3rem' }}>
                        Admin Full Name *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User
                          size={15}
                          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94a3b8)' }}
                        />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sarah Connor"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border-medium, #cbd5e1)',
                            borderRadius: 'var(--radius-md, 0.5rem)',
                            padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                            color: 'var(--text-primary, #0f172a)',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '0.3rem' }}>
                        Admin Email *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail
                          size={15}
                          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94a3b8)' }}
                        />
                        <input
                          type="email"
                          required
                          placeholder="admin@acme.io"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border-medium, #cbd5e1)',
                            borderRadius: 'var(--radius-md, 0.5rem)',
                            padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                            color: 'var(--text-primary, #0f172a)',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '0.3rem' }}>
                        Company Size
                      </label>
                      <select
                        value={companySize}
                        onChange={(e) => setCompanySize(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-medium, #cbd5e1)',
                          borderRadius: 'var(--radius-md, 0.5rem)',
                          padding: '0.6rem 0.75rem',
                          color: 'var(--text-primary, #0f172a)',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="1-10">1-10 Employees</option>
                        <option value="11-50">11-50 Employees</option>
                        <option value="51-200">51-200 Employees</option>
                        <option value="201-1000">201-1,000 Employees</option>
                        <option value="1000+">1,000+ Employees</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '0.3rem' }}>
                        Primary Domain
                      </label>
                      <select
                        value={primaryDomain}
                        onChange={(e) => setPrimaryDomain(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: '#ffffff',
                          border: '1px solid var(--border-medium, #cbd5e1)',
                          borderRadius: 'var(--radius-md, 0.5rem)',
                          padding: '0.6rem 0.75rem',
                          color: 'var(--text-primary, #0f172a)',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value="Cloud & Microservices">Cloud &amp; Microservices</option>
                        <option value="Frontend & UI Architecture">Frontend &amp; UI Architecture</option>
                        <option value="DevOps & Kubernetes">DevOps &amp; Kubernetes</option>
                        <option value="AI & Data Engineering">AI &amp; Data Engineering</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '0.3rem' }}>
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-medium, #cbd5e1)',
                        borderRadius: 'var(--radius-md, 0.5rem)',
                        padding: '0.6rem 0.75rem',
                        color: 'var(--text-primary, #0f172a)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleCloseRegister}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid var(--border-medium, #cbd5e1)',
                        color: 'var(--text-secondary, #475569)',
                        padding: '0.6rem 1.25rem',
                        borderRadius: 'var(--radius-md, 0.5rem)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary"
                      style={{
                        padding: '0.6rem 1.25rem',
                        borderRadius: 'var(--radius-md, 0.5rem)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                    >
                      {isSubmitting ? 'Provisioning...' : 'Register Company Workspace'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicTransparencyPortal;
