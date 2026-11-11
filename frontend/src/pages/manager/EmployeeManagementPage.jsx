import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeManagementApi } from '../../api/employeeManagementApi';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import Modal from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  FileText,
  Download,
  Search,
  CheckCircle2,
  ShieldAlert,
  Building,
  Briefcase,
  Calendar,
  Lock,
  Mail,
  User,
  UploadCloud,
  X,
  Eye,
  Info
} from 'lucide-react';

export const EmployeeManagementPage = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [resumeFilter, setResumeFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Create Employee Form state
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departmentId: '',
    currentJobRoleId: '',
    targetJobRoleId: '',
    hireDate: new Date().toISOString().split('T')[0],
    mentorOptIn: false,
    mentorAvailabilityHrsPerWeek: 0,
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empRes, deptRes, rolesRes] = await Promise.allSettled([
        employeeManagementApi.getEmployees(),
        employeeManagementApi.getDepartments(),
        employeeManagementApi.getJobRoles(),
      ]);

      if (empRes.status === 'fulfilled') {
        setEmployees(extractArray(empRes.value));
      } else {
        throw new Error(empRes.reason?.response?.data?.message || 'Failed to load employees');
      }

      if (deptRes.status === 'fulfilled') {
        const depts = extractArray(deptRes.value);
        setDepartments(depts);
        if (depts.length > 0 && !form.departmentId) {
          const userDeptId = user?.department?.id || user?.departmentId || depts[0].id;
          setForm((prev) => ({ ...prev, departmentId: userDeptId }));
        }
      }

      if (rolesRes.status === 'fulfilled') {
        setJobRoles(extractArray(rolesRes.value));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update job roles when department changes in form
  const availableJobRoles = useMemo(() => {
    if (!form.departmentId) return jobRoles;
    return jobRoles.filter((jr) => String(jr.departmentId) === String(form.departmentId));
  }, [jobRoles, form.departmentId]);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: generated }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['pdf', 'doc', 'docx', 'txt'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Please select a valid document (PDF, DOC, DOCX, or TXT).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }
    setError(null);
    setResumeFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Please fill in all required credentials (name, email, and password).');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName.trim());
      formData.append('lastName', form.lastName.trim());
      formData.append('email', form.email.trim().toLowerCase());
      formData.append('password', form.password.trim());
      formData.append('role', form.role);

      if (form.departmentId) formData.append('departmentId', form.departmentId);
      if (form.currentJobRoleId) formData.append('currentJobRoleId', form.currentJobRoleId);
      if (form.targetJobRoleId) formData.append('targetJobRoleId', form.targetJobRoleId);
      if (form.hireDate) formData.append('hireDate', form.hireDate);
      formData.append('mentorOptIn', form.mentorOptIn);
      formData.append('mentorAvailabilityHrsPerWeek', form.mentorAvailabilityHrsPerWeek || 0);

      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      await employeeManagementApi.provisionEmployee(formData);

      setSuccessMsg(`Employee account for '${form.firstName} ${form.lastName}' successfully provisioned!`);
      setIsCreateModalOpen(false);

      // Reset form
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        departmentId: user?.department?.id || user?.departmentId || '',
        currentJobRoleId: '',
        targetJobRoleId: '',
        hireDate: new Date().toISOString().split('T')[0],
        mentorOptIn: false,
        mentorAvailabilityHrsPerWeek: 0,
      });
      setResumeFile(null);

      loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to provision employee account');
    } finally {
      setSubmitting(false);
    }
  };

  const [viewingId, setViewingId] = useState(null);

  const handleViewResume = async (emp) => {
    setViewingId(emp.id);
    setError(null);
    try {
      await employeeManagementApi.viewResume(emp.id);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to view resume file');
    } finally {
      setViewingId(null);
    }
  };

  const handleDownloadResume = async (emp) => {
    setDownloadingId(emp.id);
    setError(null);
    try {
      const filename = emp.resumeFileName || `${emp.firstName}_${emp.lastName}_Resume.pdf`;
      await employeeManagementApi.downloadResume(emp.id, filename);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to download resume file');
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchQuery === '' ||
        emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.currentJobRoleTitle?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;

      const matchesResume =
        resumeFilter === 'ALL' ||
        (resumeFilter === 'WITH_RESUME' && emp.hasResume) ||
        (resumeFilter === 'WITHOUT_RESUME' && !emp.hasResume);

      return matchesSearch && matchesRole && matchesResume;
    });
  }, [employees, searchQuery, roleFilter, resumeFilter]);

  const totalEmployees = employees.length;
  const employeesWithResume = employees.filter((e) => e.hasResume).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header & Provision Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(6, 182, 212, 0.25))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: 'var(--accent-primary)',
              }}
            >
              <Users size={20} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Employee Directory &amp; Provisioning</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '750px' }}>
            Manager Workspace: Provision new employee accounts for the organization, attach candidate resumes, and govern team profiles.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
            boxShadow: 'var(--shadow-glow)',
            cursor: 'pointer',
          }}
        >
          <UserPlus size={18} />
          <span>Provision New Employee</span>
        </button>
      </div>

      {/* Policy Banner: Deactivation restriction statement */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            flexShrink: 0,
          }}
        >
          <Info size={18} />
        </div>
        <div style={{ fontSize: '0.86rem', lineHeight: '1.4' }}>
          <strong style={{ color: '#fff' }}>Manager Account Governance Policy: </strong>
          <span style={{ color: 'var(--text-secondary)' }}>
            Managers are granted organizational authority to onboard team members and upload candidate resumes.
            Per security guidelines, employee accounts remain active upon provisioning, and account deactivation is restricted.
          </span>
        </div>
      </div>

      {/* Status Alerts */}
      {error && <ErrorAlert message={error} />}

      {successMsg && (
        <div
          style={{
            padding: '0.9rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#34d399',
            fontSize: '0.9rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-primary)',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Employees
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalEmployees}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-secondary)',
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resumes Archived
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{employeesWithResume}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-success)',
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Governance
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>100%</div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div className="modern-search-wrapper">
            <Search size={18} className="modern-search-icon" />
            <input
              type="text"
              className="modern-search-input"
              placeholder="Search by employee name, email, department, or job role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="modern-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
              style={{
                padding: '0.55rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="EMPLOYEE">Employees</option>
              <option value="MENTOR">Mentors</option>
              <option value="MANAGER">Managers</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Resume:</span>
            <select
              value={resumeFilter}
              onChange={(e) => setResumeFilter(e.target.value)}
              className="input"
              style={{
                padding: '0.55rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <option value="ALL">All</option>
              <option value="WITH_RESUME">With Resume</option>
              <option value="WITHOUT_RESUME">Without Resume</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Department Roster ({filteredEmployees.length})
        </h3>

        {loading ? (
          <LoadingSkeleton height="280px" lines={1} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Member</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Current Role</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Hire Date</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Resume</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No employees matching the criteria found.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isDownloading = downloadingId === emp.id;
                    return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {/* Member Name & Email */}
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(6, 182, 212, 0.4))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: '#fff',
                              }}
                            >
                              {emp.firstName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.fullName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span className={`badge badge-${emp.role?.toLowerCase()}`}>{emp.role}</span>
                        </td>

                        {/* Department */}
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>
                          {emp.departmentName || '—'}
                        </td>

                        {/* Current Job Role */}
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-primary)' }}>
                          {emp.currentJobRoleTitle || '—'}
                        </td>

                        {/* Hire Date */}
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {emp.hireDate || '—'}
                        </td>

                        {/* Resume Attachment */}
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          {emp.hasResume ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                onClick={() => handleViewResume(emp)}
                                disabled={viewingId === emp.id}
                                title="View resume in new tab"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  padding: '0.35rem 0.6rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(99, 102, 241, 0.12)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  color: 'var(--accent-primary)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Eye size={13} />
                                <span>{viewingId === emp.id ? 'Opening...' : 'View'}</span>
                              </button>
                              <button
                                onClick={() => handleDownloadResume(emp)}
                                disabled={isDownloading}
                                title="Download uploaded resume file"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(6, 182, 212, 0.15)',
                                  border: '1px solid rgba(6, 182, 212, 0.35)',
                                  color: 'var(--accent-secondary)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                <Download size={13} />
                                <span>{isDownloading ? 'Downloading...' : 'Resume'}</span>
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No file</span>
                          )}
                        </td>

                        {/* Account Status: Active (NO deactivate action) */}
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              color: '#34d399',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                            ACTIVE
                          </span>
                        </td>

                        {/* Details View */}
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Provision New Employee Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Employee & Talent Profile"
        maxWidth="750px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Personal Credentials */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} />
              <span>Personal Identity &amp; System Credentials</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patel"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="maya.patel@orgkgi.dev"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', fontWeight: 600 }}
                  >
                    Generate Strong
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Organizational Placement */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-secondary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Briefcase size={15} />
              <span>Role &amp; Organizational Department</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  System Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="EMPLOYEE">EMPLOYEE (Standard Member)</option>
                  <option value="MENTOR">MENTOR (Peer Guide)</option>
                  <option value="MANAGER">MANAGER (Department Lead)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Department
                </label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value, currentJobRoleId: '', targetJobRoleId: '' })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Current Job Role
                </label>
                <select
                  value={form.currentJobRoleId}
                  onChange={(e) => setForm({ ...form, currentJobRoleId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">-- Select Job Role --</option>
                  {availableJobRoles.map((jr) => (
                    <option key={jr.id} value={jr.id}>
                      {jr.title} ({jr.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Target Career Role (Optional)
                </label>
                <select
                  value={form.targetJobRoleId}
                  onChange={(e) => setForm({ ...form, targetJobRoleId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">-- No Target Role --</option>
                  {availableJobRoles.map((jr) => (
                    <option key={jr.id} value={jr.id}>
                      {jr.title} ({jr.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Hire Date
                </label>
                <input
                  type="date"
                  value={form.hireDate}
                  onChange={(e) => setForm({ ...form, hireDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Candidate Resume Upload */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={15} />
              <span>Candidate Resume / CV Attachment</span>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: dragActive ? '#eef2ff' : '#f8fafc',
                transition: 'all var(--transition-fast)',
              }}
            >
              {resumeFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <FileText size={28} color="var(--accent-secondary)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{resumeFile.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(resumeFile.size / 1024).toFixed(1)} KB • Ready for upload
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    style={{
                      padding: '0.35rem',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.15)',
                      color: 'var(--accent-danger)',
                      cursor: 'pointer',
                      marginLeft: '1rem',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div>
                  <UploadCloud size={32} color="var(--accent-primary)" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                    Drag &amp; drop resume file here, or browse
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                    Supports PDF, DOC, DOCX, TXT up to 10MB
                  </div>
                  <label
                    style={{
                      display: 'inline-block',
                      padding: '0.5rem 1.1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Select File
                    <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitting}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
                boxShadow: 'var(--shadow-glow)',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <UserPlus size={16} />
              <span>{submitting ? 'Provisioning Account...' : 'Complete Provisioning'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Employee Quick View Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => setSelectedEmployee(null)}
          title={`Employee Profile — ${selectedEmployee.fullName}`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: '#fff',
                }}
              >
                {selectedEmployee.firstName?.charAt(0) || 'U'}
              </div>
              <div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedEmployee.fullName}</h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedEmployee.email}</div>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className={`badge badge-${selectedEmployee.role?.toLowerCase()}`}>{selectedEmployee.role}</span>
                  <span
                    style={{
                      marginLeft: '0.5rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: '#34d399',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    ● ACTIVE
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedEmployee.departmentName || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Job Role</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedEmployee.currentJobRoleTitle || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hire Date</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedEmployee.hireDate || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Manager</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedEmployee.managerFullName || 'Direct Department Lead'}</div>
              </div>
            </div>

            {/* Resume Section */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Archived Candidate Resume
              </div>
              {selectedEmployee.hasResume ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <FileText size={20} color="var(--accent-secondary)" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedEmployee.resumeFileName || 'Resume Document'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified candidate archive</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleViewResume(selectedEmployee)}
                      disabled={viewingId === selectedEmployee.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid var(--accent-primary)',
                        color: 'var(--accent-primary)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Eye size={14} />
                      <span>{viewingId === selectedEmployee.id ? 'Opening...' : 'View Resume'}</span>
                    </button>
                    <button
                      onClick={() => handleDownloadResume(selectedEmployee)}
                      disabled={downloadingId === selectedEmployee.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.45rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--accent-secondary)',
                        color: '#000',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Download size={14} />
                      <span>{downloadingId === selectedEmployee.id ? 'Downloading...' : 'Download Resume'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No candidate resume file was uploaded during provisioning.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                onClick={() => setSelectedEmployee(null)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeManagementPage;
