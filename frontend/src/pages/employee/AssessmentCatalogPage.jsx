import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentApi } from '../../api/assessmentApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import {
  FileCheck2,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  History,
  Search,
  BookOpen,
  Filter,
  Layers,
  Flame,
  Check,
} from 'lucide-react';

export const AssessmentCatalogPage = () => {
  const [courses, setCourses] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');

  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, histRes] = await Promise.allSettled([
        assessmentApi.getEligibleCourses(),
        assessmentApi.getOwnHistory(),
      ]);

      if (coursesRes.status === 'fulfilled') {
        setCourses(extractArray(coursesRes.value));
      } else {
        const fallbackRes = await assessmentApi.getAllAssessments();
        const legacyAssessments = extractArray(fallbackRes);
        setCourses(
          legacyAssessments.map((a) => ({
            courseId: a.id,
            courseTitle: a.title,
            primarySkillName: a.skillName,
            assessmentId: a.id,
            questionPoolSize: a.questionCount,
            timeLimitMinutes: a.timeLimitMinutes,
            passingScore: a.passingScore,
            difficultyLevel: 'INTERMEDIATE',
          }))
        );
      }

      if (histRes.status === 'fulfilled') {
        setHistory(extractArray(histRes.value));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load course assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const safeCourses = extractArray(courses);
  const safeHistory = extractArray(history);

  const filteredCourses = useMemo(() => {
    return safeCourses.filter((course) => {
      const matchesSearch =
        searchTerm === '' ||
        course.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.primarySkillName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.provider?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDiff =
        selectedDifficulty === 'ALL' ||
        course.difficultyLevel?.toUpperCase() === selectedDifficulty.toUpperCase();

      return matchesSearch && matchesDiff;
    });
  }, [safeCourses, searchTerm, selectedDifficulty]);

  const getDifficultyBadge = (diff) => {
    switch (diff?.toUpperCase()) {
      case 'ADVANCED':
        return { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)', label: 'Advanced' };
      case 'INTERMEDIATE':
        return { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)', label: 'Intermediate' };
      case 'BEGINNER':
      default:
        return { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)', label: 'Beginner' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <LoadingSkeleton height="50px" lines={1} style={{ width: '350px' }} />
        <LoadingSkeleton height="56px" lines={1} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          <LoadingSkeleton height="280px" lines={1} />
          <LoadingSkeleton height="280px" lines={1} />
          <LoadingSkeleton height="280px" lines={1} />
        </div>
      </div>
    );
  }

  // Statistics calculation for the header overview
  const totalPassed = safeHistory.filter((h) => h.passed).length;
  const attemptsCount = safeHistory.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Page Header with Stats Banner */}
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
        <div style={{ flex: '1 1 450px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
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
                letterSpacing: '0.05em',
              }}
            >
              <FileCheck2 size={12} /> Diagnostic Testing
            </span>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.45rem', color: 'var(--text-primary)' }}>
            Course Diagnostic Assessments
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.5, maxWidth: '620px' }}>
            Validate technical competencies through course-aligned diagnostic quizzes. Each attempt contains <strong>5 questions</strong> to evaluate your skills.
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '110px',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{safeCourses.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Courses</div>
          </div>

          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '110px',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-success)' }}>{totalPassed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Passed Quizzes</div>
          </div>

          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '110px',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{attemptsCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Attempts</div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Modern Filter and Search Toolbar */}
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
        <div style={{ flex: '1 1 340px' }}>
          <div className="modern-search-wrapper">
            <Search size={18} className="modern-search-icon" />
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search by course title, skill, or provider..."
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

        {/* Difficulty Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Difficulty:</span>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="input"
            style={{
              padding: '0.55rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Levels</option>
            <option value="BEGINNER">Beginner (Level 1)</option>
            <option value="INTERMEDIATE">Intermediate (Level 2)</option>
            <option value="ADVANCED">Advanced (Level 3)</option>
          </select>
        </div>
      </div>

      {/* Courses Diagnostic Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck2 size={20} color="var(--accent-primary)" />
            <span>Eligible Course Quizzes</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                background: '#f1f5f9',
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {filteredCourses.length}
            </span>
          </h3>
        </div>

        {filteredCourses.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1.5rem',
              alignItems: 'stretch',
            }}
          >
            {filteredCourses.map((c) => {
              const diffBadge = getDifficultyBadge(c.difficultyLevel);
              return (
                <div
                  key={c.courseId}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-normal)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {/* Header Row: Skill Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--accent-secondary)',
                          background: 'rgba(6, 182, 212, 0.12)',
                          padding: '0.18rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(6, 182, 212, 0.25)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {c.primarySkillName || 'Technical Skill'}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h4
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        lineHeight: 1.35,
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                      title={c.courseTitle}
                    >
                      {c.courseTitle}
                    </h4>

                    {/* Provider, Rating and Difficulty Contents together */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BookOpen size={13} color="var(--text-secondary)" />
                        <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {c.provider || 'Enterprise Academy'}
                        </strong>
                      </span>
                      {c.rating && (
                        <>
                          <span>&bull;</span>
                          <span style={{ color: '#d97706', fontWeight: 600 }}>★ {c.rating}</span>
                        </>
                      )}
                      <span>&bull;</span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: diffBadge.bg,
                          color: diffBadge.text,
                          border: `1px solid ${diffBadge.border}`,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        {diffBadge.label}
                      </span>
                    </div>

                    {/* Assessment Specification Box */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.4rem',
                        padding: '0.85rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        background: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ borderRight: '1px solid var(--border-subtle)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                          Questions
                        </div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.825rem' }}>
                          5
                        </strong>
                      </div>

                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem' }}>
                          Pass Mark
                        </div>
                        <strong style={{ color: 'var(--accent-success)', fontSize: '0.825rem' }}>
                          {c.passingScore || 70}%
                        </strong>
                      </div>
                    </div>

                    {/* Employee Status Badge (if attempted) */}
                    {c.totalAttempts > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: c.latestPassed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          border: `1px solid ${c.latestPassed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                          fontSize: '0.775rem',
                        }}
                      >
                        {c.latestPassed ? (
                          <CheckCircle2 size={16} color="var(--accent-success)" />
                        ) : (
                          <XCircle size={16} color="var(--accent-danger)" />
                        )}
                        <span style={{ color: c.latestPassed ? '#34d399' : '#f87171', fontWeight: 600 }}>
                          {c.latestPassed ? 'Passed' : 'Not Passed'} &bull; Best Score: {c.bestScore}% ({c.totalAttempts} {c.totalAttempts === 1 ? 'attempt' : 'attempts'})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Start / Retake Action Button (Pinned to Bottom) */}
                  <button
                    onClick={() => navigate(`/assessments/course/${c.courseId}/take`)}
                    style={{
                      width: '100%',
                      marginTop: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      boxShadow: 'var(--shadow-glow)',
                      cursor: 'pointer',
                      transition: 'transform var(--transition-fast)',
                    }}
                  >
                    <span>{c.totalAttempts > 0 ? 'Retake Diagnostic Quiz' : 'Start Diagnostic Quiz'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileCheck2}
            title="No Matching Courses"
            description="No eligible courses match your search or difficulty filter."
          />
        )}
      </div>

      {/* Assessment History Table */}
      <div className="glass-card" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <History size={18} color="var(--accent-secondary)" />
          <span>My Assessment Attempt History</span>
        </h3>

        {safeHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.65rem', fontWeight: 600 }}>Course / Assessment</th>
                  <th style={{ padding: '0.75rem 0.65rem', fontWeight: 600 }}>Attempt #</th>
                  <th style={{ padding: '0.75rem 0.65rem', fontWeight: 600 }}>Skill</th>
                  <th style={{ padding: '0.75rem 0.65rem', fontWeight: 600 }}>Score</th>
                  <th style={{ padding: '0.75rem 0.65rem', fontWeight: 600 }}>Result</th>
                  <th style={{ padding: '0.75rem 0.65rem', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {safeHistory.map((h) => (
                  <tr key={h.submissionId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 0.65rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {h.courseTitle || h.assessmentTitle}
                    </td>
                    <td style={{ padding: '0.85rem 0.65rem' }}>
                      <span
                        style={{
                          background: '#f1f5f9',
                          color: 'var(--text-secondary)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        Attempt #{h.attemptNumber || 1}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.65rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                      {h.skillName}
                    </td>
                    <td style={{ padding: '0.85rem 0.65rem', fontWeight: 700 }}>
                      <span style={{ color: h.passed ? '#34d399' : '#f87171', fontSize: '0.9rem' }}>{h.score}%</span>
                    </td>
                    <td style={{ padding: '0.85rem 0.65rem' }}>
                      {h.passed ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: '#34d399',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          <CheckCircle2 size={13} /> Passed
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: '#f87171',
                            fontWeight: 700,
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                          }}
                        >
                          <XCircle size={13} /> Not Passed
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 0.65rem', color: 'var(--text-muted)' }}>
                      {new Date(h.attemptedAt).toLocaleDateString()} at{' '}
                      {new Date(h.attemptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No assessment attempts on record yet. Select any course above and click Start Diagnostic Quiz to test your skills!
          </p>
        )}
      </div>
    </div>
  );
};

export default AssessmentCatalogPage;
