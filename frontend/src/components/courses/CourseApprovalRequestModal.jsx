import React, { useState } from 'react';
import Modal from '../common/Modal';
import { courseApprovalApi } from '../../api/courseApprovalApi';
import ErrorAlert from '../common/ErrorAlert';
import { Send, CheckCircle2, Clock, AlertTriangle, BookOpen, Star, Award } from 'lucide-react';

const PROVIDER_COLORS = {
  Coursera: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  Udemy: { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
  edX: { bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d' },
  'YouTube Learning': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  'Internal Academy': { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
};

export const CourseApprovalRequestModal = ({ isOpen, onClose, course, onSuccess }) => {
  if (!isOpen || !course) return null;

  const [reason, setReason] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [targetSkillName, setTargetSkillName] = useState(course.skillsCovered?.[0] || 'Core Engineering');
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason explaining how this course bridges your competency gap.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await courseApprovalApi.submitRequest({
        courseId: course.id,
        externalCourseTitle: course.title,
        externalCourseProvider: course.provider,
        externalCourseUrl: course.courseUrl,
        price: course.price,
        durationHours: course.durationHours,
        difficultyLevel: course.difficultyLevel,
        rating: course.rating,
        targetSkillName,
        reason: reason.trim(),
        expectedOutcome: expectedOutcome.trim(),
        priority,
        targetCompletionDate: targetDate,
      });

      if (onSuccess) {
        onSuccess(`Course request for "${course.title}" submitted successfully for manager approval!`);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit course approval request');
    } finally {
      setSubmitting(false);
    }
  };

  const providerStyle = PROVIDER_COLORS[course.provider] || { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Course Approval from Manager" maxWidth="620px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <ErrorAlert message={error} />}

        {/* Selected Course Summary - Modern Light Card */}
        <div
          style={{
            padding: '1.15rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.65rem' }}>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  background: providerStyle.bg,
                  border: `1px solid ${providerStyle.border}`,
                  color: providerStyle.text,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '0.35rem',
                }}
              >
                {course.provider}
              </span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.15rem 0 0.35rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
                {course.title}
              </h4>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <strong style={{ color: course.isFree ? '#059669' : 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 800 }}>
                {course.isFree ? 'Free Access' : `$${Number(course.price).toFixed(2)}`}
              </strong>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Level: {course.difficultyLevel}</span>
            <span>&bull;</span>
            <span>Duration: {course.durationHours} hrs</span>
            <span>&bull;</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {Number(course.rating).toFixed(2)} / 5.0
            </span>
          </div>
        </div>

        {/* Target Skill */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            Primary Skill to Improve
          </label>
          <input
            type="text"
            className="input"
            value={targetSkillName}
            onChange={(e) => setTargetSkillName(e.target.value)}
            placeholder="e.g. Spring Boot Framework, System Design"
            required
          />
        </div>

        {/* Reason for Request */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            Business &amp; Technical Justification <span style={{ color: 'var(--accent-danger)' }}>*</span>
          </label>
          <textarea
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain how this course directly addresses your target role skill gap and project needs..."
            required
          />
        </div>

        {/* Expected Outcome */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
            Expected Learning Deliverables / Outcome
          </label>
          <input
            type="text"
            className="input"
            value={expectedOutcome}
            onChange={(e) => setExpectedOutcome(e.target.value)}
            placeholder="e.g. Build production microservices, pass internal diagnostic quiz"
          />
        </div>

        {/* Priority & Target Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Urgency Priority
            </label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="LOW">Low - General Elective</option>
              <option value="MEDIUM">Medium - Core Upskilling</option>
              <option value="HIGH">High - Target Gap Resolution</option>
              <option value="URGENT">Urgent - Mandatory Role Requirement</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Target Completion Date
            </label>
            <input
              type="date"
              className="input"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
          >
            <Send size={15} />
            {submitting ? 'Submitting Request...' : 'Submit to Manager'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CourseApprovalRequestModal;
