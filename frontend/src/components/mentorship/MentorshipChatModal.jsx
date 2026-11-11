import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { mentorshipChatApi } from '../../api/mentorshipChatApi';
import { liveClassApi } from '../../api/liveClassApi';
import { weakAreaApi } from '../../api/weakAreaApi';
import { useAuth } from '../../context/AuthContext';
import { extractArray } from '../../utils/apiUtils';
import {
  MessageSquare,
  Send,
  Video,
  BookOpen,
  Calendar,
  ExternalLink,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  Sparkles,
  Info,
  Paperclip,
  FileText,
  Download,
  X,
  Image,
} from 'lucide-react';

export const MentorshipChatModal = ({ isOpen, onClose, assignment, isMentor = false }) => {
  if (!isOpen) return null;

  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user;
  } catch {
    // Graceful fallback for components rendered without AuthProvider
  }
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');

  // Suggestion pickers (for Mentors)
  const [showLiveClassPicker, setShowLiveClassPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [liveClasses, setLiveClasses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedLiveClassId, setSelectedLiveClassId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  // Image & Document Attachment state
  const [attachment, setAttachment] = useState(null);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);

  const menteeName = assignment?.menteeName || assignment?.mentee?.name || 'Mentee';
  const mentorName = assignment?.mentorName || assignment?.mentor?.name || 'Mentor';
  const skillName = assignment?.skillName || assignment?.skill?.name || 'Engineering Competency';
  const assignmentId = assignment?.id || assignment?.assignmentId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await mentorshipChatApi.getMessages(assignmentId);
      setMessages(extractArray(res));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load mentorship messages');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestionCatalogs = async () => {
    try {
      const [lcRes, matRes] = await Promise.allSettled([
        liveClassApi.getLiveClasses(),
        weakAreaApi.getMaterials ? weakAreaApi.getMaterials() : Promise.resolve({ data: [] }),
      ]);
      if (lcRes.status === 'fulfilled') setLiveClasses(extractArray(lcRes.value));
      if (matRes.status === 'fulfilled') setMaterials(extractArray(matRes.value));
    } catch (e) {
      console.warn('Could not load suggestions catalog', e);
    }
  };

  useEffect(() => {
    if (isOpen && assignmentId) {
      loadMessages();
      if (isMentor) {
        loadSuggestionCatalogs();
      }
    }
  }, [isOpen, assignmentId, isMentor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        url: reader.result,
        name: file.name,
        type: isImage ? 'IMAGE' : 'DOCUMENT',
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !selectedLiveClassId && !selectedMaterialId && !attachment) return;

    setSending(true);
    setError(null);
    try {
      const defaultText = attachment
        ? `Shared ${attachment.type === 'IMAGE' ? 'image' : 'document'}: ${attachment.name}`
        : selectedLiveClassId
        ? 'I recommend attending this upcoming Live Class session.'
        : 'I recommend reviewing this targeted study material.';

      const payload = {
        messageText: text.trim() || defaultText,
        suggestionType: selectedLiveClassId ? 'LIVE_CLASS' : selectedMaterialId ? 'MATERIAL' : 'NONE',
        suggestedLiveClassId: selectedLiveClassId ? Number(selectedLiveClassId) : null,
        suggestedMaterialId: selectedMaterialId ? Number(selectedMaterialId) : null,
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
        attachmentType: attachment?.type || null,
      };

      const res = await mentorshipChatApi.sendMessage(assignmentId, payload);
      const newMsg = res?.data?.data || res?.data;
      setMessages((prev) => [...prev, newMsg]);
      setText('');
      setAttachment(null);
      setSelectedLiveClassId('');
      setSelectedMaterialId('');
      setShowLiveClassPicker(false);
      setShowMaterialPicker(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectLiveClass = (lc) => {
    setSelectedLiveClassId(lc.id);
    setSelectedMaterialId('');
    setShowLiveClassPicker(false);
    if (!text.trim()) {
      setText(`Hi! I strongly recommend joining this live interactive class: "${lc.title}". It directly targets our current roadmap focus.`);
    }
  };

  const handleSelectMaterial = (mat) => {
    setSelectedMaterialId(mat.id);
    setSelectedLiveClassId('');
    setShowMaterialPicker(false);
    if (!text.trim()) {
      setText(`Please review this recommended study material: "${mat.title}". It provides in-depth coverage for our target competencies.`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MessageSquare size={20} color="var(--accent-primary)" />
          <span>Mentorship Discussion &bull; {skillName}</span>
        </div>
      }
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '620px', margin: '-0.5rem -0.5rem -1rem' }}>
        {/* Header Bar */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-subtle, #f8fafc)',
            borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              {isMentor ? menteeName.charAt(0) : mentorName.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                  {isMentor ? menteeName : mentorName}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#dcfce7',
                    color: '#15803d',
                  }}
                >
                  Active Mentorship
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Targeting: <strong>{skillName}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadMessages}
            disabled={loading}
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--bg-card, #ffffff)',
          }}
        >
          {loading && messages.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <span>Loading mentorship dialogue...</span>
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <h4 style={{ margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>No messages yet</h4>
              <p style={{ margin: 0, fontSize: '0.825rem' }}>
                {isMentor
                  ? 'Send a welcoming message, suggest an upcoming live class, or recommend study materials.'
                  : 'Start a conversation with your mentor to discuss your learning roadmap and goals.'}
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.isCurrentUser;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                }}
              >
                {/* Sender info */}
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.2rem',
                    padding: '0 0.25rem',
                  }}
                >
                  {isMe ? 'You' : msg.senderName} &bull;{' '}
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>

                {/* Bubble Container */}
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: isMe ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#f1f5f9',
                    color: isMe ? '#ffffff' : '#0f172a',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
                    fontSize: '0.875rem',
                    lineHeight: 1.45,
                    width: '100%',
                  }}
                >
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.messageText}</p>

                  {/* Suggested Live Class Card */}
                  {msg.suggestedLiveClass && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isMe ? 'rgba(255, 255, 255, 0.15)' : '#ffffff',
                        border: isMe ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #bfdbfe',
                        color: isMe ? '#ffffff' : '#1e3a8a',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Video size={14} color={isMe ? '#ffffff' : '#2563eb'} />
                        <span>Recommended Live Class Session</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.3 }}>
                        {msg.suggestedLiveClass.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={13} />
                        <span>{msg.suggestedLiveClass.scheduledAt ? new Date(msg.suggestedLiveClass.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Upcoming Session'}</span>
                        <span>&bull; Instructor: {msg.suggestedLiveClass.instructorName}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <a
                          href={msg.suggestedLiveClass.meetingUrl || '/live-classes'}
                          target={msg.suggestedLiveClass.meetingUrl?.startsWith('http') ? '_blank' : '_self'}
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isMe ? '#ffffff' : '#2563eb',
                            color: isMe ? '#1d4ed8' : '#ffffff',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Join Live Class</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Suggested Study Material Card */}
                  {msg.suggestedMaterial && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isMe ? 'rgba(255, 255, 255, 0.15)' : '#ffffff',
                        border: isMe ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #fed7aa',
                        color: isMe ? '#ffffff' : '#7c2d12',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <BookOpen size={14} color={isMe ? '#ffffff' : '#ea580c'} />
                        <span>Recommended Study Material</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.3 }}>
                        {msg.suggestedMaterial.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Skill: <strong>{msg.suggestedMaterial.skillName}</strong></span>
                        <span>&bull; Level: {msg.suggestedMaterial.difficultyLevel || 'Intermediate'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <a
                          href={msg.suggestedMaterial.url || '/weak-areas'}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.35rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: isMe ? '#ffffff' : '#ea580c',
                            color: isMe ? '#9a3412' : '#ffffff',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Open Resource</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* File Attachment: Image or Document */}
                  {msg.attachmentUrl && (
                    <div style={{ marginTop: '0.65rem' }}>
                      {msg.attachmentType === 'IMAGE' || (typeof msg.attachmentUrl === 'string' && msg.attachmentUrl.startsWith('data:image/')) ? (
                        <div style={{ borderRadius: '8px', overflow: 'hidden', border: isMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid #cbd5e1' }}>
                          <img
                            src={msg.attachmentUrl}
                            alt={msg.attachmentName || 'Attachment image'}
                            style={{ maxWidth: '100%', maxHeight: '220px', display: 'block', cursor: 'pointer', objectFit: 'contain' }}
                            onClick={() => window.open(msg.attachmentUrl, '_blank')}
                          />
                          <div style={{ padding: '0.3rem 0.5rem', background: isMe ? 'rgba(0,0,0,0.2)' : '#f8fafc', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                              {msg.attachmentName || 'Image attachment'}
                            </span>
                            <a href={msg.attachmentUrl} download={msg.attachmentName || 'image.png'} style={{ color: isMe ? '#fff' : '#2563eb', display: 'flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontWeight: 600 }}>
                              <Download size={11} /> Save
                            </a>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={msg.attachmentUrl}
                          download={msg.attachmentName || 'document.pdf'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.85rem',
                            borderRadius: '8px',
                            background: isMe ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9',
                            border: isMe ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #cbd5e1',
                            color: isMe ? '#ffffff' : '#1e293b',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}
                        >
                          <FileText size={16} color={isMe ? '#ffffff' : '#2563eb'} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {msg.attachmentName || 'Download Shared Document'}
                          </span>
                          <Download size={13} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Mentor Suggestion Toolbars & Pickers */}
        {isMentor && (
          <div
            style={{
              padding: '0.5rem 1.25rem',
              background: '#f8fafc',
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Mentor Actions:
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowLiveClassPicker((prev) => !prev);
                  setShowMaterialPicker(false);
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.65rem',
                  background: selectedLiveClassId ? '#eff6ff' : undefined,
                  borderColor: selectedLiveClassId ? '#3b82f6' : undefined,
                  color: selectedLiveClassId ? '#1d4ed8' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Video size={13} color="#2563eb" />
                <span>{selectedLiveClassId ? 'Class Selected ✓' : 'Suggest Live Class'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowMaterialPicker((prev) => !prev);
                  setShowLiveClassPicker(false);
                }}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.3rem 0.65rem',
                  background: selectedMaterialId ? '#fff7ed' : undefined,
                  borderColor: selectedMaterialId ? '#f97316' : undefined,
                  color: selectedMaterialId ? '#c2410c' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <BookOpen size={13} color="#ea580c" />
                <span>{selectedMaterialId ? 'Material Selected ✓' : 'Suggest Material'}</span>
              </button>

              {(selectedLiveClassId || selectedMaterialId) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLiveClassId('');
                    setSelectedMaterialId('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.72rem',
                    color: '#ef4444',
                    cursor: 'pointer',
                    marginLeft: 'auto',
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Live Class Picker Popover */}
            {showLiveClassPicker && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e40af' }}>
                  Select Live Class to Recommend:
                </div>
                {liveClasses.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No live classes found.</div>
                ) : (
                  liveClasses.map((lc) => (
                    <div
                      key={lc.id}
                      onClick={() => handleSelectLiveClass(lc)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedLiveClassId === lc.id ? '#eff6ff' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{lc.title}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {lc.scheduledAt ? new Date(lc.scheduledAt).toLocaleDateString() : 'Upcoming'} &bull; {lc.skillName || 'Skill Target'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700 }}>Select</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Material Picker Popover */}
            {showMaterialPicker && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #fed7aa',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  maxHeight: '160px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9a3412' }}>
                  Select Study Material to Recommend:
                </div>
                {materials.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No study materials found.</div>
                ) : (
                  materials.map((mat) => (
                    <div
                      key={mat.id}
                      onClick={() => handleSelectMaterial(mat)}
                      style={{
                        padding: '0.45rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        background: selectedMaterialId === mat.id ? '#fff7ed' : '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: '#1e293b' }}>{mat.title}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {mat.skillName || 'Skill'} &bull; {mat.materialType || 'Article'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 700 }}>Select</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Attachment preview if selected */}
        {attachment && (
          <div
            style={{
              padding: '0.45rem 1.25rem',
              background: '#eff6ff',
              borderTop: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              color: '#1e40af',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {attachment.type === 'IMAGE' ? <Image size={15} color="#2563eb" /> : <FileText size={15} color="#2563eb" />}
              <span>Ready to share {attachment.type.toLowerCase()}: <strong>{attachment.name}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-subtle, #f8fafc)',
            borderTop: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            gap: '0.6rem',
            alignItems: 'center',
          }}
        >
          {/* Hidden File Input for Image & Document Sharing */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image or Document"
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-sm)',
              padding: '0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: attachment ? '#2563eb' : '#64748b',
              flexShrink: 0,
            }}
          >
            <Paperclip size={17} />
          </button>

          <input
            type="text"
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              selectedLiveClassId
                ? 'Add an optional personalized note for this live class...'
                : selectedMaterialId
                ? 'Add an optional note for this study material...'
                : attachment
                ? `Add caption for ${attachment.name}...`
                : `Type a message to ${isMentor ? menteeName : mentorName}...`
            }
            disabled={sending}
            style={{ flex: 1, padding: '0.65rem 0.95rem' }}
          />

          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || (!text.trim() && !selectedLiveClassId && !selectedMaterialId && !attachment)}
            style={{
              padding: '0.65rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexShrink: 0,
            }}
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default MentorshipChatModal;
