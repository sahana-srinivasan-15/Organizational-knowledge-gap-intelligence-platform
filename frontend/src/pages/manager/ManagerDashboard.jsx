import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { managerAnalyticsApi } from '../../api/managerAnalyticsApi';
import { mentorshipApi } from '../../api/mentorshipApi';
import { notificationApi } from '../../api/notificationApi';
import { extractArray } from '../../utils/apiUtils';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  Users,
  CheckCircle,
  Target,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  Route,
  BookOpen,
  TrendingUp,
  Clock,
  FileCheck2,
} from 'lucide-react';

export const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [pendingMentorApprovals, setPendingMentorApprovals] = useState([]);
  const [managerNotifications, setManagerNotifications] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, mentorAssignRes, notifsRes] = await Promise.allSettled([
        managerAnalyticsApi.getOverview(),
        mentorshipApi.getAssignments('RECOMMENDED'),
        notificationApi.getMyNotifications ? notificationApi.getMyNotifications() : Promise.resolve([]),
      ]);

      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value?.data);
      } else {
        throw new Error(overviewRes.reason?.response?.data?.message || 'Failed to load department overview');
      }

      if (mentorAssignRes.status === 'fulfilled') {
        setPendingMentorApprovals(extractArray(mentorAssignRes.value));
      }

      if (notifsRes.status === 'fulfilled') {
        setManagerNotifications(extractArray(notifsRes.value));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load manager dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Department Management Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
        </div>
      </div>
    );
  }

  const deptName = overview?.departmentName || user?.department?.name || 'Engineering';
  const teamMembers = overview?.teamMembers || [];
  const priorityGaps = overview?.prioritySkillGaps || [];
  const pendingCourses = overview?.pendingCourseRequests || 0;
  const pendingMentors = pendingMentorApprovals.length;

  const gapReportNotifications = useMemo(() => {
    return (managerNotifications || []).filter((n) => n.type === 'GAP_REPORT_SUBMITTED' || n.type === 'TEST_SCORE_REPORT');
  }, [managerNotifications]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Title & Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {deptName} &bull; Talent Intelligence &amp; Governance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Live department analytics: review external course requests, monitor team skill gaps, and manage peer mentorship workflows.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/manager/course-approvals')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: pendingCourses > 0 ? 'var(--accent-warning)' : 'var(--accent-primary)',
              color: pendingCourses > 0 ? '#111827' : '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <BookOpen size={16} />
            <span>Course Approvals ({pendingCourses})</span>
          </button>

          <button
            onClick={() => navigate('/mentor-approvals')}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.875rem' }}
          >
            <CheckCircle size={16} />
            <span>Mentor Approvals ({pendingMentors})</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Gap Report & Test Score Notification Banner for Manager */}
      {gapReportNotifications.length > 0 && (
        <div
          className="glass-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.75rem',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #86efac',
            borderRadius: 'var(--radius-lg)',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 15px rgba(22, 101, 52, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#bbf7d0', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileCheck2 size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#14532d', margin: 0 }}>
                  {gapReportNotifications[0].title}
                </h4>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#16a34a', color: '#ffffff', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                  DIAGNOSTIC REPORT DELIVERED
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#166534', margin: 0, maxWidth: '780px', lineHeight: 1.45 }}>
                {gapReportNotifications[0].message}
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#15803d', borderColor: '#15803d' }}
            onClick={() => navigate('/team-skills')}
          >
            <span>Review Team Skills Matrix</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Course Approval Alert Banner if any pending */}
      {pendingCourses > 0 && (
        <div
          className="glass-card"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.75rem',
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <AlertTriangle size={24} color="var(--accent-warning)" />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.2rem' }}>
                {pendingCourses} Course Proposal(s) Pending Your Review
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Employees have requested approval for external courses bridging identified target skill gaps.
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.825rem' }}
            onClick={() => navigate('/manager/course-approvals')}
          >
            Review Proposals &rarr;
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          icon={Users}
          title="Team Size"
          value={overview?.totalManagedEmployees ?? teamMembers.length}
          badgeText="Active Staff"
          badgeType="default"
          subtext={`Employees registered in ${deptName}`}
          accentColor="var(--accent-primary)"
        />

        <StatCard
          icon={BookOpen}
          title="Course Approvals"
          value={pendingCourses}
          badgeText={pendingCourses > 0 ? 'Pending Action' : 'Up to Date'}
          badgeType={pendingCourses > 0 ? 'warning' : 'success'}
          subtext={`${overview?.approvedCourseRequests ?? 0} approved, ${overview?.rejectedCourseRequests ?? 0} rejected`}
          accentColor="var(--accent-warning)"
        />

        <StatCard
          icon={Route}
          title="Active Learners"
          value={overview?.employeesCurrentlyLearning ?? 0}
          badgeText="In Progress"
          badgeType="success"
          subtext={`${overview?.totalCompletedCourses ?? 0} course steps completed`}
          accentColor="var(--accent-secondary)"
        />

        <StatCard
          icon={AlertTriangle}
          title="Falling Behind"
          value={overview?.employeesFallingBehind ?? 0}
          badgeText={overview?.employeesFallingBehind > 0 ? 'Attention Needed' : 'On Schedule'}
          badgeType={overview?.employeesFallingBehind > 0 ? 'danger' : 'success'}
          subtext="Employees with < 25% course progress"
          accentColor="var(--accent-danger)"
        />
      </div>

      {/* Priority Team Skill Gaps Summary */}
      {priorityGaps.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.2rem' }}>
                Top Team Skill Gaps &amp; Priority Areas
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Aggregated skill deficiencies requiring targeted courses or peer mentoring interventions.
              </p>
            </div>
            <button
              onClick={() => navigate('/manager/team-skill-matrix')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--accent-secondary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span>Full Matrix</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {priorityGaps.slice(0, 3).map((gap) => (
              <div
                key={gap.skillId}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span className="badge" style={{ background: gap.priorityLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: gap.priorityLevel === 'HIGH' ? '#f87171' : '#facc15' }}>
                    {gap.priorityLevel} Priority
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{gap.affectedEmployeesCount} members</span>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.2rem 0' }}>{gap.skillName}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Avg Gap: <strong style={{ color: '#f87171' }}>+{gap.averageGapMagnitude} levels</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members Roster & Learning Status */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Department Roster &amp; Learning Progress</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Individual readiness scores, active courses, and learning status.
            </p>
          </div>
          <button
            onClick={() => navigate('/team-readiness')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.825rem',
              color: 'var(--accent-secondary)',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>Team Gap Heatmap</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Employee</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Target Role</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Role Readiness</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Learning Status</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Assigned Mentor</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No department team members registered yet.
                  </td>
                </tr>
              ) : (
                teamMembers.map((member) => (
                  <tr key={member.userId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>
                      <div>{member.fullName}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {member.targetRoleTitle || 'Senior Software Engineer'}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: (member.readinessScorePercentage ?? 0) >= 70 ? '#34d399' : '#f87171' }}>
                          {member.readinessScorePercentage != null ? `${member.readinessScorePercentage}%` : '58.0%'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span
                        className="badge"
                        style={{
                          background:
                            member.currentLearningStatus === 'FALLING_BEHIND'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : member.currentLearningStatus === 'COMPLETED'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(99, 102, 241, 0.15)',
                          color:
                            member.currentLearningStatus === 'FALLING_BEHIND'
                              ? '#f87171'
                              : member.currentLearningStatus === 'COMPLETED'
                                ? '#34d399'
                                : '#818cf8',
                        }}
                      >
                        {member.currentLearningStatus || 'ON_TRACK'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {member.assignedMentorName ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-secondary)' }}>
                          <UserCheck size={14} /> {member.assignedMentorName}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/team-readiness?userId=${member.userId}`)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: '#818cf8',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        View Competencies
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
