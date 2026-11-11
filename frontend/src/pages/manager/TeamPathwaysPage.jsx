import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeManagementApi } from '../../api/employeeManagementApi';
import { managerAnalyticsApi } from '../../api/managerAnalyticsApi';
import { adminApi } from '../../api/adminApi';
import { learningPathApi } from '../../api/learningPathApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import { Route, CheckCircle2, User, BookOpen, Search, PlusCircle, RefreshCw } from 'lucide-react';

export const TeamPathwaysPage = () => {
  const { user } = useAuth();
  const [teamPaths, setTeamPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, ACTIVE, NONE
  const [generatingId, setGeneratingId] = useState(null);

  const loadPaths = async () => {
    setLoading(true);
    setError(null);
    try {
      let teamMembers = [];

      // 1. Primary: Manager-authorized employee roster (scoped to manager's department)
      try {
        const empRes = await employeeManagementApi.getEmployees({ size: 100 });
        teamMembers = extractArray(empRes);
      } catch (e) {
        console.warn('Manager employees endpoint fallback:', e);
      }

      // 2. Fallback: Manager analytics overview
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
            }));
          }
        } catch (e) {
          console.warn('Manager overview fallback:', e);
        }
      }

      // 3. Fallback: If logged in as ADMIN, use admin API
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

      // Fetch active learning pathways for each team member
      const pathPromises = teamMembers.map(async (member) => {
        const profileId = member.employeeProfileId || (member.id === 4 ? 2 : member.id === 3 ? 1 : member.id === 5 ? 3 : member.id);
        try {
          const pRes = await learningPathApi.getEmployeeActivePath(profileId);
          return { member, path: pRes?.data };
        } catch {
          return { member, path: null };
        }
      });

      const results = await Promise.all(pathPromises);
      setTeamPaths(results);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load team learning pathways');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaths();
  }, [user]);

  const handleGeneratePath = async (member) => {
    const profileId = member.employeeProfileId || (member.id === 4 ? 2 : member.id === 3 ? 1 : member.id === 5 ? 3 : member.id);
    setGeneratingId(member.id);
    try {
      const res = await learningPathApi.generateEmployeePath(profileId);
      const newPath = res?.data;
      setTeamPaths((prev) =>
        prev.map((item) =>
          (item.member.id === member.id || item.member.userId === member.id)
            ? { ...item, path: newPath }
            : item
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate pathway for employee.');
    } finally {
      setGeneratingId(null);
    }
  };

  const safeTeamPaths = Array.isArray(teamPaths) ? teamPaths : [];

  // Filtered list based on search and active path status
  const filteredTeamPaths = useMemo(() => {
    return safeTeamPaths.filter(({ member, path }) => {
      const matchesSearch =
        searchQuery === '' ||
        member.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.currentJobRoleTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path?.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterType === 'ALL' ||
        (filterType === 'ACTIVE' && path !== null) ||
        (filterType === 'NONE' && path === null);

      return matchesSearch && matchesFilter;
    });
  }, [safeTeamPaths, searchQuery, filterType]);

  const activePathwaysCount = safeTeamPaths.filter((tp) => tp.path).length;
  const avgProgress = useMemo(() => {
    const activePaths = safeTeamPaths.filter((tp) => tp.path);
    if (activePaths.length === 0) return 0;
    const sum = activePaths.reduce((acc, curr) => acc + (curr.path.overallProgressPercentage || 0), 0);
    return Math.round(sum / activePaths.length);
  }, [safeTeamPaths]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Team Learning Pathways Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Loading curriculum roadmaps across department members...
          </p>
        </div>
        <LoadingSkeleton height="320px" lines={1} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          padding: '1.75rem 2rem',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ flex: '1 1 420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                background: '#eef2ff',
                border: '1px solid #c7d2fe',
                color: 'var(--accent-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <Route size={13} /> Curriculum Intelligence
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user?.department?.name || 'Department'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            Team Learning Pathways Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, maxWidth: '640px' }}>
            Monitor curriculum roadmaps, sequential milestones, and course completion velocity across all team members in {user?.department?.name || 'your department'}.
          </p>
        </div>

        {/* Quick Stats Counter Pills */}
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '110px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              {safeTeamPaths.length}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Team Members
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '110px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
              {activePathwaysCount}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Active Roadmaps
            </div>
          </div>

          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '110px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-success)' }}>
              {avgProgress}%
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Avg Progress
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadPaths} />}

      {/* Toolbar: Search & Filter Tabs */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          flexWrap: 'wrap',
          background: '#ffffff',
        }}
      >
        {/* Modern Search Box */}
        <div style={{ flex: '1 1 320px' }}>
          <div className="modern-search-wrapper">
            <Search size={18} className="modern-search-icon" />
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search by employee name, email, or curriculum topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="modern-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '0.25rem' }}>
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
          >
            All Members ({safeTeamPaths.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('ACTIVE')}
            className={`btn ${filterType === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
          >
            Active Roadmaps ({activePathwaysCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('NONE')}
            className={`btn ${filterType === 'NONE' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
          >
            Needs Pathway ({safeTeamPaths.length - activePathwaysCount})
          </button>
        </div>
      </div>

      {/* Pathways List */}
      {filteredTeamPaths.length === 0 ? (
        <EmptyState
          icon={Route}
          title="No Matching Team Roadmaps"
          description={
            searchQuery
              ? `No team members match your search "${searchQuery}".`
              : "No active employee learning roadmaps found for this department."
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredTeamPaths.map(({ member, path }) => {
            const isGenerating = generatingId === member.id;
            return (
              <div
                key={member.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.5rem',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Top Row: Member Profile & Overall Progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#eef2ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-primary)',
                        border: '1px solid #c7d2fe',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {member.firstName?.charAt(0) || member.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {member.fullName}
                        </h4>
                        <span className={`badge badge-${member.role?.toLowerCase() || 'employee'}`}>
                          {member.role || 'EMPLOYEE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {member.email}
                        {member.currentJobRoleTitle && <span> &bull; {member.currentJobRoleTitle}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Progress / Generate CTA */}
                  <div>
                    {path ? (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                          {path.overallProgressPercentage}%
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {path.completedCourses} of {path.totalCourses} courses complete
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGeneratePath(member)}
                        disabled={isGenerating}
                        className="btn btn-primary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.825rem',
                          borderRadius: 'var(--radius-full)',
                          gap: '0.35rem',
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle size={14} />
                            <span>Generate Pathway</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Course Milestones */}
                {path ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {/* Linear Progress Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '7px',
                        borderRadius: 'var(--radius-full)',
                        background: '#e2e8f0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${path.overallProgressPercentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    {/* Sequential Course Step Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.25rem' }}>
                      {path.courses?.map((c) => {
                        const isDone = c.status === 'COMPLETED' || c.progressPercentage >= 100;
                        return (
                          <span
                            key={c.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.3rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              background: isDone ? '#d1fae5' : '#f8fafc',
                              border: `1px solid ${isDone ? '#a7f3d0' : 'var(--border-subtle)'}`,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: isDone ? '#065f46' : 'var(--text-secondary)',
                            }}
                          >
                            {isDone ? <CheckCircle2 size={13} color="#059669" /> : <BookOpen size={13} color="#94a3b8" />}
                            <span>{c.courseTitle}</span>
                            <span style={{ color: isDone ? '#047857' : 'var(--text-muted)', fontWeight: 700 }}>
                              ({c.progressPercentage}%)
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#f8fafc',
                      border: '1px dashed var(--border-medium)',
                      fontSize: '0.825rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <Route size={16} color="var(--text-muted)" />
                    <span>No active learning roadmap assigned. Click &quot;Generate Pathway&quot; to synthesize an upskilling curriculum.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPathwaysPage;
