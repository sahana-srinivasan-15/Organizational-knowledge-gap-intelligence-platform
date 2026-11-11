import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MyCertificatesPage from '../pages/employee/MyCertificatesPage';
import { certificateApi } from '../api/certificateApi';
import { learningPathApi } from '../api/learningPathApi';

vi.mock('../api/certificateApi', () => ({
  certificateApi: {
    getMyCertificates: vi.fn(),
    uploadCertificate: vi.fn(),
    getDownloadUrl: vi.fn((id) => `/api/v1/certificates/download/${id}`),
  },
}));

vi.mock('../api/learningPathApi', () => ({
  learningPathApi: {
    getOwnActivePath: vi.fn(),
  },
}));

describe('My Certificates Feature & Two-Step Verification Gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCertificates = [
    {
      id: 1,
      courseTitle: 'Data Structures and Algorithms Specialization',
      courseProvider: 'Coursera',
      status: 'CERTIFIED',
      quizPassed: true,
      authenticityScore: 0.95,
      completionDate: '2026-10-20',
      credentialUrl: 'https://coursera.org/verify/DSA123',
    },
    {
      id: 2,
      courseTitle: 'Cloud Native Java Microservices',
      courseProvider: 'Coursera',
      status: 'ML_VERIFIED_PENDING_QUIZ',
      quizPassed: false,
      authenticityScore: 0.92,
      completionDate: '2026-10-28',
      credentialUrl: 'https://coursera.org/verify/CNJ456',
    },
  ];

  const mockLearningPath = {
    id: 10,
    status: 'ACTIVE',
    overallProgressPercentage: 50,
    courses: [
      {
        id: 101,
        courseId: 5,
        courseTitle: 'Data Structures and Algorithms Specialization',
        provider: 'Coursera',
        stepOrder: 1,
        status: 'COMPLETED',
        progressPercentage: 100,
      },
      {
        id: 102,
        courseId: 6,
        courseTitle: 'Cloud Native Java Microservices',
        provider: 'Coursera',
        stepOrder: 2,
        status: 'ENROLLED',
        progressPercentage: 25,
      },
      {
        id: 103,
        courseId: 7,
        courseTitle: 'System Design Interview Guide',
        provider: 'Coursera',
        stepOrder: 3,
        status: 'NOT_STARTED',
        progressPercentage: 0,
      },
    ],
  };

  it('renders My Certificates page with statistics, 2-step guide, and certificate cards', async () => {
    certificateApi.getMyCertificates.mockResolvedValueOnce({
      success: true,
      data: mockCertificates,
    });
    learningPathApi.getOwnActivePath.mockResolvedValueOnce({
      success: true,
      data: mockLearningPath,
    });

    render(
      <MemoryRouter>
        <MyCertificatesPage />
      </MemoryRouter>
    );

    // Wait for content to render
    await waitFor(() => {
      expect(screen.getByText('My Certificates')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText('Total Certificates')).toBeInTheDocument();
    expect(screen.getAllByText(/Completed & Certified/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Quiz Pending/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Avg. ML Authenticity')).toBeInTheDocument();

    // Check course cards rendered
    expect(screen.getByText('Data Structures and Algorithms Specialization')).toBeInTheDocument();
    expect(screen.getByText('Cloud Native Java Microservices')).toBeInTheDocument();

    // Check badges
    expect(screen.getByText(/Passed \(≥70%\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Required to Certify/i)).toBeInTheDocument();
    expect(screen.getByText(/Take Quiz/i)).toBeInTheDocument();

    // Check courses awaiting certificate
    expect(screen.getByText(/Active Roadmap Courses Awaiting Certificates/i)).toBeInTheDocument();
    expect(screen.getByText('System Design Interview Guide')).toBeInTheDocument();
  });

  it('filters certificates by tab: Completed & Certified vs Quiz Pending', async () => {
    certificateApi.getMyCertificates.mockResolvedValueOnce({
      success: true,
      data: mockCertificates,
    });
    learningPathApi.getOwnActivePath.mockResolvedValueOnce({
      success: true,
      data: mockLearningPath,
    });

    render(
      <MemoryRouter>
        <MyCertificatesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Data Structures and Algorithms Specialization')).toBeInTheDocument();
    });

    // Click "Quiz Pending" filter tab
    const pendingTab = screen.getByRole('button', { name: /Quiz Pending/i });
    fireEvent.click(pendingTab);

    // Should only show Cloud Native Java Microservices
    expect(screen.getByText('Cloud Native Java Microservices')).toBeInTheDocument();
    expect(screen.queryByText('Data Structures and Algorithms Specialization')).not.toBeInTheDocument();

    // Click "Completed & Certified" filter tab
    const certifiedTab = screen.getByRole('button', { name: /Completed & Certified/i });
    fireEvent.click(certifiedTab);

    // Should now show Data Structures and Algorithms Specialization
    expect(screen.getByText('Data Structures and Algorithms Specialization')).toBeInTheDocument();
    expect(screen.queryByText('Cloud Native Java Microservices')).not.toBeInTheDocument();
  });

  it('opens certificate upload modal when clicking Upload Certificate button', async () => {
    certificateApi.getMyCertificates.mockResolvedValueOnce({
      success: true,
      data: mockCertificates,
    });
    learningPathApi.getOwnActivePath.mockResolvedValueOnce({
      success: true,
      data: mockLearningPath,
    });

    render(
      <MemoryRouter>
        <MyCertificatesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('My Certificates')).toBeInTheDocument();
    });

    const uploadButtons = screen.getAllByRole('button', { name: /Upload Certificate/i });
    fireEvent.click(uploadButtons[0]);

    // Modal title should appear
    await waitFor(() => {
      expect(screen.getByText('Submit Course Completion Certificate')).toBeInTheDocument();
    });
  });
});
