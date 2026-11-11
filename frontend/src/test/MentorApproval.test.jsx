import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MentorApprovalPage from '../pages/manager/MentorApprovalPage';
import mentorshipApi from '../api/mentorshipApi';

vi.mock('../api/mentorshipApi');

const mockAssignments = [
  {
    id: 1,
    menteeProfileId: 2,
    menteeFullName: 'David Kim',
    menteeEmail: 'david.junior@orgkgi.dev',
    mentorProfileId: 4,
    mentorFullName: 'Alex Morgan',
    mentorEmail: 'mentor.alex@orgkgi.dev',
    skillId: 2,
    skillName: 'Spring Boot Framework',
    status: 'RECOMMENDED',
    notes: 'AI Algorithmic Match: 95% affinity score based on verified proficiency delta.',
    createdAt: '2026-10-30T10:00:00Z',
  },
  {
    id: 3,
    menteeProfileId: 7,
    menteeFullName: 'Maya Patel',
    menteeEmail: 'maya.patel@orgkgi.dev',
    mentorProfileId: 5,
    mentorFullName: 'Priya Sharma',
    mentorEmail: 'priya.sharma@orgkgi.dev',
    skillId: 3,
    skillName: 'System Design & Architecture',
    status: 'RECOMMENDED',
    notes: 'AI Algorithmic Match: 96% affinity score for high-scale distributed systems mentoring.',
    createdAt: '2026-10-30T11:00:00Z',
  },
];

describe('MentorApprovalPage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modern light-themed header, statistics, and pending mentor recommendations', async () => {
    mentorshipApi.getAssignments.mockResolvedValue({
      data: { content: mockAssignments },
    });

    render(
      <MemoryRouter>
        <MentorApprovalPage />
      </MemoryRouter>
    );

    // Title
    expect(await screen.findByText('Manager Mentor Approval Queue')).toBeInTheDocument();

    // Mentees and Mentors displayed
    expect(await screen.findByText('David Kim')).toBeInTheDocument();
    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('Maya Patel')).toBeInTheDocument();
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument();

    // Target Skills
    expect(screen.getByText(/Skill: Spring Boot Framework/i)).toBeInTheDocument();
    expect(screen.getByText(/Skill: System Design & Architecture/i)).toBeInTheDocument();

    // Actions visible for RECOMMENDED status
    const approveButtons = screen.getAllByRole('button', { name: /Approve Mentorship/i });
    expect(approveButtons.length).toBe(2);
  });

  it('allows manager to approve a recommended mentorship match', async () => {
    mentorshipApi.getAssignments.mockResolvedValue({
      data: { content: mockAssignments },
    });
    mentorshipApi.approveAssignment.mockResolvedValue({
      data: { ...mockAssignments[0], status: 'APPROVED_BY_MANAGER' },
    });

    render(
      <MemoryRouter>
        <MentorApprovalPage />
      </MemoryRouter>
    );

    await screen.findByText('David Kim');

    const approveButtons = screen.getAllByRole('button', { name: /Approve Mentorship/i });
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(mentorshipApi.approveAssignment).toHaveBeenCalledWith(1);
    });
  });

  it('allows manager to auto-generate sample recommendations when needed', async () => {
    mentorshipApi.getAssignments.mockResolvedValue({
      data: { content: [] },
    });
    mentorshipApi.autoGenerateAssignments.mockResolvedValue({
      data: mockAssignments,
    });

    render(
      <MemoryRouter>
        <MentorApprovalPage />
      </MemoryRouter>
    );

    const generateBtn = await screen.findByRole('button', { name: /Generate AI Matches/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(mentorshipApi.autoGenerateAssignments).toHaveBeenCalled();
    });
  });

  it('filters recommendations using modern search input', async () => {
    mentorshipApi.getAssignments.mockResolvedValue({
      data: { content: mockAssignments },
    });

    render(
      <MemoryRouter>
        <MentorApprovalPage />
      </MemoryRouter>
    );

    await screen.findByText('David Kim');
    expect(screen.getByText('Maya Patel')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/Search by mentee, mentor, or target skill/i);
    fireEvent.change(searchInput, { target: { value: 'David' } });

    expect(screen.getByText('David Kim')).toBeInTheDocument();
    expect(screen.queryByText('Maya Patel')).not.toBeInTheDocument();
  });
});

