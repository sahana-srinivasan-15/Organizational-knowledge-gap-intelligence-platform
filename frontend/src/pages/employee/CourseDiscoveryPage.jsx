import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseDiscoveryApi } from '../../api/courseDiscoveryApi';
import { getWorkingCourseUrl } from '../../utils/apiUtils';
import CourseComparisonModal from '../../components/courses/CourseComparisonModal';
import CourseApprovalRequestModal from '../../components/courses/CourseApprovalRequestModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import {
  Search,
  Filter,
  Star,
  Clock,
  Award,
  ExternalLink,
  Layers,
  Send,
  BookOpen,
  CheckCircle2,
  FileCheck,
  Compass,
  RotateCcw,
  Check,
  User,
} from 'lucide-react';

const PROVIDER_THEMES = {
  Coursera: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    text: '#1d4ed8',
    label: 'Coursera',
  },
  Udemy: {
    bg: '#faf5ff',
    border: '#e9d5ff',
    text: '#7e22ce',
    label: 'Udemy',
  },
  edX: {
    bg: '#fdf2f8',
    border: '#fbcfe8',
    text: '#be185d',
    label: 'edX',
  },
  'YouTube Learning': {
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#dc2626',
    label: 'YouTube Learning',
  },
  'Internal Academy': {
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#047857',
    label: 'Internal Academy',
  },
};

