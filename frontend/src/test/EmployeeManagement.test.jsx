import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import EmployeeManagementPage from '../pages/manager/EmployeeManagementPage';
import employeeManagementApi from '../api/employeeManagementApi';

vi.mock('../api/employeeManagementApi');

const mockManagerContext = {
  user: {
    id: 2,
    fullName: 'Sarah Jenkins',
    email: 'manager.eng@orgkgi.dev',
    role: 'MANAGER',
    department: { id: 1, name: 'Engineering', code: 'ENG' },
  },
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  isManager: true,
  isAdmin: false,
  isEmployee: false,
  isMentor: false,
};

const mockEmployees = [
  {
    id: 10,
    firstName: 'Maya',
    lastName: 'Patel',
    fullName: 'Maya Patel',
    email: 'maya.patel@orgkgi.dev',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    departmentName: 'Engineering',
    currentJobRoleTitle: 'Junior Software Engineer',
    hireDate: '2026-10-28',
    hasResume: true,
    resumeFileName: 'maya_patel_cv.pdf',
  },
  {
    id: 11,
    firstName: 'Rohan',
    lastName: 'Gupta',
    fullName: 'Rohan Gupta',
    email: 'rohan.gupta@orgkgi.dev',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    departmentName: 'Engineering',
    currentJobRoleTitle: 'Senior Software Engineer',
    hireDate: '2026-10-20',
    hasResume: false,
    resumeFileName: null,
  },
];

const mockDepartments = [
  { id: 1, name: 'Engineering', code: 'ENG' },
  { id: 2, name: 'Data & AI', code: 'DAI' },
];

const mockJobRoles = [
  { id: 1, title: 'Senior Software Engineer', code: 'ROLE_SR_SWE', departmentId: 1, level: 'SENIOR' },
  { id: 2, title: 'Junior Software Engineer', code: 'ROLE_JR_SWE', departmentId: 1, level: 'JUNIOR' },
];

describe('EmployeeManagementPage (Manager Role)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    employeeManagementApi.getEmployees.mockResolvedValue({
      success: true,
      data: mockEmployees,
    });
    employeeManagementApi.getDepartments.mockResolvedValue({
      success: true,
      data: mockDepartments,
    });
    employeeManagementApi.getJobRoles.mockResolvedValue({
      success: true,
      data: mockJobRoles,
    });
  });

  const renderComponent = () =>
    render(
      <AuthContext.Provider value={mockManagerContext}>
        <MemoryRouter>
          <EmployeeManagementPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  it('renders employee directory with correct title, roster, and active badges', async () => {
    renderComponent();

    expect(await screen.findByText(/Employee Directory & Provisioning/i)).toBeInTheDocument();
    expect(screen.getByText('Maya Patel')).toBeInTheDocument();
    expect(screen.getByText('Rohan Gupta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument();

    // Verify Active status is displayed
    const activeBadges = screen.getAllByText(/ACTIVE/i);
    expect(activeBadges.length).toBeGreaterThan(0);
  });

  it('strictly ensures NO deactivate button is rendered for manager role', async () => {
    renderComponent();

    await screen.findByText('Maya Patel');

    // Manager role must not have deactivate buttons anywhere on the page
    expect(screen.queryByText(/^deactivate$/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^deactivate$/i })).not.toBeInTheDocument();
  });

  it('opens provisioning modal with employee details inputs and resume upload area', async () => {
    renderComponent();

    const provisionBtn = await screen.findByRole('button', { name: /Provision New Employee/i });
    fireEvent.click(provisionBtn);

    expect(screen.getByText(/Provision New Employee & Talent Profile/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Maya/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Patel/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/maya\.patel@orgkgi\.dev/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag & drop resume file here, or browse/i)).toBeInTheDocument();
    expect(screen.getByText(/Supports PDF, DOC, DOCX, TXT/i)).toBeInTheDocument();
  });

  it('calls downloadResume when clicking resume button', async () => {
    employeeManagementApi.downloadResume.mockResolvedValue({});
    renderComponent();

    const resumeBtn = await screen.findByRole('button', { name: /Resume/i });
    fireEvent.click(resumeBtn);

    expect(employeeManagementApi.downloadResume).toHaveBeenCalledWith(10, 'maya_patel_cv.pdf');
  });
});
