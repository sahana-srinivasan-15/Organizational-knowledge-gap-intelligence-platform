import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerAnalyticsApi } from '../../api/managerAnalyticsApi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import {
  Target,
  Users,
  AlertTriangle,
  BookOpen,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Layers,
} from 'lucide-react';

export const TeamSkillGapMatrixPage = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await managerAnalyticsApi.getOverview();
      setOverview(res?.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load department analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const priorityGaps = overview?.prioritySkillGaps || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Team Skill Gap Matrix &amp; Strategic Priorities
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Aggregated competency deficiencies across {overview?.departmentName || 'your department'}. Prioritize targeted training and mentor pairings.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/manager/course-approvals')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <BookOpen size={16} /> Course Approval Queue
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchOverview} />}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LoadingSkeleton height="150px" lines={1} />
          <LoadingSkeleton height="200px" lines={1} />
        </div>
      ) : priorityGaps.length === 0 ? (
        <EmptyState
          title="No Significant Team Skill Gaps"
          description="All department team members have satisfied their verified proficiency benchmarks."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {priorityGaps.map((gap) => (
            <div key={gap.skillId} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span
                      className="badge"
                      style={{
                        background: gap.priorityLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                        color: gap.priorityLevel === 'HIGH' ? '#f87171' : '#facc15',
                        fontWeight: 700,
                      }}
                    >
                      {gap.priorityLevel} PRIORITY GAP
                    </span>
                    <span className="badge badge-manager">{gap.categoryName}</span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.3rem 0' }}>
                    {gap.skillName} ({gap.skillCode})
                  </h3>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>Affected Team Members: <strong style={{ color: '#fff' }}>{gap.affectedEmployeesCount}</strong></span>
                    <span>Average Proficiency Gap: <strong style={{ color: '#f87171' }}>+{gap.averageGapMagnitude} levels</strong></span>
                  </div>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => navigate('/team-readiness')}
                >
                  Inspect Team Coverage <ArrowRight size={14} />
                </button>
              </div>

              {/* Recommended Course & Mentor Suggestions */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '0.25rem' }}>
                    <BookOpen size={15} /> Recommended Catalog Course:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                    {gap.recommendedCourseTitle || 'Advanced Spring Boot & Architecture'}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '0.25rem' }}>
                    <UserCheck size={15} /> Top Peer Mentor Candidate:
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                    {gap.recommendedMentorName || 'Alex Morgan (Senior SWE)'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamSkillGapMatrixPage;
