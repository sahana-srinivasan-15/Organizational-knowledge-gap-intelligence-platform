import React, { useState, useEffect } from 'react';
import { courseApi } from '../../api/courseApi';
import { extractArray, getWorkingCourseUrl } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import { BookOpen, Star, Clock, Target, ExternalLink, Award, Compass, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CourseRecommendationsPage = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseApi.getOwnRecommendations();
      setRecommendations(extractArray(res));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load course recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Personalized Course Recommendations
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Loading recommended courses tailored to your competency profile...
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <LoadingSkeleton height="180px" lines={1} />
          <LoadingSkeleton height="180px" lines={1} />
          <LoadingSkeleton height="180px" lines={1} />
        </div>
      </div>
    );
  }

  const safeRecs = Array.isArray(recommendations) ? recommendations : [];

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
              <Target size={13} /> AI Curriculum Targeting
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Adaptive Skill Gap Closure</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            Dynamic Course Recommendations
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, maxWidth: '640px' }}>
            Courses ranked dynamically to cover your unresolved target role skill gaps with maximal proficiency gains.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => navigate('/course-discovery')}
          style={{
            height: '44px',
            padding: '0 1.25rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: '#ffffff',
          }}
        >
          <Compass size={16} color="var(--accent-primary)" />
          <span>Explore Multi-Platform Catalog</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {safeRecs.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {safeRecs.map((rec) => {
            const course = rec.course;
            return (
              <div
                key={course.id}
                className="glass-card course-card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.5rem',
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: rec.matchRank === 1 ? '4px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#eef2ff',
                        color: 'var(--accent-primary)',
                        border: '1px solid #c7d2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                      }}
                    >
                      #{rec.matchRank}
                    </span>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                        {course.title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Provider: <strong style={{ color: 'var(--text-primary)' }}>{course.provider}</strong> &bull; Level: {course.difficultyLevel}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: 'var(--accent-success)',
                      }}
                    >
                      {(rec.recommendationScore * 100).toFixed(0)}% Match
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Affinity Score
                    </span>
                  </div>
                </div>

                {/* Explanation Banner */}
                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)',
                    border: '1px solid #c7d2fe',
                    fontSize: '0.825rem',
                    color: '#3730a3',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    lineHeight: 1.45,
                  }}
                >
                  <TrendingUp size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>{rec.explanation}</span>
                </div>

                {/* Skills Covered Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Skills Covered:
                  </span>
                  {Array.isArray(course?.skillsCovered) &&
                    course.skillsCovered.map((sk) => (
                      <span
                        key={sk.skillId}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          color: '#065f46',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {sk.skillName} (+{sk.targetProficiencyGain} level gain)
                      </span>
                    ))}
                </div>

                {/* Meta details footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.85rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={15} color="var(--text-muted)" />
                      <span>{course.durationHours} hours duration</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Star size={15} color="#f59e0b" fill="#f59e0b" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.rating} / 5.0</span>
                    </div>
                  </div>

                  <a
                    href={getWorkingCourseUrl(course)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderRadius: 'var(--radius-full)',
                      background: '#ffffff',
                    }}
                  >
                    <span>Explore Syllabus</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No Course Recommendations"
          description="Either you have no unresolved skill gaps, or all matching courses are already completed in your roadmap."
        />
      )}
    </div>
  );
};

export default CourseRecommendationsPage;
