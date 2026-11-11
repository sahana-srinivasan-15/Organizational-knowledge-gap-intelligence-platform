import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import { certificateApi } from '../../api/certificateApi';
import { Award, Upload, CheckCircle2, AlertCircle, FileText, Globe, Calendar, Link, ShieldCheck, ArrowRight } from 'lucide-react';

export const CertificateUploadModal = ({ isOpen, onClose, course, onSuccess }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [credentialUrl, setCredentialUrl] = useState('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [courseTitleInput, setCourseTitleInput] = useState('');
  const [providerInput, setProviderInput] = useState('Coursera');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setCredentialUrl('');
      setCompletionDate(new Date().toISOString().split('T')[0]);
      setError(null);
      setSuccess(false);
      setVerificationData(null);
      setCourseTitleInput(course?.title || course?.courseTitle || '');
      setProviderInput(course?.provider || 'Coursera');
    }
  }, [isOpen, course]);

  const [fileWarning, setFileWarning] = useState(null);

  const isScreenshotName = (name) => {
    if (!name) return false;
    return /(screenshot|screen[_\s-]?shot|screen[_\s-]?grab|snip|capture|whatsapp|telegram|img_\d{4,})/i.test(name);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError('Certificate file must be under 10MB');
        return;
      }
      setFile(selected);
      setError(null);
      if (isScreenshotName(selected.name)) {
        setFileWarning('⚠️ Anti-Fraud Notice: Filename appears to be a screenshot. The ML certificate engine will verify document layout & credentials; arbitrary screen grabs will be rejected.');
      } else {
        setFileWarning(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCourseTitle = (course?.title || course?.courseTitle || courseTitleInput).trim();
    if (!finalCourseTitle) {
      setError('Please enter or select a course title.');
      return;
    }

    if (!file && !credentialUrl.trim()) {
      setError('Please either upload a certificate file (PDF/Image) or provide a verification credential link.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('courseTitle', finalCourseTitle);
      const prov = course?.provider || providerInput || 'Coursera';
      formData.append('courseProvider', prov);
      if (course?.slug) formData.append('courseSlug', course.slug);
      if (credentialUrl.trim()) formData.append('credentialUrl', credentialUrl.trim());
      if (completionDate) formData.append('completionDate', completionDate);
      if (file) formData.append('file', file);

      const res = await certificateApi.uploadCertificate(formData);
      const data = res?.data?.data || res?.data;
      setVerificationData(data);
      setSuccess(true);
      if (onSuccess) {
        onSuccess(course || { title: finalCourseTitle, provider: prov }, data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to upload certificate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Course Completion Certificate" maxWidth="560px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Course Summary Card or Course Selector */}
        {course && (course.title || course.courseTitle) ? (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Award size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--accent-primary)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '0.15rem',
                }}
              >
                {course.provider || 'Coursera'} &bull; Verified Course
              </span>
              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.35,
                }}
              >
                {course.title || course.courseTitle}
              </h4>
              {course.matchedSkillName && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: '0.25rem',
                    display: 'inline-block',
                  }}
                >
                  Validates: <strong>{course.matchedSkillName}</strong>
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Course Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={courseTitleInput}
                onChange={(e) => setCourseTitleInput(e.target.value)}
                placeholder="e.g. Data Structures and Software Design Specialization"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Course Provider
              </label>
              <select
                value={providerInput}
                onChange={(e) => setProviderInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontSize: '0.875rem',
                }}
              >
                <option value="Coursera">Coursera</option>
                <option value="Google Cloud">Google Cloud</option>
                <option value="DeepLearning.AI">DeepLearning.AI</option>
                <option value="Udemy">Udemy</option>
                <option value="edX">edX</option>
                <option value="Internal / Other">Internal / Other</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ML Verification Pending Quiz Result Card */}
        {success && verificationData?.status === 'ML_VERIFIED_PENDING_QUIZ' && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontWeight: 800, fontSize: '0.95rem' }}>
              <ShieldCheck size={20} color="#d97706" />
              <span>Certificate Authenticity Verified by ML Model!</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#78350f', lineHeight: 1.5 }}>
              {verificationData?.verificationMessage ||
                `The ML verification model confirmed document authenticity (${Math.round((verificationData?.authenticityScore || 0.95) * 100)}% score).`}
            </p>
            <div style={{ padding: '0.75rem', background: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', fontSize: '0.8rem', color: '#451a03' }}>
              <strong>Next Step Required:</strong> In order for this course to be marked <strong>Completed &amp; Certified</strong> and qualify you for <strong>Peer Mentorship</strong>, you must attend and pass the 5-question course diagnostic quiz.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
              >
                Take Quiz Later
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  onClose();
                  const targetId = course.courseId || course.id;
                  navigate(targetId ? `/assessments/course/${targetId}/take` : '/assessments');
                }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Take Diagnostic Quiz Now</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Already Certified Result Card */}
        {success && verificationData?.status === 'CERTIFIED' && (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065f46', fontWeight: 800, fontSize: '0.95rem' }}>
              <CheckCircle2 size={20} color="#059669" />
              <span>Completed &amp; Certified!</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857', lineHeight: 1.45 }}>
              Certificate authenticity confirmed and diagnostic quiz passed! Your profile competencies have been updated and you are now officially eligible as a Peer Mentor.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {!success && (
          <>
            {/* Certificate File Upload */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Upload Certificate Document (PDF or Image)
              </label>
              <div
                style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: file ? '#f0fdf4' : '#fafafa',
                  borderColor: file ? '#86efac' : 'var(--border-medium)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                  }}
                />
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="#16a34a" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16a34a' }}>
                      {file.name} ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <Upload size={22} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Click to choose file or drag &amp; drop
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Supported formats: PDF, PNG, JPG, WEBP (Max 10MB)
                    </span>
                  </div>
                )}
              </div>
              {fileWarning && (
                <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>{fileWarning}</span>
                </div>
              )}
            </div>

            {/* Online Credential URL */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Or Public Verification Link (Optional if file is uploaded)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  className="input"
                  placeholder="e.g. https://www.coursera.org/verify/XXXXXX or Credential ID"
                  value={credentialUrl}
                  onChange={(e) => setCredentialUrl(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Link size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Completion Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Completion Date
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  className="input"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Calendar size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {submitting ? (
                  <span>Verifying ML Authenticity...</span>
                ) : (
                  <>
                    <Award size={15} />
                    <span>Confirm &amp; Record Certificate</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};

export default CertificateUploadModal;

