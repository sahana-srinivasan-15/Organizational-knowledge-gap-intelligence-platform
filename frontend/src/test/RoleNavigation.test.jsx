import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Sidebar from '../components/common/Sidebar';

const renderSidebarWithRole = (role) => {
  const mockContext = {
    user: { id: 1, fullName: 'Test User', email: 'test@orgkgi.dev', role },
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    isAdmin: role === 'ADMIN',
    isManager: role === 'MANAGER',
    isEmployee: role === 'EMPLOYEE',
    isMentor: role === 'MENTOR',
  };

  return render(
    <AuthContext.Provider value={mockContext}>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Role Navigation Sidebar Tests', () => {
  it('renders employee-specific navigation links for EMPLOYEE role', () => {
    renderSidebarWithRole('EMPLOYEE');

    expect(screen.getByText('EMPLOYEE Workspace')).toBeInTheDocument();
    expect(screen.getByText('My Readiness')).toBeInTheDocument();
    expect(screen.getByText('Skill Gap Radar')).toBeInTheDocument();
    expect(screen.getByText('Recommended Courses')).toBeInTheDocument();
    expect(screen.getByText('Learning Roadmap')).toBeInTheDocument();
    expect(screen.getByText('My Certificates')).toBeInTheDocument();
    expect(screen.getByText('Peer Mentorship')).toBeInTheDocument();

    // Verify diagnostic quizzes and manager/admin links are NOT present
    expect(screen.queryByText('Diagnostic Quizzes')).not.toBeInTheDocument();
    expect(screen.queryByText('Department Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('User Directory & RBAC')).not.toBeInTheDocument();
  });

  it('renders manager-specific navigation links for MANAGER role', () => {
    renderSidebarWithRole('MANAGER');

    expect(screen.getByText('MANAGER Workspace')).toBeInTheDocument();
    expect(screen.getByText('Department Overview')).toBeInTheDocument();
    expect(screen.getByText('Team Skill Coverage')).toBeInTheDocument();
    expect(screen.getByText('Mentor Approvals')).toBeInTheDocument();
    expect(screen.getByText('Team Learning Paths')).toBeInTheDocument();

    // Verify employee-only and admin-only links are NOT present
    expect(screen.queryByText('Peer Mentorship')).not.toBeInTheDocument();
    expect(screen.queryByText('User Directory & RBAC')).not.toBeInTheDocument();
  });

  it('renders admin-specific navigation links for ADMIN role', () => {
    renderSidebarWithRole('ADMIN');

    expect(screen.getByText('ADMIN Workspace')).toBeInTheDocument();
    expect(screen.getByText('Platform Metrics')).toBeInTheDocument();
    expect(screen.getByText('Employee Performance')).toBeInTheDocument();
    expect(screen.getByText('User Directory & RBAC')).toBeInTheDocument();
    expect(screen.getByText('Course Catalogs')).toBeInTheDocument();

    // Verify employee-only and manager-only links are NOT present
    expect(screen.queryByText('Peer Mentorship')).not.toBeInTheDocument();
    expect(screen.queryByText('Mentor Approvals')).not.toBeInTheDocument();
  });

  it('renders mentor-specific navigation links for MENTOR role', () => {
    renderSidebarWithRole('MENTOR');

    expect(screen.getByText('MENTOR Workspace')).toBeInTheDocument();
    expect(screen.getByText('Mentor Hub')).toBeInTheDocument();
    expect(screen.getByText('Course Catalog')).toBeInTheDocument();
    expect(screen.queryByText('Diagnostic Quizzes')).not.toBeInTheDocument();

    // Verify manager/admin links are NOT present
    expect(screen.queryByText('Department Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('User Directory & RBAC')).not.toBeInTheDocument();
    expect(screen.queryByText('Mentor Approvals')).not.toBeInTheDocument();
  });
});
