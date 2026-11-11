import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseApprovalApi } from '../../api/courseApprovalApi';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  UserCheck,
  BookOpen,
  MessageSquare,
  Compass,
  Undo2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export const MyCourseRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Withdrawal state & confirmation modal
  const [withdrawingReq, setWithdrawingReq] = useState(null);
  const [withdrawingLoading, setWithdrawingLoading] = useState(false);

  // Deletion state & confirmation modal
  const [deletingReq, setDeletingReq] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseApprovalApi.getMyRequests();
      setRequests(res?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load your course approval requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleConfirmWithdraw = async () => {
    if (!withdrawingReq) return;
    setWithdrawingLoading(true);
    setError(null);
    try {
      await courseApprovalApi.withdrawRequest(withdrawingReq.id);
      setSuccessMsg(`Course request for "${withdrawingReq.externalCourseTitle}" has been successfully withdrawn.`);
      setWithdrawingReq(null);
      await fetchRequests();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to withdraw course request');
    } finally {
      setWithdrawingLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReq) return;
    setDeletingLoading(true);
    setError(null);
    try {
      await courseApprovalApi.deleteRequest(deletingReq.id);
      setSuccessMsg(`Course request for "${deletingReq.externalCourseTitle}" has been permanently removed.`);
      setDeletingReq(null);
      await fetchRequests();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove course request');
    } finally {
      setDeletingLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#92400e',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <Clock size={12} /> Pending Manager Review
          </span>
        );
      case 'APPROVED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={12} /> Approved &amp; Enrolled
          </span>
        );
      case 'REJECTED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <XCircle size={12} /> Rejected
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#ffedd5',
              border: '1px solid #fed7aa',
              color: '#9a3412',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <AlertCircle size={12} /> Changes Requested
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#475569',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <Undo2 size={12} /> Withdrawn
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner - Modern White Theme */}
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
              <FileCheck size={13} /> Proposal Tracker
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tuition &amp; Upskilling Approvals</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            My Course Approval Requests
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, maxWidth: '640px' }}>
            Track the status of your submitted course proposals, manager review decisions, and assigned peer mentors.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/course-discovery')}
          style={{
            height: '44px',
            padding: '0 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontWeight: 700,
          }}
        >
          <Compass size={16} /> Discover More Courses
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchRequests} />}

      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#065f46',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LoadingSkeleton height="140px" lines={1} />
          <LoadingSkeleton height="140px" lines={1} />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No Course Requests Submitted"
          description="You haven't requested approval for any courses yet. Explore our multi-platform catalog and request your first upskilling course."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {requests.map((req) => (
            <div
              key={req.id}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#f8fafc',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {req.externalCourseProvider}
                    </span>
                    {getStatusBadge(req.status)}
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: '#f1f5f9',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                      }}
                    >
                      Priority: {req.priority}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.35rem 0', color: 'var(--text-primary)' }}>
                    {req.externalCourseTitle}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Target Skill: <strong style={{ color: 'var(--text-secondary)' }}>{req.targetSkillName || 'Core Competency'}</strong>
                    {req.skillGap != null && ` (Verified Gap: +${req.skillGap} levels)`} &bull; Cost: {req.price > 0 ? `$${Number(req.price).toFixed(2)}` : 'Free'} &bull; Submitted: {req.createdAt ? req.createdAt.slice(0, 10) : 'Recent'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {req.status === 'APPROVED' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-full)' }}
                      onClick={() => navigate('/learning-path')}
                    >
                      View in Roadmap <ArrowRight size={14} />
                    </button>
                  )}

                  {(req.status === 'PENDING' || req.status === 'CHANGES_REQUESTED') && (
                    <button
                      type="button"
                      onClick={() => setWithdrawingReq(req)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        borderRadius: 'var(--radius-md)',
                        background: '#ffffff',
                        border: '1px solid #fca5a5',
                        color: '#dc2626',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <Undo2 size={14} /> Withdraw Request
                    </button>
                  )}

                  {(req.status === 'WITHDRAWN' || req.status === 'REJECTED' || req.status === 'COMPLETED') && (
                    <button
                      type="button"
                      onClick={() => setDeletingReq(req)}
                      title="Remove course request from list"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        borderRadius: 'var(--radius-md)',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <Trash2 size={14} color="#ef4444" /> Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Justification note */}
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  background: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ color: 'var(--text-primary)' }}>Your Reason: </strong> {req.reason}
                {req.expectedOutcome && (
                  <div style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Expected Outcome: </strong> {req.expectedOutcome}
                  </div>
                )}
              </div>

              {/* Manager Feedback & Mentor Assignment */}
              {(req.managerComment || req.recommendedMentorFullName || req.alternativeCourseTitle) && (
                <div
                  style={{
                    padding: '0.95rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background:
                      req.status === 'APPROVED'
                        ? '#ecfdf5'
                        : req.status === 'REJECTED'
                        ? '#fef2f2'
                        : '#fffbeb',
                    border: `1px solid ${
                      req.status === 'APPROVED'
                        ? '#a7f3d0'
                        : req.status === 'REJECTED'
                        ? '#fecaca'
                        : '#fde68a'
                    }`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color:
                        req.status === 'APPROVED'
                          ? '#065f46'
                          : req.status === 'REJECTED'
                          ? '#991b1b'
                          : '#92400e',
                    }}
                  >
                    <MessageSquare size={15} /> Manager Review Feedback:
                  </div>

                  {req.managerComment && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      &ldquo;{req.managerComment}&rdquo;
                    </p>
                  )}

                  {req.recommendedMentorFullName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                      <UserCheck size={14} /> Assigned Peer Mentor: <strong style={{ color: 'var(--text-primary)' }}>{req.recommendedMentorFullName}</strong>
                    </div>
                  )}

                  {req.alternativeCourseTitle && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: '#b45309', fontWeight: 600 }}>
                      <BookOpen size={14} /> Manager Suggested Alternative: <strong style={{ color: 'var(--text-primary)' }}>{req.alternativeCourseTitle}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Withdraw Request Confirmation Modal */}
      {withdrawingReq && (
        <Modal
          isOpen={!!withdrawingReq}
          onClose={() => !withdrawingLoading && setWithdrawingReq(null)}
          title="Withdraw Course Request"
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#dc2626',
                }}
              >
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  Are you sure you want to withdraw this request?
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  You are about to withdraw your tuition approval request for <strong>{withdrawingReq.externalCourseTitle}</strong> ({withdrawingReq.externalCourseProvider}).
                  Your manager will no longer be asked to review this proposal.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={withdrawingLoading}
                onClick={() => setWithdrawingReq(null)}
                style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawingLoading}
                onClick={handleConfirmWithdraw}
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  cursor: withdrawingLoading ? 'not-allowed' : 'pointer',
                  opacity: withdrawingLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {withdrawingLoading ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete / Remove Request Confirmation Modal */}
      {deletingReq && (
        <Modal
          isOpen={!!deletingReq}
          onClose={() => !deletingLoading && setDeletingReq(null)}
          title="Remove Course Request"
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#dc2626',
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  Remove this course request?
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                  Are you sure you want to permanently remove the request for <strong>{deletingReq.externalCourseTitle}</strong> ({deletingReq.externalCourseProvider})? This will remove it from your course requests list.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deletingLoading}
                onClick={() => setDeletingReq(null)}
                style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingLoading}
                onClick={handleConfirmDelete}
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  cursor: deletingLoading ? 'not-allowed' : 'pointer',
                  opacity: deletingLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {deletingLoading ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyCourseRequestsPage;
