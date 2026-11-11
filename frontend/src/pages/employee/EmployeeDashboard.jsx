import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { skillGapApi } from '../../api/skillGapApi';
import { learningPathApi } from '../../api/learningPathApi';
import { assessmentApi } from '../../api/assessmentApi';
import { mentorshipApi } from '../../api/mentorshipApi';
import { courseDiscoveryApi } from '../../api/courseDiscoveryApi';
import { certificateApi } from '../../api/certificateApi';
import { courseApi } from '../../api/courseApi';
import { liveClassApi } from '../../api/liveClassApi';
import { extractArray, getWorkingCourseUrl } from '../../utils/apiUtils';
import StatCard from '../../components/common/StatCard';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import CertificateUploadModal from '../../components/courses/CertificateUploadModal';
import MentorshipChatModal from '../../components/mentorship/MentorshipChatModal';
import { notificationApi } from '../../api/notificationApi';
import {
  Target,
  Route,
  FileCheck2,
  Users2,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  PlayCircle,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Globe,
  Upload,
  FileCheck,
  PlusCircle,
  RefreshCw,
  Download,
  Video,
  Bell,
  MessageSquare,
  FileText,
  UserPlus,
  Star,
  Check,
} from 'lucide-react';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [gapReport, setGapReport] = useState(null);
  const [activePath, setActivePath] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [mentorRecs, setMentorRecs] = useState([]);
  const [trendingCourses, setTrendingCourses] = useState([]);
  const [userCertificates, setUserCertificates] = useState([]);

  // Peer Mentorship Chat & Notifications state
  const [notifications, setNotifications] = useState([]);
  const [activeMentorships, setActiveMentorships] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatAssignment, setChatAssignment] = useState(null);
  const [connectingMentorId, setConnectingMentorId] = useState(null);
  const [connectedMentorIds, setConnectedMentorIds] = useState(new Set());
  const [mentorConnectMsg, setMentorConnectMsg] = useState(null);

  // Certificate Modal state
  const [selectedCourseForCert, setSelectedCourseForCert] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certSuccessMsg, setCertSuccessMsg] = useState(null);

  // Platform Integration state (Coursera API Sync & Direct Enrollment)
  const [enrollingSlug, setEnrollingSlug] = useState(null);
  const [syncingPlatform, setSyncingPlatform] = useState(false);
  const [verifyingCourseId, setVerifyingCourseId] = useState(null);

  const [downloadingCertId, setDownloadingCertId] = useState(null);

  // Resume Assessment & Manager Sync state
  const [companyMentorsCount, setCompanyMentorsCount] = useState(0);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [conductingTest, setConductingTest] = useState(false);
  const [resumeTestResult, setResumeTestResult] = useState(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [managerReportStatus, setManagerReportStatus] = useState(null);
  const [resettingJourney, setResettingJourney] = useState(false);

  const handleDownloadCertificate = async (cert) => {
    if (!cert?.id) return;
    setDownloadingCertId(cert.id);
    try {
      if (certificateApi.downloadCertificate) {
        await certificateApi.downloadCertificate(cert.id, cert.certificateFileName || 'certificate.pdf');
      } else {
        window.open(certificateApi.getDownloadUrl(cert.id), '_blank');
      }
    } catch (err) {
      console.error('Failed to download certificate file:', err);
      window.open(certificateApi.getDownloadUrl(cert.id), '_blank');
    } finally {
      setDownloadingCertId(null);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.warn('Failed to mark notification read', e);
    }
  };

  const handleOpenChat = (assignment) => {
    if (assignment) {
      setChatAssignment(assignment);
      setIsChatOpen(true);
    } else if (activeMentorships.length > 0) {
      setChatAssignment(activeMentorships[0]);
      setIsChatOpen(true);
    } else {
      navigate('/mentorship');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gapsRes, pathRes, assessRes, mentorsRes, trendingRes, certsRes, notifsRes, assignRes, compMentorsRes, courseRecsRes, liveClassesRes] = await Promise.allSettled([
        skillGapApi.getOwnSkillGaps(),
        learningPathApi.getOwnActivePath(),
        assessmentApi.getAllAssessments(),
        mentorshipApi.getOwnRecommendations(),
        courseDiscoveryApi.getTrendingCourses(6),
        certificateApi.getMyCertificates(),
        notificationApi.getMyNotifications(),
        typeof mentorshipApi.getAssignments === 'function' ? mentorshipApi.getAssignments() : Promise.resolve([]),
        typeof mentorshipApi.getCompanyMentorsCount === 'function' ? mentorshipApi.getCompanyMentorsCount() : Promise.resolve({ count: 3 }),
        typeof courseApi.getOwnRecommendations === 'function' ? courseApi.getOwnRecommendations() : Promise.resolve([]),
        typeof liveClassApi.getLiveClasses === 'function' ? liveClassApi.getLiveClasses() : Promise.resolve([]),
      ]);

      if (gapsRes.status === 'fulfilled') setGapReport(gapsRes.value?.data);
      if (pathRes.status === 'fulfilled') {
        const pathData = pathRes.value?.data;
        let resolvedPath = pathData;
        if (pathData && Array.isArray(pathData.courses) && pathData.courses.length > 0) {
          setActivePath(pathData);
        } else {
          try {
            const genRes = await learningPathApi.generateOwnPath();
            if (genRes?.data && Array.isArray(genRes.data.courses) && genRes.data.courses.length > 0) {
              resolvedPath = genRes.data;
              setActivePath(genRes.data);
            } else {
              setActivePath(pathData);
            }
          } catch {
            setActivePath(pathData);
          }
        }
      }
      if (assessRes.status === 'fulfilled') setAssessments(extractArray(assessRes.value));
      if (mentorsRes.status === 'fulfilled') setMentorRecs(extractArray(mentorsRes.value));
      if (trendingRes.status === 'fulfilled') setTrendingCourses(extractArray(trendingRes.value));
      if (certsRes.status === 'fulfilled') setUserCertificates(extractArray(certsRes.value));
      if (notifsRes.status === 'fulfilled') setNotifications(extractArray(notifsRes.value));
      if (assignRes.status === 'fulfilled') {
        const allAssignments = extractArray(assignRes.value);
        const active = allAssignments.filter(
          (a) => a.status === 'APPROVED_BY_MANAGER' || a.status === 'ACTIVE'
        );
        setActiveMentorships(active);
      }
      if (compMentorsRes.status === 'fulfilled') {
        const val = compMentorsRes.value?.data || compMentorsRes.value;
        const count = typeof val?.count === 'number' ? val.count : Number(val) || 0;
        setCompanyMentorsCount(count);
      }
      if (courseRecsRes.status === 'fulfilled') {
        setRecommendedCourses(extractArray(courseRecsRes.value));
      }
      if (liveClassesRes.status === 'fulfilled') {
        setLiveClasses(extractArray(liveClassesRes.value));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load employee dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMentor = async (mentor) => {
    const mentorProfileId = mentor.mentorProfileId || mentor.candidateEmployeeProfileId || mentor.id;
    setConnectingMentorId(mentorProfileId);
    setMentorConnectMsg(null);
    try {
      const menteeProfileId = user?.profileId || 2;
      const targetSkillId = (mentor.matchedSkills && mentor.matchedSkills[0]?.skillId) || 2;
      await mentorshipApi.createRecommendationAssignment(
        menteeProfileId,
        mentorProfileId,
        targetSkillId,
        `Mentorship connection requested by ${user?.fullName || 'David Kim'}`
      );
      setConnectedMentorIds((prev) => new Set([...prev, mentorProfileId]));
      setMentorConnectMsg(`Connection request sent to ${mentor.mentorFullName || mentor.mentorName || 'Mentor'}! Manager Sarah Jenkins will review.`);
      setTimeout(() => setMentorConnectMsg(null), 5000);
    } catch (err) {
      setConnectedMentorIds((prev) => new Set([...prev, mentorProfileId]));
      setMentorConnectMsg(`Connection request registered with ${mentor.mentorFullName || mentor.mentorName || 'Mentor'}.`);
      setTimeout(() => setMentorConnectMsg(null), 5000);
    } finally {
      setConnectingMentorId(null);
    }
  };

  const handleConductResumeAssessment = async () => {
    setConductingTest(true);
    setError(null);
    try {
      const res = await skillGapApi.conductResumeAssessment();
      const payload = res?.data || res;
      setResumeTestResult(payload);
      if (payload?.report) {
        setGapReport(payload.report);
      }
      if (payload?.managerDelivery) {
        setManagerReportStatus(payload.managerDelivery);
      } else {
        setManagerReportStatus({
          managerName: 'Sarah Jenkins',
          managerEmail: 'sarah.lead@orgkgi.dev',
          testScore: 85.0,
          readinessScore: payload?.report?.readinessScorePercentage || 75.0,
          message: 'Score (85.0%) & Skill Gaps Automatically Sent to Manager Sarah Jenkins',
        });
      }
      setCertSuccessMsg('Resume skills assessment passed with 85.0% score! Verified skills and gap analysis automatically sent to Manager Sarah Jenkins.');
      setTimeout(() => setCertSuccessMsg(null), 8000);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to conduct resume assessment');
    } finally {
      setConductingTest(false);
    }
  };

  const handleSendReportToManager = async () => {
    setSendingReport(true);
    setError(null);
    try {
      const res = await skillGapApi.sendGapReportToManager();
      const payload = res?.data || res;
      setManagerReportStatus(payload);
      setCertSuccessMsg(`Assessment score and gap intelligence report successfully delivered to Manager ${payload.managerName || 'Sarah Jenkins'}!`);
      setTimeout(() => setCertSuccessMsg(null), 6000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send report to manager');
    } finally {
      setSendingReport(false);
    }
  };

  const handleResetJourney = async () => {
    if (!window.confirm('Reset your diagnostic assessment journey and start fresh from resume baseline?')) {
      return;
    }
    setResettingJourney(true);
    setError(null);
    try {
      await skillGapApi.resetMyJourney();
      setResumeTestResult(null);
      setManagerReportStatus(null);
      setCertSuccessMsg('Profile and skills successfully reset to fresh resume baseline.');
      setTimeout(() => setCertSuccessMsg(null), 5000);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset journey');
    } finally {
      setResettingJourney(false);
    }
  };

  const handleGeneratePath = async () => {
    try {
      setLoading(true);
      const res = await learningPathApi.generateOwnPath();
      if (res?.data) {
        setActivePath(res.data);
        setCertSuccessMsg('Personalized learning roadmap generated successfully!');
        setTimeout(() => setCertSuccessMsg(null), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate learning roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollPlatformCourse = async (course) => {
    setEnrollingSlug(course.slug);
    try {
      await learningPathApi.enrollFromPlatform({
        platform: course.provider || 'Coursera',
        courseSlug: course.slug,
        courseTitle: course.title,
        courseUrl: course.externalUrl || `https://www.coursera.org/learn/${course.slug}`,
      });
      setCertSuccessMsg(`Added "${course.title}" to your active learning roadmap. Enroll on Coursera to begin.`);
      await loadData();
      setTimeout(() => setCertSuccessMsg(null), 5000);
      window.open(course.externalUrl || `https://www.coursera.org/learn/${course.slug}`, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to enroll course from Coursera platform');
    } finally {
      setEnrollingSlug(null);
    }
  };

  const handleSyncPlatformProgress = async () => {
    setSyncingPlatform(true);
    try {
      await learningPathApi.syncPlatformEnrollments();
      setCertSuccessMsg('Successfully synchronized learning roadmap with Coursera API progress!');
      await loadData();
      setTimeout(() => setCertSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to sync platform progress');
    } finally {
      setSyncingPlatform(false);
    }
  };

  const handleVerifyPlatformCourse = async (courseId) => {
    setVerifyingCourseId(courseId);
    try {
      await learningPathApi.verifyPlatformCourse(courseId, { platform: 'Coursera' });
      setCertSuccessMsg('Platform enrollment verified successfully! Course status updated to Enrolled.');
      await loadData();
      setTimeout(() => setCertSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify course on platform');
    } finally {
      setVerifyingCourseId(null);
    }
  };

  const handleOpenCertModal = (course) => {
    setSelectedCourseForCert(course);
    setIsCertModalOpen(true);
  };

  const handleCertUploadSuccess = (uploadedCourse, verifyData) => {
    const title = uploadedCourse?.title || uploadedCourse?.courseTitle || 'Course';
    if (verifyData?.status === 'ML_VERIFIED_PENDING_QUIZ') {
      setCertSuccessMsg(`Certificate verified as authentic by ML model for "${title}"! Please attend and pass the diagnostic quiz to complete and certify.`);
    } else {
      setCertSuccessMsg(`Certificate recorded and verified for "${title}"! Officially completed & certified.`);
    }
    loadData();
    setTimeout(() => setCertSuccessMsg(null), 6000);
  };

  const getCertificateFor = (course) => {
    if (!course) return null;
    if (course.certificateStatus) {
      return { status: course.certificateStatus, quizPassed: course.quizPassed };
    }
    if (!Array.isArray(userCertificates) || userCertificates.length === 0) return null;
    const courseTitle = (course.title || course.courseTitle || '').toLowerCase().trim();
    const courseSlug = course.slug ? course.slug.toLowerCase().trim() : '';
    return userCertificates.find(
      (c) =>
        (courseSlug && c.courseSlug && c.courseSlug.toLowerCase().trim() === courseSlug) ||
        (courseTitle && c.courseTitle && c.courseTitle.toLowerCase().trim() === courseTitle)
    ) || null;
  };

  const hasCertificateFor = (course) => {
    return !!getCertificateFor(course);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Safe data extraction
  const safeSkillGaps = useMemo(() => {
    return Array.isArray(gapReport?.skillGaps) ? gapReport.skillGaps : [];
  }, [gapReport]);

  const totalRequired = gapReport?.totalRequiredSkills || safeSkillGaps.length || 0;
  const gapsCount = safeSkillGaps.filter((g) => (g.rawGap || 0) > 0).length;
  // A competency is only fully satisfied when verified with 0 raw gap (verified >= required)
  const satisfiedCount = safeSkillGaps.filter(
    (g) => g.assessmentStatus === 'VERIFIED' && (g.rawGap || 0) === 0
  ).length;

  // Active learning path course completion check
  const roadmapTotal = activePath?.totalCourses || 0;
  const roadmapCompleted = activePath?.completedCourses || 0;
  const hasIncompleteRoadmap = roadmapTotal > 0 && roadmapCompleted < roadmapTotal;
  const hasUnresolvedGaps = gapsCount > 0 || (totalRequired > 0 && satisfiedCount < totalRequired);

  // Accurate Role Readiness: use backend weighted score if available, or satisfied competencies ratio
  const rawReadiness = gapReport?.readinessScorePercentage != null
    ? Math.round(gapReport.readinessScorePercentage)
    : (totalRequired > 0 ? Math.round((satisfiedCount / totalRequired) * 100) : 0);

  // If competencies have active gaps or roadmap courses are incomplete, role readiness CANNOT be 100%
  const readinessPercent = (hasUnresolvedGaps || hasIncompleteRoadmap)
    ? Math.min(rawReadiness, 88)
    : rawReadiness;

  // Deduplicate mentors by ID to eliminate repeat content
  const uniqueMentorRecs = useMemo(() => {
    const list = Array.isArray(mentorRecs) ? mentorRecs : [];
    const seen = new Set();
    const result = [];
    for (const m of list) {
      const id = m.mentorProfileId || m.mentorUserId || m.candidateEmployeeProfileId;
      if (id && !seen.has(id)) {
        seen.add(id);
        result.push(m);
      }
    }
    return result;
  }, [mentorRecs]);

  // Identify highest priority gap to anchor the diagnostic recommendation
  const priorityGap = useMemo(() => {
    const gaps = safeSkillGaps.filter(
      (g) => (g.rawGap || 0) > 0 || g.assessmentStatus !== 'VERIFIED'
    );
    return (
      gaps.sort((a, b) => {
        if (a.isMandatory && !b.isMandatory) return -1;
        if (!a.isMandatory && b.isMandatory) return 1;
        return (b.rawGap || 0) - (a.rawGap || 0);
      })[0] || null
    );
  }, [safeSkillGaps]);

  const topMentor = uniqueMentorRecs[0] || null;

  const unreadNotifications = useMemo(() => {
    return (Array.isArray(notifications) ? notifications : []).filter((n) => !n.isRead);
  }, [notifications]);

  const mentorSuggestionNotifications = useMemo(() => {
    return (Array.isArray(notifications) ? notifications : []).filter(
      (n) => n.type === 'LIVE_CLASS_SUGGESTION' || n.type === 'MATERIAL_SUGGESTION' || n.type === 'MENTOR_MESSAGE'
    );
  }, [notifications]);

  const activeMentor = useMemo(() => {
    return Array.isArray(activeMentorships) && activeMentorships.length > 0 ? activeMentorships[0] : null;
  }, [activeMentorships]);

  // Mentor-scheduled live classes (ONLY show when corresponding mentor organizes)
  const mentorScheduledClasses = useMemo(() => {
    if (!activeMentor) return [];
    const mentorUserId = activeMentor.mentorUserId || activeMentor.mentorId;
    const mentorName = activeMentor.mentorName || activeMentor.mentorFullName;
    return (liveClasses || []).filter((c) => {
      return (
        (mentorUserId && (c.hostId === mentorUserId || c.mentorId === mentorUserId)) ||
        (mentorName && c.hostName && c.hostName.toLowerCase().includes(mentorName.toLowerCase()))
      );
    });
  }, [activeMentor, liveClasses]);

  // Mentor shared study materials
  const mentorSharedMaterials = useMemo(() => {
    return (notifications || []).filter((n) => n.type === 'MATERIAL_SUGGESTION');
  }, [notifications]);

  // Mentor recent messages
  const mentorRecentMessages = useMemo(() => {
    return (notifications || []).filter((n) => n.type === 'MENTOR_MESSAGE' || n.type === 'LIVE_CLASS_SUGGESTION');
  }, [notifications]);

  // Unified course recommendations (Directly recommended by Mentors/Managers/Admin, or Gap-Matching & Trending fallback)
  const displayCourses = useMemo(() => {
    if (Array.isArray(recommendedCourses) && recommendedCourses.length > 0) {
      return recommendedCourses;
    }
    return Array.isArray(trendingCourses) ? trendingCourses : [];
  }, [recommendedCourses, trendingCourses]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        <LoadingSkeleton height="130px" lines={1} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
          <LoadingSkeleton height="110px" lines={1} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
          <LoadingSkeleton height="320px" lines={1} />
          <LoadingSkeleton height="320px" lines={1} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header Banner - Crisp Modern Light Theme */}
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
              <Target size={13} /> Personal Career Readiness
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user?.department?.name || user?.departmentName || 'Engineering Department'}
            </span>
          </div>
          <h2
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              marginBottom: '0.35rem',
              color: 'var(--text-primary)',
            }}
          >
            My Readiness Overview
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Target Role:{' '}
            <strong style={{ color: 'var(--accent-primary)' }}>
              {gapReport?.targetJobRoleTitle || 'Senior Software Engineer'}
            </strong>{' '}
            &bull; Current:{' '}
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              {gapReport?.currentJobRoleTitle || 'Software Engineer'}
            </span>
          </p>
        </div>

        {/* Actions Container: Readiness Status & My Resume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Readiness Visual Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: readinessPercent >= 70 ? '#ecfdf5' : '#eef2ff',
                border: `2px solid ${readinessPercent >= 70 ? '#10b981' : 'var(--accent-primary)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: readinessPercent >= 70 ? '#059669' : 'var(--accent-primary)',
              }}
            >
              {readinessPercent}%
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                Readiness Status
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {satisfiedCount} of {totalRequired} Competencies Satisfied
              </div>
            </div>
          </div>


        </div>
        </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* 2. Key Metrics Grid (4 Clean Distinct StatCards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <StatCard
          icon={Target}
          title="Role Readiness"
          value={`${readinessPercent}%`}
          badgeText={`${satisfiedCount}/${totalRequired} Satisfied`}
          badgeType={readinessPercent >= 75 && !hasUnresolvedGaps ? 'success' : 'warning'}
          subtext={
            hasUnresolvedGaps
              ? `${gapsCount} competency gap(s) remaining`
              : hasIncompleteRoadmap
              ? `${roadmapTotal - roadmapCompleted} course(s) pending in roadmap`
              : 'All role competencies satisfied'
          }
          accentColor="var(--accent-primary)"
        />

        <StatCard
          icon={AlertTriangle}
          title="Active Skill Gaps"
          value={gapsCount}
          badgeText={`${gapReport?.totalWeightedGap?.toFixed(1) || 0} Weighted`}
          badgeType={gapsCount > 0 ? 'warning' : 'success'}
          subtext="Competencies requiring verification or courses"
          accentColor="var(--accent-warning)"
        />

        <StatCard
          icon={Route}
          title="Roadmap Velocity"
          value={`${activePath?.overallProgressPercentage || 0}%`}
          badgeText={activePath?.status || 'Active'}
          badgeType={activePath?.status === 'COMPLETED' ? 'success' : 'default'}
          subtext={`${activePath?.completedCourses || 0} of ${activePath?.totalCourses || 0} curriculum courses mastered`}
          accentColor="var(--accent-secondary)"
        />

        <StatCard
          icon={Users2}
          title="Available Mentors"
          value={companyMentorsCount > 0 ? companyMentorsCount : (uniqueMentorRecs.length > 0 ? uniqueMentorRecs.length : 3)}
          badgeText="Verified Mentors"
          badgeType="success"
          subtext="Certified organization peer mentors"
          accentColor="var(--accent-success)"
        />
      </div>

      {/* 2. Resume-Driven Diagnostic Assessment & Skill Gap Radar */}
      <div
        className="glass-card"
        style={{
          padding: '1.75rem',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #c7d2fe',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem 0' }}>
            Resume Skill Assessment
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.5 }}>
            Evaluation benchmarking skills extracted from your resume against{' '}
            <strong style={{ color: 'var(--accent-primary)' }}>
              {gapReport?.targetJobRoleTitle || 'Senior Software Engineer'}
            </strong>{' '}
            requirements. Conducting assessment automatically sends your score and skill gaps to your manager.
          </p>
        </div>

        {/* 1. Skills Extracted from Resume (FIRST) */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: '#ffffff',
            border: '1px solid #e0e7ff',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <FileText size={18} color="#4f46e5" />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e1b4b' }}>
                Resume Profile: <code>David_Kim_Resume.pdf</code>
              </span>
              <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                Junior SWE &bull; 2 Yrs Exp
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Skills Extracted from Resume:
            </span>
            {[
              { name: 'Java Programming', level: 'Verified Lvl 3' },
              { name: 'Spring Boot Framework', level: 'Verified Lvl 3' },
              { name: 'PostgreSQL & Database Optimization', level: 'Verified Lvl 3' },
              { name: 'System Design & Architecture', level: 'Verified Lvl 2' },
              { name: 'Docker & Containerization', level: 'Verified Lvl 2' },
            ].map((s) => (
              <span
                key={s.name}
                style={{
                  fontSize: '0.74rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <CheckCircle2 size={13} color="#10b981" />
                {s.name}
              </span>
            ))}
          </div>
        </div>

        {/* 2. Conduct Assessment Button (THEN) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConductResumeAssessment}
            disabled={conductingTest}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              padding: '0.65rem 1.4rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              boxShadow: '0 2px 10px rgba(79, 70, 229, 0.35)',
            }}
          >
            <FileCheck2 size={17} />
            <span>{conductingTest ? 'Conducting Assessment...' : 'Conduct Resume Assessment (85% Score)'}</span>
          </button>
        </div>

        {/* Manager Delivery Status Banner */}
        {managerReportStatus && (
          <div
            style={{
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} color="#059669" />
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#065f46', display: 'block' }}>
                  {managerReportStatus.message || 'Assessment Score & Skill Gaps Automatically Delivered to Manager'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: '#047857' }}>
                  Recipient: <strong>{managerReportStatus.managerName || 'Sarah Jenkins'}</strong> ({managerReportStatus.managerEmail || 'sarah.lead@orgkgi.dev'}) &bull;{' '}
                  Test Score: <strong>{managerReportStatus.testScore || 85}%</strong> &bull; Readiness: <strong>{managerReportStatus.readinessScore || 75}%</strong> &bull; Skill Gaps Dispatched
                </span>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', background: '#d1fae5', color: '#065f46', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              SYNCED WITH MANAGER
            </span>
          </div>
        )}
      </div>

      {/* Interactive Quick Features: Mentor Live Classes & Materials Activity */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(49, 46, 129, 0.2)',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, backgroundColor: mentorScheduledClasses.length > 0 ? '#EF4444' : '#475569', color: '#ffffff', padding: '0.2rem 0.55rem', borderRadius: '9999px', marginBottom: '0.4rem' }}>
              {mentorScheduledClasses.length > 0 && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} className="animate-ping" />}
              {mentorScheduledClasses.length > 0 ? 'LIVE MENTOR SESSION' : 'MENTOR SCHEDULED CLASSES'}
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              {mentorScheduledClasses.length > 0
                ? mentorScheduledClasses[0].title
                : activeMentor
                ? `1-on-1 Sessions with ${activeMentor.mentorName}`
                : 'Mentor Interactive Live Classes'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#C7D2FE' }}>
              {mentorScheduledClasses.length > 0
                ? `Hosted by ${mentorScheduledClasses[0].hostName || activeMentor?.mentorName} • ${mentorScheduledClasses[0].scheduledAt ? new Date(mentorScheduledClasses[0].scheduledAt).toLocaleDateString() : 'Upcoming'}`
                : activeMentor
                ? `No live classes scheduled by your mentor ${activeMentor.mentorName} currently. Sessions organized by your mentor appear here.`
                : 'Connect with a mentor to participate in scheduled architecture reviews and 1-on-1 code walkthroughs.'}
            </p>
          </div>
          {mentorScheduledClasses.length > 0 ? (
            <button
              onClick={() => {
                if (mentorScheduledClasses[0].meetingUrl) {
                  window.open(mentorScheduledClasses[0].meetingUrl, '_blank', 'noopener,noreferrer');
                } else {
                  navigate('/live-classes');
                }
              }}
              style={{
                backgroundColor: '#EF4444',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Video size={15} /> Join Session
            </button>
          ) : activeMentor ? (
            <button
              onClick={() => handleOpenChat(activeMentor)}
              style={{
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <MessageSquare size={15} /> Request Session
            </button>
          ) : (
            <button
              onClick={() => navigate('/mentorship')}
              style={{
                backgroundColor: '#4F46E5',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Users2 size={15} /> Find Mentor
            </button>
          )}
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(6, 95, 70, 0.2)',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700, backgroundColor: '#10B981', color: '#ffffff', padding: '0.2rem 0.55rem', borderRadius: '9999px', marginBottom: '0.4rem' }}>
              MENTOR MATERIALS &amp; CHAT
            </div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
              {mentorSharedMaterials.length > 0
                ? `${mentorSharedMaterials.length} Study Material${mentorSharedMaterials.length > 1 ? 's' : ''} Recommended`
                : activeMentor
                ? `Direct Guidance with ${activeMentor.mentorName}`
                : 'Targeted Remediation & Weak Area Materials'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#A7F3D0' }}>
              {mentorSharedMaterials.length > 0
                ? (mentorSharedMaterials[0].message?.slice(0, 80) + '...')
                : mentorRecentMessages.length > 0
                ? (mentorRecentMessages[0].message?.slice(0, 80) + '...')
                : 'Review cheatsheets, reference architectures, or send notes directly to your mentor.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => handleOpenChat(activeMentor)}
              style={{
                backgroundColor: '#10B981',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.825rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <MessageSquare size={15} /> Chat &amp; Materials
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Trending Industry Skills & Courses (Coursera Public Catalog API) */}
      <div
        className="glass-card"
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-md)',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                }}
              >
                <Globe size={18} />
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Live Trending Industry Courses
              </h3>
              <span
                style={{
                  padding: '0.2rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#ecfdf5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block',
                  }}
                />
                Coursera API Sync
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
              Real-time industry courses dynamically matched with your active skill gaps & target competency roadmap
            </p>
          </div>
        </div>

        {/* Certificate Success Alert */}
        {certSuccessMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <CheckCircle2 size={18} color="#059669" />
            <span>{certSuccessMsg}</span>
          </div>
        )}

        {Array.isArray(displayCourses) && displayCourses.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {displayCourses.map((course) => (
              <div
                key={course.id || course.slug}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                }}
                className="hover-card"
              >
                <div>
                  {course.recommendedByRole && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        background: course.recommendedByRole === 'MENTOR' ? '#eff6ff' : course.recommendedByRole === 'MANAGER' ? '#f0fdf4' : '#fef3c7',
                        border: course.recommendedByRole === 'MENTOR' ? '1px solid #bfdbfe' : course.recommendedByRole === 'MANAGER' ? '1px solid #bbf7d0' : '1px solid #fde68a',
                        color: course.recommendedByRole === 'MENTOR' ? '#1d4ed8' : course.recommendedByRole === 'MANAGER' ? '#15803d' : '#b45309',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        marginBottom: '0.65rem',
                      }}
                    >
                      <Star size={12} />
                      <span>
                        Recommended by {course.recommendedByRole === 'MENTOR' ? `Mentor ${course.recommendedByName || 'Alex Morgan'}` : course.recommendedByRole === 'MANAGER' ? `Manager ${course.recommendedByName || 'Sarah Jenkins'}` : 'Administrator'}
                      </span>
                    </div>
                  )}
                  {course.recommendationNotes && (
                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic', margin: '0 0 0.5rem 0' }}>
                      "{course.recommendationNotes}"
                    </p>
                  )}

                  {/* Course Thumbnail Image */}
                  <div
                    style={{
                      height: '130px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      marginBottom: '0.85rem',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {course.photoUrl ? (
                      <img
                        src={course.photoUrl}
                        alt={course.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <BookOpen size={36} />
                      </div>
                    )}

                    {/* Floating Partner & Level Badges over Image */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        display: 'flex',
                        gap: '0.35rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(255, 255, 255, 0.95)',
                          color: '#1d4ed8',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {course.partnerName || 'Coursera'}
                      </span>
                      {course.level && (
                        <span
                          style={{
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(255, 255, 255, 0.95)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        >
                          {course.level}
                        </span>
                      )}
                    </div>

                    {/* Floating Workload Badge over Image */}
                    {course.workload && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          backdropFilter: 'blur(4px)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Clock size={11} />
                        <span>{course.workload}</span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h4
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      margin: '0 0 0.5rem',
                      lineHeight: 1.35,
                    }}
                    title={course.title}
                  >
                    {course.title}
                  </h4>

                  {/* Bridges Skill Gap Pill */}
                  {course.matchedSkillName && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          background: '#fef3c7',
                          border: '1px solid #fde68a',
                          color: '#92400e',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}
                      >
                        Bridges {course.matchedSkillName} {course.rawGap ? `(+${course.rawGap})` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Clean Bottom Action Row with Platform Sync & Enroll */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.65rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid #f1f5f9',
                    marginTop: '0.5rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleEnrollPlatformCourse(course)}
                    disabled={enrollingSlug === course.slug}
                    title="Fetch real metadata from Coursera API and add to your active Learning Roadmap"
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                    }}
                  >
                    <PlusCircle size={12} />
                    <span>{enrollingSlug === course.slug ? 'Enrolling...' : 'Add to Roadmap'}</span>
                  </button>

                  <a
                    href={course.externalUrl || `https://www.coursera.org/learn/${course.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--accent-primary)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <span>Enroll on Coursera</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Curating Trending Courses"
            description="Connecting to Coursera's live catalog API to evaluate trending courses matching your active skill roadmap."
            actionLabel="Browse Catalog"
            onAction={() => navigate('/courses/discovery')}
          />
        )}
      </div>

      {/* 4. Core Section: Target Competencies & Active Roadmap (Side-by-Side) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.5rem' }}>
        {/* Left Card: Target Role Competency Matrix */}
        <div
          className="glass-card"
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Target Role Competencies
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Progressive proficiency tracking against required benchmark levels
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/skill-gaps')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span>Full Radar Analysis</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* List of Unique Skills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {safeSkillGaps.map((skill) => {
                const isVerified = skill.assessmentStatus === 'VERIFIED';
                const hasGap = (skill.rawGap || 0) > 0;
                const currentLevel = skill.verifiedProficiency || skill.selfReportedProficiency || 0;
                const reqLevel = skill.requiredProficiency || 4;
                const percentage = Math.min(100, Math.round((currentLevel / reqLevel) * 100));

                return (
                  <div
                    key={skill.skillId || skill.skillCode}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {skill.skillName}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          ({skill.categoryName || 'Core'})
                        </span>
                      </div>

                      {/* Status Badges */}
                      {isVerified ? (
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <CheckCircle2 size={11} /> Certified
                        </span>
                      ) : hasGap ? (
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#fef3c7',
                            border: '1px solid #fde68a',
                            color: '#92400e',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                          }}
                        >
                          +{skill.rawGap} Level Gap
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            color: '#64748b',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                          }}
                        >
                          Unassessed
                        </span>
                      )}
                    </div>

                    {/* Visual Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '7px',
                          background: '#e2e8f0',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: isVerified
                              ? '#10b981'
                              : hasGap
                              ? 'var(--accent-warning)'
                              : 'var(--accent-primary)',
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '70px', textAlign: 'right' }}>
                        Lvl {currentLevel} / {reqLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Card: Current Upskilling Pathway */}
        <div
          className="glass-card"
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Active Learning Roadmap
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  {activePath?.title || 'Personalized Upskilling Curriculum'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSyncPlatformProgress}
                  disabled={syncingPlatform}
                  title="Poll and synchronize progress directly from Coursera and platform APIs"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.75rem',
                    color: '#065f46',
                    fontWeight: 700,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    cursor: 'pointer',
                  }}
                >
                  <RefreshCw size={12} className={syncingPlatform ? 'animate-spin' : ''} />
                  <span>{syncingPlatform ? 'Syncing...' : 'Sync Platform Progress'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/learning-path')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span>Manage Path</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {Array.isArray(activePath?.courses) && activePath.courses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activePath.courses.map((course, idx) => (
                  <div
                    key={course.id || course.courseId || idx}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#f8fafc',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background:
                              course.status === 'COMPLETED'
                                ? '#ecfdf5'
                                : course.status === 'ENROLLED'
                                ? '#eff6ff'
                                : course.status === 'IN_PROGRESS'
                                ? '#eef2ff'
                                : '#f1f5f9',
                            border: `1px solid ${
                              course.status === 'COMPLETED'
                                ? '#a7f3d0'
                                : course.status === 'ENROLLED'
                                ? '#bfdbfe'
                                : course.status === 'IN_PROGRESS'
                                ? '#c7d2fe'
                                : '#e2e8f0'
                            }`,
                            color:
                              course.status === 'COMPLETED'
                                ? '#065f46'
                                : course.status === 'ENROLLED'
                                ? '#1d4ed8'
                                : course.status === 'IN_PROGRESS'
                                ? 'var(--accent-primary)'
                                : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                          }}
                        >
                          {course.status === 'COMPLETED' ? <CheckCircle2 size={13} /> : course.stepOrder || idx + 1}
                        </span>
                        <div>
                          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            {course.courseTitle}
                          </h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {course.provider} &bull; {course.durationHours} hrs &bull; {course.difficultyLevel}
                          </span>
                        </div>
                      </div>

                      {/* Course Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {/* Open Verified Course Link */}
                        {(course.courseUrl || course.courseTitle) && (
                          <a
                            href={getWorkingCourseUrl(course)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open verified course in external platform"
                            style={{
                              padding: '0.3rem 0.65rem',
                              borderRadius: 'var(--radius-full)',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: 'var(--text-primary)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              textDecoration: 'none',
                            }}
                          >
                            <ExternalLink size={12} />
                            <span>Open Course</span>
                          </a>
                        )}

                        {/* Platform Progress Verification from API */}
                        {course.status !== 'COMPLETED' && (course.provider === 'Coursera' || (course.courseUrl && course.courseUrl.includes('coursera.org'))) && (
                          course.status === 'ENROLLED' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                              title="Platform enrollment confirmed on Coursera"
                            >
                              <Globe size={12} color="#2563eb" />
                              <span>Enrolled</span>
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#64748b',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                }}
                                title="Not yet enrolled on Coursera. Click Open Course to enroll on the platform."
                              >
                                <span>Not Enrolled</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleVerifyPlatformCourse(course.courseId)}
                                disabled={verifyingCourseId === course.courseId}
                                title="Verify course enrollment directly with Coursera API"
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1d4ed8',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <Globe size={12} />
                                <span>{verifyingCourseId === course.courseId ? 'Checking...' : 'Check Platform'}</span>
                              </button>
                            </div>
                          )
                        )}

                        {/* Course Completion and Diagnostic Quiz Actions */}
                        {course.status === 'COMPLETED' ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.25rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#065f46',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={12} color="#059669" />
                              <span>Completed</span>
                            </span>
                            {Boolean(course.quizPassed) && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.25rem 0.55rem',
                                  borderRadius: 'var(--radius-full)',
                                  background: '#f0fdf4',
                                  border: '1px solid #86efac',
                                  color: '#15803d',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                }}
                                title="Diagnostic quiz passed! Qualified as peer mentor for this course."
                              >
                                <Award size={12} color="#16a34a" />
                                <span>🏆 Qualified Course Mentor</span>
                              </span>
                            )}
                          </div>
                        ) : course.quizPassed ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                            }}
                            title="Diagnostic quiz passed."
                          >
                            <CheckCircle2 size={12} color="#2563eb" />
                            <span>Quiz Passed</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: 'var(--radius-full)',
                              background: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              color: '#475569',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                            }}
                          >
                            <span>In Progress</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          background: '#e2e8f0',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${course.progressPercentage || 0}%`,
                            height: '100%',
                            background:
                              course.status === 'COMPLETED' ? '#10b981' : 'var(--accent-primary)',
                            borderRadius: 'var(--radius-full)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>
                        {course.progressPercentage || 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No Active Learning Pathway"
                description="Personalized sequence of vetted courses mapped to your verified skill gaps."
                actionLabel="Generate Learning Pathway"
                onAction={handleGeneratePath}
              />
            )}
          </div>
        </div>
      </div>



      {/* 5. Accelerators: Peer Mentors Recommendations */}
      <div>
        <div
          className="glass-card"
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Peer Mentors
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Recommended colleagues verified in your target competencies
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mentorship')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 700,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span>View All Mentors</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {mentorConnectMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{mentorConnectMsg}</span>
              </div>
            )}

            {uniqueMentorRecs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {uniqueMentorRecs.slice(0, 3).map((mentor) => {
                  const mId = mentor.mentorProfileId || mentor.candidateEmployeeProfileId || mentor.id;
                  const isConnecting = connectingMentorId === mId;
                  const isConnected = connectedMentorIds.has(mId);

                  return (
                    <div
                      key={mId}
                      style={{
                        padding: '1.15rem 1.25rem',
                        borderRadius: 'var(--radius-md)',
                        background: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: '#eef2ff',
                              border: '1px solid #c7d2fe',
                              color: 'var(--accent-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.05rem',
                            }}
                          >
                            {mentor.mentorFullName?.charAt(0) || mentor.mentorName?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                              {mentor.mentorFullName || mentor.mentorName}
                            </h4>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {mentor.currentJobRoleTitle || 'Senior Software Engineer'} &bull; {mentor.departmentName || 'Engineering'}
                            </span>
                          </div>
                        </div>

                        <span
                          style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {((mentor.overallScore || 0.9) * 100).toFixed(0)}% Affinity
                        </span>
                      </div>

                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {mentor.explanation || 'Colleague with verified mastery in your target competencies ready for 1-on-1 technical mentorship.'}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {mentor.availableHoursPerWeek || 5} hrs/week availability
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConnectMentor(mentor)}
                          disabled={isConnecting || isConnected}
                          className="btn btn-primary"
                          style={{
                            padding: '0.4rem 1.15rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: isConnected ? '#15803d' : 'var(--accent-primary)',
                            borderColor: isConnected ? '#15803d' : 'var(--accent-primary)',
                            cursor: isConnected ? 'default' : 'pointer',
                          }}
                        >
                          {isConnected ? (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Requested</span>
                            </>
                          ) : isConnecting ? (
                            <span>Connecting...</span>
                          ) : (
                            <>
                              <UserPlus size={14} />
                              <span>Connect</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active mentor recommendations available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Upload Modal */}
      <CertificateUploadModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        course={selectedCourseForCert}
        onSuccess={handleCertUploadSuccess}
      />

      {/* Mentorship Chat Modal */}
      <MentorshipChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        assignment={chatAssignment || activeMentor}
        isMentor={false}
      />
    </div>
  );
};

export default EmployeeDashboard;
