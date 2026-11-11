import React, { useState, useEffect, useMemo } from 'react';
import { mentorshipApi } from '../../api/mentorshipApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Users,
  Search,
  BookOpen,
  ArrowRight,
  User,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';

export const MentorApprovalPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('RECOMMENDED');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [generatingLoading, setGeneratingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [hasAutoAttempted, setHasAutoAttempted] = useState(false);

  const loadAssignments = async (filter, attemptAutoGenerateOnEmpty = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await mentorshipApi.getAssignments(filter === 'ALL' ? null : filter);
      const list = extractArray(res);
      setAssignments(list);

      // If RECOMMENDED queue is completely empty on first load, auto-generate sample recommendations
      if (list.length === 0 && filter === 'RECOMMENDED' && attemptAutoGenerateOnEmpty && !hasAutoAttempted) {
        setHasAutoAttempted(true);
        try {
          const genRes = await mentorshipApi.autoGenerateAssignments();
          const generatedList = extractArray(genRes);
          if (generatedList.length > 0) {
            setAssignments(generatedList);
          } else {
            // Re-fetch
            const secondFetch = await mentorshipApi.getAssignments(filter === 'ALL' ? null : filter);
            setAssignments(extractArray(secondFetch));
          }
        } catch {
          // If auto-generation failed, keep the empty list without crashing
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load mentor assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments(statusFilter, true);
  }, [statusFilter]);

  const handleAutoGenerate = async () => {
    setGeneratingLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await mentorshipApi.autoGenerateAssignments();
      const count = extractArray(res).length;
      setSuccessMsg(
        count > 0
          ? `Successfully synthesized ${count} new algorithmic mentor matches!`
          : 'Refreshed mentor assignment recommendations!'
      );
      loadAssignments(statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to auto-generate mentor recommendations');
    } finally {
      setGeneratingLoading(false);
    }
  };

  const handleApprove = async (assignmentId) => {
    setActionLoadingId(assignmentId);
    setError(null);
    setSuccessMsg(null);
    try {
      await mentorshipApi.approveAssignment(assignmentId);
      setSuccessMsg(`Mentor assignment #${assignmentId} authorized & approved successfully!`);
      loadAssignments(statusFilter);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Concurrency/Capacity Conflict: Mentor has reached maximum mentee workload capacity.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to approve assignment');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (assignmentId) => {
    setActionLoadingId(assignmentId);
    setError(null);
    setSuccessMsg(null);
    try {
      await mentorshipApi.rejectAssignment(assignmentId, { reason: 'Manager deferred this pairing for current development cycle.' });
      setSuccessMsg(`Mentor assignment #${assignmentId} rejected.`);
      loadAssignments(statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject assignment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECOMMENDED':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Recommended
          </span>
        );
      case 'APPROVED_BY_MANAGER':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Approved
          </span>
        );
      case 'ACTIVE':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Active
          </span>
        );
      case 'REJECTED':
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Rejected
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  // Filtered by Search Query
  const filteredAssignments = useMemo(() => {
    if (!searchQuery.trim()) return safeAssignments;
    const q = searchQuery.toLowerCase();
    return safeAssignments.filter(
      (a) =>
        a.menteeFullName?.toLowerCase().includes(q) ||
        a.mentorFullName?.toLowerCase().includes(q) ||
        a.skillName?.toLowerCase().includes(q) ||
        a.notes?.toLowerCase().includes(q)
    );
  }, [safeAssignments, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner - Modern Crisp Light Theme */}
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
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ flex: '1 1 440px' }}>
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
              <ShieldCheck size={13} /> Governance Queue
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Workload Capacity Enforced</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            Manager Mentor Approval Queue
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, maxWidth: '640px' }}>
            Review, authorize, and govern peer mentorship pairings. All approvals automatically re-verify mentor bandwidth, proficiency gains, and prevent mentee overload.
          </p>
        </div>

        {/* Header Action: Auto-Generate Matches */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={generatingLoading}
            onClick={handleAutoGenerate}
            style={{
              height: '46px',
              padding: '0 1.25rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {generatingLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Generating Matches...</span>
              </>
            ) : (
              <>
                <Users size={16} />
                <span>Generate AI Matches</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Toolbar: Modern Search Box & Filter Tabs */}
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
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Modern Search Box */}
        <div style={{ flex: '1 1 320px' }}>
          <div className="modern-search-wrapper">
            <Search size={18} className="modern-search-icon" />
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search by mentee, mentor, or target skill..."
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

        {/* Filter Status Buttons */}
        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {['RECOMMENDED', 'APPROVED_BY_MANAGER', 'ACTIVE', 'REJECTED', 'ALL'].map((tab) => {
            const isCurrent = statusFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`btn ${isCurrent ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: isCurrent ? 700 : 500,
                }}
              >
                {tab === 'ALL'
                  ? 'All Matches'
                  : tab === 'APPROVED_BY_MANAGER'
                  ? 'Approved'
                  : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* List / Grid of Mentor Matches */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LoadingSkeleton height="150px" lines={1} />
          <LoadingSkeleton height="150px" lines={1} />
          <LoadingSkeleton height="150px" lines={1} />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: '#eef2ff',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              No Pending Mentor Approvals
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
              {searchQuery
                ? `No mentorship matches match your search "${searchQuery}".`
                : 'There are currently no pending mentor recommendations in the queue. Click below to synthesize new AI matches across your department.'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={generatingLoading}
            onClick={handleAutoGenerate}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              gap: '0.45rem',
            }}
          >
            {generatingLoading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Users size={15} />
                <span>Generate Sample Recommendations</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredAssignments.map((item) => {
            const isProcessing = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className="glass-card course-card-hover"
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
                {/* Top Row: Meta Badges & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: '#f1f5f9',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      MATCH #{item.id}
                    </span>
                    {getStatusBadge(item.status)}
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      <BookOpen size={12} /> Skill: {item.skillName}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                {/* Mentee & Mentor Comparison Cards Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1rem',
                    alignItems: 'center',
                  }}
                >
                  {/* Mentee Details */}
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {item.menteeFullName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Mentee (Needs Guidance)
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.1rem 0', color: 'var(--text-primary)' }}>
                        {item.menteeFullName}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {item.menteeEmail}
                      </div>
                    </div>
                  </div>

                  {/* Mentor Details */}
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                    }}
                  >
                    <div
                      style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        flexShrink: 0,
                      }}
                    >
                      {item.mentorFullName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Assigned Mentor (Verified)
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0.1rem 0', color: 'var(--text-primary)' }}>
                        {item.mentorFullName}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {item.mentorEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Algorithmic Affinity Justification Note */}
                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)',
                    border: '1px solid #c7d2fe',
                    color: '#3730a3',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <ShieldCheck size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
                  <div>
                    <strong style={{ color: '#312e81' }}>Recommendation Justification: </strong>
                    <span>{item.notes || 'Algorithmic dynamic recommendation based on verified proficiency delta.'}</span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {item.managerFullName && (
                      <span>Reviewed by: <strong style={{ color: 'var(--text-secondary)' }}>{item.managerFullName}</strong></span>
                    )}
                  </div>

                  {item.status === 'RECOMMENDED' ? (
                    <div style={{ display: 'flex', gap: '0.65rem' }}>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        disabled={isProcessing}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.45rem 1rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                        }}
                      >
                        <XCircle size={15} color="#dc2626" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        disabled={isProcessing}
                        className="btn btn-primary"
                        style={{
                          padding: '0.45rem 1.25rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          background: 'var(--accent-success)',
                          border: 'none',
                        }}
                      >
                        <CheckCircle size={15} />
                        <span>{isProcessing ? 'Authorizing...' : 'Approve Mentorship'}</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Status: {item.status.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MentorApprovalPage;
