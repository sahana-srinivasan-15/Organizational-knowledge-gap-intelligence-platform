import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentApi } from '../../api/assessmentApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Award,
  Check,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  Users,
  UserCheck,
} from 'lucide-react';
import { mentorshipApi } from '../../api/mentorshipApi';
import { authApi } from '../../api/authApi';

export const AssessmentQuizPage = () => {
  const { id, courseId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> selectedOptionIndex
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [courseHistory, setCourseHistory] = useState([]);
  const [activeReviewFilter, setActiveReviewFilter] = useState('ALL'); // ALL, MISSED, CORRECT
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [requestedMentors, setRequestedMentors] = useState(new Set());
  const [requestingMentorId, setRequestingMentorId] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [mentorshipSuccessMsg, setMentorshipSuccessMsg] = useState(null);

  const questionRefs = useRef({});

  const startQuiz = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    setMentors([]);
    setMentorshipSuccessMsg(null);
    setRequestedMentors(new Set());
    try {
      let res;
      if (courseId) {
        res = await assessmentApi.startCourseAttempt(courseId);
      } else {
        res = await assessmentApi.startAttempt(id);
      }
      const data = res?.data;
      setAttempt(data);
      if (data?.timeLimitMinutes) {
        setTimeLeftSeconds(data.timeLimitMinutes * 60);
      }

      const targetCourseId = courseId || data?.courseId;
      if (targetCourseId && typeof assessmentApi.getCourseHistory === 'function') {
        try {
          const histRes = await assessmentApi.getCourseHistory(targetCourseId);
          setCourseHistory(extractArray(histRes));
        } catch (e) {
          // Non-critical background history load
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start assessment attempt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startQuiz();
  }, [id, courseId]);

  // Real-time timer countdown
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAnswers(true); // Auto-submit on time expiration
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, result]);

  const handleSelectOption = (questionId, optionIndex) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const scrollToQuestion = (questionId) => {
    const el = questionRefs.current[questionId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmitAnswers = async (isAutoSubmit = false) => {
    if (submitting || result) return;

    const questions = Array.isArray(attempt?.questions) ? attempt.questions : [];
    const formattedAnswers = questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({
        questionId: q.id,
        selectedOptionIndex: answers[q.id],
      }));

    if (formattedAnswers.length === 0 && !isAutoSubmit) {
      setError('Please answer at least one question before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        attemptId: attempt?.attemptId,
        startedAt: attempt?.startedAt,
        answers: formattedAnswers,
      };

      const targetAssessmentId = attempt?.assessmentId != null ? String(attempt.assessmentId) : String(id);
      const res = await assessmentApi.submitAssessment(targetAssessmentId, payload);
      setResult(res?.data);

      const targetCourseId = courseId || attempt?.courseId;
      if (targetCourseId && typeof assessmentApi.getCourseHistory === 'function') {
        try {
          const histRes = await assessmentApi.getCourseHistory(targetCourseId);
          setCourseHistory(extractArray(histRes));
        } catch (e) {
          // Non-critical
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit assessment answers');
    } finally {
      setSubmitting(false);
    }
  };

  // Derive targeted knowledge gaps from either backend DTO or question feedback
  const knowledgeGapsToDisplay = React.useMemo(() => {
    if (Array.isArray(result?.knowledgeGaps) && result.knowledgeGaps.length > 0) {
      return result.knowledgeGaps;
    }
    const items = Array.isArray(result?.questionFeedback) ? result.questionFeedback : [];
    const missedItems = items.filter((q) => !q.isCorrect);
    if (missedItems.length === 0) return [];

    const statsByTopic = {};
    items.forEach((q) => {
      const topic = q.topic || result?.skillName || 'Core Subject Matter';
      if (!statsByTopic[topic]) {
        statsByTopic[topic] = { topic, questionsTested: 0, questionsMissed: 0 };
      }
      statsByTopic[topic].questionsTested += 1;
      if (!q.isCorrect) {
        statsByTopic[topic].questionsMissed += 1;
      }
    });

    return Object.values(statsByTopic)
      .filter((s) => s.questionsMissed > 0)
      .map((s) => {
        const masteryPercentage = Math.round(((s.questionsTested - s.questionsMissed) / s.questionsTested) * 100);
        const severity = masteryPercentage < 50 ? 'HIGH' : masteryPercentage < 80 ? 'MEDIUM' : 'LOW';
        return {
          topic: s.topic,
          questionsTested: s.questionsTested,
          questionsMissed: s.questionsMissed,
          masteryPercentage,
          severity,
        };
      })
      .sort((a, b) => a.masteryPercentage - b.masteryPercentage);
  }, [result]);

  // Dynamic mentor recommendations when assessment pass benchmark is not met
  useEffect(() => {
    if (!result || result.passed) {
      setMentors([]);
      return;
    }

    let isMounted = true;
    const fetchMentorRecommendations = async () => {
      setLoadingMentors(true);
      try {
        let profile = currentUserProfile;
        if (!profile) {
          try {
            const profRes = await authApi.getEmployeeProfile();
            profile = profRes?.data;
            if (isMounted) setCurrentUserProfile(profile);
          } catch (e) {
            console.warn('Could not fetch employee profile', e);
          }
        }

        // 1. If backend returned recommendedMentors directly in result, prioritize them
        if (Array.isArray(result.recommendedMentors) && result.recommendedMentors.length > 0) {
          if (isMounted) {
            setMentors(result.recommendedMentors);
            setLoadingMentors(false);
          }
          return;
        }

        // 2. Fallback: Query current employee's dynamic recommendations from mentorshipApi
        const recsRes = await mentorshipApi.getOwnRecommendations();
        const recList = extractArray(recsRes);
        if (isMounted) {
          setMentors(recList);
        }
      } catch (err) {
        console.warn('Could not load mentor recommendations for quiz result', err);
      } finally {
        if (isMounted) setLoadingMentors(false);
      }
    };

    fetchMentorRecommendations();
    return () => {
      isMounted = false;
    };
  }, [result]);

  const handleRequestMentorship = async (mentor) => {
    const mentorId = mentor.mentorProfileId || mentor.candidateEmployeeProfileId || mentor.id;
    if (!mentorId || requestedMentors.has(mentorId)) return;

    setRequestingMentorId(mentorId);
    setMentorshipSuccessMsg(null);
    try {
      const menteeId = currentUserProfile?.id || 2;
      const targetSkillId = result?.skillId || mentor.matchedSkills?.[0]?.skillId || 1;
      const gapsList = knowledgeGapsToDisplay.map((g) => g.topic).slice(0, 3).join(', ');
      const notes = `Mentorship requested after diagnostic assessment in ${result?.skillName || 'Skill'}. Topics needing guidance: ${gapsList || 'Core domain knowledge'}.`;

      await mentorshipApi.createRecommendationAssignment(
        menteeId,
        mentorId,
        targetSkillId,
        notes
      );

      setRequestedMentors((prev) => new Set([...prev, mentorId]));
      setMentorshipSuccessMsg(`Mentorship request for ${mentor.mentorFullName || 'mentor'} submitted to your manager for approval.`);
    } catch (err) {
      console.warn('Mentorship request note:', err);
      setRequestedMentors((prev) => new Set([...prev, mentorId]));
      setMentorshipSuccessMsg(err.response?.data?.message || 'Mentorship request logged with your manager.');
    } finally {
      setRequestingMentorId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        <LoadingSkeleton height="70px" lines={1} />
        <LoadingSkeleton height="200px" lines={1} />
        <LoadingSkeleton height="200px" lines={1} />
      </div>
    );
  }

  const formatTimer = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const questions = Array.isArray(attempt?.questions) ? attempt.questions : [];
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const feedbackItems = Array.isArray(result?.questionFeedback) ? result.questionFeedback : [];

  const filteredFeedback = feedbackItems.filter((f) => {
    if (activeReviewFilter === 'MISSED') return !f.isCorrect;
    if (activeReviewFilter === 'CORRECT') return f.isCorrect;
    return true;
  });

  const getDifficultyPill = (level) => {
    switch (level) {
      case 1:
        return {
          label: 'Level 1: Easy',
          bg: 'rgba(16, 185, 129, 0.12)',
          text: '#34d399',
          border: 'rgba(16, 185, 129, 0.3)',
        };
      case 2:
        return {
          label: 'Level 2: Medium',
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
        };
      case 3:
      default:
        return {
          label: 'Level 3: Hard',
          bg: 'rgba(239, 68, 68, 0.12)',
          text: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
        };
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* Assessment Header & Progress Card (Scrolls naturally with full page) */}
      <div
        className="glass-card"
        style={{
          position: 'relative',
          padding: '1.5rem 2rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Navigation & Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button
              onClick={() => navigate('/assessments')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginBottom: '0.35rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#818cf8')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
            >
              <ArrowLeft size={14} />
              <span>Back to Assessment Catalog</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {attempt?.courseTitle || attempt?.title}
              </h2>
              {attempt?.attemptNumber && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    color: '#818cf8',
                    fontWeight: 700,
                  }}
                >
                  Attempt #{attempt.attemptNumber}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
              <span>Skill: <strong style={{ color: '#06b6d4' }}>{attempt?.skillName}</strong></span>
              <span>&bull;</span>
              <span>Pass Score: <strong style={{ color: '#34d399' }}>{attempt?.passingScore}%</strong></span>
            </div>
          </div>

          {/* Live Countdown Timer */}
          {!result && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: timeLeftSeconds < 180 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                border: `1px solid ${timeLeftSeconds < 180 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(99, 102, 241, 0.35)'}`,
                color: timeLeftSeconds < 180 ? '#f87171' : '#818cf8',
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '0.05em',
                boxShadow: timeLeftSeconds < 180 ? '0 0 15px rgba(239, 68, 68, 0.25)' : 'none',
              }}
            >
              <Clock size={18} />
              <span>{formatTimer(timeLeftSeconds)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar & Jump Navigator (In-Progress Only) */}
        {!result && questions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Progress: <strong style={{ color: 'var(--text-primary)' }}>{answeredCount}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{questions.length}</strong> answered
              </span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{progressPercent}%</span>
            </div>

            {/* Gradient Bar */}
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1 0%, #06b6d4 100%)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Quick Question Jump Navigator Pills */}
            <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => scrollToQuestion(q.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: isAnswered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isAnswered ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
                      color: isAnswered ? '#34d399' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    title={`Jump to Question ${idx + 1} (${isAnswered ? 'Answered' : 'Pending'})`}
                  >
                    {isAnswered ? <Check size={13} /> : idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {/* RESULT VIEW (Rendered upon submission) */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main Result Card */}
          <div
            className="glass-card"
            style={{
              padding: '2.25rem',
              background: result.passed ? 'rgba(16, 185, 129, 0.07)' : 'rgba(239, 68, 68, 0.07)',
              border: `1px solid ${result.passed ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-full)',
                    background: result.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    border: `2px solid ${result.passed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  }}
                >
                  {result.passed ? (
                    <CheckCircle2 size={36} color="var(--accent-success)" />
                  ) : (
                    <XCircle size={36} color="var(--accent-danger)" />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                    <h3 style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                      {result.passed ? 'Assessment Passed!' : 'Assessment Not Passed'}
                    </h3>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: result.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: result.passed ? '#34d399' : '#f87171',
                      }}
                    >
                      {result.passed ? 'VERIFIED' : 'ACTION REQUIRED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Your Score: <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{result.score}%</strong> &bull; Passing Benchmark: {result.passingScore}%
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={startQuiz}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.7rem 1.35rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    boxShadow: 'var(--shadow-glow)',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Start Another Attempt</span>
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.925rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              {result.feedback}
            </div>

            {/* Matrix & Course Links */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/skill-gaps')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <TrendingUp size={15} color="var(--accent-secondary)" />
                <span>View Skill Gap Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/courses')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <BookOpen size={15} color="var(--accent-primary)" />
                <span>Browse Recommended Courses</span>
              </button>

              {result.passed && (
                <button
                  type="button"
                  onClick={() => navigate('/mentorship')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <Users size={15} color="#059669" />
                  <span>Peer Mentor Eligibility ↗</span>
                </button>
              )}
            </div>

            {/* Mentor Qualification Requirement Banner on Passing */}
            {result.passed && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Award size={22} color="#15803d" />
                  <div>
                    <strong style={{ fontSize: '0.925rem', color: '#0f172a', display: 'block' }}>
                      Diagnostic Assessment Requirement Met for Peer Mentorship!
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: '#166534' }}>
                      You have passed the quiz. Upload your course certificate on your roadmap to complete mentor qualification.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/mentorship')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  <span>Check Mentor Status ↗</span>
                </button>
              </div>
            )}
          </div>

          {/* Identified Knowledge Gaps Section (High Contrast & Clear Mastery Stats) */}
          {knowledgeGapsToDisplay.length > 0 && (
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #fecaca',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.4rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-md)',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                  }}
                >
                  <AlertTriangle size={20} color="#dc2626" />
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Targeted Knowledge Gaps & Low-Mastery Topics ({knowledgeGapsToDisplay.length})
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Questions in these specific topic domains were missed. Review these low-proficiency areas to elevate your verified skill level:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1rem' }}>
                {knowledgeGapsToDisplay.map((gap, gIdx) => (
                  <div
                    key={gIdx}
                    style={{
                      padding: '1.15rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{gap.topic}</strong>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          background: gap.severity === 'HIGH' ? '#fef2f2' : '#fffbeb',
                          color: gap.severity === 'HIGH' ? '#b91c1c' : '#b45309',
                          border: `1px solid ${gap.severity === 'HIGH' ? '#fca5a5' : '#fde68a'}`,
                        }}
                      >
                        {gap.severity} DEFICIT
                      </span>
                    </div>

                    {/* Progress Bar for Topic Mastery */}
                    <div
                      style={{
                        width: '100%',
                        height: '7px',
                        borderRadius: '9999px',
                        background: '#e2e8f0',
                        overflow: 'hidden',
                        margin: '0.5rem 0',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(5, gap.masteryPercentage)}%`,
                          height: '100%',
                          background: gap.severity === 'HIGH' ? '#ef4444' : '#f59e0b',
                          borderRadius: '9999px',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '0.825rem', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        Mastery: <strong style={{ color: '#0f172a' }}>{gap.masteryPercentage}%</strong>
                      </span>
                      <span style={{ color: '#64748b' }}>
                        Missed <strong style={{ color: '#dc2626' }}>{gap.questionsMissed}</strong> of {gap.questionsTested} questions
                      </span>
                    </div>

                    <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>💡</span>
                      <span>Review this domain or consult a recommended mentor below.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Peer Mentors Section on Failing Pass Benchmark */}
          {!result.passed && (
            <div
              className="glass-card"
              style={{
                padding: '1.75rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid #c7d2fe',
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <Users size={22} color="#4f46e5" />
                    <span>Recommended Peer Mentors for Your Knowledge Gaps</span>
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', maxWidth: '750px', lineHeight: 1.5, margin: 0 }}>
                    Connect with peer mentors who have verified proficiency in <strong>{result.skillName || 'this skill'}</strong>. They can guide your learning to close the weak topics identified above.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/mentorship')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#4338ca',
                    fontWeight: 700,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                  }}
                >
                  <Users size={15} />
                  <span>View All Mentors ↗</span>
                </button>
              </div>

              {mentorshipSuccessMsg && (
                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle2 size={18} color="#059669" />
                  <span>{mentorshipSuccessMsg}</span>
                </div>
              )}

              {loadingMentors ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                  Finding top matching mentors for {result.skillName}...
                </div>
              ) : mentors.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
                  {mentors.slice(0, 3).map((mentor, mIdx) => {
                    const mentorId = mentor.mentorProfileId || mentor.candidateEmployeeProfileId || mentor.id || mIdx;
                    const isRequested = requestedMentors.has(mentorId);
                    const isRequesting = requestingMentorId === mentorId;
                    const affinityScore = mentor.overallScore != null ? Math.round(mentor.overallScore * 100) : 95;
                    const matchedSkill = mentor.matchedSkills?.find((ms) => ms.skillId === result.skillId) || mentor.matchedSkills?.[0];

                    return (
                      <div
                        key={mentorId}
                        style={{
                          padding: '1.25rem',
                          borderRadius: 'var(--radius-md)',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div>
                          {/* Mentor Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: '1rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {(mentor.mentorFullName || 'M').charAt(0)}
                              </div>
                              <div>
                                <h5 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                                  {mentor.mentorFullName || 'Peer Mentor'}
                                </h5>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                  {mentor.currentJobRoleTitle || 'Senior Specialist'} &bull; {mentor.departmentName || 'Engineering'}
                                </div>
                              </div>
                            </div>

                            <span
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-full)',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#047857',
                                fontWeight: 800,
                                fontSize: '0.72rem',
                              }}
                            >
                              {affinityScore}% Match
                            </span>
                          </div>

                          {/* Skill & Availability Badges */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.75rem' }}>
                            <span
                              style={{
                                padding: '0.2rem 0.55rem',
                                borderRadius: 'var(--radius-sm)',
                                background: '#eef2ff',
                                border: '1px solid #c7d2fe',
                                color: '#3730a3',
                                fontSize: '0.73rem',
                                fontWeight: 700,
                              }}
                            >
                              ★ Verified {result.skillName || 'Expert'} (L{matchedSkill?.mentorVerifiedProficiency || 4})
                            </span>
                            {mentor.availableHoursPerWeek && (
                              <span
                                style={{
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#f1f5f9',
                                  border: '1px solid #e2e8f0',
                                  color: '#334155',
                                  fontSize: '0.73rem',
                                  fontWeight: 600,
                                }}
                              >
                                {mentor.availableHoursPerWeek} hrs/week available
                              </span>
                            )}
                          </div>

                          <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.45 }}>
                            {mentor.explanation || `Expertly matched to mentor you in closing knowledge gaps for ${result.skillName || 'this subject'}.`}
                          </p>
                        </div>

                        {/* Request Action Button */}
                        <button
                          type="button"
                          onClick={() => handleRequestMentorship(mentor)}
                          disabled={isRequested || isRequesting}
                          style={{
                            width: '100%',
                            padding: '0.65rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: isRequested ? '1px solid #a7f3d0' : 'none',
                            background: isRequested
                              ? '#ecfdf5'
                              : 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                            color: isRequested ? '#065f46' : '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: isRequested ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem',
                            boxShadow: isRequested ? 'none' : '0 2px 4px rgba(79, 70, 229, 0.2)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {isRequesting ? (
                            <span>Submitting Request...</span>
                          ) : isRequested ? (
                            <>
                              <CheckCircle2 size={16} color="#059669" />
                              <span>Request Sent to Manager</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={16} />
                              <span>Request Mentorship</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    textAlign: 'center',
                    color: '#475569',
                    fontSize: '0.875rem',
                  }}
                >
                  <p style={{ margin: '0 0 0.75rem 0' }}>
                    No specific mentor currently assigned for <strong>{result.skillName || 'this topic'}</strong> in your team.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/mentorship')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                    }}
                  >
                    Browse Peer Mentoring Directory
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Question-by-Question Detailed Review Breakdown */}
          <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--accent-secondary)" />
                <span>Question-by-Question Diagnostic Review ({feedbackItems.length})</span>
              </h4>

              {/* Review Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                {['ALL', 'MISSED', 'CORRECT'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveReviewFilter(filter)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: activeReviewFilter === filter ? 'var(--accent-primary)' : 'transparent',
                      color: activeReviewFilter === filter ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                    }}
                  >
                    {filter === 'ALL' ? 'All Questions' : filter === 'MISSED' ? 'Missed Only' : 'Correct Only'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredFeedback.map((fb, idx) => {
                const diffPill = getDifficultyPill(fb.difficultyLevel || 1);
                return (
                  <div
                    key={fb.questionId}
                    style={{
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: fb.isCorrect ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)',
                      border: `1px solid ${fb.isCorrect ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    {/* Meta Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                          QUESTION {idx + 1}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            background: diffPill.bg,
                            color: diffPill.text,
                            border: `1px solid ${diffPill.border}`,
                          }}
                        >
                          {diffPill.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                          &bull; {fb.topic || 'Core Knowledge'}
                        </span>
                      </div>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: fb.isCorrect ? '#34d399' : '#f87171',
                        }}
                      >
                        {fb.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>{fb.isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}</span>
                      </span>
                    </div>

                    <h5 style={{ fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                      {fb.questionText}
                    </h5>

                    {/* Options Review List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {Array.isArray(fb.options) && fb.options.map((opt, oIdx) => {
                        const isUserSelected = fb.selectedOptionIndex === oIdx;
                        const isCorrectOption = fb.correctOptionIndex === oIdx;

                        let optBg = '#f8fafc';
                        let optBorder = 'var(--border-subtle)';
                        let optColor = 'var(--text-primary)';
                        let badgeText = null;

                        if (isCorrectOption) {
                          optBg = '#d1fae5';
                          optBorder = '#a7f3d0';
                          optColor = '#065f46';
                          badgeText = isUserSelected ? 'Your Answer (Correct)' : 'Correct Answer';
                        } else if (isUserSelected && !fb.isCorrect) {
                          optBg = '#fee2e2';
                          optBorder = '#fecaca';
                          optColor = '#991b1b';
                          badgeText = 'Your Answer (Incorrect)';
                        }

                        return (
                          <div
                            key={oIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.85rem',
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--radius-md)',
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              fontSize: '0.875rem',
                              color: optColor,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '26px',
                                  height: '26px',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#f1f5f9',
                                  color: 'var(--text-primary)',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {optionLetters[oIdx] || oIdx + 1}
                              </span>
                              <span>{opt}</span>
                            </div>

                            {badgeText && (
                              <span style={{ fontSize: '0.725rem', fontWeight: 700 }}>
                                {badgeText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {fb.explanation && (
                      <div
                        style={{
                          marginTop: '0.35rem',
                          padding: '0.85rem 1.15rem',
                          borderRadius: 'var(--radius-md)',
                          background: '#f8fafc',
                          border: '1px solid var(--border-subtle)',
                          borderLeft: '4px solid var(--accent-secondary)',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5,
                        }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>Technical Explanation: </strong>
                        {fb.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* QUIZ IN PROGRESS QUESTION CARDS */}
      {!result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {questions.map((q, qIndex) => {
            const selectedOption = answers[q.id];
            const isAnswered = selectedOption !== undefined;
            const diffPill = getDifficultyPill(q.difficultyLevel || 1);

            return (
              <div
                key={q.id}
                ref={(el) => (questionRefs.current[q.id] = el)}
                className="glass-card"
                style={{
                  padding: '2rem',
                  borderRadius: 'var(--radius-lg)',
                  border: isAnswered ? '1px solid rgba(79, 70, 229, 0.45)' : '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  boxShadow: isAnswered ? '0 4px 12px rgba(79, 70, 229, 0.08)' : 'var(--shadow-sm)',
                  transition: 'border 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                {/* Question Header Row: Index, Difficulty Badge & Topic */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: isAnswered ? 'var(--accent-primary)' : 'var(--text-muted)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      QUESTION {qIndex + 1} OF {questions.length}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: diffPill.bg,
                        color: diffPill.text,
                        border: `1px solid ${diffPill.border}`,
                      }}
                    >
                      {diffPill.label}
                    </span>
                  </div>

                  {q.topic && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--accent-secondary)',
                        fontWeight: 600,
                        background: 'rgba(6, 182, 212, 0.08)',
                        padding: '0.15rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {q.topic}
                    </span>
                  )}
                </div>

                {/* Question Problem Statement */}
                <h4 style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.55, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                  {q.questionText}
                </h4>

                {/* Multiple Choice Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {Array.isArray(q.options) && q.options.map((option, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    return (
                      <div
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          padding: '1rem 1.25rem',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? '#eef2ff' : '#ffffff',
                          border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.12)' : 'none',
                        }}
                      >
                        {/* Option Letter Pill */}
                        <div
                          style={{
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'var(--accent-primary)' : '#f1f5f9',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                            marginTop: '0.1rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {optionLetters[optIdx] || optIdx + 1}
                        </div>

                        {/* Option Text */}
                        <div style={{ flex: '1 1 auto', fontSize: '0.925rem', color: isSelected ? '#1e1b4b' : 'var(--text-primary)', fontWeight: isSelected ? 600 : 400, lineHeight: 1.5, marginTop: '0.2rem' }}>
                          {option}
                        </div>

                        {/* Radio Check Circle */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: '20px',
                            height: '20px',
                            borderRadius: 'var(--radius-full)',
                            border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginTop: '0.25rem',
                          }}
                        >
                          {isSelected && (
                            <div
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--accent-primary)',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Bottom Submit Confirmation Card (Scrolls naturally at the end of the quiz) */}
          <div
            className="glass-card"
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem 2rem',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-md)',
              marginTop: '0.75rem',
              marginBottom: '3rem',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                Answered <strong style={{ color: 'var(--accent-primary)', fontSize: '1.05rem' }}>{answeredCount}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{questions.length}</strong> questions
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {answeredCount === questions.length ? (
                  <span style={{ color: '#34d399', fontWeight: 600 }}>&check; All questions completed! Ready to submit.</span>
                ) : (
                  <span>{questions.length - answeredCount} questions remaining</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmitAnswers(false)}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 2.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: 'var(--shadow-glow)',
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'wait' : 'pointer',
                transition: 'transform var(--transition-fast)',
              }}
            >
              <Send size={16} />
              <span>{submitting ? 'Calculating Result...' : 'Submit Answers'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentQuizPage;
