import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import { skillGapApi } from '../api/skillGapApi';
import { learningPathApi } from '../api/learningPathApi';
import { assessmentApi } from '../api/assessmentApi';
import { mentorshipApi } from '../api/mentorshipApi';
import { courseDiscoveryApi } from '../api/courseDiscoveryApi';
import { certificateApi } from '../api/certificateApi';
import AuthContext from '../context/AuthContext';

vi.mock('../api/skillGapApi');
vi.mock('../api/learningPathApi');
vi.mock('../api/assessmentApi');
vi.mock('../api/mentorshipApi');
vi.mock('../api/courseDiscoveryApi');
vi.mock('../api/certificateApi', () => ({
  certificateApi: {
    uploadCertificate: vi.fn(),
    getMyCertificates: vi.fn().mockResolvedValue({ data: [] }),
    getDownloadUrl: vi.fn((id) => `/api/v1/certificates/download/${id}`),
  },
}));

const mockUser = {
  id: 4,
  firstName: 'David',
  lastName: 'Kim',
  role: 'EMPLOYEE',
  email: 'david.junior@orgkgi.dev',
};

const mockTrendingCourses = [
  {
    id: 'course-101',
    title: 'PostgreSQL 17: Core Concepts and Advanced SQL Techniques',
    slug: 'packt-postgresql-17-core-concepts-and-advanced-sql-techniques-ojoqu',
    provider: 'Coursera',
    externalUrl: 'https://www.coursera.org/learn/packt-postgresql-17-core-concepts-and-advanced-sql-techniques-ojoqu',
    photoUrl: 'https://d3njjcbhbojbot.cloudfront.net/test-photo.png',
    workload: '6 hours',
    level: 'INTERMEDIATE',
    partnerName: 'Packt',
    instructorName: 'Packt Publishing',
    certificateAvailable: true,
    certificateType: 'VerifiedCert',
    matchedSkillName: 'PostgreSQL & Database Optimization',
    matchedSkillId: 4,
    rawGap: 1,
    requiredProficiency: 4,
    verifiedProficiency: 3,
    matchRelevanceScore: 25.0,
    recommendationReason: 'Directly addresses your verified skill gap in PostgreSQL & Database Optimization (Required Level: 4, Verified Level: 3) for target role Senior Software Engineer.',
    isLiveFromApi: true,
  },
  {
    id: 'course-102',
    title: 'Getting started with the Vertex AI Gemini 1.5 Pro Model',
    slug: 'googlecloud-getting-started-with-the-vertex-ai-gemini-1-5-pro-model-i43mr',
    provider: 'Coursera',
    externalUrl: 'https://www.coursera.org/learn/googlecloud-getting-started-with-the-vertex-ai-gemini-1-5-pro-model-i43mr',
    photoUrl: 'https://d3njjcbhbojbot.cloudfront.net/gemini.png',
    workload: '1 hour 30 minutes',
    level: 'BEGINNER',
    partnerName: 'Google Cloud',
    instructorName: 'Google Cloud Training',
    certificateAvailable: true,
    certificateType: 'VerifiedCert',
    matchedSkillName: 'Machine Learning & Scikit-Learn',
    matchedSkillId: 6,
    rawGap: 2,
    requiredProficiency: 4,
    verifiedProficiency: 2,
    matchRelevanceScore: 50.0,
    recommendationReason: 'Directly addresses your verified skill gap in Machine Learning & Scikit-Learn (Required Level: 4, Verified Level: 2) for target role Senior Software Engineer.',
    isLiveFromApi: true,
  },
];

describe('Employee Dashboard Live Trending Courses (Coursera API)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    skillGapApi.getOwnSkillGaps.mockResolvedValue({
      data: {
        employeeProfileId: 2,
        currentRole: 'Junior Software Engineer',
        targetRole: 'Senior Software Engineer',
        skillGaps: [
          {
            skillId: 4,
            skillName: 'PostgreSQL & Database Optimization',
            rawGap: 1,
            criticality: 'CORE',
            importanceWeight: 2.0,
          },
        ],
      },
    });

    learningPathApi.getOwnActivePath.mockResolvedValue({
      data: {
        id: 10,
        title: 'Senior Software Engineer Pathway',
        courses: [
          {
            id: 201,
            courseId: 201,
            courseTitle: 'Spring Boot 3 Fundamentals',
            provider: 'Internal Academy',
            durationHours: 20,
            difficultyLevel: 'INTERMEDIATE',
            status: 'IN_PROGRESS',
            progressPercentage: 40,
          },
        ],
      },
    });

    assessmentApi.getAllAssessments.mockResolvedValue({ data: [] });
    mentorshipApi.getOwnRecommendations.mockResolvedValue({ data: [] });
    courseDiscoveryApi.getTrendingCourses.mockResolvedValue({ data: mockTrendingCourses });
  });

  it('renders Live Trending Industry Courses section with Coursera API sync badge and matched skill gap cards', async () => {
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <EmployeeDashboard />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Section title & API sync indicator
    expect(await screen.findByText('Live Trending Industry Courses')).toBeInTheDocument();
    expect(screen.getByText('Coursera API Sync')).toBeInTheDocument();

    // Trending course titles
    expect(
      screen.getByText('PostgreSQL 17: Core Concepts and Advanced SQL Techniques')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Getting started with the Vertex AI Gemini 1.5 Pro Model')
    ).toBeInTheDocument();

    // Matched skill gap badges
    expect(screen.getByText('Bridges PostgreSQL & Database Optimization (+1)')).toBeInTheDocument();
    expect(screen.getByText('Bridges Machine Learning & Scikit-Learn (+2)')).toBeInTheDocument();

    // Real partner badges from Coursera API
    expect(screen.getByText('Packt')).toBeInTheDocument();
    expect(screen.getByText('Google Cloud')).toBeInTheDocument();

    // Real workload from Coursera API
    expect(screen.getByText('6 hours')).toBeInTheDocument();
    expect(screen.getByText('1 hour 30 minutes')).toBeInTheDocument();

    // Enroll links
    const enrollLinks = screen.getAllByRole('link', { name: /Enroll on Coursera/i });
    expect(enrollLinks.length).toBe(2);
    expect(enrollLinks[0]).toHaveAttribute(
      'href',
      'https://www.coursera.org/learn/packt-postgresql-17-core-concepts-and-advanced-sql-techniques-ojoqu'
    );

    // Upload Certificate button is removed from Active Roadmap (managed exclusively in dedicated /my-certificates)
    expect(screen.queryByRole('button', { name: /Upload Certificate/i })).not.toBeInTheDocument();
    // Diagnostic quizzes removed per platform governance policy
    expect(screen.queryByRole('button', { name: /Take Quiz/i })).not.toBeInTheDocument();
    expect(screen.getByText('Spring Boot 3 Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
});
