import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningPathApi } from '../../api/learningPathApi';
import { certificateApi } from '../../api/certificateApi';
import { CertificateUploadModal } from '../../components/courses/CertificateUploadModal';
import { extractArray, getWorkingCourseUrl } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import {
  Route,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  PlayCircle,
  ExternalLink,
  FileCheck2,
  Upload,
  ShieldCheck,
  Globe,
  Download,
} from 'lucide-react';

export const LearningPathPage = () => {
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [userCertificates, setUserCertificates] = useState([]);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedCourseForCert, setSelectedCourseForCert] = useState(null);
  const [verifyingCourseId, setVerifyingCourseId] = useState(null);
  const [downloadingCertId, setDownloadingCertId] = useState(null);

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

  const handleVerifyPlatformCourse = async (courseId) => {
    setVerifyingCourseId(courseId);
    try {
      await learningPathApi.verifyPlatformCourse(courseId, { platform: 'Coursera' });
      setSuccessMsg('Platform enrollment verified successfully! Status: Enrolled.');
      loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify course on platform');
    } finally {
      setVerifyingCourseId(null);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pathRes, certsRes] = await Promise.allSettled([
        learningPathApi.getOwnActivePath(),
        certificateApi.getMyCertificates ? certificateApi.getMyCertificates() : Promise.resolve({ data: [] }),
      ]);

      if (certsRes.status === 'fulfilled') {
        setUserCertificates(extractArray(certsRes.value));
      }

      if (pathRes.status === 'fulfilled') {
        const pathData = pathRes.value?.data;
        if (pathData && Array.isArray(pathData.courses) && pathData.courses.length > 0) {
          setPath(pathData);
        } else {
          try {
            const genRes = await learningPathApi.generateOwnPath();
            if (genRes?.data && Array.isArray(genRes.data.courses) && genRes.data.courses.length > 0) {
              setPath(genRes.data);
            } else {
              setPath(pathData);
            }
          } catch {
            setPath(pathData);
          }
        }
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setPath(null);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load learning path');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCertificateFor = (course) => {
    if (!course) return null;
    if (course.certificateStatus) {
      return { status: course.certificateStatus, quizPassed: course.quizPassed };
    }
    if (!Array.isArray(userCertificates) || userCertificates.length === 0) return null;
    const courseTitle = (course.courseTitle || course.title || '').toLowerCase().trim();
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

  const handleCertUploadSuccess = (uploadedCourse, verifyData) => {
    const title = uploadedCourse?.courseTitle || uploadedCourse?.title || 'Course';
    if (verifyData?.status === 'ML_VERIFIED_PENDING_QUIZ') {
      setSuccessMsg(`Certificate verified as authentic by ML model for "${title}"! Attend and pass the 5-question diagnostic quiz to complete & certify.`);
    } else {
      setSuccessMsg(`Certificate uploaded & verified for "${title}"! Officially completed & certified.`);
    }
    loadData();
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePath = async () => {
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await learningPathApi.generateOwnPath();
      setPath(res?.data);
      setSuccessMsg('Personalized learning pathway generated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate learning path');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Personalized Learning Pathway</h2>
        <LoadingSkeleton height="120px" lines={1} style={{ marginBottom: '1.5rem' }} />
        <LoadingSkeleton height="250px" lines={1} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Personalized Learning Pathway
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sequential, gap-prioritized curriculum for{' '}
            <strong style={{ color: 'var(--accent-secondary)' }}>
              {path?.targetJobRoleTitle || 'Your Target Role'}
            </strong>
          </p>
        </div>

        <button
          onClick={handleGeneratePath}
          disabled={generating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-glow)',
            opacity: generating ? 0.7 : 1,
          }}
        >
          <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
          <span>{generating ? 'Synthesizing Path...' : 'Regenerate Pathway'}</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          {successMsg}
        </div>
      )}

      {path ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Stats Banner */}
          <div
            className="glass-card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem 2rem',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Roadmap Title
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem' }}>{path.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                Status: <strong style={{ color: path.status === 'COMPLETED' ? '#34d399' : 'var(--accent-primary)' }}>{path.status}</strong> &bull; {path.completedCourses} of {path.totalCourses} courses completed
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                Overall Completion
              </span>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                {path.overallProgressPercentage}%
              </div>
            </div>
          </div>

          {/* Uncovered Gaps Warning Banner if present */}
          {Array.isArray(path.uncoveredSkillGaps) && path.uncoveredSkillGaps.length > 0 && (
            <div
              style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: 700 }}>
                <AlertTriangle size={16} />
                <span>Uncovered Skill Gaps (No Catalog Course Match)</span>
              </div>
              <ul style={{ paddingLeft: '1.5rem', margin: 0, fontSize: '0.8rem', lineHeight: 1.5 }}>
                {path.uncoveredSkillGaps.map((ug, idx) => (
                  <li key={idx}>{ug}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sequential Course Timeline Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Array.isArray(path.courses) && path.courses.map((step) => {
              const cert = getCertificateFor(step);
              const hasAuthenticCert = cert && (cert.status === 'CERTIFIED' || cert.status === 'ML_VERIFIED_PENDING_QUIZ' || (cert.authenticityScore && Number(cert.authenticityScore) >= 0.7));
              const hasPassedQuiz = Boolean(step.quizPassed || cert?.quizPassed);
              const isCertified = step.status === 'COMPLETED' && (cert?.status === 'CERTIFIED' || (hasAuthenticCert && hasPassedQuiz));
              const isMlVerifiedPendingQuiz = hasAuthenticCert && !hasPassedQuiz;
              const isQuizPassedPendingCert = hasPassedQuiz && !hasAuthenticCert;
              const isCompleted = isCertified;
              return (
                <div
                  key={step.id}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    borderLeft: isCompleted
                      ? '3px solid var(--accent-success)'
                      : step.status === 'IN_PROGRESS'
                      ? '3px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '2.25rem',
                          height: '2.25rem',
                          borderRadius: 'var(--radius-full)',
                          background: isCompleted
                            ? 'rgba(16, 185, 129, 0.15)'
                            : step.status === 'ENROLLED'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : step.status === 'IN_PROGRESS'
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: isCompleted
                            ? '#34d399'
                            : step.status === 'ENROLLED'
                            ? '#60a5fa'
                            : step.status === 'IN_PROGRESS'
                            ? 'var(--accent-primary)'
                            : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                        }}
                      >
                        {isCompleted ? <CheckCircle2 size={18} /> : `Step ${step.stepOrder}`}
                      </div>

                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                          {step.courseTitle}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                          Provider: {step.provider} &bull; {step.durationHours} hrs &bull; {step.difficultyLevel} &bull; Rating: {step.rating}★
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
                          fontWeight: 600,
                          background: isCompleted
                            ? 'rgba(16, 185, 129, 0.15)'
                            : step.status === 'ENROLLED'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : step.status === 'IN_PROGRESS'
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: isCompleted
                            ? '#34d399'
                            : step.status === 'ENROLLED'
                            ? '#60a5fa'
                            : step.status === 'IN_PROGRESS'
                            ? '#818cf8'
                            : 'var(--text-muted)',
                        }}
                      >
                        {step.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Interactive Step Controller */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Course Progress</span>
                      <strong style={{ color: '#fff' }}>{step.progressPercentage}%</strong>
                    </div>

                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${step.progressPercentage}%`,
                          height: '100%',
                          background: isCompleted
                            ? 'var(--accent-success)'
                            : 'linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>

                    {/* Course Actions (Diagnostic & Direct Course Access) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isCertified ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#34d399',
                            }}
                          >
                            <CheckCircle2 size={14} /> Completed &amp; Verified
                          </span>
                        ) : isMlVerifiedPendingQuiz ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#f59e0b',
                            }}
                          >
                            <ShieldCheck size={14} /> ML Verified &bull; Pass Quiz to Certify
                          </span>
                        ) : step.status === 'ENROLLED' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#60a5fa',
                            }}
                          >
                            <Globe size={14} /> Platform Enrolled
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            Progress automated via platform sync &amp; assessments
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {/* Open Verified Course Link */}
                        {(step.courseUrl || step.courseTitle) && (
                          <a
                            href={getWorkingCourseUrl(step)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <span>Open Course</span>
                            <ExternalLink size={12} />
                          </a>
                        )}

                        {/* Check Platform or Enrolled Pill */}
                        {step.status !== 'COMPLETED' && (step.provider === 'Coursera' || (step.courseUrl && step.courseUrl.includes('coursera.org'))) && (
                          step.status === 'ENROLLED' ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                color: '#1d4ed8',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                              title="Platform enrollment confirmed on Coursera"
                            >
                              <Globe size={13} color="#2563eb" />
                              <span>Enrolled</span>
                            </span>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#64748b',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                }}
                                title="Not yet enrolled on Coursera. Click Open Course to enroll on the platform."
                              >
                                <span>Not Enrolled</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleVerifyPlatformCourse(step.courseId)}
                                disabled={verifyingCourseId === step.courseId}
                                title="Verify course enrollment directly with Coursera API"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1d4ed8',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <Globe size={13} />
                                <span>{verifyingCourseId === step.courseId ? 'Checking...' : 'Check Platform'}</span>
                              </button>
                            </div>
                          )
                        )}

                        {/* Course Completion and Status State */}
                        {isCertified ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: '#ecfdf5',
                                border: '1px solid #a7f3d0',
                                color: '#047857',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={13} color="#059669" />
                              <span>Completed</span>
                            </span>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.35rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: '#f0fdf4',
                                border: '1px solid #86efac',
                                color: '#15803d',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                              title="Diagnostic quiz passed! Qualified to mentor colleagues in this course."
                            >
                              <Award size={13} color="#16a34a" />
                              <span>🏆 Qualified Course Mentor</span>
                            </span>
                          </div>
                        ) : hasPassedQuiz ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                            title="Diagnostic quiz passed."
                          >
                            <CheckCircle2 size={13} color="#2563eb" />
                            <span>Quiz Passed</span>
                          </span>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => navigate(`/assessments/course/${step.courseId}/take`)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            color: '#818cf8',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <FileCheck2 size={13} />
                          <span>{isCertified ? 'Retake Diagnostic' : 'Take Diagnostic Quiz'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Route}
          title="No Learning Pathway Found"
          description="Click the button above to generate a customized curriculum mapped to your target job role's skill gaps."
          actionLabel="Generate Learning Pathway"
          onAction={handleGeneratePath}
        />
      )}

      {/* Course Completion Certificate Upload Modal */}
      {selectedCourseForCert && (
        <CertificateUploadModal
          isOpen={isCertModalOpen}
          onClose={() => {
            setIsCertModalOpen(false);
            setSelectedCourseForCert(null);
          }}
          course={selectedCourseForCert}
          onSuccess={handleCertUploadSuccess}
        />
      )}
    </div>
  );
};

export default LearningPathPage;
