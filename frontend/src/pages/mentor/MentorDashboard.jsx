import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mentorshipApi } from '../../api/mentorshipApi';
import { authApi } from '../../api/authApi';
import { learningPathApi } from '../../api/learningPathApi';
import { skillGapApi } from '../../api/skillGapApi';
import { assessmentApi } from '../../api/assessmentApi';
import { mentoringTrackingApi } from '../../api/mentoringTrackingApi';
import { mentorshipChatApi } from '../../api/mentorshipChatApi';
import { courseApi } from '../../api/courseApi';
import { extractArray } from '../../utils/apiUtils';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import WeakAreasSection from '../../components/employee/WeakAreasSection';
import MentorshipChatModal from '../../components/mentorship/MentorshipChatModal';
import {
  Users2,
  Award,
  Clock,
  Target,
  Route,
  BookOpen,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Settings,
  Activity,
  ChevronRight,
  UserCheck,
  Video,
  FileCheck2,
  Plus,
  Compass,
  AlertTriangle,
  ArrowRight,
  Send,
  ExternalLink,
  Sparkles,
  Paperclip,
  FileText,
  Download,
  X,
  Image,
  Star,
} from 'lucide-react';

export const MentorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Mentor profile & assignments
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [mentorCourses, setMentorCourses] = useState([]);

  // Selected mentee for deep-dive inspection
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [menteeLoading, setMenteeLoading] = useState(false);
  const [menteePath, setMenteePath] = useState(null);
  const [menteeGaps, setMenteeGaps] = useState(null);
  const [menteeAssessments, setMenteeAssessments] = useState([]);
  const [activeInspectorTab, setActiveInspectorTab] = useState('pathway'); // 'pathway' | 'gaps' | 'assessments' | 'sessions'

  // Sessions log state (persisted in PostgreSQL per assignment)
  const [sessions, setSessions] = useState([]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    topic: '',
    durationMinutes: 45,
    sessionDate: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'COMPLETED',
  });

  // Milestones state (persisted in PostgreSQL per assignment)
  const [milestones, setMilestones] = useState([]);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  // Availability modal
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatAssignment, setChatAssignment] = useState(null);
  const [menteeMessages, setMenteeMessages] = useState([]);
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [mentorAttachment, setMentorAttachment] = useState(null);
  const mentorFileInputRef = React.useRef(null);

  // Recommend Course Modal state
  const [isCourseRecommendOpen, setIsCourseRecommendOpen] = useState(false);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [selectedRecommendCourseId, setSelectedRecommendCourseId] = useState('');
  const [recommendNotes, setRecommendNotes] = useState('');
  const [recommendingCourse, setRecommendingCourse] = useState(false);

  const [prefForm, setPrefForm] = useState({
    mentorOptIn: true,
    mentorAvailabilityHrsPerWeek: 10,
  });
  const [savingPref, setSavingPref] = useState(false);

  const handleMentorFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      setMentorAttachment({
        url: reader.result,
        name: file.name,
        type: isImage ? 'IMAGE' : 'DOCUMENT',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const fetchMenteeMessages = async (assignmentId) => {
    if (!assignmentId || typeof mentorshipChatApi?.getMessages !== 'function') return;
    try {
      const res = await mentorshipChatApi.getMessages(assignmentId);
      setMenteeMessages(extractArray(res));
    } catch {
      setMenteeMessages([]);
    }
  };

  const handleSendInlineReply = async (e) => {
    e?.preventDefault?.();
    if (!selectedAssignment?.id || (!inlineReplyText.trim() && !mentorAttachment)) return;
    setSendingReply(true);
    try {
      const defaultText = mentorAttachment
        ? `Shared ${mentorAttachment.type.toLowerCase()}: ${mentorAttachment.name}`
        : '';
      await mentorshipChatApi.sendMessage(selectedAssignment.id, {
        messageText: inlineReplyText.trim() || defaultText,
        suggestionType: 'NONE',
        attachmentUrl: mentorAttachment?.url || null,
        attachmentName: mentorAttachment?.name || null,
        attachmentType: mentorAttachment?.type || null,
      });
      setInlineReplyText('');
      setMentorAttachment(null);
      await fetchMenteeMessages(selectedAssignment.id);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleOpenCourseRecommend = async () => {
    setIsCourseRecommendOpen(true);
    try {
      const res = await courseApi.getAllCourses();
      setCatalogCourses(extractArray(res));
    } catch {
      setCatalogCourses([]);
    }
  };

  const handleConfirmRecommendCourse = async () => {
    if (!selectedRecommendCourseId || !selectedAssignment) return;
    setRecommendingCourse(true);
    try {
      const menteeProfileId = selectedAssignment.menteeProfileId || selectedAssignment.menteeId;
      await courseApi.recommendCourse({
        employeeProfileId: menteeProfileId,
        courseId: Number(selectedRecommendCourseId),
        notes: recommendNotes || 'Recommended by your mentor for targeted competency development.',
      });
      setSuccessMsg('Course recommendation successfully submitted for mentee!');
      setIsCourseRecommendOpen(false);
      setSelectedRecommendCourseId('');
      setRecommendNotes('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to recommend course');
    } finally {
      setRecommendingCourse(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, assignRes, coursesRes] = await Promise.allSettled([
        authApi.getEmployeeProfile(),
        mentorshipApi.getAssignments(),
        authApi.getMentorCourses ? authApi.getMentorCourses() : Promise.resolve({ data: [] }),
      ]);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value?.data;
        setProfile(p);
        if (p) {
          setPrefForm({
            mentorOptIn: p.mentorOptIn ?? true,
            mentorAvailabilityHrsPerWeek: p.mentorAvailabilityHrsPerWeek ?? 10,
          });
        }
      }

      if (coursesRes.status === 'fulfilled') {
        setMentorCourses(extractArray(coursesRes.value));
      }

      if (assignRes.status === 'fulfilled') {
        const rawList = extractArray(assignRes.value);
        const mentorProfileId = profileRes.status === 'fulfilled' ? profileRes.value?.data?.id : null;
        let assignList = rawList;
        if (mentorProfileId && user?.role === 'EMPLOYEE') {
          const filtered = rawList.filter((a) => a.mentorProfileId === mentorProfileId || a.mentorId === mentorProfileId);
          if (filtered.length > 0) assignList = filtered;
        }
        setAssignments(assignList);
        if (assignList.length > 0 && !selectedAssignment) {
          handleSelectMentee(assignList[0]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load mentor workspace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSelectMentee = async (assignment) => {
    setSelectedAssignment(assignment);
    setMenteeLoading(true);
    fetchMenteeMessages(assignment.id);

    try {
      const menteeProfileId = assignment.menteeProfileId;
      const [pathRes, gapsRes, assessRes, sessionsRes, milestonesRes] = await Promise.allSettled([
        learningPathApi.getEmployeeActivePath(menteeProfileId),
        skillGapApi.getEmployeeSkillGaps(menteeProfileId),
        assessmentApi.getEmployeeHistory(menteeProfileId),
        mentoringTrackingApi.getSessions(assignment.id),
        mentoringTrackingApi.getMilestones(assignment.id),
      ]);

      if (pathRes.status === 'fulfilled') setMenteePath(pathRes.value?.data);
      else setMenteePath(null);

      if (gapsRes.status === 'fulfilled') setMenteeGaps(gapsRes.value?.data);
      else setMenteeGaps(null);

      if (assessRes.status === 'fulfilled') setMenteeAssessments(extractArray(assessRes.value));
      else setMenteeAssessments([]);

      if (sessionsRes.status === 'fulfilled') setSessions(extractArray(sessionsRes.value));
      else setSessions([]);

      if (milestonesRes.status === 'fulfilled') setMilestones(extractArray(milestonesRes.value));
      else setMilestones([]);
    } catch {
      // Handled silently with empty fallbacks
    } finally {
      setMenteeLoading(false);
    }
  };

  const handleAddSession = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      await mentoringTrackingApi.createSession({
        mentorAssignmentId: selectedAssignment.id,
        topic: sessionForm.topic,
        durationMinutes: Number(sessionForm.durationMinutes),
        sessionDate: sessionForm.sessionDate,
        notes: sessionForm.notes,
        status: sessionForm.status,
      });

      const updated = await mentoringTrackingApi.getSessions(selectedAssignment.id);
      setSessions(extractArray(updated));

      setIsSessionModalOpen(false);
      setSessionForm({
        topic: '',
        durationMinutes: 45,
        sessionDate: new Date().toISOString().split('T')[0],
        notes: '',
        status: 'COMPLETED',
      });
      setSuccessMsg('Mentorship session logged and persisted in database successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save session to database');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      await mentoringTrackingApi.createMilestone({
        mentorAssignmentId: selectedAssignment.id,
        title: milestoneForm.title,
        description: milestoneForm.description,
        targetDate: milestoneForm.targetDate,
      });

      const updated = await mentoringTrackingApi.getMilestones(selectedAssignment.id);
      setMilestones(extractArray(updated));

      setIsMilestoneModalOpen(false);
      setMilestoneForm({
        title: '',
        description: '',
        targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });
      setSuccessMsg('Learning milestone created and assigned to mentee successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create milestone');
    }
  };

  const handleToggleMilestone = async (milestoneId, currentStatus) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await mentoringTrackingApi.updateMilestoneStatus(milestoneId, newStatus);
      if (selectedAssignment) {
        const updated = await mentoringTrackingApi.getMilestones(selectedAssignment.id);
        setMilestones(extractArray(updated));
      }
    } catch (err) {
      setError('Failed to update milestone status');
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavingPref(true);
    setError(null);
    try {
      const res = await authApi.updateEmployeeProfile({
        mentorOptIn: prefForm.mentorOptIn,
        mentorAvailabilityHrsPerWeek: Number(prefForm.mentorAvailabilityHrsPerWeek),
      });
      if (res?.data) {
        setProfile(res.data);
      }
      setIsPrefModalOpen(false);
      setSuccessMsg('Mentorship availability and capacity settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update preferences');
    } finally {
      setSavingPref(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Mentor Intelligence Hub</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
        </div>
        <LoadingSkeleton height="320px" lines={3} />
      </div>
    );
  }

  const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE' || a.status === 'APPROVED_BY_MANAGER');
  const menteeCount = profile?.currentMenteeCount ?? activeAssignments.length;
  const maxMentees = profile?.maxMentees ?? profile?.maxMenteesCapacity ?? 3;
  const availabilityHrs = profile?.mentorAvailabilityHrsPerWeek ?? 10;
  const skillsList = profile?.skills || [];
  const verifiedSkillsCount = skillsList.filter((s) => s.verified).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Mentor Advisory &amp; Talent Hub
            </h2>
            <span className="badge badge-mentor">{user?.role === 'EMPLOYEE' ? 'Peer Mentor' : 'Dedicated Mentor'}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Guide engineering mentees, monitor learning roadmap completion, and drive competency mastery across your department.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/live-classes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Video size={16} />
            <span>Start Live Session</span>
          </button>

          <button
            onClick={() => setIsPrefModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Settings size={16} />
            <span>Availability &amp; Preferences</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadDashboardData} />}
      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          icon={Users2}
          title="Active Mentees"
          value={menteeCount}
          badgeText={`Capacity ${menteeCount}/${maxMentees}`}
          badgeType={menteeCount >= maxMentees ? 'warning' : 'success'}
          subtext="Assigned direct engineering mentees"
          accentColor="#c084fc"
        />

        <StatCard
          icon={Clock}
          title="Weekly Availability"
          value={`${availabilityHrs} hrs`}
          badgeText={profile?.mentorOptIn ? 'Opted In' : 'Paused'}
          badgeType={profile?.mentorOptIn ? 'success' : 'danger'}
          subtext="Advisory, code pairing & review capacity"
          accentColor="var(--accent-secondary)"
        />

        <StatCard
          icon={Award}
          title="Verified Expertise"
          value={verifiedSkillsCount > 0 ? verifiedSkillsCount : skillsList.length}
          badgeText="Evaluated"
          badgeType="success"
          subtext="Validated domain technical proficiencies"
          accentColor="var(--accent-primary)"
        />

        <StatCard
          icon={Calendar}
          title="Mentorship Sessions"
          value={sessions.length}
          badgeText="Recorded"
          badgeType="default"
          subtext="Logged technical reviews & guidance sessions"
          accentColor="var(--accent-warning)"
        />
      </div>

      {/* Mentor Profile & Domain Expertise Card */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Mentor Competency Profile
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Verified credentials and advisory domain specializations
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Department: <strong style={{ color: 'var(--text-primary)' }}>{user?.department?.name || user?.departmentName || 'Engineering'}</strong>
            </span>
            <span className="badge badge-mentor">{user?.role === 'EMPLOYEE' ? 'Role: Peer Mentor' : `Role: ${user?.role}`}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          {skillsList.length > 0 ? (
            skillsList.map((skill, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={14} color="#34d399" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{skill.skillName}</span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    fontWeight: 700,
                  }}
                >
                  Lvl {skill.proficiencyLevel} / 5
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Domain skills loaded from employee talent profile.
            </p>
          )}
        </div>
      </div>

      {/* Course-Specific Mentorship Qualifications Section */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <Award size={20} color="#c084fc" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Course-Specific Mentorship Qualifications
              </h3>
            </div>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
              Course-level certification gating: Only courses with uploaded certificates and passed diagnostic quizzes authorize you to mentor
            </span>
          </div>

          <span
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: mentorCourses.filter((c) => c.isMentorQualified).length > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: mentorCourses.filter((c) => c.isMentorQualified).length > 0 ? '#34d399' : '#f87171',
              border: `1px solid ${mentorCourses.filter((c) => c.isMentorQualified).length > 0 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
            }}
          >
            {mentorCourses.filter((c) => c.isMentorQualified).length > 0
              ? `🏆 ${mentorCourses.filter((c) => c.isMentorQualified).length} Course(s) Mentor Certified`
              : '0 Courses Qualified'}
          </span>
        </div>

        {/* Mentorship Policy Banner */}
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            fontSize: '0.825rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: '#c084fc' }}>📌 Mandatory Course Mentorship Policy:</strong> You are authorized to mentor engineering colleagues <span style={{ textDecoration: 'underline' }}>only for courses where you have uploaded an authentic certificate AND passed the diagnostic quiz</span>. If you wish to mentor in another or next course, you must repeat this exact verification process for each course.
        </div>

        {/* Grid of Courses */}
        {mentorCourses.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            {mentorCourses.map((c) => {
              const isQualified = Boolean(c.isMentorQualified);
              const certOk = Boolean(c.certificateUploaded);
              const quizOk = Boolean(c.quizPassed);

              return (
                <div
                  key={c.courseId}
                  style={{
                    padding: '1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: isQualified ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isQualified ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.925rem', fontWeight: 800, margin: '0 0 0.15rem 0', color: 'var(--text-primary)' }}>
                          {c.courseTitle}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Provider: {c.courseProvider || 'Coursera'} • Skill: <strong style={{ color: 'var(--text-secondary)' }}>{c.primarySkillName || 'Engineering'}</strong>
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          background: isQualified ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.15)',
                          color: isQualified ? '#34d399' : '#fbbf24',
                          border: `1px solid ${isQualified ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isQualified ? '🏆 Qualified Mentor' : '🔒 Incomplete'}
                      </span>
                    </div>

                    {/* Criteria Checkmarks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.65rem', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: certOk ? '#34d399' : '#fbbf24' }}>
                        <FileCheck2 size={15} />
                        <span>
                          {certOk ? `Certificate: Verified (${c.certificateFileName || 'Authentic ML-Score'})` : 'Certificate: Missing / Not Uploaded'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: quizOk ? '#34d399' : c.quizAttended ? '#f87171' : '#94a3b8' }}>
                        <Award size={15} />
                        <span>
                          {quizOk
                            ? `Diagnostic Quiz: Passed (${c.quizScore != null ? c.quizScore + '%' : '100%'})`
                            : c.quizAttended
                            ? `Diagnostic Quiz: Failed (${c.quizScore != null ? c.quizScore + '%' : 'Retake Required'})`
                            : 'Diagnostic Quiz: Not Attended'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Guidance & Actions */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flex: 1, lineHeight: 1.4 }}>
                      {c.guidanceMessage}
                    </span>

                    {!isQualified && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {!certOk && (
                          <button
                            type="button"
                            onClick={() => navigate('/learning-path')}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
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
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(99, 102, 241, 0.2)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              color: '#a5b4fc',
                              fontSize: '0.72rem',
                              fontWeight: 700,
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
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading course mentorship certifications...
          </p>
        )}

        {/* Qualify for Next Course Callout */}
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>
              🎯 Qualify to Mentor in Additional / Next Courses
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              To mentor in another course, complete the course on your roadmap, upload your completion certificate, and attend &amp; pass the diagnostic quiz.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => navigate('/learning-path')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>+ Qualify on Learning Roadmap</span>
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => navigate('/courses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Browse Course Catalog</span>
            </button>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1fr) minmax(480px, 1.8fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Assigned Mentees List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users2 size={18} color="#c084fc" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                Assigned Mentees ({assignments.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Active Pairings
            </span>
          </div>

          {assignments.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="No Assigned Mentees"
              description="No active mentee pairings are currently assigned to your profile. As engineering team members request mentorship, assignments approved by departmental managers will appear here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {assignments.map((a) => {
                const isSelected = selectedAssignment?.id === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => handleSelectMentee(a)}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected
                        ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.14) 0%, rgba(168, 85, 247, 0.05) 100%)'
                        : '#ffffff',
                      border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.45)' : 'var(--border-subtle)'}`,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--text-primary)' }}>
                          {a.menteeFullName}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {a.menteeEmail}
                        </span>
                      </div>
                      <span className={`badge ${a.status === 'ACTIVE' ? 'badge-mentor' : 'badge-employee'}`}>
                        {a.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Target size={14} color="#818cf8" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {a.skillName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatAssignment(a);
                            setSelectedAssignment(a);
                            setIsChatOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'var(--accent-primary)',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <MessageSquare size={12} />
                          <span>Reply</span>
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: isSelected ? '#c084fc' : 'var(--text-muted)' }}>
                          <span>Inspect</span>
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Mentee Deep Dive Inspector */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {selectedAssignment ? (
            <div>
              {/* Mentee Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                      {selectedAssignment.menteeFullName}
                    </h3>
                    <span className="badge badge-employee">Mentee</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {selectedAssignment.menteeEmail} &bull; Focus Competency:{' '}
                    <strong style={{ color: '#c084fc' }}>{selectedAssignment.skillName}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/live-classes')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Video size={15} />
                    <span>Start Live Session</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChatAssignment(selectedAssignment);
                      setIsChatOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 0 14px rgba(37, 99, 235, 0.35)',
                    }}
                  >
                    <MessageSquare size={16} />
                    <span>Message &amp; Reply</span>
                  </button>

                  <button
                    onClick={() => setIsSessionModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.55rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      border: 'none',
                      boxShadow: '0 0 14px rgba(99, 102, 241, 0.35)',
                    }}
                  >
                    <Plus size={16} />
                    <span>Log Session</span>
                  </button>
                </div>
              </div>

              {/* Early Warning Banner */}
              {(() => {
                const progress = menteePath?.overallProgressPercentage || 0;
                const overdueMilestones = milestones.filter(
                  (m) => m.targetDate && new Date(m.targetDate) < new Date() && m.status !== 'COMPLETED'
                );
                if (progress < 25 || overdueMilestones.length > 0) {
                  return (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        marginBottom: '1.25rem',
                        fontSize: '0.825rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} color="#f87171" />
                        <span>
                          <strong>Early Warning:</strong> Mentee curriculum progress is {Math.round(progress)}%
                          {overdueMilestones.length > 0 && ` with ${overdueMilestones.length} overdue milestone(s)`}. Action recommended.
                        </span>
                      </div>
                      <button
                        onClick={() => setIsSessionModalOpen(true)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#fff',
                          padding: '0.25rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Schedule Session
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Inspector Navigation Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.5rem',
                  overflowX: 'auto',
                }}
              >
                {[
                  { id: 'pathway', label: 'Learning Roadmap', icon: Route },
                  { id: 'chat', label: `Mentee Inbox (${menteeMessages.length})`, icon: MessageSquare },
                  { id: 'weak-areas', label: 'Weak Areas & Review', icon: AlertTriangle },
                  { id: 'milestones', label: `Milestones (${milestones.filter((m) => m.status === 'COMPLETED').length}/${milestones.length})`, icon: Target },
                  { id: 'sessions', label: `Session Notes (${sessions.length})`, icon: Calendar },
                  { id: 'gaps', label: 'Skill Gap Radar', icon: Activity },
                  { id: 'assessments', label: 'Quiz History', icon: FileCheck2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeInspectorTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveInspectorTab(tab.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        background: isActive ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                        color: isActive ? '#c084fc' : 'var(--text-secondary)',
                        borderBottom: isActive ? '2px solid #c084fc' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {menteeLoading ? (
                <LoadingSkeleton height="200px" lines={3} />
              ) : (
                <div>
                  {/* TAB 1: Learning Pathway */}
                  {activeInspectorTab === 'pathway' && (
                    <div>
                      {menteePath ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          <div
                            style={{
                              padding: '1.25rem',
                              borderRadius: 'var(--radius-md)',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.85rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                                  Target Career Pathway
                                </span>
                                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.2rem 0 0', color: 'var(--text-primary)' }}>
                                  {menteePath.targetRoleName || 'Target Role Pathway'}
                                </h4>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                                  {Math.round(menteePath.overallProgressPercentage || 0)}%
                                </span>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Milestone Completion
                                </span>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div
                              style={{
                                width: '100%',
                                height: '8px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.round(menteePath.overallProgressPercentage || 0)}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)',
                                  borderRadius: '4px',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </div>

                          {/* Pathway Course Milestones */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                              Curriculum Progression &amp; Courses ({(menteePath.courses || []).length})
                            </span>
                            {(menteePath.courses || []).map((c, idx) => (
                              <div
                                key={c.courseId || idx}
                                style={{
                                  padding: '0.85rem 1rem',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid var(--border-subtle)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '1rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div
                                    style={{
                                      width: '2rem',
                                      height: '2rem',
                                      borderRadius: '50%',
                                      background:
                                        c.status === 'COMPLETED'
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : c.status === 'IN_PROGRESS'
                                          ? 'rgba(99, 102, 241, 0.15)'
                                          : 'rgba(255, 255, 255, 0.05)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color:
                                        c.status === 'COMPLETED'
                                          ? '#34d399'
                                          : c.status === 'IN_PROGRESS'
                                          ? '#818cf8'
                                          : 'var(--text-muted)',
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                    }}
                                  >
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: '0.875rem', display: 'block', color: 'var(--text-primary)' }}>
                                      {c.courseTitle}
                                    </strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {c.provider || 'Enterprise Academy'} &bull; {c.durationHours} hrs &bull; Gain: +{c.targetProficiencyGain} Lvl
                                    </span>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: 'var(--radius-full)',
                                      background:
                                        c.status === 'COMPLETED'
                                          ? 'rgba(16, 185, 129, 0.15)'
                                          : c.status === 'IN_PROGRESS'
                                          ? 'rgba(99, 102, 241, 0.15)'
                                          : 'rgba(255, 255, 255, 0.05)',
                                      color:
                                        c.status === 'COMPLETED'
                                          ? '#34d399'
                                          : c.status === 'IN_PROGRESS'
                                          ? '#818cf8'
                                          : 'var(--text-muted)',
                                    }}
                                  >
                                    {c.status || 'NOT_STARTED'} ({c.progressPercentage || 0}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          icon={Route}
                          title="No Active Learning Pathway"
                          description="This mentee has not initialized an active learning path yet."
                        />
                      )}
                    </div>
                  )}

                  {/* TAB 2: Skill Gaps */}
                  {activeInspectorTab === 'gaps' && (
                    <div>
                      {menteeGaps ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                                Target Role Competency Deficits
                              </h4>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                Target: {menteeGaps.targetJobRoleTitle || 'Target Role'} &bull; Readiness:{' '}
                                <strong style={{ color: '#34d399' }}>{menteeGaps.overallReadinessPercentage}%</strong>
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {(menteeGaps.gaps || []).map((g, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '0.75rem 1rem',
                                  borderRadius: 'var(--radius-md)',
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid var(--border-subtle)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)' }}>
                                    {g.skillName}
                                  </strong>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Current: Lvl {g.currentProficiency} &rarr; Target: Lvl {g.requiredProficiency}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span
                                    style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: 'var(--radius-full)',
                                      background: g.gap > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                      color: g.gap > 0 ? '#f87171' : '#34d399',
                                    }}
                                  >
                                    {g.gap > 0 ? `Gap: -${g.gap}` : 'Verified'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <EmptyState
                          icon={Target}
                          title="No Skill Gap Data"
                          description="Skill gap calculations have not been generated for this mentee."
                        />
                      )}
                    </div>
                  )}

                  {/* TAB 3: Diagnostic Quizzes */}
                  {activeInspectorTab === 'assessments' && (
                    <div>
                      {menteeAssessments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {menteeAssessments.map((a, idx) => (
                            <div
                              key={a.id || idx}
                              style={{
                                padding: '0.85rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-primary)' }}>
                                  {a.assessmentTitle || 'Diagnostic Assessment'}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Skill: {a.skillName} &bull; Score: {a.scorePercentage}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 'var(--radius-full)',
                                    background: a.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color: a.passed ? '#34d399' : '#f87171',
                                  }}
                                >
                                  {a.passed ? 'PASSED' : 'RETRY'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => navigate('/live-classes')}
                                  title="Host live session for this quiz"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    color: '#059669',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Video size={11} />
                                  <span>Live Class</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChatAssignment(selectedAssignment);
                                    setIsChatOpen(true);
                                  }}
                                  title="Recommend study materials"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(99, 102, 241, 0.12)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    color: 'var(--accent-primary)',
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <BookOpen size={11} />
                                  <span>Materials</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={FileCheck2}
                          title="No Diagnostic Quiz History"
                          description="This mentee has not submitted diagnostic quizzes yet."
                        />
                      )}
                    </div>
                  )}

                  {/* TAB 4: Sessions Log */}
                  {activeInspectorTab === 'sessions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Advisory &amp; Pair Programming Log
                        </span>
                        <button
                          onClick={() => setIsSessionModalOpen(true)}
                          style={{
                            fontSize: '0.78rem',
                            color: '#c084fc',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          <Plus size={14} />
                          <span>Add Entry</span>
                        </button>
                      </div>

                      {sessions.length === 0 ? (
                        <EmptyState
                          icon={Calendar}
                          title="No Sessions Logged"
                          description="Click 'Log Mentorship Session' to track your 1-on-1 advisory sessions."
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {sessions.map((s) => (
                            <div
                              key={s.id}
                              style={{
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border-subtle)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.topic}</strong>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'rgba(168, 85, 247, 0.15)',
                                    color: '#c084fc',
                                    fontWeight: 700,
                                  }}
                                >
                                  {s.status}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Date: {s.sessionDate} &bull; Duration: {s.durationMinutes} mins
                              </span>
                              {s.notes && (
                                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0', lineHeight: 1.4 }}>
                                  {s.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Learning Milestones & Objectives */}
                  {activeInspectorTab === 'milestones' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                            Learning Milestones &amp; Objectives
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Track actionable progress deliverables and checkpoints for {selectedAssignment.menteeFullName}.
                          </span>
                        </div>
                        <button
                          onClick={() => setIsMilestoneModalOpen(true)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            padding: '0.5rem 0.85rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={15} />
                          <span>Assign Milestone</span>
                        </button>
                      </div>

                      {/* Milestone Progress Bar */}
                      {milestones.length > 0 && (
                        <div
                          style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--border-subtle)',
                            marginBottom: '1.25rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              Milestones Completed: {milestones.filter((m) => m.status === 'COMPLETED').length} / {milestones.length}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                              {Math.round((milestones.filter((m) => m.status === 'COMPLETED').length / (milestones.length || 1)) * 100)}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              height: '6px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.round((milestones.filter((m) => m.status === 'COMPLETED').length / (milestones.length || 1)) * 100)}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #6366f1 0%, #34d399 100%)',
                                borderRadius: '3px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {milestones.length === 0 ? (
                        <EmptyState
                          icon={Target}
                          title="No Milestones Assigned"
                          description="Click 'Assign Milestone' to establish tangible learning goals and checkpoints."
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {milestones.map((m) => {
                            const isOverdue = m.targetDate && new Date(m.targetDate) < new Date() && m.status !== 'COMPLETED';
                            const isCompleted = m.status === 'COMPLETED';
                            return (
                              <div
                                key={m.id}
                                style={{
                                  padding: '1rem',
                                  borderRadius: 'var(--radius-md)',
                                  background: isCompleted ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.02)',
                                  border: isOverdue
                                    ? '1px solid rgba(239, 68, 68, 0.4)'
                                    : isCompleted
                                    ? '1px solid rgba(16, 185, 129, 0.25)'
                                    : '1px solid var(--border-subtle)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '1rem',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                                  <button
                                    onClick={() => handleToggleMilestone(m.id, m.status)}
                                    title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '0.1rem',
                                      marginTop: '0.15rem',
                                      color: isCompleted ? '#34d399' : 'var(--text-muted)',
                                    }}
                                  >
                                    <CheckCircle2 size={20} />
                                  </button>
                                  <div>
                                    <strong
                                      style={{
                                        fontSize: '0.9rem',
                                        color: isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        textDecoration: isCompleted ? 'line-through' : 'none',
                                      }}
                                    >
                                      {m.title}
                                    </strong>
                                    {m.description && (
                                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0', lineHeight: 1.4 }}>
                                        {m.description}
                                      </p>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                                      <span style={{ color: isOverdue ? '#f87171' : 'var(--text-muted)' }}>
                                        Target: {m.targetDate || 'No deadline'} {isOverdue && '(Overdue)'}
                                      </span>
                                      {m.completedDate && (
                                        <span style={{ color: '#34d399' }}>
                                          Completed: {m.completedDate}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <span
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: 'var(--radius-full)',
                                      background: isCompleted
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : isOverdue
                                        ? 'rgba(239, 68, 68, 0.15)'
                                        : 'rgba(234, 179, 8, 0.15)',
                                      color: isCompleted ? '#34d399' : isOverdue ? '#f87171' : '#facc15',
                                      fontWeight: 700,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {isCompleted ? 'COMPLETED' : isOverdue ? 'OVERDUE' : 'IN PROGRESS'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Mentorship Dialogue, Mentee Messages & Quiz Weak Area Alerts */}
                  {activeInspectorTab === 'chat' && (
                    <div
                      style={{
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MessageSquare size={18} color="#2563eb" />
                            <span>Direct Mentee Dialogue &amp; Weak Topic Notifications</span>
                          </h4>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: '#475569' }}>
                            View messages and quiz weak area alerts from <strong>{selectedAssignment.menteeFullName}</strong>, reply directly, suggest study materials, or host targeted live sessions.
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={handleOpenCourseRecommend}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              background: '#8b5cf6',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Star size={14} />
                            <span>Recommend Course</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('/live-classes')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.85rem',
                              borderRadius: 'var(--radius-sm)',
                              background: '#10b981',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              border: 'none',
                            }}
                          >
                            <Video size={14} />
                            <span>Start Live Session</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              setChatAssignment(selectedAssignment);
                              setIsChatOpen(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                          >
                            <ExternalLink size={14} />
                            <span>Open Full Chat Modal</span>
                          </button>
                        </div>
                      </div>

                      {/* Messages Thread Container */}
                      <div
                        style={{
                          maxHeight: '380px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem',
                          padding: '1rem',
                          background: '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {menteeMessages.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b' }}>
                            <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>No messages yet with {selectedAssignment.menteeFullName}</div>
                            <p style={{ fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                              When {selectedAssignment.menteeFullName} sends a message or completes a diagnostic quiz with weak topics, notifications will appear here. Use the reply box below to start the conversation!
                            </p>
                          </div>
                        ) : (
                          menteeMessages.map((msg, idx) => {
                            const isMe = msg.senderId === user?.id || msg.sender?.id === user?.id;
                            const isQuizAlert = msg.suggestionType === 'QUIZ_ALERT' || msg.messageText?.includes('Quiz Alert') || msg.messageText?.includes('Weak Area');

                            if (isQuizAlert) {
                              return (
                                <div
                                  key={msg.id || idx}
                                  style={{
                                    padding: '1rem 1.25rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                    border: '1px solid #fde68a',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#b45309', fontWeight: 800, fontSize: '0.85rem' }}>
                                      <AlertTriangle size={16} />
                                      <span>Mentee Quiz Weak Area Alert</span>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#92400e' }}>
                                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                    </span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f', lineHeight: 1.5, fontWeight: 500 }}>
                                    {msg.messageText}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={() => navigate('/live-classes')}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: '#10b981',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        border: 'none',
                                      }}
                                    >
                                      <Video size={13} />
                                      <span>Host Live Session for Weak Topics</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setChatAssignment(selectedAssignment);
                                        setIsChatOpen(true);
                                      }}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: '#2563eb',
                                        color: '#fff',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        border: 'none',
                                      }}
                                    >
                                      <BookOpen size={13} />
                                      <span>Suggest Study Materials</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={msg.id || idx}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: isMe ? 'flex-end' : 'flex-start',
                                  maxWidth: '85%',
                                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                                }}
                              >
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.2rem', padding: '0 0.25rem' }}>
                                  {isMe ? 'You (Mentor)' : (selectedAssignment.menteeFullName || 'Mentee')} &bull;{' '}
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                </div>
                                <div
                                  style={{
                                    padding: '0.65rem 0.95rem',
                                    borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                    background: isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f1f5f9',
                                    color: isMe ? '#ffffff' : '#0f172a',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.45,
                                    border: isMe ? 'none' : '1px solid #e2e8f0',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                  }}
                                >
                                  {msg.messageText}

                                  {/* File Attachment: Image or Document */}
                                  {msg.attachmentUrl && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                      {msg.attachmentType === 'IMAGE' || (typeof msg.attachmentUrl === 'string' && msg.attachmentUrl.startsWith('data:image/')) ? (
                                        <div style={{ borderRadius: '6px', overflow: 'hidden', border: isMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid #cbd5e1' }}>
                                          <img
                                            src={msg.attachmentUrl}
                                            alt={msg.attachmentName || 'Attachment image'}
                                            style={{ maxWidth: '100%', maxHeight: '180px', display: 'block', cursor: 'pointer', objectFit: 'contain' }}
                                            onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                          />
                                          <div style={{ padding: '0.2rem 0.4rem', background: isMe ? 'rgba(0,0,0,0.2)' : '#f8fafc', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                                              {msg.attachmentName || 'Image attachment'}
                                            </span>
                                            <a href={msg.attachmentUrl} download={msg.attachmentName || 'image.png'} style={{ color: isMe ? '#fff' : '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                                              Save
                                            </a>
                                          </div>
                                        </div>
                                      ) : (
                                        <a
                                          href={msg.attachmentUrl}
                                          download={msg.attachmentName || 'document.pdf'}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.4rem 0.75rem',
                                            borderRadius: '6px',
                                            background: isMe ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                                            border: isMe ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #cbd5e1',
                                            color: isMe ? '#ffffff' : '#1e293b',
                                            textDecoration: 'none',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                          }}
                                        >
                                          <FileText size={14} color={isMe ? '#ffffff' : '#2563eb'} />
                                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                            {msg.attachmentName || 'Download Document'}
                                          </span>
                                          <Download size={12} />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Mentee Attachment Preview */}
                      {mentorAttachment && (
                        <div
                          style={{
                            padding: '0.4rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '0.78rem',
                            color: '#1e40af',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {mentorAttachment.type === 'IMAGE' ? <Image size={14} /> : <FileText size={14} />}
                            <span>Attach {mentorAttachment.type.toLowerCase()}: <strong>{mentorAttachment.name}</strong></span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMentorAttachment(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {/* Quick Reply Composer */}
                      <form onSubmit={handleSendInlineReply} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                        <input
                          type="file"
                          ref={mentorFileInputRef}
                          onChange={handleMentorFileUpload}
                          accept="image/*,.pdf,.doc,.docx,.txt"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => mentorFileInputRef.current?.click()}
                          title="Attach Image or Document"
                          style={{
                            padding: '0.65rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            cursor: 'pointer',
                            color: mentorAttachment ? '#2563eb' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Paperclip size={16} />
                        </button>
                        <textarea
                          rows={2}
                          value={inlineReplyText}
                          onChange={(e) => setInlineReplyText(e.target.value)}
                          placeholder={`Type a reply or recommendation for ${selectedAssignment.menteeFullName}...`}
                          style={{
                            flex: 1,
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.85rem',
                            resize: 'none',
                            fontFamily: 'inherit',
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendInlineReply();
                            }
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <button
                            type="submit"
                            disabled={sendingReply || (!inlineReplyText.trim() && !mentorAttachment)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              padding: '0.55rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              background: '#2563eb',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: '0.825rem',
                              cursor: sendingReply || (!inlineReplyText.trim() && !mentorAttachment) ? 'not-allowed' : 'pointer',
                              border: 'none',
                              opacity: sendingReply || (!inlineReplyText.trim() && !mentorAttachment) ? 0.6 : 1,
                            }}
                          >
                            <Send size={14} />
                            <span>{sendingReply ? 'Sending...' : 'Reply'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setChatAssignment(selectedAssignment);
                              setIsChatOpen(true);
                            }}
                            title="Suggest Materials or Live Classes"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.75rem',
                              borderRadius: 'var(--radius-md)',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#334155',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                          >
                            <Sparkles size={13} color="#6366f1" />
                            <span>Suggest</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* TAB: Weak Areas & Materials Review */}
                  {activeInspectorTab === 'weak-areas' && (
                    <WeakAreasSection
                      employeeProfileId={selectedAssignment?.menteeProfileId}
                      isMentorView={true}
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Users2}
              title="Select an Assigned Mentee"
              description="Choose a mentee from your active pairings list on the left to inspect their progress, curriculum roadmap, and record 1-on-1 guidance notes."
            />
          )}
        </div>
      </div>

      {/* MODAL 1: Log Mentorship Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title={`Log Mentorship Session with ${selectedAssignment?.menteeFullName || 'Mentee'}`}
      >
        <form onSubmit={handleAddSession} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Session Agenda / Topic
            </label>
            <input
              type="text"
              required
              value={sessionForm.topic}
              onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
              placeholder="e.g. Spring Boot REST Exception Handling & Layer Architecture"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Session Date
              </label>
              <input
                type="date"
                required
                value={sessionForm.sessionDate}
                onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={15}
                max={240}
                required
                value={sessionForm.durationMinutes}
                onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Guidance Notes &amp; Action Items
            </label>
            <textarea
              rows={4}
              required
              value={sessionForm.notes}
              onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
              placeholder="Reviewed repository PR, discussed Spring Boot validation best practices, assigned module quiz for diagnostic verification."
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(false)}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Save Mentorship Session
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Mentor Availability & Capacity Preferences */}
      <Modal
        isOpen={isPrefModalOpen}
        onClose={() => setIsPrefModalOpen(false)}
        title="Mentor Availability &amp; Advisory Settings"
      >
        <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={prefForm.mentorOptIn}
                onChange={(e) => setPrefForm({ ...prefForm, mentorOptIn: e.target.checked })}
                style={{ width: '1.1rem', height: '1.1rem', accentColor: '#7c3aed' }}
              />
              <span>Opt-in as Active Departmental Mentor</span>
            </label>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', marginLeft: '1.6rem' }}>
              When enabled, your profile is eligible for dynamic mentor recommendations generated by the intelligence matching service.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Weekly Availability (Hours / Week)
            </label>
            <input
              type="number"
              min={0}
              max={40}
              required
              value={prefForm.mentorAvailabilityHrsPerWeek}
              onChange={(e) => setPrefForm({ ...prefForm, mentorAvailabilityHrsPerWeek: e.target.value })}
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Max recommended availability: 10–15 hours/week alongside active project deliverables.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsPrefModalOpen(false)}
              disabled={savingPref}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPref}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                opacity: savingPref ? 0.7 : 1,
              }}
            >
              {savingPref ? 'Updating...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </Modal>
      {/* MODAL 3: Assign Learning Milestone Modal */}
      <Modal
        isOpen={isMilestoneModalOpen}
        onClose={() => setIsMilestoneModalOpen(false)}
        title={`Assign Learning Milestone for ${selectedAssignment?.menteeFullName || 'Mentee'}`}
      >
        <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Milestone Title / Checkpoint Objective
            </label>
            <input
              type="text"
              required
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              placeholder="e.g. Complete Docker Compose microservice orchestration deployment"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Target Completion Deadline
            </label>
            <input
              type="date"
              required
              value={milestoneForm.targetDate}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Description &amp; Deliverables Checklist
            </label>
            <textarea
              rows={4}
              value={milestoneForm.description}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
              placeholder="Specify tangible criteria: repo PR merged, diagnostic test passed >= 80%, or documentation created."
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsMilestoneModalOpen(false)}
              style={{
                padding: '0.65rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Assign Milestone
            </button>
          </div>
        </form>
      </Modal>

      {/* Recommend Course Modal for Mentors */}
      <Modal
        isOpen={isCourseRecommendOpen}
        onClose={() => setIsCourseRecommendOpen(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={18} color="#8b5cf6" />
            <span>Recommend Curriculum Course for {selectedAssignment?.menteeFullName}</span>
          </div>
        }
        maxWidth="550px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Select an engineering course from the enterprise catalog to recommend to{' '}
            <strong>{selectedAssignment?.menteeFullName}</strong>. This recommendation will appear highlighted on their dashboard.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Select Course:
            </label>
            <select
              value={selectedRecommendCourseId}
              onChange={(e) => setSelectedRecommendCourseId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="">-- Choose a course to recommend --</option>
              {catalogCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.provider || 'Enterprise'} &bull; {c.difficultyLevel || 'Intermediate'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
              Mentor Recommendation Notes:
            </label>
            <textarea
              rows={3}
              value={recommendNotes}
              onChange={(e) => setRecommendNotes(e.target.value)}
              placeholder="e.g. Essential for mastering distributed microservices patterns and bridging your target role gap."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCourseRecommendOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedRecommendCourseId || recommendingCourse}
              onClick={handleConfirmRecommendCourse}
              style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
            >
              <span>{recommendingCourse ? 'Submitting...' : 'Confirm Recommendation'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Mentorship Chat & Suggestions Modal */}
      <MentorshipChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        assignment={chatAssignment || selectedAssignment}
        isMentor={true}
      />
    </div>
  );
};

export default MentorDashboard;
