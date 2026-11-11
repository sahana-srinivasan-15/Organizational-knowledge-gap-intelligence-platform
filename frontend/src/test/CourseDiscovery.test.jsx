import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CourseDiscoveryPage from '../pages/employee/CourseDiscoveryPage';
import courseDiscoveryApi from '../api/courseDiscoveryApi';

vi.mock('../api/courseDiscoveryApi');

const mockCourses = [
  {
    id: 1,
    title: 'Spring Boot Microservices Architecture',
    provider: 'Coursera',
    instructor: 'Dr. John Doe',
    price: 49.99,
    isFree: false,
    durationHours: 35,
    difficultyLevel: 'INTERMEDIATE',
    rating: 4.85,
    reviewCount: 1420,
    certificateAvailable: true,
    courseUrl: 'https://coursera.org/spring-boot',
    skillsCovered: ['Spring Boot', 'Microservices', 'Docker'],
    isRecommended: true,
    recommendationReason: 'Addresses your verified skill gap in Distributed Systems Architecture',
    matchRelevanceScore: 94,
  },
  {
    id: 2,
    title: 'Python for Enterprise AI & Data Science',
    provider: 'Udemy',
    instructor: 'Sarah Connor',
    price: 0,
    isFree: true,
    durationHours: 20,
    difficultyLevel: 'BEGINNER',
    rating: 4.90,
    reviewCount: 3200,
    certificateAvailable: true,
    courseUrl: 'https://udemy.com/python-ai',
    skillsCovered: ['Python', 'Machine Learning'],
    isRecommended: false,
    recommendationReason: null,
    matchRelevanceScore: 78,
  },
];

describe('CourseDiscoveryPage & Modern CSS System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modern light-themed header, statistics counters, and vetted course cards', async () => {
    courseDiscoveryApi.searchCourses.mockResolvedValue({
      data: mockCourses,
    });

    render(
      <MemoryRouter>
        <CourseDiscoveryPage />
      </MemoryRouter>
    );

    // Header title
    expect(await screen.findByText('Explore & Discover Courses')).toBeInTheDocument();

    // Provider Badges (present in dropdown options & course card badges)
    expect(screen.getAllByText('Coursera').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Udemy').length).toBeGreaterThanOrEqual(1);

    // Course titles
    expect(await screen.findByText('Spring Boot Microservices Architecture')).toBeInTheDocument();
    expect(screen.getByText('Python for Enterprise AI & Data Science')).toBeInTheDocument();

    // Price tags
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getAllByText('Free Access').length).toBeGreaterThanOrEqual(1);

    // AI Match badge
    expect(screen.getByText('AI Match')).toBeInTheDocument();
    expect(screen.getByText(/Addresses your verified skill gap in Distributed Systems/i)).toBeInTheDocument();

    // Verify 'Upload Certificate' is NOT present in Course Discovery & Compare
    expect(screen.queryByRole('button', { name: /Upload Certificate/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Upload Certificate/i)).not.toBeInTheDocument();
  });

  it('allows selecting courses for comparison and displays the floating comparison dock', async () => {
    courseDiscoveryApi.searchCourses.mockResolvedValue({
      data: mockCourses,
    });

    render(
      <MemoryRouter>
        <CourseDiscoveryPage />
      </MemoryRouter>
    );

    await screen.findByText('Spring Boot Microservices Architecture');

    const compareCheckboxes = screen.getAllByRole('checkbox', { name: /compare/i });
    expect(compareCheckboxes.length).toBe(2);

    // Select course 1
    fireEvent.click(compareCheckboxes[0]);

    // Floating comparison dock appears
    expect(await screen.findByText(/1 of 4 courses selected/i)).toBeInTheDocument();

    // Select course 2
    fireEvent.click(compareCheckboxes[1]);
    expect(await screen.findByText(/2 of 4 courses selected/i)).toBeInTheDocument();

    // Button is now enabled
    const compareBtn = screen.getByRole('button', { name: /Compare Side-by-Side/i });
    expect(compareBtn).toBeEnabled();
  });

  it('submits search query and triggers catalog API with search keywords', async () => {
    courseDiscoveryApi.searchCourses.mockResolvedValue({
      data: mockCourses,
    });

    render(
      <MemoryRouter>
        <CourseDiscoveryPage />
      </MemoryRouter>
    );

    await screen.findByText('Spring Boot Microservices Architecture');

    const searchInput = screen.getByPlaceholderText(/Search by topic, skill, or keywords/i);
    fireEvent.change(searchInput, { target: { value: 'Kubernetes' } });
    fireEvent.submit(searchInput.closest('form'));

    await waitFor(() => {
      expect(courseDiscoveryApi.searchCourses).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'Kubernetes' })
      );
    });
  });
});
