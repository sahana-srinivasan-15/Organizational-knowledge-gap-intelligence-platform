import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WeakAreasSection from '../components/employee/WeakAreasSection';
import { weakAreaApi } from '../api/weakAreaApi';

vi.mock('../api/weakAreaApi', () => ({
  weakAreaApi: {
    getMyWeakAreas: vi.fn(),
    getEmployeeWeakAreas: vi.fn(),
    submitReview: vi.fn(),
    submitMentorFeedback: vi.fn(),
  },
}));

const mockWeakAreas = [
  {
    skillId: 4,
    skillName: 'PostgreSQL & Database Optimization',
    categoryName: 'Data Infrastructure',
    currentProficiency: 2,
    requiredProficiency: 4,
    gap: 2,
    isWeakArea: true,
    reason: 'Verified proficiency (Level 2) is below target role requirement (Level 4)',
    diagnosticScore: 20.0,
    diagnosticPassed: false,
    mentorName: 'Liam Chen',
    materials: [
      {
        id: 7,
        title: 'PostgreSQL EXPLAIN ANALYZE & Query Optimization Field Guide',
        description: 'Deciphering query plans and index scans.',
        materialType: 'CHEATSHEET',
        difficultyLevel: 'INTERMEDIATE',
        estimatedMinutes: 25,
        url: 'https://www.postgresql.org/docs/current/using-explain.html',
      },
    ],
    reviews: [
      {
        id: 1,
        rating: 5,
        reviewText: 'Great EXPLAIN guide.',
        mentorName: 'Liam Chen',
        mentorFeedback: 'Focus on buffer cache hits.',
      },
    ],
  },
];

describe('WeakAreasSection Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    weakAreaApi.getMyWeakAreas.mockResolvedValue({
      data: mockWeakAreas,
    });
  });

  it('renders identified weak areas, diagnostic score, and tailored materials', async () => {
    render(<WeakAreasSection />);

    expect(await screen.findByText(/Identified Weak Areas & Targeted Study Materials/i)).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL & Database Optimization')).toBeInTheDocument();
    expect(screen.getByText(/Gap: -2/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnostic:/i)).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();

    // Material card
    expect(screen.getByText('PostgreSQL EXPLAIN ANALYZE & Query Optimization Field Guide')).toBeInTheDocument();
    expect(screen.getByText(/Study Now/i)).toBeInTheDocument();

    // Mentor feedback
    expect(screen.getByText(/Mentor Advisory Guidance/i)).toBeInTheDocument();
    expect(screen.getByText(/"Focus on buffer cache hits."/i)).toBeInTheDocument();
  });

  it('opens review modal and allows employee to rate remedial study material', async () => {
    weakAreaApi.submitReview.mockResolvedValue({
      data: { id: 2, rating: 5, reviewText: 'Very helpful guide' },
    });

    render(<WeakAreasSection />);

    const rateBtn = await screen.findByText('Rate');
    fireEvent.click(rateBtn);

    expect(screen.getByText(/Review Material for PostgreSQL & Database Optimization/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/How did this material help address your weak area/i)).toBeInTheDocument();
  });
});