const DIFFICULTY_THEMES = {
  BEGINNER: { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0', label: 'Beginner' },
  INTERMEDIATE: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe', label: 'Intermediate' },
  ADVANCED: { bg: '#fffbeb', text: '#92400e', border: '#fde68a', label: 'Advanced' },
};

export const CourseDiscoveryPage = () => {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [provider, setProvider] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [isFree, setIsFree] = useState(false);
  const [maxHours, setMaxHours] = useState('');

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Comparison selection state (up to 4)
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [comparingLoading, setComparingLoading] = useState(false);

  // Approval request modal
  const [selectedCourseForApproval, setSelectedCourseForApproval] = useState(null);



  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await courseDiscoveryApi.searchCourses({
        keyword: keyword || undefined,
        provider: provider !== 'ALL' ? provider : undefined,
        difficulty: difficulty !== 'ALL' ? difficulty : undefined,
        isFree: isFree ? true : undefined,
        maxDurationHours: maxHours ? parseInt(maxHours, 10) : undefined,
      });
      setCourses(res?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to search external courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 350);
    return () => clearTimeout(timer);
  }, [keyword, provider, difficulty, isFree, maxHours]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  const handleResetFilters = () => {
    setKeyword('');
    setProvider('ALL');
    setDifficulty('ALL');
    setIsFree(false);
    setMaxHours('');
  };

  const hasActiveFilters = keyword || provider !== 'ALL' || difficulty !== 'ALL' || isFree || maxHours;

  const toggleCompare = (courseId) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId);
      }
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, courseId];
    });
  };

  const handleOpenComparison = async () => {
    if (selectedForCompare.length < 2) return;
    setComparingLoading(true);
    try {
      const res = await courseDiscoveryApi.compareCourses(selectedForCompare);
      setComparisonData(res?.data);
      setIsCompareModalOpen(true);
    } catch (err) {
      setError('Failed to generate course comparison');
    } finally {
      setComparingLoading(false);
    }
  };

  const recommendedCount = useMemo(() => courses.filter((c) => c.isRecommended).length, [courses]);
  const freeCount = useMemo(() => courses.filter((c) => c.isFree).length, [courses]);

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
              <Compass size={13} /> Multi-Platform Catalog
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>&bull;</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vetted Industry Roadmaps</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            Explore &amp; Discover Courses
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, maxWidth: '680px' }}>
            Discover and compare vetted courses across Coursera, Udemy, edX, YouTube Learning, and Internal Academy.
            Personalized recommendations are ranked dynamically against your verified skill gaps.
          </p>
        </div>

        {/* Quick Actions & Stat Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '0.75rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '95px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              {courses.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Courses
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '95px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
              {recommendedCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              AI Matches
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
              minWidth: '95px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-success)' }}>
              {freeCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Free Access
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => navigate('/my-course-requests')}
            style={{
              height: '46px',
              padding: '0 1.15rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: '#ffffff',
            }}
          >
            <FileCheck size={16} color="var(--accent-primary)" />
            <span>My Approval Requests</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{successMsg}</span>
        </div>
      )}



      {error && <ErrorAlert message={error} onRetry={fetchCourses} />}

      {/* Modern Search & Filter Panel */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Search Input Bar (Instant/debounced search, no bulky button) */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div className="modern-search-wrapper">
              <Search size={18} className="modern-search-icon" />
              <input
                type="text"
                className="modern-search-input"
                placeholder="Search by topic, skill, or keywords (e.g. Java, Spring Boot, Python, System Design)..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              {keyword && (
                <button
                  type="button"
                  className="modern-search-clear"
                  onClick={() => setKeyword('')}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Filter Controls Row */}
        <div
          style={{
            display: 'flex',
            gap: '0.85rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingTop: '0.85rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em' }}>
            <Filter size={14} /> FILTERS:
          </div>

          {/* Provider Filter */}
          <select
            className="input"
            style={{
              width: 'auto',
              padding: '0.45rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="ALL">All Platforms</option>
            <option value="Coursera">Coursera</option>
            <option value="Udemy">Udemy</option>
            <option value="edX">edX</option>
            <option value="YouTube Learning">YouTube Learning</option>
            <option value="Internal Academy">Internal Academy</option>
          </select>

          {/* Difficulty Filter */}
          <select
            className="input"
            style={{
              width: 'auto',
              padding: '0.45rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="ALL">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          {/* Max Duration Filter */}
          <select
            className="input"
            style={{
              width: 'auto',
              padding: '0.45rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 500,
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
            }}
            value={maxHours}
            onChange={(e) => setMaxHours(e.target.value)}
          >
            <option value="">Any Duration</option>
            <option value="10">&le; 10 Hours</option>
            <option value="25">&le; 25 Hours</option>
            <option value="50">&le; 50 Hours</option>
            <option value="100">&le; 100 Hours</option>
          </select>

          {/* Free Checkbox Button Pill */}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: isFree ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${isFree ? '#a7f3d0' : 'var(--border-subtle)'}`,
              fontSize: '0.825rem',
              fontWeight: isFree ? 700 : 500,
              color: isFree ? '#047857' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              style={{ accentColor: '#059669', width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span>Free Courses Only</span>
          </label>

          {/* Reset Filters CTA if any filter active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'transparent',
                borderRadius: 'var(--radius-md)',
                marginLeft: 'auto',
              }}
              title="Reset all search filters"
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Comparison Dock */}
      {selectedForCompare.length > 0 && (
        <div
          style={{
            position: 'sticky',
            top: '1rem',
            zIndex: 40,
            padding: '0.85rem 1.5rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid var(--accent-primary)',
            boxShadow: '0 12px 28px -4px rgba(79, 70, 229, 0.2), 0 4px 10px -2px rgba(15, 23, 42, 0.08)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#eef2ff',
                color: 'var(--accent-primary)',
              }}
            >
              <Layers size={18} />
            </span>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {selectedForCompare.length} of 4 courses selected
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {selectedForCompare.length < 2
                  ? 'Select at least 1 more course to compare features'
                  : 'Ready for side-by-side competency & pricing analysis'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-full)',
              }}
              onClick={() => setSelectedForCompare([])}
            >
              Clear
            </button>
            <button
              className="btn btn-primary"
              style={{
                padding: '0.45rem 1.15rem',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
              disabled={selectedForCompare.length < 2 || comparingLoading}
              onClick={handleOpenComparison}
            >
              {comparingLoading ? 'Comparing...' : 'Compare Side-by-Side'}
            </button>
          </div>
        </div>
      )}

      {/* Results Subheading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{courses.length}</strong> verified courses &bull; Sorted by skill-gap relevance &amp; rating
        </div>
        {selectedForCompare.length > 0 && (
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {selectedForCompare.length} selected for comparison
          </span>
        )}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          <LoadingSkeleton height="320px" lines={1} />
          <LoadingSkeleton height="320px" lines={1} />
          <LoadingSkeleton height="320px" lines={1} />
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses matched your query"
          description="Try relaxing your filters or searching for another skill keyword like 'Java', 'Python', or 'Spring Boot'."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '1.5rem' }}>
          {courses.map((course) => {
            const isSelected = selectedForCompare.includes(course.id);
            const providerTheme = PROVIDER_THEMES[course.provider] || {
              bg: '#f1f5f9',
              border: '#cbd5e1',
              text: '#334155',
              label: course.provider,
            };
            const difficultyTheme = DIFFICULTY_THEMES[course.difficultyLevel] || {
              bg: '#f1f5f9',
              text: '#475569',
              border: '#e2e8f0',
              label: course.difficultyLevel,
            };

            return (
              <div
                key={course.id}
                className="glass-card course-card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.5rem',
                  background: course.isRecommended ? '#fbfcfe' : '#ffffff',
                  border: isSelected
                    ? '2px solid var(--accent-primary)'
                    : course.isRecommended
                    ? '1.5px solid #c7d2fe'
                    : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: isSelected
                    ? '0 0 0 4px rgba(79, 70, 229, 0.1), var(--shadow-md)'
                    : 'var(--shadow-sm)',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                }}
              >
                <div>
                  {/* Top Row: Provider Badge & Compare Checkbox */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: providerTheme.bg,
                          color: providerTheme.text,
                          border: `1px solid ${providerTheme.border}`,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {providerTheme.label}
                      </span>

                      {course.isRecommended && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: '#eef2ff',
                            color: '#4338ca',
                            border: '1px solid #c7d2fe',
                          }}
                        >
                          AI Match
                        </span>
                      )}
                    </div>

                    {/* Compare Checkbox Pill */}
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-muted)',
                        background: isSelected ? '#eef2ff' : '#f8fafc',
                        border: `1px solid ${isSelected ? '#c7d2fe' : 'var(--border-subtle)'}`,
                        padding: '0.25rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCompare(course.id)}
                        style={{
                          accentColor: 'var(--accent-primary)',
                          width: '14px',
                          height: '14px',
                          cursor: 'pointer',
                        }}
                      />
                      <span>Compare</span>
                    </label>
                  </div>

                  {/* Course Title */}
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      lineHeight: 1.35,
                      marginBottom: '0.35rem',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    <a
                      href={getWorkingCourseUrl(course)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
                      title="Open course directly on external platform"
                      onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.color = 'inherit'; }}
                    >
                      {course.title}
                    </a>
                  </h3>

                  {/* Instructor */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <User size={13} color="var(--text-muted)" />
                    <span>
                      Instructor:{' '}
                      <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {course.instructor || 'Staff Instructor'}
                      </strong>
                    </span>
                  </div>

                  {/* Meta Stats Row (Rating, Duration, Level, Certificate) */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      alignItems: 'center',
                      fontSize: '0.775rem',
                      marginBottom: '0.85rem',
                    }}
                  >
                    {/* Rating */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        color: '#92400e',
                        fontWeight: 700,
                      }}
                    >
                      <Star size={12} fill="#f59e0b" color="#f59e0b" />
                      <span>{Number(course.rating).toFixed(2)}</span>
                    </div>

                    {/* Duration */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      <Clock size={12} color="var(--text-muted)" />
                      <span>{course.durationHours} hrs</span>
                    </div>

                    {/* Difficulty Level */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: difficultyTheme.bg,
                        border: `1px solid ${difficultyTheme.border}`,
                        color: difficultyTheme.text,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {difficultyTheme.label}
                    </div>
                  </div>

                  {/* Course Description */}
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      margin: '0 0 0.85rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description}
                  </p>

                  {/* Skills Covered Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                    {course.skillsCovered?.map((sk, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          color: '#334155',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  {/* AI Recommendation Callout Box */}
                  {course.isRecommended && (
                    <div
                      style={{
                        padding: '0.75rem 0.95rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)',
                        border: '1px solid #c7d2fe',
                        fontSize: '0.8rem',
                        color: '#3730a3',
                        marginBottom: '1rem',
                        lineHeight: 1.45,
                        boxShadow: '0 1px 2px rgba(99, 102, 241, 0.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 700,
                          marginBottom: '0.25rem',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        AI Recommendation Match:
                      </div>
                      <div style={{ color: '#4338ca' }}>
                        {course.recommendationReason}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Price & Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-subtle)',
                    marginTop: '0.5rem',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.675rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        display: 'block',
                      }}
                    >
                      Access &amp; Pricing
                    </span>
                    <strong
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: course.isFree ? '#059669' : 'var(--text-primary)',
                      }}
                    >
                      {course.isFree ? 'Free Access' : `$${Number(course.price).toFixed(2)}`}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <a
                      href={getWorkingCourseUrl(course)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#ffffff',
                      }}
                      title="Open course directly on external platform"
                    >
                      <ExternalLink size={13} />
                      <span>Open Course</span>
                    </a>

                    <button
                      className="btn btn-primary"
                      style={{
                        padding: '0.45rem 1rem',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                      onClick={() => setSelectedCourseForApproval(course)}
                    >
                      <Send size={13} />
                      <span>Request Approval</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Modal */}
      <CourseComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparison={comparisonData}
        onRequestApproval={(course) => setSelectedCourseForApproval(course)}
      />

      {/* Approval Request Modal */}
      <CourseApprovalRequestModal
        isOpen={Boolean(selectedCourseForApproval)}
        onClose={() => setSelectedCourseForApproval(null)}
        course={selectedCourseForApproval}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          setTimeout(() => setSuccessMsg(null), 5000);
        }}
      />


    </div>
  );
};

export default CourseDiscoveryPage;
