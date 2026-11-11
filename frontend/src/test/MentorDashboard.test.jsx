import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import MentorDashboard from '../pages/mentor/MentorDashboard';
import { authApi } from '../api/authApi';
import { mentorshipApi } from '../api/mentorshipApi';
import { learningPathApi } from '../api/learningPathApi';
import { skillGapApi } from '../api/skillGapApi';
import { assessmentApi } from '../api/assessmentApi';

vi.mock('../api/authApi', () => ({
  authApi: {
    getEmployeeProfile: vi.fn(),
    updateEmployeeProfile: vi.fn(),
  },
}));

vi.mock('../api/mentorshipApi', () => ({
  mentorshipApi: {
    getAssignments: vi.fn(),
  },
}));

vi.mock('../api/learningPathApi', () => ({
  learningPathApi: {
    getEmployeeActivePath: vi.fn(),
  },
}));

vi.mock('../api/skillGapApi', () => ({
  skillGapApi: {
    getEmployeeSkillGaps: vi.fn(),
  },
}));

vi.mock('../api/assessmentApi', () => ({
  assessmentApi: {
    getEmployeeHistory: vi.fn(),
  },
}));

const mockMentorContext = {
  user: {
    id: 6,
    userId: 6,
    fullName: 'Alex Vance',
    email: 'mentor.alex@orgkgi.dev',
    role: 'MENTOR',
    department: { id: 1, name: 'Engineering', code: 'ENG' },
  },
  token: 'mock-mentor-jwt',
  isAuthenticated: true,
  isLoading: false,
  isMentor: true,
  isAdmin: false,
  isManager: false,
  isEmployee: false,
};

describe('MentorDashboard Component Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    authApi.getEmployeeProfile.mockResolvedValue({
      success: true,
      data: {
        id: 4,
        userId: 6,
        userFullName: 'Alex Vance',
        userEmail: 'mentor.alex@orgkgi.dev',
        currentJobRoleTitle: 'Senior Software Engineer',
        mentorOptIn: true,
        mentorAvailabilityHrsPerWeek: 10,
        currentMenteeCount: 1,
        maxMentees: 1,
        skills: [
          { skillName: 'Java', proficiencyLevel: 5, verified: true },
          { skillName: 'Spring Boot Framework', proficiencyLevel: 5, verified: true },
          { skillName: 'Microservices Architecture', proficiencyLevel: 5, verified: true },
        ],
      },
    });

    mentorshipApi.getAssignments.mockResolvedValue({
      success: true,
      data: [
        {
          id: 2,
          menteeProfileId: 1,
          menteeUserId: 4,
          menteeFullName: 'David Kim',
          menteeEmail: 'david.junior@orgkgi.dev',
          skillId: 2,
          skillName: 'Spring Boot Framework',
          status: 'ACTIVE',
          assignedAt: '2026-03-20T10:00:00Z',
          notes: 'Dedicated mentoring on backend Spring Boot, microservices architecture, and enterprise APIs',
        },
      ],
    });

    learningPathApi.getEmployeeActivePath.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        targetRoleName: 'Senior Software Engineer',
        overallProgressPercentage: 35.0,
        status: 'IN_PROGRESS',
        courses: [
          {
            courseId: 2,
            courseTitle: 'Spring Boot Microservices in Practice',
            provider: 'Enterprise Academy',
            durationHours: 30,
            targetProficiencyGain: 2,
            status: 'IN_PROGRESS',
            progressPercentage: 50,
          },
        ],
      },
    });

    skillGapApi.getEmployeeSkillGaps.mockResolvedValue({
      success: true,
      data: {
        targetJobRoleTitle: 'Senior Software Engineer',
        overallReadinessPercentage: 65,
        gaps: [
          {
            skillName: 'Spring Boot Framework',
            currentProficiency: 2,
            requiredProficiency: 4,
            gap: 2,
          },
        ],
      },
    });

    assessmentApi.getEmployeeHistory.mockResolvedValue({
      success: true,
      data: [
        {
          id: 1,
          assessmentTitle: 'Spring Boot Core Competency Assessment',
          skillName: 'Spring Boot Framework',
          scorePercentage: 80,
          passed: true,
        },
      ],
    });
  });

  it('renders mentor dashboard with metrics, mentor profile, and assigned mentee', async () => {
    render(
      <AuthContext.Provider value={mockMentorContext}>
        <MemoryRouter>
          <MentorDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Mentor Intelligence Hub')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Mentor Advisory & Talent Hub')).toBeInTheDocument();
      expect(screen.getByText('Active Mentees')).toBeInTheDocument();
      expect(screen.getByText('Weekly Availability')).toBeInTheDocument();
      expect(screen.getByText('Verified Expertise')).toBeInTheDocument();
      expect(screen.getByText('Mentor Competency Profile')).toBeInTheDocument();

      // Check verified skills are displayed
      expect(screen.getAllByText('Spring Boot Framework').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Microservices Architecture')).toBeInTheDocument();

      // Check assigned mentee is rendered
      expect(screen.getAllByText('David Kim').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('david.junior@orgkgi.dev')).toBeInTheDocument();
    });
  });

  it('inspects assigned mentee learning pathway progress and milestones', async () => {
    render(
      <AuthContext.Provider value={mockMentorContext}>
        <MemoryRouter>
          <MentorDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('David Kim').length).toBeGreaterThanOrEqual(1);
    });

    // Verify learning pathway tab is active and shows mentee course progress
    await waitFor(() => {
      expect(screen.getByText('Spring Boot Microservices in Practice')).toBeInTheDocument();
      expect(screen.getByText(/35%/)).toBeInTheDocument();
      expect(screen.getByText(/IN_PROGRESS \(50%\)/)).toBeInTheDocument();
    });
  });

  it('switches to Skill Gap Radar tab and displays mentee deficits', async () => {
    render(
      <AuthContext.Provider value={mockMentorContext}>
        <MemoryRouter>
          <MentorDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Skill Gap Radar')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Skill Gap Radar'));

    await waitFor(() => {
      expect(screen.getByText('Target Role Competency Deficits')).toBeInTheDocument();
      expect(screen.getByText(/Gap: -2/)).toBeInTheDocument();
    });
  });

  it('switches to Quiz History tab and displays mentee assessment attempts', async () => {
    render(
      <AuthContext.Provider value={mockMentorContext}>
        <MemoryRouter>
          <MentorDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Quiz History')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Quiz History'));

    await waitFor(() => {
      expect(screen.getByText('Spring Boot Core Competency Assessment')).toBeInTheDocument();
      expect(screen.getByText('PASSED')).toBeInTheDocument();
    });
  });

  it('allows mentor to update availability hours and opt-in preferences via modal', async () => {
    authApi.updateEmployeeProfile.mockResolvedValueOnce({
      success: true,
      data: {
        id: 4,
        userId: 6,
        mentorOptIn: true,
        mentorAvailabilityHrsPerWeek: 15,
        currentMenteeCount: 1,
        maxMentees: 1,
        skills: [],
      },
    });

    render(
      <AuthContext.Provider value={mockMentorContext}>
        <MemoryRouter>
          <MentorDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Availability & Preferences')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Availability & Preferences'));

    expect(screen.getByText('Mentor Availability & Advisory Settings')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save Preferences/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authApi.updateEmployeeProfile).toHaveBeenCalledWith({
        mentorOptIn: true,
        mentorAvailabilityHrsPerWeek: 10,
      });
      expect(screen.getByText(/Mentorship availability and capacity settings updated successfully!/i)).toBeInTheDocument();
    });
  });
});
