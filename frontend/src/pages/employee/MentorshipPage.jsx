import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mentorshipApi } from '../../api/mentorshipApi';
import { authApi } from '../../api/authApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import MentorshipChatModal from '../../components/mentorship/MentorshipChatModal';
import {
  Users2,
  Clock,
  UserCheck,
  CheckCircle2,
  Shield,
  Settings,
  Send,
  Award,
  FileCheck2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';

export const MentorshipPage = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatAssignment, setChatAssignment] = useState(null);

  // Form states for mentor opt-in
  const [mentorOptIn, setMentorOptIn] = useState(false);
  const [availabilityHrs, setAvailabilityHrs] = useState(5);
  const [maxCapacity, setMaxCapacity] = useState(3);
  const [savingSettings, setSavingSettings] = useState(false);

  // Assignment request state
  const [requestingMentorId, setRequestingMentorId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [recsRes, profileRes, eligRes, assignRes] = await Promise.allSettled([
        typeof mentorshipApi.getOwnRecommendations === 'function' ? mentorshipApi.getOwnRecommendations() : Promise.resolve([]),
        typeof authApi.getEmployeeProfile === 'function' ? authApi.getEmployeeProfile() : Promise.resolve(null),
        typeof authApi.getMentorEligibility === 'function' ? authApi.getMentorEligibility() : Promise.resolve(null),
        typeof mentorshipApi.getAssignments === 'function' ? mentorshipApi.getAssignments() : Promise.resolve([]),
      ]);

      if (recsRes.status === 'fulfilled') setRecommendations(extractArray(recsRes.value));
      if (assignRes.status === 'fulfilled') setAssignments(extractArray(assignRes.value));
      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value?.data;
        setProfile(p);
        if (p) {
          setMentorOptIn(p.mentorOptIn || false);
          setAvailabilityHrs(p.mentorAvailabilityHrsPerWeek || 5);
          setMaxCapacity(p.maxMenteesCapacity || p.maxMentees || 3);
        }
      }
      if (eligRes.status === 'fulfilled' && eligRes.value?.data) {
        setEligibility(eligRes.value.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load mentorship information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (mentorOptIn && eligibility && !eligibility.eligible) {
      setError('Mentor eligibility required: You must upload a course completion certificate and pass the diagnostic assessment before opting in as a mentor.');
      return;
    }
    setSavingSettings(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await authApi.updateMentorStatus({
        mentorOptIn: Boolean(mentorOptIn),
        mentorAvailabilityHrsPerWeek: Number(availabilityHrs) || 5,
        maxMenteesCapacity: Number(maxCapacity) || 3,
      });
      setSuccessMsg('Your peer mentorship settings have been updated successfully!');
      await loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update mentorship settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleRequestMentorship = async (candidate) => {
    const mentorId = candidate.mentorProfileId || candidate.candidateEmployeeProfileId || candidate.id;
    const mentorName = candidate.mentorFullName || candidate.candidateFullName || 'Peer Mentor';
    const matchedSkills = Array.isArray(candidate.matchedSkills)
      ? candidate.matchedSkills
      : Array.isArray(candidate.matchingSkills)
      ? candidate.matchingSkills
      : [];
    const skillId = matchedSkills[0]?.skillId || 1;
    const menteeProfileId = profile?.id || 2;

    if (!menteeProfileId || !mentorId) {
      setError('Unable to submit request: Missing employee or mentor profile identifier.');
      return;
    }

    setRequestingMentorId(mentorId);
    setError(null);
    setSuccessMsg(null);
    try {
      // Create assignment request for manager approval
      await mentorshipApi.createRecommendationAssignment(
        menteeProfileId,
        mentorId,
        skillId,
        `Mentee-initiated request: Matched on verified proficiency (${Math.round((candidate.overallScore || 0.9) * 100)}% affinity)`
      );
      setSuccessMsg(`Mentorship request submitted for ${mentorName}! Pending manager approval.`);
      await loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit mentorship request');
    } finally {
      setRequestingMentorId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Dynamic Peer Mentorship</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <LoadingSkeleton height="200px" lines={1} />
          <LoadingSkeleton height="200px" lines={1} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem', color: '#0f172a' }}>
          Dynamic Peer Mentorship Matching
        </h2>
        <p style={{ color: '#475569', fontSize: '0.9rem', fontWeight: 500 }}>
          Algorithmic matching evaluates verified skill delta, availability, workload capacity, and department affinity.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

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
          }}
        >
          {successMsg}
        </div>
      )}

      {/* My Mentorship Connections & Requests */}
      {(() => {
        const myPairings = (Array.isArray(assignments) ? assignments : []).filter(
          (a) => (profile?.id && (a.menteeProfileId === profile.id || a.menteeId === profile.id)) ||
                 (profile?.userId && a.menteeUserId === profile.userId)
        );

        if (myPairings.length === 0) return null;

        return (
          <div
            className="glass-card"
            style={{
              padding: '1.5rem',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users2 size={20} color="var(--accent-primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                My Mentorship Connections &amp; Requests ({myPairings.length})
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {myPairings.map((p) => {
                const isPending = p.status === 'RECOMMENDED';
                const isActive = p.status === 'APPROVED_BY_MANAGER' || p.status === 'ACTIVE';

                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      background: isPending ? '#fffbeb' : isActive ? '#f0fdf4' : '#f8fafc',
                      border: `1px solid ${isPending ? '#fde68a' : isActive ? '#bbf7d0' : '#e2e8f0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                            {p.mentorFullName || 'Assigned Mentor'}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                            Target Skill: <strong style={{ color: '#0f172a' }}>{p.skillName || 'Competency'}</strong>
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            background: isPending ? '#fef3c7' : isActive ? '#dcfce7' : '#f1f5f9',
                            color: isPending ? '#92400e' : isActive ? '#15803d' : '#475569',
                            border: `1px solid ${isPending ? '#fcd34d' : isActive ? '#86efac' : '#cbd5e1'}`,
                          }}
                        >
                          {isPending ? '⏳ Pending Manager Approval' : isActive ? '✓ Active Mentorship' : p.status}
                        </span>
                      </div>

                      {p.notes && (
                        <p style={{ fontSize: '0.78rem', color: '#334155', margin: '0.4rem 0 0', lineHeight: 1.45 }}>
                          {p.notes}
                        </p>
                      )}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.55rem' }}>
                      <span>Pairing #{p.id} &bull; {p.assignedAt ? `Assigned: ${new Date(p.assignedAt).toLocaleDateString()}` : `Requested: ${new Date(p.createdAt || Date.now()).toLocaleDateString()}`}</span>
                      {isActive && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            setChatAssignment({
                              id: p.id,
                              mentorName: p.mentorFullName || 'Mentor',
                              menteeName: profile?.user?.fullName || 'Mentee',
                              skillName: p.skillName || 'Skill',
                            });
                            setIsChatOpen(true);
                          }}
                          style={{
                            padding: '0.3rem 0.75rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            borderRadius: 'var(--radius-full)',
                          }}
                        >
                          <MessageSquare size={13} />
                          <span>Chat with Mentor</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Top Section: Recommended Mentors */}
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
          <UserCheck size={20} color="var(--accent-primary)" />
          Colleagues Recommended as Mentors for Your Gaps
        </h3>

        {(() => {
          const safeRecs = Array.isArray(recommendations) ? recommendations : [];
          if (safeRecs.length === 0) {
            return (
              <EmptyState
                icon={Users2}
                title="No Mentor Recommendations"
                description="As you evaluate your diagnostic assessments and target role gaps, peers with matching competencies will be recommended automatically."
              />
            );
          }

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
              {safeRecs.map((rec) => {
                const mentorId = rec.mentorProfileId || rec.candidateEmployeeProfileId || rec.id;
                const mentorName = rec.mentorFullName || rec.candidateFullName || 'Peer Mentor';
                const matchedSkills = Array.isArray(rec.matchedSkills)
                  ? rec.matchedSkills
                  : Array.isArray(rec.matchingSkills)
                  ? rec.matchingSkills
                  : [];
                const availableHours = rec.availableHoursPerWeek ?? rec.mentorAvailabilityHrsPerWeek ?? 5;
                const currentMentees = rec.currentMenteeCount ?? rec.activeMenteeCount ?? 0;
                const maxCapacity = rec.maxMentees ?? rec.maxMenteesCapacity ?? 3;
                const affinityPercent = Math.round((rec.overallScore || 0.85) * 100);

                const isRequesting = requestingMentorId === mentorId;

                const existingPairing = (Array.isArray(assignments) ? assignments : []).find(
                  (a) => (a.mentorProfileId === mentorId || a.mentorId === mentorId) &&
                         (a.status === 'RECOMMENDED' || a.status === 'APPROVED_BY_MANAGER' || a.status === 'ACTIVE')
                );
                const isPending = existingPairing?.status === 'RECOMMENDED';
                const isActive = existingPairing?.status === 'APPROVED_BY_MANAGER' || existingPairing?.status === 'ACTIVE';

                return (
                  <div
                    key={mentorId || mentorName}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.25rem', color: '#0f172a' }}>
                            {mentorName}
                          </h4>
                          <p style={{ fontSize: '0.825rem', color: '#475569', margin: 0, fontWeight: 500 }}>
                            Department: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{rec.departmentName || 'Engineering'}</strong>
                            {rec.currentJobRoleTitle && <span> &bull; {rec.currentJobRoleTitle}</span>}
                          </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: '#047857',
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              padding: '0.2rem 0.6rem',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-block',
                            }}
                          >
                            {affinityPercent}%
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, marginTop: '0.2rem' }}>Match Affinity</div>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.55, margin: '0.85rem 0', fontWeight: 500 }}>
                        {rec.explanation}
                      </p>

                      {/* Verified Matching Skills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '1.25rem' }}>
                        {matchedSkills.map((s, idx) => {
                          const sLevel = s.mentorVerifiedProficiency ?? s.mentorProficiencyLevel ?? 5;
                          const sGain = s.proficiencyGain ?? s.proficiencyDelta ?? 1;
                          return (
                            <span
                              key={s.skillId || idx}
                              style={{
                                padding: '0.25rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: '#eef2ff',
                                border: '1px solid #c7d2fe',
                                color: '#3730a3',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              {s.skillName} (Level {sLevel} verified, +{sGain} gain)
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 0.95rem',
                          borderRadius: 'var(--radius-md)',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          marginBottom: '1rem',
                          fontSize: '0.8rem',
                          color: '#334155',
                          fontWeight: 600,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={15} color="#d97706" />
                          <span style={{ color: '#334155' }}>{availableHours} hrs/week available</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UserCheck size={15} color="#0284c7" />
                          <span style={{ color: '#334155' }}>{currentMentees} / {maxCapacity} active mentees</span>
                        </div>
                      </div>

                      {isPending ? (
                        <div
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: '#fffbeb',
                            color: '#92400e',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            border: '1px solid #fde68a',
                          }}
                        >
                          <Clock size={15} color="#d97706" />
                          <span>Request Submitted (Pending Approval)</span>
                        </div>
                      ) : isActive ? (
                        <div
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: '#ecfdf5',
                            color: '#065f46',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            border: '1px solid #a7f3d0',
                          }}
                        >
                          <CheckCircle2 size={15} color="#059669" />
                          <span>Active Mentorship Connected</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRequestMentorship(rec)}
                          disabled={isRequesting}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            boxShadow: 'var(--shadow-sm)',
                            cursor: isRequesting ? 'not-allowed' : 'pointer',
                            opacity: isRequesting ? 0.7 : 1,
                            border: 'none',
                          }}
                        >
                          <Send size={15} />
                          <span>{isRequesting ? 'Submitting Request...' : 'Request Mentorship'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Bottom Section: My Mentorship Capacity Settings */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          maxWidth: '750px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <Settings size={22} color="var(--accent-primary)" />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              My Mentorship Opt-In &amp; Workload Capacity
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#475569', margin: '0.2rem 0 0', fontWeight: 500 }}>
              Employees who complete courses with certificates and pass diagnostic quizzes qualify to mentor colleagues.
            </p>
          </div>
        </div>

        {/* Mentor Qualification & Eligibility Gate Checklist */}
        <div
          style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: eligibility?.eligible ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${eligibility?.eligible ? '#bbf7d0' : '#fde68a'}`,
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color={eligibility?.eligible ? '#15803d' : '#b45309'} />
              <h4 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Peer Mentor Qualification &amp; Eligibility Gate
              </h4>
            </div>

            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                background: eligibility?.eligible ? '#dcfce7' : '#fef3c7',
                color: eligibility?.eligible ? '#15803d' : '#b45309',
                border: `1px solid ${eligibility?.eligible ? '#86efac' : '#fcd34d'}`,
              }}
            >
              {eligibility?.eligible ? '✓ Eligible to Mentor' : 'Eligibility In Progress'}
            </span>
          </div>

          <p style={{ fontSize: '0.825rem', color: '#475569', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
            To ensure verifiable subject mastery, employees must upload a verified course completion certificate <strong>and</strong> attend &amp; pass the diagnostic assessment before becoming a peer mentor.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {/* Requirement 1: Certificate */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: '#ffffff',
                border: `1px solid ${eligibility?.hasUploadedCertificate ? '#bbf7d0' : '#fed7aa'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.65rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileCheck2 size={16} color={eligibility?.hasUploadedCertificate ? '#16a34a' : '#d97706'} />
                    1. Course Certificate
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: eligibility?.hasUploadedCertificate ? '#dcfce7' : '#fff7ed',
                      color: eligibility?.hasUploadedCertificate ? '#16a34a' : '#c2410c',
                    }}
                  >
                    {eligibility?.hasUploadedCertificate ? `✓ Verified (${eligibility.certificateCount || 1})` : 'Pending'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  {eligibility?.hasUploadedCertificate
                    ? 'Course completion certificate uploaded & verified.'
                    : 'Complete a course on your roadmap and upload the completion certificate.'}
                </div>
              </div>

              {!eligibility?.hasUploadedCertificate && (
                <button
                  type="button"
                  onClick={() => navigate('/learning-path')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Upload Certificate on Roadmap ↗
                </button>
              )}
            </div>

            {/* Requirement 2: Diagnostic Assessment */}
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: '#ffffff',
                border: `1px solid ${eligibility?.hasPassedAssessment ? '#bbf7d0' : '#fed7aa'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.65rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={16} color={eligibility?.hasPassedAssessment ? '#16a34a' : '#d97706'} />
                    2. Diagnostic Quiz Pass
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: eligibility?.hasPassedAssessment ? '#dcfce7' : '#fff7ed',
                      color: eligibility?.hasPassedAssessment ? '#16a34a' : '#c2410c',
                    }}
                  >
                    {eligibility?.hasPassedAssessment ? `✓ Passed (${eligibility.passedAssessmentsCount || 1})` : 'Pending'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                  {eligibility?.hasPassedAssessment
                    ? 'Verified mastery demonstrated via passed diagnostic assessment.'
                    : 'Attend and pass the skill diagnostic assessment (benchmark >= 70%).'}
                </div>
              </div>

              {!eligibility?.hasPassedAssessment && (
                <button
                  type="button"
                  onClick={() => navigate('/assessments')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#4338ca',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Take Diagnostic Quiz ↗
                </button>
              )}
            </div>
          </div>

          {/* Course-by-Course Mentorship Qualifications Section */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Award size={18} color="#4f46e5" />
                <h5 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Course-by-Course Mentorship Qualifications ({eligibility?.qualifiedCoursesCount ?? (eligibility?.eligible ? 1 : 0)} Qualified)
                </h5>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  background: (eligibility?.qualifiedCoursesCount || (eligibility?.eligible ? 1 : 0)) > 0 ? '#dcfce7' : '#fee2e2',
                  color: (eligibility?.qualifiedCoursesCount || (eligibility?.eligible ? 1 : 0)) > 0 ? '#15803d' : '#991b1b',
                  border: `1px solid ${(eligibility?.qualifiedCoursesCount || (eligibility?.eligible ? 1 : 0)) > 0 ? '#86efac' : '#fca5a5'}`,
                }}
              >
                {(eligibility?.qualifiedCoursesCount || (eligibility?.eligible ? 1 : 0)) > 0
                  ? `✓ ${eligibility?.qualifiedCoursesCount || 1} Course(s) Qualified`
                  : '0 Courses Qualified'}
              </span>
            </div>

            {/* Explicit Mentorship Policy Notice Banner */}
            <div
              style={{
                padding: '0.75rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                fontSize: '0.78rem',
                color: '#334155',
                marginBottom: '1rem',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: '#0f172a' }}>📌 Mandatory Course Mentorship Policy:</strong> A mentor is authorized <span style={{ textDecoration: 'underline' }}>strictly for courses</span> where they have uploaded an authentic certificate <strong>and</strong> attended &amp; passed the diagnostic quiz. To mentor in any subsequent or next course, this exact process must be repeated for each course.
            </div>

            {/* List of Courses and their Mentorship Eligibility Status */}
            {Array.isArray(eligibility?.courseQualifications) && eligibility.courseQualifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {eligibility.courseQualifications.map((cq) => {
                  const isQualified = Boolean(cq.isMentorQualified);
                  const certOk = Boolean(cq.certificateUploaded);
                  const quizOk = Boolean(cq.quizPassed);

                  return (
                    <div
                      key={cq.courseId}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isQualified ? '#ffffff' : '#f8fafc',
                        border: `1px solid ${isQualified ? '#86efac' : '#e2e8f0'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                              {cq.courseTitle}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 'var(--radius-sm)',
                                background: '#f1f5f9',
                                color: '#475569',
                                fontWeight: 700,
                              }}
                            >
                              {cq.courseProvider || 'Coursera'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                            Primary Competency: <strong style={{ color: '#334155' }}>{cq.primarySkillName || 'Software Engineering'}</strong>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            background: isQualified ? '#dcfce7' : '#fff7ed',
                            color: isQualified ? '#15803d' : '#c2410c',
                            border: `1px solid ${isQualified ? '#86efac' : '#fed7aa'}`,
                          }}
                        >
                          {isQualified ? '🏆 Qualified Course Mentor' : '🔒 Not Qualified'}
                        </span>
                      </div>

                      {/* Criteria Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: certOk ? '#15803d' : '#92400e' }}>
                          <FileCheck2 size={14} color={certOk ? '#16a34a' : '#d97706'} />
                          <span>
                            {certOk ? `Certificate: Verified (${cq.certificateFileName || 'Authentic'})` : 'Certificate: Missing'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: quizOk ? '#15803d' : '#b91c1c' }}>
                          <Award size={14} color={quizOk ? '#16a34a' : '#dc2626'} />
                          <span>
                            {quizOk
                              ? `Quiz: Passed (${cq.quizScore != null ? cq.quizScore + '%' : '100%'})`
                              : cq.quizAttended
                              ? `Quiz: Failed (${cq.quizScore != null ? cq.quizScore + '%' : 'Retake Required'})`
                              : 'Quiz: Not Attended'}
                          </span>
                        </div>
                      </div>

                      {/* Guidance & Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.4rem' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {cq.guidanceMessage}
                        </span>

                        {!isQualified && (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {!certOk && (
                              <button
                                type="button"
                                onClick={() => navigate('/learning-path')}
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#fff',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#334155',
                                  cursor: 'pointer',
                                }}
                              >
                                Upload Cert ↗
                              </button>
                            )}
                            {!quizOk && (
                              <button
                                type="button"
                                onClick={() => navigate('/assessments')}
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#eef2ff',
                                  border: '1px solid #c7d2fe',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#4338ca',
                                  cursor: 'pointer',
                                }}
                              >
                                Attend Quiz ↗
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Repeat for Next Course Callout */}
            <div
              style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#1e1b4b', display: 'block' }}>
                  🎯 Want to mentor peers in another course?
                </span>
                <span style={{ fontSize: '0.75rem', color: '#4338ca' }}>
                  Repeat this process for your next course: upload completion certificate &amp; pass the diagnostic quiz.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => navigate('/learning-path')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#4f46e5',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Explore Next Course on Roadmap ↗
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/courses')}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#ffffff',
                    color: '#4f46e5',
                    border: '1px solid #c7d2fe',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Course Catalog ↗
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Toggle */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                  Opt-in as Peer Mentor
                </span>
                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                  Allow the platform to recommend you to colleagues seeking skills you are verified in
                </span>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: eligibility && !eligibility.eligible ? 'not-allowed' : 'pointer' }}>
                <input
                  type="checkbox"
                  disabled={eligibility && !eligibility.eligible}
                  checked={mentorOptIn}
                  onChange={(e) => setMentorOptIn(e.target.checked)}
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    accentColor: 'var(--accent-primary)',
                    cursor: eligibility && !eligibility.eligible ? 'not-allowed' : 'pointer',
                  }}
                />
              </label>
            </div>

            {eligibility && !eligibility.eligible && (
              <div
                style={{
                  marginTop: '0.65rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  fontSize: '0.75rem',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                }}
              >
                <AlertTriangle size={14} color="#d97706" />
                <span>Opt-in locked: You must upload a course certificate and pass a diagnostic quiz before you can become a mentor.</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                Available Weekly Hours
              </label>
              <input
                type="number"
                min="0"
                max="40"
                value={availabilityHrs}
                onChange={(e) => setAvailabilityHrs(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                Maximum Mentee Capacity
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.825rem', color: '#475569', fontWeight: 500 }}>
            Current Active Mentees Assigned: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{profile?.currentActiveMenteesCount || 0}</strong>
          </div>

          <button
            type="submit"
            disabled={savingSettings}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.875rem',
              alignSelf: 'flex-start',
              boxShadow: 'var(--shadow-sm)',
              cursor: savingSettings ? 'not-allowed' : 'pointer',
              opacity: savingSettings ? 0.7 : 1,
              border: 'none',
            }}
          >
            {savingSettings ? 'Saving Settings...' : 'Save Mentorship Settings'}
          </button>
        </form>
      </div>

      {/* Mentorship Chat Modal */}
      <MentorshipChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        assignment={chatAssignment}
        isMentor={false}
      />
    </div>
  );
};

export default MentorshipPage;
