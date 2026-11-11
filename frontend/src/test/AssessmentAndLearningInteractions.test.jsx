import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AssessmentQuizPage from '../pages/employee/AssessmentQuizPage';
import { assessmentApi } from '../api/assessmentApi';

vi.mock('../api/assessmentApi', () => ({
  assessmentApi: {
    startAttempt: vi.fn(),
    submitAssessment: vi.fn(),
  },
}));

vi.mock('../api/mentorshipApi', () => ({
  mentorshipApi: {
    getOwnRecommendations: vi.fn().mockResolvedValue({ success: true, data: [] }),
    createRecommendationAssignment: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../api/authApi', () => ({
  authApi: {
    getEmployeeProfile: vi.fn().mockResolvedValue({ success: true, data: { id: 2, fullName: 'Alex Rivera' } }),
  },
}));

describe('Assessment Quiz Interactive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assessment questions, allows selecting options, and displays server-evaluated result', async () => {
    assessmentApi.startAttempt.mockResolvedValueOnce({
      success: true,
      data: {
        assessmentId: 1,
        title: 'Spring Boot Architecture Diagnostic',
        skillId: 2,
        skillName: 'Spring Boot Framework',
        passingScore: 75.0,
        timeLimitMinutes: 20,
        startedAt: '2026-10-15T21:00:00Z',
        expiresAt: '2026-10-15T21:20:00Z',
        questions: [
          {
            id: 101,
            questionText: 'Which annotation enables dynamic configuration property injection?',
            options: ['@Value', '@ConfigurationProperties', '@PropertySource', '@Autowired'],
            difficultyLevel: 2,
          },
        ],
      },
    });

    assessmentApi.submitAssessment.mockResolvedValueOnce({
      success: true,
      data: {
        submissionId: 501,
        assessmentId: 1,
        assessmentTitle: 'Spring Boot Architecture Diagnostic',
        skillId: 2,
        skillName: 'Spring Boot Framework',
        score: 100.0,
        passed: true,
        passingScore: 75.0,
        totalQuestions: 1,
        correctQuestions: 1,
        verificationStatus: 'ASSESSED',
        verifiedProficiencyLevel: 3,
        feedback: 'Passed! You scored 100.00%. Skill Spring Boot Framework verified at Level 3.',
      },
    });

    render(
      <MemoryRouter initialEntries={['/assessments/1/take']}>
        <Routes>
          <Route path="/assessments/:id/take" element={<AssessmentQuizPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify question renders
    await waitFor(() => {
      expect(screen.getByText('Spring Boot Architecture Diagnostic')).toBeInTheDocument();
      expect(screen.getByText('Which annotation enables dynamic configuration property injection?')).toBeInTheDocument();
      expect(screen.getByText('@ConfigurationProperties')).toBeInTheDocument();
    });

    // Select second option: @ConfigurationProperties (index 1)
    const option = screen.getByText('@ConfigurationProperties');
    fireEvent.click(option);

    // Submit answers
    const submitBtn = screen.getByRole('button', { name: /Submit Answers/i });
    fireEvent.click(submitBtn);

    // Verify submission payload
    await waitFor(() => {
      expect(assessmentApi.submitAssessment).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          startedAt: '2026-10-15T21:00:00Z',
          answers: [{ questionId: 101, selectedOptionIndex: 1 }],
        })
      );
    });

    // Verify server result feedback is displayed
    await waitFor(() => {
      expect(screen.getByText('Assessment Passed!')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText(/Skill Spring Boot Framework verified at Level 3/i)).toBeInTheDocument();
    });
  });

  it('displays low-mastery weak topics and recommended mentors when passing benchmark is not met', async () => {
    assessmentApi.startAttempt.mockResolvedValueOnce({
      success: true,
      data: {
        assessmentId: 2,
        title: 'Kubernetes Cluster Diagnostic',
        skillId: 5,
        skillName: 'Kubernetes & Container Orchestration',
        passingScore: 75.0,
        timeLimitMinutes: 20,
        startedAt: '2026-10-15T21:00:00Z',
        expiresAt: '2026-10-15T21:20:00Z',
        questions: [
          {
            id: 201,
            questionText: 'Which object controls Pod traffic ingress routing?',
            options: ['Service', 'Ingress Controller', 'ConfigMap', 'DaemonSet'],
            difficultyLevel: 3,
            topic: 'Ingress & Network Policies',
          },
        ],
      },
    });

    assessmentApi.submitAssessment.mockResolvedValueOnce({
      success: true,
      data: {
        submissionId: 502,
        assessmentId: 2,
        assessmentTitle: 'Kubernetes Cluster Diagnostic',
        skillId: 5,
        skillName: 'Kubernetes & Container Orchestration',
        score: 0.0,
        passed: false,
        passingScore: 75.0,
        totalQuestions: 1,
        correctQuestions: 0,
        verificationStatus: 'SELF_REPORTED',
        verifiedProficiencyLevel: 1,
        feedback: 'Did not meet passing score. You scored 0.00%.',
        knowledgeGaps: [
          {
            topic: 'Ingress & Network Policies',
            questionsTested: 1,
            questionsMissed: 1,
            masteryPercentage: 0.0,
            severity: 'HIGH',
          },
        ],
        recommendedMentors: [
          {
            mentorProfileId: 10,
            mentorFullName: 'Marcus Vance',
            currentJobRoleTitle: 'Principal Cloud Architect',
            departmentName: 'Infrastructure',
            availableHoursPerWeek: 4,
            overallScore: 0.94,
            explanation: 'High domain affinity in Kubernetes & Container Orchestration',
            matchedSkills: [
              {
                skillId: 5,
                skillName: 'Kubernetes & Container Orchestration',
                mentorVerifiedProficiency: 5,
              },
            ],
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={['/assessments/2/take']}>
        <Routes>
          <Route path="/assessments/:id/take" element={<AssessmentQuizPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Answer question incorrectly (index 0)
    await waitFor(() => {
      expect(screen.getByText('Kubernetes Cluster Diagnostic')).toBeInTheDocument();
      expect(screen.getByText('Service')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Service'));

    // Submit answers
    const submitBtn = screen.getByRole('button', { name: /Submit Answers/i });
    fireEvent.click(submitBtn);

    // Verify Not Passed screen renders
    await waitFor(() => {
      expect(screen.getByText('Assessment Not Passed')).toBeInTheDocument();
      expect(screen.getByText('ACTION REQUIRED')).toBeInTheDocument();
    });

    // Verify low-mastery weak topics section is shown with high-contrast information
    await waitFor(() => {
      expect(screen.getByText(/Targeted Knowledge Gaps & Low-Mastery Topics/i)).toBeInTheDocument();
      expect(screen.getByText('Ingress & Network Policies')).toBeInTheDocument();
      expect(screen.getByText('HIGH DEFICIT')).toBeInTheDocument();
      expect(screen.getByText(/Questions in these specific topic domains were missed/i)).toBeInTheDocument();
    });

    // Verify Recommended Peer Mentors section is displayed
    await waitFor(() => {
      expect(screen.getByText(/Recommended Peer Mentors for Your Knowledge Gaps/i)).toBeInTheDocument();
      expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
      expect(screen.getByText(/Principal Cloud Architect/i)).toBeInTheDocument();
      expect(screen.getByText(/94% Match/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified Kubernetes & Container Orchestration/i)).toBeInTheDocument();
    });

    // Test clicking "Request Mentorship" button
    const requestBtn = screen.getByRole('button', { name: /Request Mentorship/i });
    fireEvent.click(requestBtn);

    await waitFor(() => {
      expect(screen.getByText(/Request Sent to Manager/i)).toBeInTheDocument();
    });
  });
});
