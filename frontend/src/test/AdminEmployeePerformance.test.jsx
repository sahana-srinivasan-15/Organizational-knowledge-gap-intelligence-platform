import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeePerformancePage from '../pages/admin/EmployeePerformancePage';
import { adminPerformanceApi } from '../api/adminPerformanceApi';

vi.mock('../api/adminPerformanceApi', () => ({
  adminPerformanceApi: {
    getOverview: vi.fn(),
    inquireManager: vi.fn(),
    acceptReason: vi.fn(),
    grantReward: vi.fn(),
    appreciatePersonnel: vi.fn(),
    terminateEmployee: vi.fn(),
  },
}));

vi.mock('../api/adminApi', () => ({
  adminApi: {
    getAllUsers: vi.fn().mockResolvedValue({
      data: {
        content: [],
      },
    }),
    deleteUser: vi.fn().mockResolvedValue({ status: 200 }),
  },
}));

const mockOverviewData = [
  {
    userId: 2,
    employeeProfileId: 2,
    fullName: 'David Kim',
    email: 'david.junior@orgkgi.dev',
    role: 'EMPLOYEE',
    departmentName: 'Core Engineering',
    currentJobRoleTitle: 'Junior Backend Engineer',
    targetJobRoleTitle: 'Senior Backend Engineer',
    managerFullName: 'Sarah Jenkins',
    managerEmail: 'manager.eng@orgkgi.dev',
    diagnosticTestScore: 85.0,
    readinessScorePercentage: 85.0,
    verifiedSkillsCount: 4,
    gapSkillsCount: 2,
    verifiedSkillNames: ['Java Programming (L3)', 'Spring Boot Framework (L3)'],
    criticalGaps: ['System Design & Architecture'],
    performanceTier: 'TOP_PERFORMER',
    escalationStatus: 'NONE',
    awardedBadges: [],
    appreciationMessages: [],
  },
  {
    userId: 3,
    employeeProfileId: null,
    fullName: 'Sarah Jenkins',
    email: 'manager.eng@orgkgi.dev',
    role: 'MANAGER',
    departmentName: 'Core Engineering',
    currentJobRoleTitle: 'Engineering Manager',
    targetJobRoleTitle: 'Director of Engineering',
    managerFullName: 'Executive Leadership',
    managerEmail: 'admin@orgkgi.dev',
    diagnosticTestScore: 96.0,
    readinessScorePercentage: 94.2,
    verifiedSkillsCount: 5,
    gapSkillsCount: 0,
    verifiedSkillNames: ['Engineering Leadership (L4)', 'Team Gap Closure (84.6%)'],
    criticalGaps: [],
    performanceTier: 'TOP_PERFORMER',
    escalationStatus: 'NONE',
    awardedBadges: [],
    appreciationMessages: [],
  },
  {
    userId: 16,
    employeeProfileId: 16,
    fullName: 'Priya Raman',
    email: 'priya.raman@orgkgi.dev',
    role: 'EMPLOYEE',
    departmentName: 'Quality Engineering',
    currentJobRoleTitle: 'Associate Quality Engineer',
    targetJobRoleTitle: 'Senior SDET',
    managerFullName: 'Sarah Jenkins',
    managerEmail: 'manager.eng@orgkgi.dev',
    diagnosticTestScore: 35.0,
    readinessScorePercentage: 32.0,
    verifiedSkillsCount: 1,
    gapSkillsCount: 4,
    verifiedSkillNames: ['Manual QA Basics (L1)'],
    criticalGaps: ['Automated Test Frameworks', 'CI/CD Integration'],
    performanceTier: 'AT_RISK',
    escalationStatus: 'REASON_RECEIVED',
    inquiryReason: 'Missed mandatory diagnostic test cycle and low target readiness (32%)',
    managerExplanation: 'Employee was on approved emergency medical leave during the assessment cycle with HR documentation.',
    awardedBadges: [],
    appreciationMessages: [],
  },
];

describe('Admin Employee Performance, Rewards & Low Performer Escalation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminPerformanceApi.getOverview.mockResolvedValue({
      data: mockOverviewData,
    });
  });

  it('renders page header, summary counters, and 3 feature tabs', async () => {
    render(
      <BrowserRouter>
        <EmployeePerformancePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Employee Performance & Accountability')).toBeInTheDocument();
    });

    expect(screen.getByText('All Employee Performance')).toBeInTheDocument();
    expect(screen.getByText('Top Performers & Rewards')).toBeInTheDocument();
    expect(screen.getByText('Low Performers & Manager Accountability')).toBeInTheDocument();
  });

  it('displays all employees with readiness, test scores, and performance tiers', async () => {
    render(
      <BrowserRouter>
        <EmployeePerformancePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('David Kim')).toBeInTheDocument();
      expect(screen.getByText('Priya Raman')).toBeInTheDocument();
      expect(screen.getAllByText('85%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('35%').length).toBeGreaterThan(0);
    });

    // Ensure Actions column is removed from All Employee Performance table
    expect(screen.queryByText('Actions')).not.toBeInTheDocument();
  });

  it('allows granting corporate rewards to top performers', async () => {
    adminPerformanceApi.grantReward.mockResolvedValue({
      data: {
        status: 'SUCCESS',
        award: 'Spot Bonus ($1000)',
      },
    });

    render(
      <BrowserRouter>
        <EmployeePerformancePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('David Kim')).toBeInTheDocument();
    });

    // Switch to Top Performers tab
    fireEvent.click(screen.getByText('Top Performers & Rewards'));

    await waitFor(() => {
      expect(screen.getByText('Corporate Recognition & Reward Center')).toBeInTheDocument();
    });

    // Click Reward on David Kim
    const rewardButtons = screen.getAllByText('Grant Reward');
    fireEvent.click(rewardButtons[0]);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByText('Grant Award & Notify')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Grant Award & Notify'));

    await waitFor(() => {
      expect(adminPerformanceApi.grantReward).toHaveBeenCalledTimes(1);
    });
  });

  it('allows accepting valid reason for low performer with extension', async () => {
    adminPerformanceApi.acceptReason.mockResolvedValue({
      data: {
        userId: 16,
        escalationStatus: 'REASON_ACCEPTED',
        extensionDays: 30,
      },
    });

    render(
      <BrowserRouter>
        <EmployeePerformancePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('David Kim')).toBeInTheDocument();
    });

    // Switch to Low Performers tab
    fireEvent.click(screen.getByText('Low Performers & Manager Accountability'));

    await waitFor(() => {
      expect(screen.getByText('Priya Raman')).toBeInTheDocument();
      expect(screen.getByText('Accept Valid Reason')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept Valid Reason'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Acceptance & Extension')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm Acceptance & Extension'));

    await waitFor(() => {
      expect(adminPerformanceApi.acceptReason).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 16,
          extensionDays: 30,
        })
      );
    });
  });

  it('allows terminating low performer (firing) when requested', async () => {
    adminPerformanceApi.terminateEmployee.mockResolvedValue({
      data: 'USER_DELETED',
    });

    render(
      <BrowserRouter>
        <EmployeePerformancePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('David Kim')).toBeInTheDocument();
    });

    // Switch to Low Performers tab
    fireEvent.click(screen.getByText('Low Performers & Manager Accountability'));

    await waitFor(() => {
      expect(screen.getByText('Fire / Terminate Employee')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Fire / Terminate Employee'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Termination (Fire Employee)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Confirm Termination (Fire Employee)'));

    await waitFor(() => {
      expect(adminPerformanceApi.terminateEmployee).toHaveBeenCalledWith(16);
    });
  });
});
