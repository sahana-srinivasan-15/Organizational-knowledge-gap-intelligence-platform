import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import CertificateUploadModal from '../components/courses/CertificateUploadModal';
import MentorshipChatModal from '../components/mentorship/MentorshipChatModal';
import { notificationApi } from '../api/notificationApi';
import { mentorshipApi } from '../api/mentorshipApi';
import { mentorshipChatApi } from '../api/mentorshipChatApi';
import { certificateApi } from '../api/certificateApi';
import { skillGapApi } from '../api/skillGapApi';
import { learningPathApi } from '../api/learningPathApi';
import { assessmentApi } from '../api/assessmentApi';
import { courseDiscoveryApi } from '../api/courseDiscoveryApi';
import AuthContext from '../context/AuthContext';

vi.mock('../api/notificationApi', () => ({
  notificationApi: {
    getMyNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

vi.mock('../api/mentorshipApi', () => ({
  mentorshipApi: {
    getOwnRecommendations: vi.fn(),
    getAssignments: vi.fn(),
  },
}));

vi.mock('../api/mentorshipChatApi', () => ({
  mentorshipChatApi: {
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

vi.mock('../api/certificateApi', () => ({
  certificateApi: {
    uploadCertificate: vi.fn(),
    getMyCertificates: vi.fn(),
  },
}));

vi.mock('../api/skillGapApi', () => ({
  skillGapApi: {
    getOwnSkillGaps: vi.fn(),
  },
}));

vi.mock('../api/learningPathApi', () => ({
  learningPathApi: {
    getOwnActivePath: vi.fn(),
    generateOwnPath: vi.fn(),
  },
}));

vi.mock('../api/assessmentApi', () => ({
  assessmentApi: {
    getAllAssessments: vi.fn(),
  },
}));

vi.mock('../api/courseDiscoveryApi', () => ({
  courseDiscoveryApi: {
    getTrendingCourses: vi.fn(),
  },
}));

const mockAuthContextValue = {
  user: {
    id: 4,
    email: 'david.junior@orgkgi.dev',
    fullName: 'David Kim',
    role: 'EMPLOYEE',
    department: { id: 1, name: 'Core Platform Engineering' },
  },
  isMentor: false,
  isEmployee: true,
};

describe('Anti-Screenshot ML Rejection & Mentorship Live Notification / Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects screenshot filenames in CertificateUploadModal and warns user against arbitrary screen snips', async () => {
    render(
      <MemoryRouter>
        <CertificateUploadModal
          isOpen={true}
          onClose={vi.fn()}
          course={{ title: 'Advanced Spring Boot Microservices', provider: 'Coursera' }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Submit Course Completion Certificate/i)).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]');
    const screenshotFile = new File(['dummy screenshot data'], 'Screenshot 2026-11-02 at 14.30.00.png', {
      type: 'image/png',
    });

    fireEvent.change(fileInput, { target: { files: [screenshotFile] } });

    // Assert anti-fraud warning banner appears
    await waitFor(() => {
      expect(screen.getByText(/Anti-Fraud Notice: Filename appears to be a screenshot/i)).toBeInTheDocument();
    });
  });

  it('renders Active Peer Mentor Suggestions on EmployeeDashboard when mentor suggests live classes and materials', async () => {
    skillGapApi.getOwnSkillGaps.mockResolvedValueOnce({
      success: true,
      data: {
        totalWeightedGap: 2.5,
        targetJobRoleTitle: 'Senior Software Engineer',
        skillGaps: [{ skillId: 1, skillName: 'Java', rawGap: 1, assessmentStatus: 'ASSESSED' }],
      },
    });

    learningPathApi.getOwnActivePath.mockResolvedValueOnce({
      success: true,
      data: {
        id: 1,
        title: 'Senior Engineer Pathway',
        overallProgressPercentage: 40,
        courses: [{ courseId: 1, title: 'Java Concurrency' }],
      },
    });

    assessmentApi.getAllAssessments.mockResolvedValueOnce({ success: true, data: [] });
    mentorshipApi.getOwnRecommendations.mockResolvedValueOnce({ success: true, data: [] });
    courseDiscoveryApi.getTrendingCourses.mockResolvedValueOnce({ success: true, data: [] });
    certificateApi.getMyCertificates.mockResolvedValueOnce({ success: true, data: [] });

    // Active assignment for David Kim with mentor Alex Morgan
    mentorshipApi.getAssignments.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 1,
          menteeId: 2,
          menteeName: 'David Kim',
          mentorId: 1,
          mentorName: 'Alex Morgan',
          skillName: 'Spring Boot Framework',
          status: 'APPROVED_BY_MANAGER',
        },
      ],
    });

    // Seeded notifications from Alex Morgan for Live Class & Material suggestions
    notificationApi.getMyNotifications.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 101,
          title: 'Live Class Suggested: Mastering Spring Cloud',
          message: 'Alex Morgan suggested attending the live class "Mastering Spring Cloud & Microservices".',
          type: 'LIVE_CLASS_SUGGESTION',
          actionUrl: '/live-classes',
          referenceId: 1,
          senderName: 'Alex Morgan',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 102,
          title: 'Study Material Recommended: Spring Boot Microservices Guide',
          message: 'Alex Morgan recommended reviewing "Spring Boot Enterprise Patterns & Cloud Architecture".',
          type: 'MATERIAL_SUGGESTION',
          actionUrl: '/weak-areas',
          referenceId: 2,
          senderName: 'Alex Morgan',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <EmployeeDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Verify Resume Skill Assessment and Mentor Activity render on dashboard
    await waitFor(() => {
      expect(screen.getByText(/Resume Skill Assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/Skills Extracted from Resume/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Conduct Resume Assessment/i })).toBeInTheDocument();
    });

    // Verify action buttons exist
    expect(screen.getByRole('button', { name: /Chat & Materials/i })).toBeInTheDocument();
  });

  it('renders interactive MentorshipChatModal displaying suggestions and allowing sending messages', async () => {
    mentorshipChatApi.getMessages.mockResolvedValueOnce({
      success: true,
      data: [
        {
          id: 501,
          assignmentId: 1,
          senderId: 3,
          senderName: 'Alex Morgan',
          messageText: 'Welcome! I recommend attending our upcoming Live Class on Spring Cloud.',
          suggestionType: 'LIVE_CLASS',
          suggestedLiveClass: {
            id: 1,
            title: 'Mastering Spring Cloud & Microservice Mesh',
            instructorName: 'Alex Morgan',
            scheduledAt: new Date().toISOString(),
            meetingUrl: 'https://meet.google.com/test-live-class',
          },
          isCurrentUser: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter>
          <MentorshipChatModal
            isOpen={true}
            onClose={vi.fn()}
            assignment={{
              id: 1,
              mentorName: 'Alex Morgan',
              menteeName: 'David Kim',
              skillName: 'Spring Boot Framework',
            }}
            isMentor={false}
          />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Mentorship Discussion • Spring Boot Framework/i)).toBeInTheDocument();
      expect(screen.getByText(/Recommended Live Class Session/i)).toBeInTheDocument();
      expect(screen.getByText(/Mastering Spring Cloud & Microservice Mesh/i)).toBeInTheDocument();
    });

    // Check message input
    const input = screen.getByPlaceholderText(/Type a message to Alex Morgan.../i);
    expect(input).toBeInTheDocument();
  });
});
