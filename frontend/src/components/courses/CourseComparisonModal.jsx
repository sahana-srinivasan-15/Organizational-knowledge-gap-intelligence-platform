import React from 'react';
import Modal from '../common/Modal';
import { ExternalLink, Star, Clock, CheckCircle2, XCircle, Award } from 'lucide-react';
import { getWorkingCourseUrl } from '../../utils/apiUtils';

const PROVIDER_COLORS = {
  Coursera: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  Udemy: { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
  edX: { bg: '#fdf2f8', border: '#fbcfe8', text: '#be185d' },
  'YouTube Learning': { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  'Internal Academy': { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' },
};

export const CourseComparisonModal = ({ isOpen, onClose, comparison, onRequestApproval }) => {
  if (!isOpen || !comparison) return null;

  const courses = comparison.courses || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Side-by-Side Course & Platform Comparison" maxWidth="1100px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {comparison.comparisonSummary && (
          <div
            style={{
              padding: '0.95rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%)',
              border: '1px solid #c7d2fe',
              color: '#3730a3',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
            }}
          >
            <CheckCircle2 size={18} color="#4f46e5" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
            <div>
              <strong style={{ color: '#312e81' }}>Comparative Analysis: </strong>
              <span>{comparison.comparisonSummary}</span>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', width: '180px', letterSpacing: '0.04em' }}>
                  Criteria
                </th>
                {courses.map((c) => (
                  <th key={c.id} style={{ padding: '0.85rem 1rem', fontSize: '0.925rem', fontWeight: 800, color: 'var(--text-primary)', background: c.isRecommended ? '#fbfcfe' : 'transparent' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {c.isRecommended && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#eef2ff', color: 'var(--accent-primary)', border: '1px solid #c7d2fe', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content' }}>
                          <CheckCircle2 size={10} /> BEST FIT
                        </span>
                      )}
                      <a
                        href={getWorkingCourseUrl(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', transition: 'color 0.15s' }}
                        title="Open course directly on external platform"
                        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent-primary)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                      >
                        {c.title}
                      </a>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Platform */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Platform</td>
                {courses.map((c) => {
                  const style = PROVIDER_COLORS[c.provider] || { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' };
                  return (
                    <td key={c.id} style={{ padding: '0.85rem 1rem', background: c.isRecommended ? '#fbfcfe' : 'transparent' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', background: style.bg, border: `1px solid ${style.border}`, color: style.text, fontSize: '0.75rem', fontWeight: 700 }}>
                        {c.provider}
                      </span>
                    </td>
                  );
                })}
              </tr>

              {/* Price */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#fafbfc' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Pricing</td>
                {courses.map((c) => (
                  <td key={c.id} style={{ padding: '0.85rem 1rem', background: c.isRecommended ? '#f8faff' : '#fafbfc' }}>
                    <strong style={{ fontSize: '0.95rem', color: c.isFree ? '#059669' : 'var(--text-primary)' }}>
                      {c.isFree ? 'Free Access' : `$${Number(c.price).toFixed(2)}`}
                    </strong>
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Quality Rating</td>
                {courses.map((c) => (
                  <td key={c.id} style={{ padding: '0.85rem 1rem', background: c.isRecommended ? '#fbfcfe' : 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Star size={15} fill="#f59e0b" color="#f59e0b" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{Number(c.rating).toFixed(2)}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.reviewCount || '1.2k'} reviews)</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Level & Duration */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#fafbfc' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Level &amp; Duration</td>
                {courses.map((c) => (
                  <td key={c.id} style={{ padding: '0.85rem 1rem', background: c.isRecommended ? '#f8faff' : '#fafbfc' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)', background: '#ffffff', border: '1px solid var(--border-medium)', fontSize: '0.75rem', fontWeight: 600 }}>
                      {c.difficultyLevel}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 500 }}>
                      &bull; {c.durationHours} hrs
                    </span>
                  </td>
                ))}
              </tr>

              {/* Certificate */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Certificate</td>
                {courses.map((c) => (
                  <td key={c.id} style={{ padding: '0.85rem 1rem', background: c.isRecommended ? '#fbfcfe' : 'transparent' }}>
                    {c.certificateAvailable ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                        <Award size={13} color="#059669" /> Certificate Included
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Skills Covered */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: '#fafbfc' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Skills Covered</td>
                {courses.map((c) => (
                  <td key={c.id} style={{ padding: '0.85rem 1rem', background: c.isRecommended ? '#f8faff' : '#fafbfc' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {c.skillsCovered?.map((sk, idx) => (
                        <span key={idx} style={{ padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-sm)', background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', fontSize: '0.72rem', fontWeight: 600 }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Skill Gap Relevance */}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Skill Gap Relevance</td>
                {courses.map((c) => (
                  <td key={c.id} style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', background: c.isRecommended ? '#fbfcfe' : 'transparent' }}>
                    {c.isRecommended ? (
                      <div>
                        <strong style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                          Relevance Score: {c.matchRelevanceScore || 95} pts
                        </strong>
                        <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.45 }}>
                          {c.recommendationReason}
                        </p>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Foundational skill match</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.825rem' }}>Action</td>
                {courses.map((c) => (
                  <td key={c.id} style={{ padding: '0.85rem 1rem', background: c.isRecommended ? '#fbfcfe' : 'transparent' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', borderRadius: 'var(--radius-full)' }}
                        onClick={() => {
                          onClose();
                          onRequestApproval(c);
                        }}
                      >
                        Request Approval
                      </button>
                      <a
                        href={getWorkingCourseUrl(c)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', borderRadius: 'var(--radius-full)', background: '#ffffff' }}
                        title="Open course directly on external platform"
                      >
                        <ExternalLink size={13} />
                        <span>Open Course</span>
                      </a>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default CourseComparisonModal;
