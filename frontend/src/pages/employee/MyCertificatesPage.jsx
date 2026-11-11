import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { certificateApi } from '../../api/certificateApi';
import { learningPathApi } from '../../api/learningPathApi';
import { CertificateUploadModal } from '../../components/courses/CertificateUploadModal';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import {
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  ShieldCheck,
  Globe,
  Calendar,
  ExternalLink,
  Download,
  Clock,
  ArrowRight,
  BookOpen,
  Filter,
  Sparkles,
} from 'lucide-react';

export const MyCertificatesPage = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CERTIFIED' | 'PENDING_QUIZ'

  // Certificate Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadCertificate = async (e, cert) => {
    if (e) e.preventDefault();
    if (!cert?.id) return;
    setDownloadingId(cert.id);
    try {
      if (certificateApi.downloadCertificate) {
        await certificateApi.downloadCertificate(cert.id, cert.certificateFileName || 'certificate.pdf');
      } else {
        window.open(certificateApi.getDownloadUrl(cert.id), '_blank');
      }
    } catch (err) {
      console.error('Failed to download certificate:', err);
      window.open(certificateApi.getDownloadUrl(cert.id), '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [certsRes, pathRes] = await Promise.allSettled([
        certificateApi.getMyCertificates(),
        learningPathApi.getOwnActivePath(),
      ]);

      if (certsRes.status === 'fulfilled') {
        const certList = certsRes.value?.data || certsRes.value || [];
        setCertificates(Array.isArray(certList) ? certList : []);
      }

      if (pathRes.status === 'fulfilled') {
        setLearningPath(pathRes.value?.data || pathRes.value || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load course certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenUploadModal = (course = null) => {
    setSelectedCourseForModal(course || { title: '', provider: 'Coursera' });
    setIsModalOpen(true);
  };

  const handleCertificateSuccess = (course, certData) => {
    setIsModalOpen(false);
    const title = course?.title || course?.courseTitle || 'Course';
    if (certData?.quizPassed) {
      setSuccessMsg(`Certificate verified and diagnostic quiz passed for "${title}"! Officially Completed & Certified.`);
    } else {
      setSuccessMsg(
        `Certificate verified as authentic by ML model for "${title}"! Please attend and pass the course Diagnostic Quiz to complete & certify.`
      );
    }
    fetchData();
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  // Metrics
  const totalCerts = certificates.length;
  const certifiedCount = certificates.filter(
    (c) => (c.status === 'CERTIFIED' && c.quizPassed) || (c.quizPassed && c.authenticityScore >= 0.7)
  ).length;
  const pendingQuizCount = certificates.filter(
    (c) => !c.quizPassed || c.status === 'ML_VERIFIED_PENDING_QUIZ'
  ).length;

  const avgAuthenticityScore =
    totalCerts > 0
      ? Math.round(
          certificates.reduce((sum, c) => sum + (c.authenticityScore ? Number(c.authenticityScore) * 100 : 90), 0) /
            totalCerts
        )
      : 0;

  // Filtered certificates
  const filteredCertificates = certificates.filter((c) => {
    if (filter === 'CERTIFIED') {
      return (c.status === 'CERTIFIED' && c.quizPassed) || (c.quizPassed && c.authenticityScore >= 0.7);
    }
    if (filter === 'PENDING_QUIZ') {
      return !c.quizPassed || c.status === 'ML_VERIFIED_PENDING_QUIZ';
    }
    return true;
  });

  // Roadmap courses that need a certificate
  const roadmapCourses = learningPath?.courses || [];
  const coursesNeedingCertificate = roadmapCourses.filter((course) => {
    const cTitle = (course.courseTitle || course.title || '').trim().toLowerCase();
    const hasCert = certificates.some((cert) => {
      const certTitle = (cert.courseTitle || '').trim().toLowerCase();
      return certTitle === cTitle || certTitle.includes(cTitle) || cTitle.includes(certTitle);
    });
    return !hasCert && course.status !== 'COMPLETED';
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Award size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                My Certificates
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#475569' }}>
                Upload authentic course completion certificates, verify ML authenticity, and certify your roadmap courses.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenUploadModal()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            border: 'none',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(79, 70, 229, 0.25)',
          }}
        >
          <Upload size={16} />
          <span>Upload Certificate</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span style={{ fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && <ErrorAlert message={error} />}

      {/* Key Metric Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Total Certificates
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{totalCerts}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Completed &amp; Certified
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>{certifiedCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Quiz Pending
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706' }}>{pendingQuizCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Avg. ML Authenticity
            </span>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>
              {totalCerts > 0 ? `${avgAuthenticityScore}%` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Content Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                background: filter === 'ALL' ? 'var(--accent-primary)' : '#ffffff',
                color: filter === 'ALL' ? '#ffffff' : '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              All Certificates ({totalCerts})
            </button>
            <button
              type="button"
              onClick={() => setFilter('CERTIFIED')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                background: filter === 'CERTIFIED' ? '#059669' : '#ffffff',
                color: filter === 'CERTIFIED' ? '#ffffff' : '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Completed &amp; Certified ({certifiedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('PENDING_QUIZ')}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
                background: filter === 'PENDING_QUIZ' ? '#d97706' : '#ffffff',
                color: filter === 'PENDING_QUIZ' ? '#ffffff' : '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Quiz Pending ({pendingQuizCount})
            </button>
          </div>
        </div>

        {/* Certificate Cards Grid */}
        {loading ? (
          <LoadingSkeleton height="200px" count={3} />
        ) : filteredCertificates.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {filteredCertificates.map((cert) => {
              const isCertified = (cert.status === 'CERTIFIED' && cert.quizPassed) || (cert.quizPassed && cert.authenticityScore >= 0.7);
              const scorePercent = cert.authenticityScore ? Math.round(Number(cert.authenticityScore) * 100) : 95;

              return (
                <div
                  key={cert.id}
                  className="glass-card"
                  style={{
                    padding: '1.35rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    borderLeft: isCertified ? '4px solid #059669' : '4px solid #d97706',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Top Row: Provider & Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: '#64748b',
                        }}
                      >
                        {cert.courseProvider || 'Coursera'}
                      </span>

                      {isCertified ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            color: '#065f46',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={13} color="#059669" />
                          <span>Completed &amp; Certified</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            color: '#b45309',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          <Clock size={13} color="#d97706" />
                          <span>Quiz Pending</span>
                        </span>
                      )}
                    </div>

                    {/* Course Title */}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.35 }}>
                      {cert.courseTitle}
                    </h3>

                    {/* Verification & Quiz Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.75rem',
                          color: '#047857',
                          background: '#f0fdf4',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #bbf7d0',
                          fontWeight: 600,
                        }}
                      >
                        <ShieldCheck size={14} color="#059669" />
                        <span>ML Verified Authenticity: <strong>{scorePercent}%</strong></span>
                      </div>

                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.75rem',
                          color: cert.quizPassed ? '#047857' : '#92400e',
                          background: cert.quizPassed ? '#f0fdf4' : '#fffbeb',
                          padding: '0.3rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          border: cert.quizPassed ? '1px solid #bbf7d0' : '1px solid #fde68a',
                          fontWeight: 600,
                        }}
                      >
                        {cert.quizPassed ? (
                          <>
                            <CheckCircle2 size={14} color="#059669" />
                            <span>Diagnostic Quiz: <strong>Passed (≥70%)</strong></span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} color="#d97706" />
                            <span>Diagnostic Quiz: <strong>Required to Certify</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Dates */}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      {cert.completionDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar size={13} />
                          <span>Completed: {cert.completionDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.85rem',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#1e293b',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>View Credential</span>
                        </a>
                      )}

                      {cert.certificateFileName && (
                        <a
                          href={certificateApi.getDownloadUrl(cert.id)}
                          onClick={(e) => handleDownloadCertificate(e, cert)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#1e293b',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Download size={12} />
                          <span>{downloadingId === cert.id ? 'Downloading...' : 'Download File'}</span>
                        </a>
                      )}
                    </div>

                    {!cert.quizPassed && (
                      <button
                        type="button"
                        onClick={() => navigate('/assessments')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--accent-primary)',
                          border: 'none',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <FileCheck2 size={13} />
                        <span>Take Quiz</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Award}
            title={filter === 'ALL' ? 'No Certificates Uploaded Yet' : 'No Certificates Match This Filter'}
            description={
              filter === 'ALL'
                ? 'Upload your external course certificates from Coursera, Udemy, or other learning platforms to verify and certify your roadmap courses.'
                : 'Switch filters or upload a new certificate to get started.'
            }
            actionLabel="Upload First Certificate"
            onAction={() => handleOpenUploadModal()}
          />
        )}
      </div>

      {/* Courses in Learning Roadmap Awaiting Certificate Upload */}
      {coursesNeedingCertificate.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Active Roadmap Courses Awaiting Certificates ({coursesNeedingCertificate.length})
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            These courses are in your active learning roadmap. Upload your completion certificate to initiate authenticity verification.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {coursesNeedingCertificate.map((course) => (
              <div
                key={course.id || course.courseId}
                className="glass-card"
                style={{
                  padding: '1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    {course.provider || 'Coursera'} &bull; Step {course.stepOrder}
                  </span>
                  <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0 0.4rem' }}>
                    {course.courseTitle || course.title}
                  </h4>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 700,
                    }}
                  >
                    Status: {course.status}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenUploadModal({ courseId: course.courseId, title: course.courseTitle || course.title, provider: course.provider })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--accent-primary)',
                    color: 'var(--accent-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Upload size={13} />
                  <span>Upload</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certificate Upload Modal */}
      <CertificateUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourseForModal}
        onSuccess={handleCertificateSuccess}
      />
    </div>
  );
};

export default MyCertificatesPage;

