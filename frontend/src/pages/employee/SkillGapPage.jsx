import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { skillGapApi } from '../../api/skillGapApi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import SkillGapRadarChart from '../../components/charts/SkillGapRadarChart';
import SkillGapBarChart from '../../components/charts/SkillGapBarChart';
import WeakAreasSection from '../../components/employee/WeakAreasSection';
import { Target, FileCheck2, BookOpen, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export const SkillGapPage = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await skillGapApi.getOwnSkillGaps();
      setReport(res?.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load skill gap report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Skill Gap Intelligence</h2>
        <LoadingSkeleton height="350px" lines={1} style={{ marginBottom: '1.5rem' }} />
        <LoadingSkeleton height="300px" lines={1} />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle size={13} /> Verified
          </span>
        );
      case 'UNVERIFIED_SELF_REPORTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600 }}>
            <AlertCircle size={13} /> Self-Reported
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600 }}>
            <HelpCircle size={13} /> Unassessed
          </span>
        );
    }
  };

  const getCriticalityBadge = (crit) => {
    if (crit === 'MANDATORY') {
      return <span className="badge badge-admin">Mandatory</span>;
    }
    if (crit === 'CORE') {
      return <span className="badge badge-manager">Core</span>;
    }
    return <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>Elective</span>;
  };

  const safeGaps = Array.isArray(report?.skillGaps) ? report.skillGaps : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Dynamic Skill Gap &amp; Competency Analysis
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Benchmarked dynamically against requirements for{' '}
          <strong style={{ color: 'var(--accent-secondary)' }}>
            {report?.targetJobRoleTitle || 'Target Role'}
          </strong>
        </p>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Visualizations Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Competency Radar Map
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Required vs verified proficiency levels (Scale 1–5)
          </p>
          <SkillGapRadarChart skillGaps={safeGaps} />
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Gap Severity &amp; Importance Impact
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Raw gap: max(0, required - verified) &bull; Weighted gap: rawGap &times; dynamicWeight (calculated dynamically)
          </p>
          <SkillGapBarChart skillGaps={safeGaps} />
        </div>
      </div>

      {/* Detailed Skill Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Skill Inventory &amp; Gap Breakdown</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/assessments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <FileCheck2 size={14} />
              Take Assessment
            </button>
            <button
              onClick={() => navigate('/courses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38bdf8',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <BookOpen size={14} />
              View Courses
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Skill</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Criticality</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Required</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Verified</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Self-Reported</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Raw Gap</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Dynamic Weight</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Weighted Gap</th>
              </tr>
            </thead>
            <tbody>
              {safeGaps.length > 0 ? (
                safeGaps.map((g) => (
                  <tr key={g.skillId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>
                      <div>{g.skillName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g.categoryName}</div>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>{getCriticalityBadge(g.criticality)}</td>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>Level {g.requiredProficiency}</td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {g.verifiedProficiency ? (
                        <span style={{ color: '#34d399', fontWeight: 600 }}>Level {g.verifiedProficiency}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {g.selfReportedProficiency ? (
                        <span>Level {g.selfReportedProficiency}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>{getStatusBadge(g.assessmentStatus)}</td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {g.rawGap > 0 ? (
                        <span style={{ color: '#f87171', fontWeight: 700 }}>+{g.rawGap}</span>
                      ) : g.rawGap === 0 ? (
                        <span style={{ color: '#34d399' }}>0</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unverified</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          background: '#f1f5f9',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          display: 'inline-block',
                        }}
                      >
                        {g.importanceWeight?.toFixed(1)}x
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      {g.weightedGap != null ? (
                        <span style={{ fontWeight: 700, color: g.weightedGap > 0 ? '#fbbf24' : '#34d399' }}>
                          {g.weightedGap.toFixed(1)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No skill gaps found for this role.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Targeted Weak Areas, Curated Study Materials & Remedial Reviews */}
      <WeakAreasSection />
    </div>
  );
};

export default SkillGapPage;
