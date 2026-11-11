import React, { useState, useEffect, useMemo, useContext } from 'react';
import { adminApi } from '../../api/adminApi';
import { AuthContext } from '../../context/AuthContext';
import { extractArray } from '../../utils/apiUtils';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import ErrorAlert from '../../components/common/ErrorAlert';
import Modal from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Building,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react';

export const UserManagementPage = () => {
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user || null;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Delete modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Create User modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    departmentId: 1,
  });
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAllUsers();
      setUsers(extractArray(res));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (user) => {
    setTogglingId(user.id);
    setError(null);
    setSuccessMsg(null);
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminApi.updateUserStatus(user.id, newStatus);
      setSuccessMsg(`User '${user.fullName}' status updated to ${newStatus}.`);
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update user status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!targetUser) return;
    setDeletingId(targetUser.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await adminApi.deleteUser(targetUser.id);
      setSuccessMsg(`User account '${targetUser.fullName}' (${targetUser.email}) successfully deleted.`);
      setDeleteConfirmUser(null);
      await loadUsers();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete user account');
    } finally {
      setDeletingId(null);
    }
  };

  const uniqueUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    const seenIds = new Set();
    const seenEmails = new Set();
    const result = [];
    for (const u of list) {
      if (!u || !u.id) continue;
      const email = (u.email || '').toLowerCase().trim();
      if (!seenIds.has(u.id) && (!email || !seenEmails.has(email))) {
        seenIds.add(u.id);
        if (email) seenEmails.add(email);
        result.push(u);
      }
    }
    return result;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const list = uniqueUsers;
    return list.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.fullName && u.fullName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.department?.name && u.department.name.toLowerCase().includes(q)) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });
  }, [uniqueUsers, roleFilter, searchQuery]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await adminApi.createUser({
        fullName: createForm.fullName,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        departmentId: parseInt(createForm.departmentId, 10),
      });

      setSuccessMsg(`Account for '${createForm.fullName}' successfully provisioned!`);
      setIsModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        departmentId: 1,
      });
      loadUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            User Directory &amp; RBAC Governance
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Provision organizational accounts, assign strict authentication roles, and control access statuses.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <UserPlus size={16} />
          <span>Provision New User</span>
        </button>
      </div>

      {error && <ErrorAlert message={error} />}

      {successMsg && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
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

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              Registered Accounts ({filteredUsers.length} of {uniqueUsers.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Filter, toggle access, or permanently delete user profiles
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search name, email, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  backgroundColor: '#ffffff',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MENTOR">MENTOR</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton height="250px" lines={1} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Full Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Department</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isToggling = togglingId === u.id;
                    const isDeleting = deletingId === u.id;
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)' }}>#{u.id}</td>
                        <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600 }}>{u.fullName}</td>
                        <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span className={`badge badge-${u.role?.toLowerCase()}`}>{u.role}</span>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          {u.department
                            ? `${u.department.name} (${u.department.code || ''})`
                            : u.departmentName
                            ? u.departmentName
                            : '—'}
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem' }}>
                          <span style={{ color: u.status === 'ACTIVE' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isToggling || isDeleting}
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: 'var(--radius-sm)',
                                background:
                                  u.status === 'ACTIVE'
                                    ? 'rgba(239, 68, 68, 0.12)'
                                    : 'rgba(16, 185, 129, 0.12)',
                                color: u.status === 'ACTIVE' ? '#f87171' : '#34d399',
                                border: `1px solid ${
                                  u.status === 'ACTIVE'
                                    ? 'rgba(239, 68, 68, 0.25)'
                                    : 'rgba(16, 185, 129, 0.25)'
                                }`,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                opacity: isToggling ? 0.6 : 1,
                                cursor: 'pointer',
                              }}
                            >
                              {isToggling
                                ? 'Updating...'
                                : u.status === 'ACTIVE'
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmUser(u)}
                              disabled={isSelf || isDeleting}
                              title={isSelf ? 'Cannot delete current logged-in account' : 'Delete user account'}
                              style={{
                                padding: '0.35rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239, 68, 68, 0.12)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                opacity: isSelf || isDeleting ? 0.4 : 1,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Trash2 size={13} />
                              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                            </button>
                          </div>
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

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmUser)}
        onClose={() => setDeleteConfirmUser(null)}
        title="Confirm User Account Deletion"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={28} color="#dc2626" />
            <div>
              <h4 style={{ margin: 0, color: '#991b1b', fontSize: '0.95rem', fontWeight: 700 }}>
                Permanent Account Deletion
              </h4>
              <p style={{ margin: '0.2rem 0 0', color: '#b91c1c', fontSize: '0.82rem' }}>
                Are you sure you want to permanently delete account for <strong>{deleteConfirmUser?.fullName}</strong> ({deleteConfirmUser?.email})?
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            This will permanently remove their employee profile, skill assessments, learning paths, mentor records, and authentication credentials from the enterprise platform. This action cannot be reversed.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDeleteConfirmUser(null)}
              disabled={deletingId}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => handleDeleteUser(deleteConfirmUser)}
              disabled={deletingId}
              style={{
                background: '#dc2626',
                color: '#ffffff',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={15} />
              <span>{deletingId ? 'Deleting Account...' : 'Permanently Delete User'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New User Account">
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              placeholder="e.g. Morgan Stanley"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Corporate Email
            </label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="user@orgkgi.dev"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Initial Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="••••••••••••"
              style={{
                width: '100%',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Authentication Role
              </label>
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MENTOR">MENTOR</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Department
              </label>
              <select
                value={createForm.departmentId}
                onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                }}
              >
                <option value={1}>Engineering (ENG)</option>
                <option value={2}>Product &amp; Design (PROD)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                background: '#f1f5f9',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.85rem',
                border: '1px solid var(--border-medium)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '0.65rem 1.5rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                boxShadow: 'var(--shadow-glow)',
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
