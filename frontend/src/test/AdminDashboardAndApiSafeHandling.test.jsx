import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { extractArray, extractTotalCount } from '../utils/apiUtils';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { adminApi } from '../api/adminApi';
import { courseApi } from '../api/courseApi';
import { assessmentApi } from '../api/assessmentApi';

// Mock API modules
vi.mock('../api/adminApi', () => ({
  adminApi: {
    getAllUsers: vi.fn(),
    updateUserStatus: vi.fn(),
  },
}));

vi.mock('../api/courseApi', () => ({
  courseApi: {
    getAllCourses: vi.fn(),
  },
}));

vi.mock('../api/assessmentApi', () => ({
  assessmentApi: {
    getAllAssessments: vi.fn(),
  },
}));

describe('apiUtils: extractArray & extractTotalCount unit tests', () => {
  it('extracts direct arrays', () => {
    const list = [{ id: 1 }, { id: 2 }];
    expect(extractArray(list)).toEqual(list);
  });

  it('extracts arrays from standard { data: [...] } responses', () => {
    const res = { success: true, data: [{ id: 1 }, { id: 2 }] };
    expect(extractArray(res)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('extracts arrays from Spring Boot PagedResponse { data: { content: [...] } }', () => {
    const res = {
      success: true,
      message: 'Users retrieved',
      data: {
        content: [{ id: 1, role: 'ADMIN' }, { id: 2, role: 'EMPLOYEE' }],
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
        last: true,
      },
    };
    expect(extractArray(res)).toEqual([{ id: 1, role: 'ADMIN' }, { id: 2, role: 'EMPLOYEE' }]);
    expect(extractTotalCount(res)).toBe(2);
  });

  it('extracts arrays from direct { content: [...] }', () => {
    const res = {
      content: [{ id: 10 }],
      totalElements: 1,
    };
    expect(extractArray(res)).toEqual([{ id: 10 }]);
    expect(extractTotalCount(res)).toBe(1);
  });

  it('safely returns empty array for null, undefined, primitives, and non-array objects', () => {
    expect(extractArray(null)).toEqual([]);
    expect(extractArray(undefined)).toEqual([]);
    expect(extractArray(42)).toEqual([]);
    expect(extractArray('string')).toEqual([]);
    expect(extractArray({})).toEqual([]);
    expect(extractArray({ data: null })).toEqual([]);
    expect(extractArray({ data: { message: 'Unexpected' } })).toEqual([]);
    expect(extractArray({ data: 123 })).toEqual([]);
  });
});

describe('AdminDashboard Safe Handling Tests (Regressing users.reduce error)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when backend returns Spring Boot PagedResponse shape', async () => {
    adminApi.getAllUsers.mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: 1, email: 'admin@org.com', role: 'ADMIN', departmentName: 'Executive' },
          { id: 2, email: 'manager@org.com', role: 'MANAGER', departmentName: 'Engineering' },
          { id: 3, email: 'dev@org.com', role: 'EMPLOYEE', departmentName: 'Engineering' },
        ],
        page: 0,
        size: 10,
        totalElements: 3,
        totalPages: 1,
        last: true,
      },
    });

    courseApi.getAllCourses.mockResolvedValue({
      success: true,
      data: [{ id: 101, title: 'Cloud Architecture' }],
    });

    assessmentApi.getAllAssessments.mockResolvedValue({
      success: true,
      data: [{ id: 201, title: 'AWS Solutions' }],
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Verify header and metrics load without throwing users.reduce is not a function
    await waitFor(() => {
      expect(screen.getByText('Platform Administration & Governance')).toBeInTheDocument();
    });

    // Check user stats rendered
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getAllByText('Overall Organisation Improvement').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Team-Wise Improvement').length).toBeGreaterThan(0);

    // Verify System User Directory table is removed from Platform Metrics (managed exclusively in dedicated /admin/users)
    expect(screen.queryByText(/System User Directory/i)).not.toBeInTheDocument();
  });

  it('never crashes when API returns empty object or unexpected response format', async () => {
    // This previously caused: AdminDashboard.jsx:66 Uncaught TypeError: users.reduce is not a function
    adminApi.getAllUsers.mockResolvedValue({
      success: true,
      data: {}, // Unexpected empty object shape!
    });

    courseApi.getAllCourses.mockResolvedValue({
      success: true,
      data: null,
    });

    assessmentApi.getAllAssessments.mockResolvedValue({
      success: true,
      data: undefined,
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    // Verify dashboard renders cleanly without crashing
    await waitFor(() => {
      expect(screen.getByText('Platform Administration & Governance')).toBeInTheDocument();
    });

    // Verify 0 values are computed safely
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('renders ErrorAlert with retry when API call fails', async () => {
    adminApi.getAllUsers.mockRejectedValue(new Error('Network error connecting to backend'));
    courseApi.getAllCourses.mockResolvedValue({ success: true, data: [] });
    assessmentApi.getAllAssessments.mockResolvedValue({ success: true, data: [] });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Platform Administration & Governance')).toBeInTheDocument();
    });

    // Verify the error alert is present and can be retried
    expect(screen.getByText(/Failed to load admin metrics|Network error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});

describe('UserManagementPage Safe Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user list when backend returns PagedResponse shape', async () => {
    adminApi.getAllUsers.mockResolvedValue({
      success: true,
      data: {
        content: [
          {
            id: 1,
            email: 'admin@org.com',
            fullName: 'Admin User',
            role: 'ADMIN',
            departmentName: 'Engineering',
            status: 'ACTIVE',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        totalElements: 1,
      },
    });

    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User Directory & RBAC Governance')).toBeInTheDocument();
    });

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@org.com')).toBeInTheDocument();
  });

  it('renders empty table gracefully if API returns unexpected object shape', async () => {
    adminApi.getAllUsers.mockResolvedValue({
      success: true,
      data: { unexpected: true },
    });

    render(
      <BrowserRouter>
        <UserManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User Directory & RBAC Governance')).toBeInTheDocument();
    });

    expect(screen.getByText('No user accounts found.')).toBeInTheDocument();
  });
});
