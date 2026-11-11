import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MentorshipPage from '../pages/employee/MentorshipPage';
import { authApi } from '../api/authApi';
import { mentorshipApi } from '../api/mentorshipApi';

vi.mock('../api/authApi', () => ({
  authApi: {
    getEmployeeProfile: vi.fn(),
    updateMentorStatus: vi.fn(),
    getMentorEligibility: vi.fn(),
  },
}));

vi.mock('../api/mentorshipApi', () => ({
  mentorshipApi: {
    getOwnRecommendations: vi.fn(),
    createRecommendationAssignment: vi.fn(),
    getAssignments: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

describe('Mentor Eligibility & Gating Requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('locks mentor opt-in when course certificate has not been uploaded or quiz not passed', async () => {
    authApi.getEmployeeProfile.mockResolvedValueOnce({
      success: true,
      data: {
        id: 2,
        userId: 4,
        fullName: 'David Kim',
        mentorOptIn: false,
        mentorAvailabilityHrsPerWeek: 5,
        maxMenteesCapacity: 3,
      },
    });

    mentorshipApi.getOwnRecommendations.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    authApi.getMentorEligibility.mockResolvedValueOnce({
      success: true,
      data: {
        eligible: false,
        hasUploadedCertificate: false,
        certificateCount: 0,
        hasPassedAssessment: false,
        passedAssessmentsCount: 0,
        summaryMessage: 'To qualify as a peer mentor, you must complete an online course, upload your completion certificate, and attend & pass the skill diagnostic quiz.',
        criteria: [
          { key: 'CERTIFICATE_UPLOAD', title: 'Course Completion Certificate Uploaded', met: false },
          { key: 'DIAGNOSTIC_ASSESSMENT_PASSED', title: 'Diagnostic Assessment Passed', met: false },
        ],
      },
    });

    render(
      <MemoryRouter>
        <MentorshipPage />
      </MemoryRouter>
    );

    // Verify Eligibility Gate section appears
    await waitFor(() => {
      expect(screen.getByText(/Peer Mentor Qualification & Eligibility Gate/i)).toBeInTheDocument();
      expect(screen.getByText('Eligibility In Progress')).toBeInTheDocument();
      expect(screen.getByText(/1. Course Certificate/i)).toBeInTheDocument();
      expect(screen.getByText(/2. Diagnostic Quiz Pass/i)).toBeInTheDocument();
    });

    // Verify Opt-in checkbox is locked/disabled
    const optInCheckbox = screen.getByRole('checkbox');
    expect(optInCheckbox).toBeDisabled();
    expect(screen.getByText(/Opt-in locked: You must upload a course certificate and pass a diagnostic quiz/i)).toBeInTheDocument();
  });

  it('unlocks mentor opt-in when course certificate is uploaded and diagnostic quiz is passed', async () => {
    authApi.getEmployeeProfile.mockResolvedValueOnce({
      success: true,
      data: {
        id: 2,
        userId: 4,
        fullName: 'David Kim',
        mentorOptIn: false,
        mentorAvailabilityHrsPerWeek: 5,
        maxMenteesCapacity: 3,
      },
    });

    mentorshipApi.getOwnRecommendations.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    authApi.getMentorEligibility.mockResolvedValueOnce({
      success: true,
      data: {
        eligible: true,
        hasUploadedCertificate: true,
        certificateCount: 1,
        hasPassedAssessment: true,
        passedAssessmentsCount: 2,
        summaryMessage: 'You have met all eligibility criteria to mentor your peers!',
        criteria: [
          { key: 'CERTIFICATE_UPLOAD', title: 'Course Completion Certificate Uploaded', met: true },
          { key: 'DIAGNOSTIC_ASSESSMENT_PASSED', title: 'Diagnostic Assessment Passed', met: true },
        ],
      },
    });

    authApi.updateMentorStatus.mockResolvedValueOnce({
      success: true,
      data: {
        mentorOptIn: true,
        mentorAvailabilityHrsPerWeek: 8,
      },
    });

    render(
      <MemoryRouter>
        <MentorshipPage />
      </MemoryRouter>
    );

    // Verify Eligible badge
    await waitFor(() => {
      expect(screen.getByText('✓ Eligible to Mentor')).toBeInTheDocument();
      expect(screen.getByText('✓ Verified (1)')).toBeInTheDocument();
      expect(screen.getByText('✓ Passed (2)')).toBeInTheDocument();
    });

    // Verify Opt-in checkbox is enabled
    const optInCheckbox = screen.getByRole('checkbox');
    expect(optInCheckbox).not.toBeDisabled();

    // Toggle opt-in checkbox
    fireEvent.click(optInCheckbox);

    // Save preferences
    const saveBtn = screen.getByRole('button', { name: /Save Mentorship Settings/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(authApi.updateMentorStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          mentorOptIn: true,
        })
      );
      expect(screen.getByText(/Your peer mentorship settings have been updated successfully!/i)).toBeInTheDocument();
    });
  });

  it('renders mentor recommendations with match affinity and allows submitting a mentorship request', async () => {
    authApi.getEmployeeProfile.mockResolvedValueOnce({
      success: true,
      data: {
        id: 2,
        userId: 4,
        fullName: 'David Kim',
        mentorOptIn: false,
        mentorAvailabilityHrsPerWeek: 5,
        maxMenteesCapacity: 3,
      },
    });

    mentorshipApi.getOwnRecommendations.mockResolvedValueOnce({
      success: true,
      data: [
        {
          mentorProfileId: 1,
          mentorUserId: 3,
          mentorFullName: 'Alex Morgan',
          departmentName: 'Engineering',
          currentJobRoleTitle: 'Senior Software Engineer',
          availableHoursPerWeek: 5,
          currentMenteeCount: 0,
          maxMentees: 3,
          remainingCapacity: 3,
          overallScore: 0.9,
          explanation: 'Algorithmic match: Verified in Java Programming (+2 proficiency gain)',
          matchedSkills: [
            {
              skillId: 1,
              skillName: 'Java Programming',
              mentorVerifiedProficiency: 5,
              proficiencyGain: 2,
            },
          ],
        },
      ],
    });

    mentorshipApi.getAssignments.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    authApi.getMentorEligibility.mockResolvedValueOnce({
      success: true,
      data: {
        eligible: false,
        hasUploadedCertificate: false,
        certificateCount: 0,
        hasPassedAssessment: false,
        passedAssessmentsCount: 0,
        criteria: [],
      },
    });

    mentorshipApi.createRecommendationAssignment.mockResolvedValueOnce({
      success: true,
      data: { id: 101, status: 'RECOMMENDED' },
    });

    render(
      <MemoryRouter>
        <MentorshipPage />
      </MemoryRouter>
    );

    // Verify mentor recommendation details
    await waitFor(() => {
      expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText(/Java Programming \(Level 5 verified, \+2 gain\)/i)).toBeInTheDocument();
      expect(screen.getByText(/5 hrs\/week available/i)).toBeInTheDocument();
    });

    // Click Request Mentorship button
    const requestBtn = screen.getByRole('button', { name: /Request Mentorship/i });
    expect(requestBtn).toBeInTheDocument();
    fireEvent.click(requestBtn);

    await waitFor(() => {
      expect(mentorshipApi.createRecommendationAssignment).toHaveBeenCalledWith(
        2,
        1,
        1,
        expect.stringContaining('Mentee-initiated request')
      );
      expect(screen.getByText(/Mentorship request submitted for Alex Morgan! Pending manager approval./i)).toBeInTheDocument();
    });
  });
});
