import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MentorshipPage from '../pages/employee/MentorshipPage';
import MentorDashboard from '../pages/mentor/MentorDashboard';
import { authApi } from '../api/authApi';
import { mentorshipApi } from '../api/mentorshipApi';
import AuthContext from '../context/AuthContext';

vi.mock('../api/authApi', () => ({
  authApi: {
    getEmployeeProfile: vi.fn(),
    updateMentorStatus: vi.fn(),
    getMentorEligibility: vi.fn(),
    getMentorCourses: vi.fn(),
  },
}));

vi.mock('../api/mentorshipApi', () => ({
  mentorshipApi: {
    getOwnRecommendations: vi.fn(),
    createRecommendationAssignment: vi.fn(),
    getAssignments: vi.fn(),
  },
}));

const mockAuthContextValue = {
  user: {
    id: 4,
    email: 'david.junior@orgkgi.dev',
    fullName: 'David Kim',
    role: 'EMPLOYEE',
    activeRole: 'MENTOR',
    department: { id: 1, name: 'Core Platform Engineering' },
  },
  isMentor: true,
  isEmployee: false,
};

describe('Course-Specific Mentorship Qualification & Next Course Repeat Rule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders course-by-course mentor qualifications on MentorshipPage showing qualified vs pending courses', async () => {
    authApi.getEmployeeProfile.mockResolvedValueOnce({
      success: true,
      data: {
        id: 2,
        userId: 4,
        fullName: 'David Kim',
        mentorOptIn: true,
        mentorAvailabilityHrsPerWeek: 10,
        maxMenteesCapacity: 3,
      },
    });

    mentorshipApi.getOwnRecommendations.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    mentorshipApi.getAssignments.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    authApi.getMentorEligibility.mockResolvedValueOnce({
      success: true,
      data: {
        eligible: true,
        qualifiedCoursesCount: 1,
        pendingCoursesCount: 2,
        hasUploadedCertificate: true,
        certificateCount: 2,
        hasPassedAssessment: true,
        passedAssessmentsCount: 1,
        summaryMessage: 'You are qualified as a peer mentor for 1 course(s)!',
        criteria: [
          { key: 'CERTIFICATE_UPLOAD', title: 'Course Completion Certificate Uploaded', met: true },
          { key: 'DIAGNOSTIC_ASSESSMENT_PASSED', title: 'Diagnostic Assessment Passed', met: true },
        ],
        courseQualifications: [
          {
            courseId: 2,
            courseTitle: 'Distributed Systems Architecture & Design Patterns',
            courseProvider: 'Coursera',
            primarySkillName: 'Distributed Systems Architecture',
            certificateUploaded: true,
            certificateFileName: 'distributed_cert.pdf',
            quizAttended: true,
            quizPassed: true,
            quizScore: 100,
            isMentorQualified: true,
            qualificationStatus: 'QUALIFIED_MENTOR',
            guidanceMessage: 'Certificate verified, diagnostic quiz passed! You are authorized to mentor engineering peers for this course.',
          },
          {
            courseId: 13,
            courseTitle: 'System Design Interview – Step by Step Guide',
            courseProvider: 'YouTube Learning',
            primarySkillName: 'System Architecture',
            certificateUploaded: true,
            certificateFileName: 'sys_design_cert.pdf',
            quizAttended: false,
            quizPassed: false,
            isMentorQualified: false,
            qualificationStatus: 'PENDING_QUIZ',
            guidanceMessage: 'Certificate uploaded and verified. To complete mentor qualification for this course, attend and pass the course diagnostic assessment.',
          },
          {
            courseId: 4,
            courseTitle: 'PostgreSQL Database Performance Tuning & Indexing',
            courseProvider: 'Coursera',
            primarySkillName: 'PostgreSQL Database Tuning',
            certificateUploaded: false,
            quizAttended: false,
            quizPassed: false,
            isMentorQualified: false,
            qualificationStatus: 'NOT_STARTED',
            guidanceMessage: 'To qualify as a mentor for this next course, repeat the verification process: upload your completion certificate and attend & pass the diagnostic quiz.',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <MentorshipPage />
      </MemoryRouter>
    );

    // Verify Course-by-course heading and policy notice
    await waitFor(() => {
      expect(screen.getByText(/Course-by-Course Mentorship Qualifications/i)).toBeInTheDocument();
      expect(screen.getByText(/Mandatory Course Mentorship Policy/i)).toBeInTheDocument();
      expect(screen.getByText(/Distributed Systems Architecture & Design Patterns/i)).toBeInTheDocument();
      expect(screen.getByText(/System Design Interview – Step by Step Guide/i)).toBeInTheDocument();
      expect(screen.getByText(/PostgreSQL Database Performance Tuning & Indexing/i)).toBeInTheDocument();
    });

    // Verify qualification badges
    expect(screen.getByText('🏆 Qualified Course Mentor')).toBeInTheDocument();
    expect(screen.getAllByText('🔒 Not Qualified').length).toBeGreaterThanOrEqual(2);

    // Verify next course repetition callout
    expect(screen.getByText(/Want to mentor peers in another course\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Repeat this process for your next course/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explore Next Course on Roadmap/i })).toBeInTheDocument();
  });

  it('renders MentorDashboard with course mentorship qualifications and guidance to qualify for next course', async () => {
    authApi.getEmployeeProfile.mockResolvedValueOnce({
      success: true,
      data: {
        id: 2,
        userId: 4,
        fullName: 'David Kim',
        mentorOptIn: true,
        mentorAvailabilityHrsPerWeek: 10,
        maxMenteesCapacity: 3,
        currentMenteeCount: 1,
        skills: [{ skillName: 'Distributed Systems', proficiencyLevel: 4, verified: true }],
      },
    });

    mentorshipApi.getAssignments.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 101,
          menteeFullName: 'Maya Patel',
          mentorFullName: 'David Kim',
          skillName: 'Distributed Systems Architecture',
          status: 'APPROVED_BY_MANAGER',
          notes: 'Mentorship on Distributed Systems',
        },
      ],
    });

    authApi.getMentorCourses.mockResolvedValueOnce({
      success: true,
      data: [
        {
          courseId: 2,
          courseTitle: 'Distributed Systems Architecture & Design Patterns',
          courseProvider: 'Coursera',
          primarySkillName: 'Distributed Systems Architecture',
          certificateUploaded: true,
          certificateFileName: 'david_dist_cert.pdf',
          quizAttended: true,
          quizPassed: true,
          quizScore: 100,
          isMentorQualified: true,
          guidanceMessage: 'Certificate uploaded & verified, diagnostic assessment passed! You are authorized to mentor engineering peers for this course.',
        },
        {
          courseId: 4,
          courseTitle: 'PostgreSQL Database Performance Tuning & Indexing',
          courseProvider: 'Coursera',
          primarySkillName: 'PostgreSQL Database Tuning',
          certificateUploaded: false,
          quizAttended: false,
          quizPassed: false,
          isMentorQualified: false,
          guidanceMessage: 'To qualify as a mentor for this next course, repeat the verification process: upload your completion certificate and attend & pass the diagnostic quiz.',
        },
      ],
    });

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <MentorDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Verify course-specific qualifications section rendered on MentorDashboard
    await waitFor(() => {
      expect(screen.getByText('Course-Specific Mentorship Qualifications')).toBeInTheDocument();
      expect(screen.getByText(/🏆 1 Course\(s\) Mentor Certified/i)).toBeInTheDocument();
      expect(screen.getByText(/Mandatory Course Mentorship Policy/i)).toBeInTheDocument();
      expect(screen.getByText('Distributed Systems Architecture & Design Patterns')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL Database Performance Tuning & Indexing')).toBeInTheDocument();
    });

    // Verify repetition for next course action
    expect(screen.getByText(/Qualify to Mentor in Additional \/ Next Courses/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Qualify on Learning Roadmap/i })).toBeInTheDocument();
  });
});
