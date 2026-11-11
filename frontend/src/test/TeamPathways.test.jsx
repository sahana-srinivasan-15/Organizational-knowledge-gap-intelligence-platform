import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import TeamPathwaysPage from '../pages/manager/TeamPathwaysPage';
import employeeManagementApi from '../api/employeeManagementApi';
import adminApi from '../api/adminApi';
import learningPathApi from '../api/learningPathApi';

vi.mock('../api/employeeManagementApi');
vi.mock('../api/adminApi');
vi.mock('../api/learningPathApi');

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

const mockTeam = [
  {
    id: 10,
    employeeProfileId: 10,
    fullName: 'David Junior',
    email: 'david.junior@orgkgi.dev',
    role: 'EMPLOYEE',
    departmentName: 'Engineering',
    currentJobRoleTitle: 'Junior Software Engineer',
  },
  {
    id: 11,
    employeeProfileId: 11,
    fullName: 'Maya Patel',
    email: 'maya.patel@orgkgi.dev',
    role: 'EMPLOYEE',
    departmentName: 'Engineering',
    currentJobRoleTitle: 'Backend Engineer',
  },
];

describe('TeamPathwaysPage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders team learning pathways for MANAGER using employeeManagementApi without calling adminApi', async () => {
    employeeManagementApi.getEmployees.mockResolvedValue({
      data: { content: mockTeam },
    });

    learningPathApi.getEmployeeActivePath.mockImplementation((profileId) => {
      if (profileId === 10) {
        return Promise.resolve({
          data: {
            id: 101,
            title: 'Backend Mastery Pathway',
            overallProgressPercentage: 65,
            completedCourses: 2,
            totalCourses: 3,
            courses: [
              { id: 1, courseTitle: 'Java Core', progressPercentage: 100, status: 'COMPLETED' },
              { id: 2, courseTitle: 'Spring Boot Microservices', progressPercentage: 100, status: 'COMPLETED' },
              { id: 3, courseTitle: 'Kubernetes', progressPercentage: 0, status: 'IN_PROGRESS' },
            ],
          },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <AuthContext.Provider value={mockManagerContext}>
        <MemoryRouter>
          <TeamPathwaysPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for data to load
    expect(await screen.findByText('David Junior')).toBeInTheDocument();

    // Verify Title & Department
    expect(screen.getByRole('heading', { level: 2, name: /Team Learning Pathways Overview/i })).toBeInTheDocument();

    // Verify employeeManagementApi was called and adminApi was NOT called
    expect(employeeManagementApi.getEmployees).toHaveBeenCalled();
    expect(adminApi.getAllUsers).not.toHaveBeenCalled();

    // Verify member names are displayed
    expect(screen.getByText('Maya Patel')).toBeInTheDocument();

    // David has active roadmap (65% shown in card and in stats)
    expect(screen.getAllByText('65%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Java Core')).toBeInTheDocument();

    // Maya has no active pathway, so "Generate Pathway" CTA button is visible
    expect(screen.getByText('Generate Pathway')).toBeInTheDocument();
  });

  it('allows manager to generate a learning pathway for an employee needing one', async () => {
    employeeManagementApi.getEmployees.mockResolvedValue({
      data: { content: mockTeam },
    });

    learningPathApi.getEmployeeActivePath.mockRejectedValue(new Error('Not found'));
    learningPathApi.generateEmployeePath.mockResolvedValue({
      data: {
        id: 202,
        title: 'New Pathway',
        overallProgressPercentage: 0,
        completedCourses: 0,
        totalCourses: 2,
        courses: [
          { id: 5, courseTitle: 'Distributed Systems', progressPercentage: 0, status: 'NOT_STARTED' },
        ],
      },
    });

    render(
      <AuthContext.Provider value={mockManagerContext}>
        <MemoryRouter>
          <TeamPathwaysPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Wait for data to load
    expect(await screen.findByText('David Junior')).toBeInTheDocument();

    expect(screen.getByRole('heading', { level: 2, name: /Team Learning Pathways Overview/i })).toBeInTheDocument();

    const generateButtons = screen.getAllByText('Generate Pathway');
    expect(generateButtons.length).toBeGreaterThan(0);

    fireEvent.click(generateButtons[0]);

    await waitFor(() => {
      expect(learningPathApi.generateEmployeePath).toHaveBeenCalledWith(10);
    });

    // After generating, the new pathway appears
    expect(await screen.findByText('Distributed Systems')).toBeInTheDocument();
  });

  it('filters team members using the modern search box', async () => {
    employeeManagementApi.getEmployees.mockResolvedValue({
      data: { content: mockTeam },
    });

    learningPathApi.getEmployeeActivePath.mockRejectedValue(new Error('Not found'));

    render(
      <AuthContext.Provider value={mockManagerContext}>
        <MemoryRouter>
          <TeamPathwaysPage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(await screen.findByText('David Junior')).toBeInTheDocument();
    expect(screen.getByText('Maya Patel')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by employee name/i);
    fireEvent.change(searchInput, { target: { value: 'David' } });

    expect(screen.getByText('David Junior')).toBeInTheDocument();
    expect(screen.queryByText('Maya Patel')).not.toBeInTheDocument();
  });
});
