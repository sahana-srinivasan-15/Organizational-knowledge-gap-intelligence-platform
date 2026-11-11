import React, { useState, useEffect } from 'react';
import { courseApprovalApi } from '../../api/courseApprovalApi';
import { courseDiscoveryApi } from '../../api/courseDiscoveryApi';
import { mentorshipApi } from '../../api/mentorshipApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  BookOpen,
  Filter,
  Search,
  ExternalLink,
  MessageSquare,
  UserCheck,
  Calendar,
  Send,
} from 'lucide-react';

export const CourseApprovalManagementPage = () => {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Active request selected for review
  const [reviewingReq, setReviewingReq] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVED'); // 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
  const [managerComment, setManagerComment] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedAltCourseId, setSelectedAltCourseId] = useState('');
  const [selectedMentorId, setSelectedMentorId] = useState('');

  // Alternatives and mentor candidates for smart suggestions
  const [alternatives, setAlternatives] = useState([]);
  const [mentorCandidates, setMentorCandidates] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseApprovalApi.getDepartmentRequests({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        size: 50,
      });
      setRequests(extractArray(res));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load department course requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleOpenReview = async (req, defaultAction = 'APPROVED') => {
    setReviewingReq(req);
    setReviewAction(defaultAction);
    setManagerComment('');
    setSelectedAltCourseId('');
    setSelectedMentorId('');
    setTargetDate(req.targetCompletionDate || '');

    // Fetch smart alternatives if courseId is available
    if (req.courseId) {
      try {
        const altRes = await courseDiscoveryApi.getAlternatives(req.courseId);
        setAlternatives(altRes?.data || []);
      } catch {
        setAlternatives([]);
      }
    } else {
      setAlternatives([]);
    }

    // Fetch mentor recommendations for employee
    try {
      const mentorRes = await mentorshipApi.getEmployeeRecommendations(req.employeeProfileId);
      setMentorCandidates(mentorRes?.data || []);
    } catch {
      setMentorCandidates([]);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewAction === 'REJECTED' && !managerComment.trim()) {
      setError('Please provide a constructive reason for rejecting this course request.');
      return;
    }

    setSubmittingReview(true);
    setError(null);
    try {
      await courseApprovalApi.reviewRequest(reviewingReq.id, {
        status: reviewAction,
        managerComment: managerComment.trim(),
        alternativeCourseId: selectedAltCourseId ? parseInt(selectedAltCourseId, 10) : null,
        recommendedMentorProfileId: selectedMentorId ? parseInt(selectedMentorId, 10) : null,
        targetCompletionDate: targetDate || null,
      });

      setSuccessMsg(`Decision for request #${reviewingReq.id} recorded successfully as ${reviewAction}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setReviewingReq(null);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit review decision');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.employeeFullName?.toLowerCase().includes(term) ||
      r.externalCourseTitle?.toLowerCase().includes(term) ||
      r.externalCourseProvider?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Course Approval Governance Queue
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Review employee course proposals, verify skill gap alignments, suggest cost-effective alternatives, and assign peer mentors.
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'WITHDRAWN'].map((st) => (
            <button
              key={st}
              className={`btn ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
              onClick={() => setStatusFilter(st)}
            >
              {st === 'ALL' ? 'All Requests' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ width: '280px' }}>
          <div className="modern-search-wrapper">
            <Search size={16} className="modern-search-icon" />
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search employee or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="modern-search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Request Table / List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <LoadingSkeleton height="120px" lines={1} />
          <LoadingSkeleton height="120px" lines={1} />
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title={`No ${statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} requests found`}
          description="There are currently no employee course proposals matching your selected filters."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredRequests.map((req) => (
            <div key={req.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="badge badge-manager">{req.externalCourseProvider}</span>
                    <span
                      className="badge"
                      style={{
                        background:
                          req.status === 'APPROVED'
                            ? '#ecfdf5'
                            : req.status === 'REJECTED'
                            ? '#fee2e2'
                            : req.status === 'WITHDRAWN'
                            ? '#f1f5f9'
                            : '#fef3c7',
                        color:
                          req.status === 'APPROVED'
                            ? '#065f46'
                            : req.status === 'REJECTED'
                            ? '#991b1b'
                            : req.status === 'WITHDRAWN'
                            ? '#475569'
                            : '#92400e',
                        border: `1px solid ${
                          req.status === 'APPROVED'
                            ? '#a7f3d0'
                            : req.status === 'REJECTED'
                            ? '#fecaca'
                            : req.status === 'WITHDRAWN'
                            ? '#cbd5e1'
                            : '#fde68a'
                        }`,
                        fontWeight: 700,
                      }}
                    >
                      {req.status === 'WITHDRAWN' ? 'Withdrawn' : req.status}
                    </span>
                    <span className="badge" style={{ fontSize: '0.7rem' }}>Priority: {req.priority}</span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0.3rem 0' }}>
                    {req.externalCourseTitle}
                  </h3>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    <div>
                      Applicant: <strong style={{ color: '#0f172a' }}>{req.employeeFullName}</strong> ({req.employeeRoleTitle || 'Employee'})
                    </div>
                    <div>
                      Target Skill: <strong style={{ color: 'var(--accent-secondary)' }}>{req.targetSkillName}</strong>
                      {req.skillGap != null && (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}> &bull; Verified Gap: +{req.skillGap} levels</span>
                      )}
                    </div>
                    <div>
                      Cost: <strong style={{ color: '#0f172a' }}>{req.price > 0 ? `$${Number(req.price).toFixed(2)}` : 'Free'}</strong>
                    </div>
                  </div>
                </div>

                {/* Review Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        onClick={() => handleOpenReview(req, 'APPROVED')}
                      >
                        <CheckCircle2 size={15} /> Approve / Assign
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: '#f87171' }}
                        onClick={() => handleOpenReview(req, 'REJECTED')}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
                      onClick={() => handleOpenReview(req, req.status)}
                    >
                      View Details / Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Justification snippet */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <strong>Employee Justification: </strong> {req.reason}
              </div>

              {/* Existing Manager feedback if already reviewed */}
              {req.managerComment && (
                <div style={{ fontSize: '0.85rem', color: '#38bdf8', padding: '0.65rem 0.85rem', background: 'rgba(6,182,212,0.08)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Manager Feedback: </strong> "{req.managerComment}"
                  {req.recommendedMentorFullName && (
                    <span style={{ display: 'block', marginTop: '0.2rem', color: 'var(--accent-secondary)' }}>
                      Assigned Mentor: {req.recommendedMentorFullName}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review & Decision Modal */}
      {reviewingReq && (
        <Modal
          isOpen={Boolean(reviewingReq)}
          onClose={() => setReviewingReq(null)}
          title={`Review Course Proposal: ${reviewingReq.externalCourseTitle}`}
          maxWidth="700px"
        >
          <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Applicant & Course Summary Card */}
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem', fontSize: '1.1rem', fontWeight: 700 }}>{reviewingReq.employeeFullName}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role: {reviewingReq.employeeRoleTitle}</span>
                </div>
                <strong style={{ fontSize: '1rem', color: reviewingReq.price > 0 ? '#fff' : '#34d399' }}>
                  {reviewingReq.price > 0 ? `$${Number(reviewingReq.price).toFixed(2)}` : 'Free Course'}
                </strong>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                <div><strong>Target Competency:</strong> {reviewingReq.targetSkillName} (Verified Gap: +{reviewingReq.skillGap ?? 2} levels)</div>
                <div><strong>Reason:</strong> {reviewingReq.reason}</div>
              </div>
            </div>

            {/* Smart Alternative Suggestions */}
            {alternatives.length > 0 && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: '#fbbf24' }}>
                  <BookOpen size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                  Smart Alternative Recommendations (Available in Catalog):
                </label>
                <select
                  className="input"
                  value={selectedAltCourseId}
                  onChange={(e) => setSelectedAltCourseId(e.target.value)}
                >
                  <option value="">-- Keep Employee's Requested Course --</option>
                  {alternatives.map((alt) => (
                    <option key={alt.id} value={alt.id}>
                      {alt.title} ({alt.provider}) &bull; Rating: {alt.rating} &bull; {alt.isFree ? 'Free' : `$${alt.price}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Peer Mentor Assignment Recommendation */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--accent-secondary)' }}>
                <UserCheck size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
                Assign Verified Peer Mentor:
              </label>
              <select
                className="input"
                value={selectedMentorId}
                onChange={(e) => setSelectedMentorId(e.target.value)}
              >
                <option value="">-- No Mentor Assigned (Self-Study) --</option>
                {mentorCandidates.map((m) => (
                  <option key={m.mentorProfileId} value={m.mentorProfileId}>
                    {m.mentorFullName} ({m.departmentName || 'Engineering'}) &bull; Verified in {m.matchingSkills?.[0]?.skillName} (+{m.matchingSkills?.[0]?.proficiencyGain} gain)
                  </option>
                ))}
              </select>
            </div>

            {/* Target Completion Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Target Completion Deadline
              </label>
              <input
                type="date"
                className="input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            {/* Decision Radio Choice */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Approval Decision <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#059669', fontWeight: 700 }}>
                  <input
                    type="radio"
                    name="decision"
                    value="APPROVED"
                    checked={reviewAction === 'APPROVED'}
                    onChange={(e) => setReviewAction(e.target.value)}
                  />
                  Approve Course
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>
                  <input
                    type="radio"
                    name="decision"
                    value="REJECTED"
                    checked={reviewAction === 'REJECTED'}
                    onChange={(e) => setReviewAction(e.target.value)}
                  />
                  Reject Proposal
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#d97706', fontWeight: 700 }}>
                  <input
                    type="radio"
                    name="decision"
                    value="CHANGES_REQUESTED"
                    checked={reviewAction === 'CHANGES_REQUESTED'}
                    onChange={(e) => setReviewAction(e.target.value)}
                  />
                  Request Changes
                </label>
              </div>
            </div>

            {/* Manager Comments */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Manager Comments &amp; Guidance {reviewAction === 'REJECTED' && <span style={{ color: 'var(--accent-danger)' }}>*</span>}
              </label>
              <textarea
                className="input"
                rows={3}
                value={managerComment}
                onChange={(e) => setManagerComment(e.target.value)}
                placeholder="Add milestone expectations, budget justification, or feedback..."
                required={reviewAction === 'REJECTED'}
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReviewingReq(null)} disabled={submittingReview}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submittingReview}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Send size={15} />
                {submittingReview ? 'Recording Decision...' : 'Save Decision'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CourseApprovalManagementPage;
