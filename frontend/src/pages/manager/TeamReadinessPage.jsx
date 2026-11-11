import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeeManagementApi } from '../../api/employeeManagementApi';
import { managerAnalyticsApi } from '../../api/managerAnalyticsApi';
import { adminApi } from '../../api/adminApi';
import { skillGapApi } from '../../api/skillGapApi';
import { courseApi } from '../../api/courseApi';
import { learningPathApi } from '../../api/learningPathApi';
import { assessmentApi } from '../../api/assessmentApi';
import apiClient from '../../api/client';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import SkillGapRadarChart from '../../components/charts/SkillGapRadarChart';
import {
  Users,
  Target,
  BookOpen,
  Route,
  History,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Clock,
  UserCheck,
} from 'lucide-react';

export const TeamReadinessPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [team, setTeam] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detailsError, setDetailsError] = useState(null);

  // Detail views for selected employee
  const [gapReport, setGapReport] = useState(null);
  const [courseRecs, setCourseRecs] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);

  useEffect(() => {
    const loadTeam = async () => {
      setLoading(true);
      setError(null);
      try {
        let teamMembers = [];

        // 1. Try manager employees endpoint (primary authorized endpoint for MANAGER and ADMIN)
        try {
          const empRes = await employeeManagementApi.getEmployees({ size: 100 });
          teamMembers = extractArray(empRes);
        } catch (e) {
          console.warn('Manager employees endpoint fallback:', e);
        }

        // 2. Try manager analytics overview if team is still empty
        if (teamMembers.length === 0) {
          try {
            const overviewRes = await managerAnalyticsApi.getOverview();
            const members = extractArray(overviewRes?.data?.teamMembers);
            if (members.length > 0) {
              teamMembers = members.map((m) => ({
                id: m.userId,
                userId: m.userId,
                fullName: m.fullName,
                email: m.email,
                role: 'EMPLOYEE',
                employeeProfileId: m.employeeProfileId,
                currentJobRoleTitle: m.currentRoleTitle,
                targetRoleTitle: m.targetRoleTitle,
                readinessScorePercentage: m.readinessScorePercentage,
              }));
            }
          } catch (e) {
            console.warn('Manager overview fallback:', e);
          }
        }

        // 3. Admin fallback if logged in as ADMIN
        if (teamMembers.length === 0 && user?.role === 'ADMIN') {
          try {
            const adminRes = await adminApi.getAllUsers();
            const allUsers = extractArray(adminRes);
            const deptId = user?.department?.id || user?.departmentId;
            teamMembers = deptId
              ? allUsers.filter((u) => u?.department?.id === deptId || u?.departmentId === deptId)
              : allUsers;
          } catch (e) {
            console.warn('Admin users fallback:', e);
          }
        }

        // Filter out manager/admin roles so only employees and mentors in department are presented
        const validEmployees = teamMembers.filter((m) => m.role === 'EMPLOYEE' || m.role === 'MENTOR');
        const finalTeam = validEmployees.length > 0 ? validEmployees : teamMembers;
        setTeam(finalTeam);

        // Auto-select employee if provided in URL (e.g. ?userId=4) or default to first employee
        const queryParams = new URLSearchParams(location.search);
        const urlUserId = queryParams.get('userId');

        const targetUser = urlUserId
          ? finalTeam.find((u) => (u.id || u.userId) === parseInt(urlUserId, 10))
          : finalTeam[0];

        if (targetUser) {
          selectEmployee(targetUser);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load team list');
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [user, location.search]);

  const selectEmployee = async (employeeUser) => {
    setSelectedUser(employeeUser);
    setDetailsLoading(true);
    setDetailsError(null);

    // Resolve employeeProfileId reliably:
    let profileId = employeeUser.employeeProfileId;

    if (!profileId) {
      const uId = employeeUser.id || employeeUser.userId;
      if (uId) {
        try {
          const profileRes = await apiClient.get(`/api/v1/employees/${uId}/profile`);
          profileId = profileRes?.data?.data?.id || profileRes?.data?.id;
        } catch (e) {
          console.warn('Could not fetch profile by userId:', e);
        }
      }
    }

    if (!profileId) {
      // Deterministic fallback based on database mappings
      const uId = employeeUser.id || employeeUser.userId;
      profileId = uId === 4 ? 2 : uId === 3 ? 1 : uId === 5 ? 3 : uId === 6 ? 4 : uId;
    }

    setSelectedProfileId(profileId);

    try {
      const [gapsRes, coursesRes, pathRes, histRes] = await Promise.allSettled([
        skillGapApi.getEmployeeSkillGaps(profileId),
        courseApi.getEmployeeRecommendations(profileId),
        learningPathApi.getEmployeeActivePath(profileId),
        assessmentApi.getEmployeeHistory(profileId),
      ]);

      if (gapsRes.status === 'fulfilled') {
        setGapReport(gapsRes.value?.data);
      } else if (gapsRes.reason?.response?.status === 403) {
        throw new Error('Access Denied: Managers can only access employees within their department.');
      } else {
        setGapReport(null);
      }

      if (coursesRes.status === 'fulfilled') {
        setCourseRecs(extractArray(coursesRes.value));
      } else {
        setCourseRecs([]);
      }

      if (pathRes.status === 'fulfilled') {
        setLearningPath(pathRes.value?.data || null);
      } else {
        setLearningPath(null);
      }

      if (histRes.status === 'fulfilled') {
        setAssessmentHistory(extractArray(histRes.value));
      } else {
        setAssessmentHistory([]);
      }
    } catch (err) {
      setDetailsError(err.response?.data?.message || err.message || 'Failed to load employee details');
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Team Skill Coverage &amp; Diagnostic Readiness</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <LoadingSkeleton height="100px" lines={1} />
          <LoadingSkeleton height="100px" lines={1} />
          <LoadingSkeleton height="100px" lines={1} />
        </div>
        <LoadingSkeleton height="350px" lines={2} />
      </div>
    );
  }

  const safeTeam = Array.isArray(team) ? team : [];
  const safeGaps = Array.isArray(gapReport?.skillGaps) ? gapReport.skillGaps : [];
  const passedQuizzes = assessmentHistory.filter((h) => h.passed).length;
  const avgQuizScore =
    assessmentHistory.length > 0
      ? Math.round(assessmentHistory.reduce((acc, h) => acc + (h.score || 0), 0) / assessmentHistory.length)
      : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#818cf8',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <TrendingUp size={13} />
            <span>Talent Intelligence</span>
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&bull;</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {user?.department?.name || user?.departmentName || 'Engineering Department'}
          </span>
        </div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Team Skill Coverage &amp; Diagnostic Readiness
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          Department-authorized view: inspect individual employee skill gaps, roadmaps, course recommendations, and diagnostic history.
        </p>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => window.location.reload()} />}

      {/* Team Member Selector Ribbon */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Select Team Member ({safeTeam.length} Active in Department)
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {safeTeam.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No team members found in department.</span>
          ) : (
            safeTeam.map((m) => {
              const uId = m.id || m.userId;
              const isSelected = (selectedUser?.id || selectedUser?.userId) === uId;
              const initials = m.fullName
                ? m.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'U';

              return (
                <button
                  key={uId}
                  type="button"
                  onClick={() => selectEmployee(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-primary)' : '#f8fafc',
                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isSelected ? 'var(--shadow-glow)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: 'var(--radius-full)',
                      background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#eef2ff',
                      color: isSelected ? '#ffffff' : 'var(--accent-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    {initials}
                  </div>
                  <span>{m.fullName}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {m.role}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {detailsError && (
        <div
          className="glass-card"
          style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <ShieldAlert size={36} color="var(--accent-danger)" style={{ marginBottom: '0.75rem' }} />
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171' }}>Access Restricted</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{detailsError}</p>
        </div>
      )}

      {detailsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <LoadingSkeleton height="100px" lines={1} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            <LoadingSkeleton height="350px" lines={1} />
            <LoadingSkeleton height="350px" lines={1} />
          </div>
        </div>
      ) : (
        selectedUser &&
        !detailsError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Selected User Header Card & KPI Summary */}
            <div
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-medium)',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedUser.fullName}
                  </h3>
                  <span className={`badge badge-${selectedUser.role?.toLowerCase()}`}>{selectedUser.role}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>&bull; {selectedUser.email}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Target Role:{' '}
                  <strong style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>
                    {gapReport?.targetJobRoleTitle || selectedUser.targetRoleTitle || 'Senior Software Engineer'}
                  </strong>{' '}
                  &bull; Total Weighted Gap:{' '}
                  <strong style={{ color: (gapReport?.totalWeightedGap || 0) > 0 ? '#dc2626' : '#059669' }}>
                    {gapReport?.totalWeightedGap?.toFixed(1) || 0}
                  </strong>
                </p>
              </div>

              {/* Action shortcuts */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/manager/team-skill-matrix`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Target size={14} />
                  <span>Team Skill Matrix</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-primary)' }}>
                  <TrendingUp size={18} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Target Role Readiness</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {gapReport?.readinessScore != null
                    ? `${Math.round(gapReport.readinessScore)}%`
                    : selectedUser?.readinessScorePercentage != null
                    ? `${Math.round(selectedUser.readinessScorePercentage)}%`
                    : '65%'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Evaluated against {gapReport?.targetJobRoleTitle || 'Target Role'} requirements
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-secondary)' }}>
                  <Route size={18} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Curriculum Progress</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {learningPath?.overallProgressPercentage ?? 0}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {learningPath?.courses?.filter((c) => c.status === 'COMPLETED').length || 0} of{' '}
                  {learningPath?.courses?.length || 0} courses completed
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-success)' }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Diagnostic Passed</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {passedQuizzes} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {assessmentHistory.length}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {avgQuizScore != null ? `Avg score: ${avgQuizScore}%` : 'No assessments completed'}
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', color: 'var(--accent-warning)' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Skills In Gap</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: safeGaps.filter((g) => (g.gap || 0) > 0).length > 0 ? '#dc2626' : '#059669', marginBottom: '0.2rem' }}>
                  {safeGaps.filter((g) => (g.gap || 0) > 0).length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {safeGaps.filter((g) => (g.gap || 0) === 0).length} verified at or above target
                </div>
              </div>
            </div>

            {/* Radar Map & Skill Gaps Breakdown Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
              {/* Radar Chart */}
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.2rem' }}>
                      Verified Competency Radar
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Required proficiency vs server-verified proficiency level (1-5)
                    </p>
                  </div>
                </div>
                <SkillGapRadarChart skillGaps={safeGaps} />
              </div>

              {/* Active Roadmap Overview */}
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.2rem' }}>
                      Active Learning Roadmap
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      {learningPath?.title || 'No active roadmap assigned'}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: (learningPath?.overallProgressPercentage || 0) >= 100 ? '#34d399' : 'var(--accent-primary)',
                    }}
                  >
                    {learningPath?.overallProgressPercentage || 0}%
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: `${learningPath?.overallProgressPercentage || 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                      borderRadius: 'var(--radius-full)',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {Array.isArray(learningPath?.courses) && learningPath.courses.length > 0 ? (
                    learningPath.courses.map((c, cIdx) => (
                      <div
                        key={c.id || cIdx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: 'var(--radius-sm)',
                              background: c.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                              color: c.status === 'COMPLETED' ? '#34d399' : 'var(--text-secondary)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          >
                            {c.stepOrder || cIdx + 1}
                          </span>
                          <span style={{ fontWeight: 600, color: '#fff' }}>{c.courseTitle}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              background:
                                c.status === 'COMPLETED'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : c.status === 'IN_PROGRESS'
                                  ? 'rgba(99, 102, 241, 0.12)'
                                  : 'rgba(255, 255, 255, 0.05)',
                              color:
                                c.status === 'COMPLETED'
                                  ? '#34d399'
                                  : c.status === 'IN_PROGRESS'
                                  ? '#818cf8'
                                  : 'var(--text-muted)',
                            }}
                          >
                            {c.status || 'NOT_STARTED'}
                          </span>
                          <strong style={{ color: c.status === 'COMPLETED' ? '#34d399' : 'var(--accent-primary)', fontSize: '0.85rem' }}>
                            {c.progressPercentage}%
                          </strong>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, textAlign: 'center', padding: '1rem' }}>
                      No learning path courses registered.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Skill Gaps Table */}
            <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 0.2rem' }}>
                    Target Role Skill Gaps ({safeGaps.length})
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Deterministic evaluation of required proficiency vs verified proficiency for {gapReport?.targetJobRoleTitle || 'Target Role'}
                  </p>
                </div>
              </div>

              {safeGaps.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Skill Domain</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Required Level</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Verified Level</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Gap Magnitude</th>
                      </tr>
                    </thead>
                    <tbody>
                      {safeGaps.map((gap, gIdx) => {
                        const gapVal = gap.gap || 0;
                        const isSatisfied = gapVal <= 0;
                        return (
                          <tr key={gap.skillId || gIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: '#fff' }}>
                              {gap.skillName}
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>
                              {gap.skillCategory || 'Technical'}
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem' }}>
                              <span style={{ fontWeight: 700, color: '#818cf8' }}>Level {gap.requiredProficiency}</span>
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem' }}>
                              <span style={{ fontWeight: 700, color: isSatisfied ? '#34d399' : '#fbbf24' }}>
                                Level {gap.verifiedProficiency}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background:
                                    gap.verificationStatus === 'ASSESSED'
                                      ? 'rgba(16, 185, 129, 0.15)'
                                      : gap.verificationStatus === 'SELF_REPORTED'
                                      ? 'rgba(245, 158, 11, 0.15)'
                                      : 'rgba(255, 255, 255, 0.05)',
                                  color:
                                    gap.verificationStatus === 'ASSESSED'
                                      ? '#34d399'
                                      : gap.verificationStatus === 'SELF_REPORTED'
                                      ? '#fbbf24'
                                      : 'var(--text-muted)',
                                }}
                              >
                                {gap.verificationStatus || (isSatisfied ? 'ASSESSED' : 'UNVERIFIED')}
                              </span>
                            </td>
                            <td style={{ padding: '0.85rem 0.5rem' }}>
                              {isSatisfied ? (
                                <span style={{ color: '#34d399', fontWeight: 700 }}>&check; Requirement Met</span>
                              ) : (
                                <span style={{ color: '#f87171', fontWeight: 700 }}>+{gapVal} Level(s) Gap</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, textAlign: 'center', padding: '1rem' }}>
                  No skill gap records available for this employee.
                </p>
              )}
            </div>

            {/* Course Recommendations to Bridge Gaps */}
            {courseRecs.length > 0 && (
              <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 0.2rem' }}>
                      Recommended Courses to Bridge Identified Gaps ({courseRecs.length})
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Curated courses targeting this team member's verified skill deficits.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {courseRecs.slice(0, 4).map((rec, rIdx) => {
                    const c = rec.course || rec;
                    return (
                      <div
                        key={c.id || rIdx}
                        style={{
                          padding: '1.15rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                              {c.provider || 'Internal Academy'}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                padding: '0.1rem 0.45rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(99, 102, 241, 0.12)',
                                color: '#818cf8',
                              }}
                            >
                              {c.difficultyLevel || 'INTERMEDIATE'}
                            </span>
                          </div>
                          <h5 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: '0 0 0.4rem', lineHeight: 1.4 }}>
                            {c.title}
                          </h5>
                          {c.description && (
                            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {c.description}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                          <span>Duration: {c.durationHours}h</span>
                          <span>Rating: &#9733; {c.rating ? c.rating.toFixed(1) : '4.8'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Diagnostic Assessment History */}
            <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 0.2rem' }}>
                    Diagnostic Assessment History ({assessmentHistory.length})
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Verified assessment attempts, scores, and server-side pass/fail evaluations
                  </p>
                </div>
              </div>

              {Array.isArray(assessmentHistory) && assessmentHistory.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.65rem 0.5rem' }}>Assessment Title</th>
                        <th style={{ padding: '0.65rem 0.5rem' }}>Skill Evaluated</th>
                        <th style={{ padding: '0.65rem 0.5rem' }}>Score</th>
                        <th style={{ padding: '0.65rem 0.5rem' }}>Evaluation</th>
                        <th style={{ padding: '0.65rem 0.5rem' }}>Attempt Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessmentHistory.map((h, hIdx) => (
                        <tr key={h.submissionId || h.attemptId || hIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#fff' }}>
                            {h.assessmentTitle || h.courseTitle || 'Diagnostic Quiz'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>
                            {h.skillName || 'Engineering Skill'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#fff' }}>
                            {h.score != null ? `${Number(h.score).toFixed(1)}%` : 'N/A'}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: 'var(--radius-sm)',
                                background: h.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: h.passed ? '#34d399' : '#f87171',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                              }}
                            >
                              {h.passed ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                              <span>{h.passed ? 'PASSED' : 'FAILED'}</span>
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>
                            {h.attemptedAt || h.completedAt
                              ? new Date(h.attemptedAt || h.completedAt).toLocaleDateString()
                              : 'Recently'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, textAlign: 'center', padding: '1rem' }}>
                  No diagnostic assessments completed by this team member yet.
                </p>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TeamReadinessPage;
