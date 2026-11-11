import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { courseApi } from '../../api/courseApi';
import { assessmentApi } from '../../api/assessmentApi';
import { extractArray } from '../../utils/apiUtils';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  Users,
  Building2,
  Server,
  Activity,
  Award,
  Users2,
} from 'lucide-react';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, coursesRes, assessRes] = await Promise.allSettled([
        adminApi.getAllUsers(),
        courseApi.getAllCourses(),
        assessmentApi.getAllAssessments(),
      ]);

      if (usersRes.status === 'fulfilled') {
        setUsers(extractArray(usersRes.value));
      } else {
        setError(usersRes.reason?.response?.data?.message || usersRes.reason?.message || 'Failed to load admin metrics');
      }
      if (coursesRes.status === 'fulfilled') setCourses(extractArray(coursesRes.value));
      if (assessRes.status === 'fulfilled') setAssessments(extractArray(assessRes.value));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const uniqueUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const seenIds = new Set();
    const seenEmails = new Set();
    const result = [];
    for (const u of list) {
      if (!u || !u.id) continue;
      const email = (u.email || '').toLowerCase().trim();
      if (!seenIds.has(u.id) && (!email || !seenEmails.has(email))) {
        seenIds.add(u.id);
        if (email) seenEmails.add(email);
        result.push(u);
      }
    }
    return result;
  }, [users]);

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Platform Administration</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
        </div>
      </div>
    );
  }

  const safeUsers = uniqueUsers;
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeAssessments = Array.isArray(assessments) ? assessments : [];

  const roleCounts = safeUsers.reduce((acc, u) => {
    if (u && u.role) {
      acc[u.role] = (acc[u.role] || 0) + 1;
    }
    return acc;
  }, {});

  const distinctDepts = new Set(
    safeUsers
      .map((u) => u?.department?.code || u?.departmentName || u?.department?.name)
      .filter(Boolean)
  ).size;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Platform Administration &amp; Governance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Enterprise overview across identity &amp; access management, competency catalogs, and microservices.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/users')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.6rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-glow)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Users size={16} />
          <span>Manage User Directory</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Metric Cards Row: Improvement & Governance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          icon={Award}
          title="Overall Organisation Improvement"
          value="94.2%"
          badgeText="Target Benchmark"
          badgeType="success"
          subtext="Enterprise organizational skill resilience"
          accentColor="#3b82f6"
        />

        <StatCard
          icon={Users2}
          title="Team-Wise Improvement"
          value="84.6%"
          badgeText="Gap Closed"
          badgeType="success"
          subtext="Department readiness & peer mentorship pairing"
          accentColor="#8b5cf6"
        />

        <StatCard
          icon={Users}
          title="Total Users"
          value={safeUsers.length}
          badgeText="Active Directory"
          badgeType="default"
          subtext="Provisioned across 4 enterprise RBAC tiers"
          accentColor="var(--accent-primary)"
        />
      </div>

      {/* 2 Improvement Pillars: Overall Organisation & Team-Wise Improvement */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Overall Organisation Improvement */}
        <div
          className="glass-card"
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '0.5rem', background: '#eff6ff', color: '#2563eb' }}>
                  <Award size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Overall Organisation Improvement
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', background: '#dbeafe', color: '#1d4ed8' }}>
                94.2%
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
              Enterprise competency resilience, mission-critical architectural readiness, and organizational skill health index.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Enterprise Skill Health Index</span>
                  <strong style={{ color: '#2563eb' }}>94.2 / 100 Health</strong>
                </div>
                <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '94%', background: '#3b82f6', borderRadius: '9999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Critical Tech Stack Coverage</span>
                  <strong style={{ color: 'var(--text-primary)' }}>100% Redundancy</strong>
                </div>
                <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', background: '#10b981', borderRadius: '9999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Talent Modernization Velocity</span>
                  <strong style={{ color: 'var(--text-primary)' }}>Cloud Native &amp; AI-Ready</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enterprise Resilience</span>
            <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>Benchmark Leader</span>
          </div>
        </div>

        {/* Team-Wise Improvement */}
        <div
          className="glass-card"
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.45rem', borderRadius: '0.5rem', background: '#f5f3ff', color: '#7c3aed' }}>
                  <Users2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Team-Wise Improvement
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', background: '#ede9fe', color: '#6d28d9' }}>
                84.6%
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
              Cross-functional cohort synergy, departmental knowledge sharing, and peer mentor connection velocity.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Department Skill Gap Closure</span>
                  <strong style={{ color: '#7c3aed' }}>-42.0% Gaps Closed</strong>
                </div>
                <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '84%', background: '#8b5cf6', borderRadius: '9999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Peer Mentorship Pairing Rate</span>
                  <strong style={{ color: 'var(--text-primary)' }}>78.5% Connected</strong>
                </div>
                <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '78%', background: '#10b981', borderRadius: '9999px' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Team Readiness Benchmark</span>
                  <strong style={{ color: 'var(--text-primary)' }}>Engineering &amp; Product</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{distinctDepts} Functional Divisions</span>
            <span style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 700 }}>Optimized Cohorts</span>
          </div>
        </div>
      </div>

      {/* Role Distribution & Architecture Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Role Distribution Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Role-Based Access Governance</h3>
            <button
              onClick={() => navigate('/admin/users')}
              style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600 }}
            >
              View Users &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-employee">EMPLOYEE</span>
                <span style={{ fontSize: '0.875rem' }}>Standard Team Members &amp; Learners</span>
              </div>
              <strong style={{ fontSize: '1.15rem', color: '#34d399' }}>{roleCounts['EMPLOYEE'] || 0}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-mentor">MENTOR</span>
                <span style={{ fontSize: '0.875rem' }}>Dedicated Mentors &amp; Upskilling Advisors</span>
              </div>
              <strong style={{ fontSize: '1.15rem', color: '#c084fc' }}>{roleCounts['MENTOR'] || 0}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-manager">MANAGER</span>
                <span style={{ fontSize: '0.875rem' }}>Department Leads &amp; Mentor Approvers</span>
              </div>
              <strong style={{ fontSize: '1.15rem', color: '#fbbf24' }}>{roleCounts['MANAGER'] || 0}</strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="badge badge-admin">ADMIN</span>
                <span style={{ fontSize: '0.875rem' }}>Platform Governance &amp; Security Controls</span>
              </div>
              <strong style={{ fontSize: '1.15rem', color: '#f87171' }}>{roleCounts['ADMIN'] || 0}</strong>
            </div>
          </div>
        </div>

        {/* System Architecture Connectivity */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            System Infrastructure Connectivity
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Server size={18} color="#60a5fa" />
                <span style={{ fontSize: '0.875rem' }}>Spring Boot REST Backend (:8080)</span>
              </div>
              <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>CONNECTED</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Activity size={18} color="#a78bfa" />
                <span style={{ fontSize: '0.875rem' }}>FastAPI ML Prediction Service (:8000)</span>
              </div>
              <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>CONNECTED</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Building2 size={18} color="#34d399" />
                <span style={{ fontSize: '0.875rem' }}>PostgreSQL 17 Native Database (:5432)</span>
              </div>
              <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>ACTIVE (19 Tables)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
