import React, { useState, useEffect } from 'react';
import { weakAreaApi } from '../../api/weakAreaApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../common/LoadingSkeleton';
import ErrorAlert from '../common/ErrorAlert';
import Modal from '../common/Modal';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Star,
  MessageSquare,
  GraduationCap,
  FileText,
  Video,
  Code2,
  HelpCircle,
  Clock,
  UserCheck,
} from 'lucide-react';

export const WeakAreasSection = ({ employeeProfileId = null, isMentorView = false }) => {
  const [weakAreas, setWeakAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Review Modal State (For Employee)
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [completionStatus, setCompletionStatus] = useState('REVIEWED');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Mentor Feedback Modal State (For Mentor)
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [mentorSkill, setMentorSkill] = useState(null);
  const [mentorFeedbackText, setMentorFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchWeakAreas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = employeeProfileId
        ? await weakAreaApi.getEmployeeWeakAreas(employeeProfileId)
        : await weakAreaApi.getMyWeakAreas();
      const list = extractArray(res);
      setWeakAreas(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load weak areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeakAreas();
  }, [employeeProfileId]);

  const handleOpenReviewModal = (skill, material = null) => {
    setActiveSkill(skill);
    setSelectedMaterial(material);
    setRating(5);
    setReviewText('');
    setCompletionStatus('REVIEWED');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeSkill) return;
    setSubmittingReview(true);
    try {
      await weakAreaApi.submitReview(activeSkill.skillId, {
        materialId: selectedMaterial ? selectedMaterial.id : null,
        rating: parseInt(rating),
        reviewText,
        completionStatus,
      });
      setSuccessMsg(`Review submitted successfully for ${activeSkill.skillName}!`);
      setReviewModalOpen(false);
      fetchWeakAreas();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenMentorModal = (skill) => {
    setMentorSkill(skill);
    const existing = skill.reviews?.find((r) => r.mentorFeedback);
    setMentorFeedbackText(existing ? existing.mentorFeedback : '');
    setMentorModalOpen(true);
  };

  const handleSubmitMentorFeedback = async (e) => {
    e.preventDefault();
    if (!mentorSkill || !employeeProfileId) return;
    setSubmittingFeedback(true);
    try {
      await weakAreaApi.submitMentorFeedback(employeeProfileId, mentorSkill.skillId, {
        mentorFeedback: mentorFeedbackText,
        completionStatus: 'REVIEWED',
      });
      setSuccessMsg(`Advisory feedback submitted for ${mentorSkill.skillName}!`);
      setMentorModalOpen(false);
      fetchWeakAreas();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit mentor feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'CHEATSHEET':
        return FileText;
      case 'LAB_EXERCISE':
        return Code2;
      case 'VIDEO_GUIDE':
        return Video;
      case 'OFFICIAL_DOCS':
        return BookOpen;
      default:
        return HelpCircle;
    }
  };

  if (loading) {
    return <LoadingSkeleton height="140px" count={2} />;
  }

  const weakSkills = weakAreas.filter((w) => w.isWeakArea);

  return (
    <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#D97706', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <AlertTriangle size={15} /> Identified Weak Areas & Targeted Study Materials
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0 0' }}>
            Skill Gap Remediation & Material Reviews
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Curated hands-on labs, cheatsheets, and peer mentor reviews addressing specific competency gaps and diagnostic assessment misses.
          </p>
        </div>

        <span style={{ fontSize: '0.825rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontWeight: 700 }}>
          {weakSkills.length} Priority Focus Area{weakSkills.length === 1 ? '' : 's'}
        </span>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {error && <ErrorAlert message={error} style={{ marginBottom: '1rem' }} />}

      {weakAreas.length === 0 ? (
        <div style={{ backgroundColor: '#F8FAFC', padding: '2rem', textAlign: 'center', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
          <CheckCircle2 size={36} style={{ color: '#10B981', margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>No Critical Weak Areas Detected</h3>
          <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Current verified competencies satisfy all target job role proficiencies.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {weakAreas.map((w) => {
            const hasReviews = w.reviews && w.reviews.length > 0;
            const mentorReview = w.reviews?.find((r) => r.mentorFeedback);

            return (
              <div
                key={w.skillId}
                style={{
                  backgroundColor: '#ffffff',
                  border: w.isWeakArea ? '1.5px solid #FCD34D' : '1px solid #E2E8F0',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  boxShadow: w.isWeakArea ? '0 4px 12px rgba(245, 158, 11, 0.08)' : 'none',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                        {w.skillName}
                      </h3>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#F1F5F9', color: '#475569', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontWeight: 600 }}>
                        {w.categoryName}
                      </span>
                      {w.isWeakArea ? (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#FEF2F2', color: '#DC2626', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700, border: '1px solid #FECACA' }}>
                          Needs Improvement
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', backgroundColor: '#ECFDF5', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '0.375rem', fontWeight: 700 }}>
                          Proficient
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#D97706', fontSize: '0.825rem', marginTop: '0.35rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={13} /> {w.reason}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#F8FAFC', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.825rem' }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Current: </span>
                      <strong style={{ color: '#0F172A' }}>Level {w.currentProficiency}</strong>
                    </div>
                    <div style={{ color: '#CBD5E1' }}>|</div>
                    <div>
                      <span style={{ color: '#64748B' }}>Required: </span>
                      <strong style={{ color: '#0F172A' }}>Level {w.requiredProficiency}</strong>
                    </div>
                    {w.gap > 0 && (
                      <>
                        <div style={{ color: '#CBD5E1' }}>|</div>
                        <div style={{ color: '#DC2626', fontWeight: 700 }}>
                          Gap: -{w.gap}
                        </div>
                      </>
                    )}
                    {w.diagnosticScore !== null && (
                      <>
                        <div style={{ color: '#CBD5E1' }}>|</div>
                        <div>
                          <span style={{ color: '#64748B' }}>Diagnostic: </span>
                          <strong style={{ color: w.diagnosticPassed ? '#059669' : '#DC2626' }}>
                            {Math.round(w.diagnosticScore)}%
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Assigned Mentor Callout */}
                {w.mentorName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#4338CA', backgroundColor: '#EEF2FF', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', marginBottom: '1rem' }}>
                    <UserCheck size={14} /> Assigned Mentor for this Skill: <strong>{w.mentorName}</strong>
                  </div>
                )}

                {/* Mentor Feedback Banner if present */}
                {mentorReview && (
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.5rem', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#166534', fontWeight: 700, fontSize: '0.825rem', marginBottom: '0.3rem' }}>
                      Mentor Advisory Guidance from {mentorReview.mentorName || 'Domain Mentor'}:
                    </div>
                    <p style={{ color: '#14532D', fontSize: '0.85rem', margin: 0, fontStyle: 'italic', lineHeight: 1.45 }}>
                      "{mentorReview.mentorFeedback}"
                    </p>
                  </div>
                )}

                {/* Tailored Study Materials Section */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem' }}>
                    Recommended Remedial Learning Materials:
                  </div>

                  {w.materials && w.materials.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                      {w.materials.map((m) => {
                        const IconComponent = getMaterialIcon(m.materialType);
                        return (
                          <div
                            key={m.id}
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '0.5rem',
                              padding: '0.85rem',
                              backgroundColor: '#FAFAFA',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '0.15rem 0.45rem', borderRadius: '0.25rem' }}>
                                  <IconComponent size={12} /> {m.materialType.replace('_', ' ')}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Clock size={11} /> {m.estimatedMinutes}m
                                </span>
                              </div>
                              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', margin: '0 0 0.25rem 0' }}>
                                {m.title}
                              </h4>
                              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                                {m.description}
                              </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9' }}>
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  flex: 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: '#4F46E5',
                                  color: '#ffffff',
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                }}
                              >
                                <ExternalLink size={12} /> Study Now
                              </a>

                              {!isMentorView && (
                                <button
                                  onClick={() => handleOpenReviewModal(w, m)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.3rem',
                                    backgroundColor: '#ffffff',
                                    color: '#334155',
                                    border: '1px solid #CBD5E1',
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Star size={12} style={{ color: '#F59E0B' }} /> Rate
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.825rem', color: '#64748B', fontStyle: 'italic' }}>
                      Materials currently being curated for this domain.
                    </div>
                  )}
                </div>

                {/* Submitted Reviews & Action Bar */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {hasReviews ? (
                      w.reviews.map((r) => (
                        <div key={r.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#F8FAFC', padding: '0.25rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#475569' }}>
                          <span style={{ display: 'flex', alignItems: 'center', color: '#F59E0B' }}>
                            {[...Array(r.rating || 5)].map((_, i) => (
                              <Star key={i} size={11} fill="#F59E0B" />
                            ))}
                          </span>
                          <span>{r.reviewText ? `"${r.reviewText.slice(0, 40)}..."` : 'Reviewed'}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>No reviews recorded yet</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isMentorView ? (
                      <button
                        onClick={() => handleOpenMentorModal(w)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <MessageSquare size={13} /> Provide Mentor Advisory Feedback
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenReviewModal(w)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          padding: '0.45rem 0.85rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Star size={13} style={{ color: '#F59E0B' }} /> Submit Skill Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Employee Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Review Material for ${activeSkill?.skillName || 'Skill'}`}
      >
        <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {selectedMaterial && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
              <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Selected Material:</div>
              <strong style={{ color: '#0F172A' }}>{selectedMaterial.title}</strong>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Your Star Rating (1 - 5)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                  }}
                >
                  <Star
                    size={26}
                    fill={star <= rating ? '#F59E0B' : 'none'}
                    color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                  />
                </button>
              ))}
              <span style={{ marginLeft: '0.5rem', fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Remedial Review & Key Takeaways
            </label>
            <textarea
              required
              rows={3}
              placeholder="How did this material help address your weak area? (e.g., cleared up virtual thread scheduler details)"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Remediation Status
            </label>
            <select
              value={completionStatus}
              onChange={(e) => setCompletionStatus(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            >
              <option value="REVIEWED">Reviewed (In Progress)</option>
              <option value="MASTERED">Mastered (Ready for Re-Assessment)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#4F46E5', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              {submittingReview ? 'Submitting...' : 'Save Review'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mentor Feedback Modal */}
      <Modal
        isOpen={mentorModalOpen}
        onClose={() => setMentorModalOpen(false)}
        title={`Mentor Advisory Feedback on ${mentorSkill?.skillName || 'Skill'}`}
      >
        <form onSubmit={handleSubmitMentorFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
            Provide actionable mentorship advice, recommended reading, and milestone expectations for this mentee's weak area.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Actionable Mentor Advice & Next Steps *
            </label>
            <textarea
              required
              rows={4}
              placeholder="e.g. Focus on query indexing and buffer cache hits before attempting the complex join queries..."
              value={mentorFeedbackText}
              onChange={(e) => setMentorFeedbackText(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setMentorModalOpen(false)}
              style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingFeedback}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              {submittingFeedback ? 'Saving...' : 'Submit Mentor Feedback'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WeakAreasSection;

