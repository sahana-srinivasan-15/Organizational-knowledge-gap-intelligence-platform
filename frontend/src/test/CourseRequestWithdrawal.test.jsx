import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MyCourseRequestsPage from '../pages/employee/MyCourseRequestsPage';
import { courseApprovalApi } from '../api/courseApprovalApi';

vi.mock('../api/courseApprovalApi', () => ({
  courseApprovalApi: {
    getMyRequests: vi.fn(),
    withdrawRequest: vi.fn(),
    deleteRequest: vi.fn(),
  },
}));

describe('Course Request Withdrawal Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders course requests, opens withdrawal modal, and withdraws request successfully', async () => {
    const mockRequests = [
      {
        id: 101,
        externalCourseTitle: 'Advanced Distributed Systems with Kubernetes',
        externalCourseProvider: 'Coursera',
        price: 49.99,
        priority: 'HIGH',
        status: 'PENDING',
        targetSkillName: 'System Design & Architecture',
        skillGap: 2,
        reason: 'To master distributed architectures for target senior role',
        createdAt: '2026-11-01T10:00:00Z',
      },
      {
        id: 102,
        externalCourseTitle: 'Spring Boot Microservices Mastery',
        externalCourseProvider: 'Udemy',
        price: 29.99,
        priority: 'MEDIUM',
        status: 'APPROVED',
        targetSkillName: 'Spring Boot Framework',
        skillGap: 1,
        reason: 'Accelerate backend microservices competence',
        createdAt: '2026-10-25T10:00:00Z',
      },
    ];

    courseApprovalApi.getMyRequests.mockResolvedValueOnce({
      success: true,
      data: mockRequests,
    });

    courseApprovalApi.withdrawRequest.mockResolvedValueOnce({
      success: true,
      data: {
        ...mockRequests[0],
        status: 'WITHDRAWN',
      },
    });

    render(
      <MemoryRouter>
        <MyCourseRequestsPage />
      </MemoryRouter>
    );

    // Verify course requests are rendered
    await waitFor(() => {
      expect(screen.getByText('Advanced Distributed Systems with Kubernetes')).toBeInTheDocument();
      expect(screen.getByText(/Pending Manager Review/i)).toBeInTheDocument();
      expect(screen.getByText('Spring Boot Microservices Mastery')).toBeInTheDocument();
      expect(screen.getByText(/Approved & Enrolled/i)).toBeInTheDocument();
    });

    // PENDING request should have a Withdraw Request button
    const withdrawBtn = screen.getByRole('button', { name: /Withdraw Request/i });
    expect(withdrawBtn).toBeInTheDocument();

    // APPROVED request should NOT have a Withdraw button, but should have View in Roadmap
    expect(screen.getByRole('button', { name: /View in Roadmap/i })).toBeInTheDocument();

    // Click Withdraw Request button
    fireEvent.click(withdrawBtn);

    // Verify modal is displayed
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to withdraw this request\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Withdrawal/i })).toBeInTheDocument();
    });

    // Mock subsequent fetch after withdrawal
    courseApprovalApi.getMyRequests.mockResolvedValueOnce({
      success: true,
      data: [
        { ...mockRequests[0], status: 'WITHDRAWN' },
        mockRequests[1],
      ],
    });

    // Click Confirm Withdrawal in modal
    fireEvent.click(screen.getByRole('button', { name: /Confirm Withdrawal/i }));

    // Verify API was called
    await waitFor(() => {
      expect(courseApprovalApi.withdrawRequest).toHaveBeenCalledWith(101);
      expect(screen.getByText(/has been successfully withdrawn/i)).toBeInTheDocument();
    });
  });

  it('allows permanently removing a withdrawn or rejected course request', async () => {
    const mockRequests = [
      {
        id: 103,
        externalCourseTitle: 'Data Structures and Software Design Specialization',
        externalCourseProvider: 'Coursera',
        price: 49.00,
        priority: 'MEDIUM',
        status: 'WITHDRAWN',
        targetSkillName: 'Java Programming',
        skillGap: 1,
        reason: 'Legacy proposal',
        createdAt: '2026-10-28T10:00:00Z',
      },
    ];

    courseApprovalApi.getMyRequests.mockResolvedValueOnce({
      success: true,
      data: mockRequests,
    });

    courseApprovalApi.deleteRequest.mockResolvedValueOnce({
      success: true,
      message: 'Course request removed successfully',
    });

    render(
      <MemoryRouter>
        <MyCourseRequestsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Data Structures and Software Design Specialization')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Remove/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Remove/i }));

    await waitFor(() => {
      expect(screen.getByText(/Remove this course request\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Confirm Remove/i })).toBeInTheDocument();
    });

    courseApprovalApi.getMyRequests.mockResolvedValueOnce({
      success: true,
      data: [],
    });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Remove/i }));

    await waitFor(() => {
      expect(courseApprovalApi.deleteRequest).toHaveBeenCalledWith(103);
      expect(screen.getByText(/permanently removed/i)).toBeInTheDocument();
    });
  });
});

