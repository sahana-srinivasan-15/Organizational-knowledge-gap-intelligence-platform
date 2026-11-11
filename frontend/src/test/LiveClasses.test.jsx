import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LiveClassesPage from '../pages/LiveClassesPage';
import { liveClassApi } from '../api/liveClassApi';

// Mock Auth Context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 6, role: 'MENTOR', fullName: 'Alex Morgan' },
    isMentor: true,
    isManager: false,
    isAdmin: false,
    isEmployee: false,
  }),
}));

// Mock Live Class API
vi.mock('../api/liveClassApi', () => ({
  liveClassApi: {
    getLiveClasses: vi.fn(),
    joinClass: vi.fn(),
    updateStatus: vi.fn(),
    createLiveClass: vi.fn(),
  },
}));

const mockLiveClasses = [
  {
    id: 1,
    mentorId: 4,
    mentorUserId: 6,
    mentorName: 'Alex Morgan',
    title: 'Spring Boot 3 & Virtual Threads in High-Throughput Microservices',
    description: 'Live interactive deep-dive into Spring Boot 3 on Java 21.',
    skillId: 2,
    skillName: 'Spring Boot Framework',
    scheduledAt: '2026-11-02T16:00:00Z',
    durationMinutes: 60,
    meetingUrl: 'https://meet.google.com/org-live-boot',
    status: 'LIVE',
    materialsUrl: 'https://github.com/spring-projects/spring-boot',
    maxParticipants: 50,
    currentAttendees: 18,
  },
  {
    id: 2,
    mentorId: 5,
    mentorUserId: 7,
    mentorName: 'Priya Sharma',
    title: 'High-Scale System Architecture: Designing 99.999% Fault-Tolerant Clusters',
    description: 'Interactive architectural workshop on building multi-region clusters.',
    skillId: 3,
    skillName: 'System Design & Architecture',
    scheduledAt: '2026-11-03T18:00:00Z',
    durationMinutes: 90,
    meetingUrl: 'https://meet.google.com/org-sys-arch',
    status: 'UPCOMING',
    maxParticipants: 75,
    currentAttendees: 34,
  },
];

describe('LiveClassesPage Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    liveClassApi.getLiveClasses.mockResolvedValue({
      data: mockLiveClasses,
    });
  });

  it('renders live class hero banner, tabs, and scheduled classes', async () => {
    render(
      <MemoryRouter>
        <LiveClassesPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Live Classes & Interactive Masterclasses/i)).toBeInTheDocument();

    // Check LIVE BROADCAST NOW banner
    expect(screen.getByText(/LIVE BROADCAST NOW/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Spring Boot 3 & Virtual Threads in High-Throughput Microservices/i).length).toBeGreaterThan(0);

    // Check upcoming class
    expect(screen.getByText(/High-Scale System Architecture/i)).toBeInTheDocument();

    // Check Filter tabs
    expect(screen.getByText(/All Classes/i)).toBeInTheDocument();
    expect(screen.getByText(/🔴 Live Now/i)).toBeInTheDocument();
    expect(screen.getByText(/📅 Upcoming/i)).toBeInTheDocument();
  });

  it('filters classes when clicking tabs', async () => {
    render(
      <MemoryRouter>
        <LiveClassesPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/High-Scale System Architecture/i)).toBeInTheDocument();

    // Click "Live Now" tab
    const liveNowTab = screen.getByText(/🔴 Live Now/i);
    fireEvent.click(liveNowTab);

    // Upcoming should no longer be in filtered list
    expect(screen.queryByText(/High-Scale System Architecture/i)).not.toBeInTheDocument();
    // Live should still be visible
    expect(screen.getAllByText(/Spring Boot 3 & Virtual Threads/i).length).toBeGreaterThan(0);
  });

  it('opens schedule modal and allows mentor to schedule new live class', async () => {
    liveClassApi.createLiveClass.mockResolvedValue({
      data: { id: 3, title: 'New System Design Workshop' },
    });

    render(
      <MemoryRouter>
        <LiveClassesPage />
      </MemoryRouter>
    );

    const scheduleBtn = await screen.findByText(/Schedule Live Class/i);
    fireEvent.click(scheduleBtn);

    expect(screen.getByText('Schedule New Live Class')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Modern System Design/i)).toBeInTheDocument();
  });
});
