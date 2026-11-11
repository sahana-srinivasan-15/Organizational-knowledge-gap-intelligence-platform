import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { liveClassApi } from '../api/liveClassApi';
import { extractArray } from '../utils/apiUtils';
import LoadingSkeleton from '../components/common/LoadingSkeleton';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import {
  Video,
  Radio,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  BookOpen,
  PlayCircle,
  Plus,
  CheckCircle,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

export const LiveClassesPage = () => {
  const { user, isMentor, isManager, isAdmin } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('ALL');

  // Modal for scheduling
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    skillId: '',
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    durationMinutes: 60,
    meetingUrl: 'https://meet.google.com/org-live-session',
    materialsUrl: '',
    maxParticipants: 50,
  });

  // End Class Modal
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endingClassId, setEndingClassId] = useState(null);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [endingLoading, setEndingLoading] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await liveClassApi.getLiveClasses();
      const list = extractArray(res);
      setClasses(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load live classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleJoin = async (c) => {
    try {
      await liveClassApi.joinClass(c.id);
      window.open(c.meetingUrl, '_blank', 'noopener,noreferrer');
      fetchClasses();
    } catch {
      window.open(c.meetingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleStartClass = async (id) => {
    try {
      await liveClassApi.updateStatus(id, { status: 'LIVE' });
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start class');
    }
  };

  const handleOpenEndModal = (id) => {
    setEndingClassId(id);
    setRecordingUrl('https://www.youtube.com/watch?v=0Lt9w-BxKFQ');
    setEndModalOpen(true);
  };

  const handleConfirmEnd = async () => {
    if (!endingClassId) return;
    setEndingLoading(true);
    try {
      await liveClassApi.updateStatus(endingClassId, {
        status: 'COMPLETED',
        recordingUrl: recordingUrl || null,
      });
      setEndModalOpen(false);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete class');
    } finally {
      setEndingLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setScheduling(true);
    try {
      await liveClassApi.createLiveClass({
        title: form.title,
        description: form.description,
        skillId: form.skillId ? parseInt(form.skillId) : null,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
        durationMinutes: parseInt(form.durationMinutes) || 60,
        meetingUrl: form.meetingUrl,
        materialsUrl: form.materialsUrl || null,
        maxParticipants: parseInt(form.maxParticipants) || 50,
      });
      setIsModalOpen(false);
      setForm({
        title: '',
        description: '',
        skillId: '',
        scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        durationMinutes: 60,
        meetingUrl: 'https://meet.google.com/org-live-session',
        materialsUrl: '',
        maxParticipants: 50,
      });
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule live class');
    } finally {
      setScheduling(false);
    }
  };

  const canHost = isMentor || isManager || isAdmin;

  // Filtered classes
  const filteredClasses = classes.filter((c) => {
    if (activeTab !== 'ALL' && c.status !== activeTab) return false;
    if (selectedSkill !== 'ALL' && c.skillName !== selectedSkill) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title?.toLowerCase().includes(q);
      const matchMentor = c.mentorName?.toLowerCase().includes(q);
      const matchDesc = c.description?.toLowerCase().includes(q);
      const matchSkill = c.skillName?.toLowerCase().includes(q);
      return matchTitle || matchMentor || matchDesc || matchSkill;
    }
    return true;
  });

  const liveClasses = classes.filter((c) => c.status === 'LIVE');
  const upcomingClasses = classes.filter((c) => c.status === 'UPCOMING');
  const completedClasses = classes.filter((c) => c.status === 'COMPLETED');

  // Distinct skills for filter dropdown
  const skillsList = Array.from(new Set(classes.map((c) => c.skillName).filter(Boolean)));

  const heroLiveClass = liveClasses.length > 0 ? liveClasses[0] : null;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            <Radio size={14} className="animate-pulse" /> Interactive Live Academy
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Live Classes & Interactive Masterclasses
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.925rem', marginTop: '0.35rem', maxWidth: '650px' }}>
            Join real-time interactive mentoring sessions, technical deep-dives, and hands-on architecture labs with verified domain mentors.
          </p>
        </div>

        {canHost && (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#4F46E5',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)',
            }}
          >
            <Plus size={16} /> Schedule Live Class
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} style={{ marginBottom: '1.5rem' }} />}

      {/* Hero Banner: If there is a live class happening right now! */}
      {heroLiveClass && (
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
            borderRadius: '1rem',
            padding: '1.75rem',
            color: '#ffffff',
            marginBottom: '2.5rem',
            boxShadow: '0 10px 25px -5px rgba(67, 56, 202, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#EF4444', color: '#ffffff', padding: '0.3rem 0.85rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'inline-block' }} className="animate-ping" />
              LIVE BROADCAST NOW
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#E0E7FF' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={15} /> {heroLiveClass.currentAttendees || 18} attending
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} /> {heroLiveClass.durationMinutes || 60} mins
              </span>
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ffffff' }}>
              {heroLiveClass.title}
            </h2>
            <p style={{ color: '#C7D2FE', fontSize: '0.92rem', maxWidth: '850px', margin: 0, lineHeight: 1.5 }}>
              {heroLiveClass.description}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.15)', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                {heroLiveClass.mentorName ? heroLiveClass.mentorName[0] : 'M'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{heroLiveClass.mentorName}</div>
                <div style={{ fontSize: '0.78rem', color: '#A5B4FC' }}>
                  Lead Instructor • {heroLiveClass.skillName || 'Engineering'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {heroLiveClass.materialsUrl && (
                <a
                  href={heroLiveClass.materialsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    padding: '0.6rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <BookOpen size={15} /> Slides & Code
                </a>
              )}
              <button
                onClick={() => handleJoin(heroLiveClass)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#10B981',
                  color: '#ffffff',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                }}
              >
                <Video size={18} /> Join Meeting Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Classes (${classes.length})` },
            { id: 'LIVE', label: `🔴 Live Now (${liveClasses.length})` },
            { id: 'UPCOMING', label: `📅 Upcoming (${upcomingClasses.length})` },
            { id: 'COMPLETED', label: `📹 Recordings (${completedClasses.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeTab === tab.id ? '#4F46E5' : '#F1F5F9',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {skillsList.length > 0 && (
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="ALL">All Skills</option>
              {skillsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search classes or mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.85rem',
                width: '220px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <LoadingSkeleton height="120px" count={3} />
      ) : filteredClasses.length === 0 ? (
        <EmptyState
          title="No live classes found"
          description="There are currently no live sessions matching your active filter criteria."
          icon={Video}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredClasses.map((c) => {
            const isLive = c.status === 'LIVE';
            const isUpcoming = c.status === 'UPCOMING';
            const isCompleted = c.status === 'COMPLETED';
            const isMentorOwner = c.mentorUserId === user?.id || isAdmin;

            return (
              <div
                key={c.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: isLive ? '2px solid #EF4444' : '1px solid #E2E8F0',
                  borderRadius: '0.75rem',
                  padding: '1.25rem',
                  boxShadow: isLive ? '0 4px 15px rgba(239, 68, 68, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  {/* Card Header Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        backgroundColor: isLive ? '#FEE2E2' : isUpcoming ? '#DBEAFE' : '#F1F5F9',
                        color: isLive ? '#DC2626' : isUpcoming ? '#1D4ED8' : '#475569',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {isLive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#DC2626' }} className="animate-ping" />}
                      {c.status}
                    </span>

                    {c.skillName && (
                      <span style={{ fontSize: '0.75rem', color: '#6366F1', backgroundColor: '#EEF2FF', padding: '0.2rem 0.5rem', borderRadius: '0.375rem', fontWeight: 600 }}>
                        {c.skillName}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.4rem 0', lineHeight: 1.4 }}>
                    {c.title}
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.84rem', margin: '0 0 1rem 0', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.description}
                  </p>

                  {/* Date, Time, Duration Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#475569', marginBottom: '1rem', backgroundColor: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} style={{ color: '#64748B' }} />
                      <span>{c.scheduledAt ? new Date(c.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled Soon'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={14} style={{ color: '#64748B' }} />
                        <span>{c.durationMinutes || 60} minutes</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669', fontWeight: 600 }}>
                        <Users size={14} /> {c.currentAttendees || 0} enrolled
                      </span>
                    </div>
                  </div>

                  {/* Mentor Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E0E7FF', color: '#4338CA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                      {c.mentorName ? c.mentorName[0] : 'M'}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B' }}>{c.mentorName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Verified Mentor</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isLive && (
                      <button
                        onClick={() => handleJoin(c)}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#DC2626',
                          color: '#ffffff',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.825rem',
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Video size={15} /> Join Live Now
                      </button>
                    )}

                    {isUpcoming && (
                      <button
                        onClick={() => handleJoin(c)}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#4F46E5',
                          color: '#ffffff',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <ExternalLink size={14} /> Open Meeting Link
                      </button>
                    )}

                    {isCompleted && c.recordingUrl && (
                      <a
                        href={c.recordingUrl.includes('bUHFg8CZFCA') ? 'https://www.youtube.com/watch?v=0Lt9w-BxKFQ' : c.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#0F172A',
                          color: '#ffffff',
                          padding: '0.55rem 0.85rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <PlayCircle size={15} /> Watch Recording
                      </a>
                    )}

                    {c.materialsUrl && (
                      <a
                        href={c.materialsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.35rem',
                          backgroundColor: '#F8FAFC',
                          color: '#334155',
                          border: '1px solid #CBD5E1',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        <BookOpen size={14} /> Materials
                      </a>
                    )}
                  </div>

                  {/* Mentor Controls */}
                  {isMentorOwner && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      {isUpcoming && (
                        <button
                          onClick={() => handleStartClass(c.id)}
                          style={{
                            flex: 1,
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          ▶ Start Class (Go Live)
                        </button>
                      )}
                      {isLive && (
                        <button
                          onClick={() => handleOpenEndModal(c.id)}
                          style={{
                            flex: 1,
                            backgroundColor: '#475569',
                            color: '#ffffff',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          ◼ End Class & Save
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule New Live Class">
        <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Class Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Modern System Design: Caching Patterns"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Target Skill Domain
            </label>
            <select
              value={form.skillId}
              onChange={(e) => setForm({ ...form, skillId: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            >
              <option value="">Select skill (Optional)</option>
              <option value="1">Java Programming</option>
              <option value="2">Spring Boot Framework</option>
              <option value="3">System Design & Architecture</option>
              <option value="4">PostgreSQL & Database Optimization</option>
              <option value="5">Python for Data Science</option>
              <option value="6">Machine Learning & Scikit-Learn</option>
              <option value="7">Docker & Containerization</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Session Description
            </label>
            <textarea
              rows={3}
              placeholder="What will engineers learn in this live session?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Duration (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="240"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Meeting URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://meet.google.com/xyz-abc-def"
              value={form.meetingUrl}
              onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Materials / Slides URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://github.com/..."
              value={form.materialsUrl}
              onChange={(e) => setForm({ ...form, materialsUrl: e.target.value })}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduling}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#4F46E5', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              {scheduling ? 'Scheduling...' : 'Schedule Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* End Class Modal */}
      <Modal isOpen={endModalOpen} onClose={() => setEndModalOpen(false)} title="End Live Class & Save Recording">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
            Conclude this live masterclass. You can optionally attach a recording URL so attendees can re-watch on demand.
          </p>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Recording URL (YouTube, Vimeo, Google Drive, or Cloud Archive)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={recordingUrl}
              onChange={(e) => setRecordingUrl(e.target.value)}
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setEndModalOpen(false)}
              style={{ padding: '0.55rem 1rem', borderRadius: '0.375rem', border: '1px solid #CBD5E1', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={endingLoading}
              onClick={handleConfirmEnd}
              style={{ padding: '0.55rem 1.25rem', borderRadius: '0.375rem', border: 'none', backgroundColor: '#059669', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              {endingLoading ? 'Ending...' : 'Complete & Publish'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LiveClassesPage;

