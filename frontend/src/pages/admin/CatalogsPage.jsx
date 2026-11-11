import React, { useState, useEffect } from 'react';
import { courseApi } from '../../api/courseApi';
import { assessmentApi } from '../../api/assessmentApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import { BookOpen, FileCheck2, Clock, Star, Award, CheckCircle2 } from 'lucide-react';

export const CatalogsPage = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadCatalogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, assessRes] = await Promise.allSettled([
        courseApi.getAllCourses(),
        assessmentApi.getAllAssessments(),
      ]);

      if (coursesRes.status === 'fulfilled') setCourses(extractArray(coursesRes.value));
      if (assessRes.status === 'fulfilled') setAssessments(extractArray(assessRes.value));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load catalogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  const handleGenerateAiQuestions = async (assessmentId) => {
    setGeneratingId(assessmentId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await assessmentApi.generateQuestionsForAssessment(assessmentId, 5);
      const generatedList = extractArray(res);
      setSuccessMsg(`Successfully generated ${generatedList.length || 5} dynamic questions via OpenAI integration!`);
      const assessRes = await assessmentApi.getAllAssessments();
      setAssessments(extractArray(assessRes));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate assessment questions');
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Competency &amp; Course Catalogs</h2>
        <LoadingSkeleton height="250px" lines={1} />
      </div>
    );
  }

  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeAssessments = Array.isArray(assessments) ? assessments : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Platform Competency &amp; Curriculum Catalogs
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Inspect active courses, course-skill mapping proficiency gains, and diagnostic assessments.
        </p>
      </div>

      {error && <ErrorAlert message={error} />}
      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-sm)',
            color: '#34d399',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('courses')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'courses' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            color: activeTab === 'courses' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: activeTab === 'courses' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
          }}
        >
          <BookOpen size={16} />
          <span>Courses ({safeCourses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assessments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'assessments' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            color: activeTab === 'assessments' ? '#818cf8' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            border: activeTab === 'assessments' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
          }}
        >
          <FileCheck2 size={16} />
          <span>Diagnostic Assessments ({safeAssessments.length})</span>
        </button>
      </div>

      {/* Tab 1: Courses */}
      {activeTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {safeCourses.length === 0 ? (
            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No courses available in catalog.</div>
          ) : (
            safeCourses.map((course) => (
              <div key={course.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                      {course.provider}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {course.difficultyLevel}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{course.title}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.35rem 0' }}>
                    {course.description}
                  </p>
                </div>

                {/* Skills Covered */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {Array.isArray(course.skillsCovered) && course.skillsCovered.map((sk) => (
                    <span
                      key={sk.skillId}
                      style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(99, 102, 241, 0.12)',
                        color: '#818cf8',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                      }}
                    >
                      {sk.skillName} (+{sk.targetProficiencyGain} gain)
                    </span>
                  ))}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>{course.durationHours} hours</span>
                  <span style={{ color: '#fbbf24' }}>{course.rating} ★</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Assessments */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {safeAssessments.length === 0 ? (
            <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No diagnostic assessments available.</div>
          ) : (
            safeAssessments.map((ass) => (
              <div key={ass.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                    Skill: {ass.skillName}
                  </span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.25rem' }}>{ass.title}</h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0.35rem 0' }}>
                    {ass.description}
                  </p>
                </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>Passing: <strong style={{ color: '#34d399' }}>{ass.passingScore}%</strong></span>
                <span>Time Limit: {ass.timeLimitMinutes} mins</span>
                <span>{ass.questionCount} Questions</span>
              </div>

              <button
                type="button"
                onClick={() => handleGenerateAiQuestions(ass.id)}
                disabled={generatingId === ass.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  marginTop: '0.25rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: generatingId === ass.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  color: '#818cf8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: generatingId === ass.id ? 'wait' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <FileCheck2 size={14} />
                <span>{generatingId === ass.id ? 'Synthesizing with OpenAI...' : 'Generate AI Questions'}</span>
              </button>
            </div>
          ))
        )}
      </div>
    )}
    </div>
  );
};

export default CatalogsPage;
