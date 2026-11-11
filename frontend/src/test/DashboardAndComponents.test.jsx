import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { Target, AlertCircle } from 'lucide-react';

describe('Common Dashboard Components Tests', () => {
  it('renders StatCard with title, value, subtext, and badge', () => {
    render(
      <StatCard
        icon={Target}
        title="Active Skill Gaps"
        value="4"
        badgeText="12.0 Weighted"
        badgeType="warning"
        subtext="Requires upskilling or diagnostic evaluation"
      />
    );

    expect(screen.getByText('Active Skill Gaps')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('12.0 Weighted')).toBeInTheDocument();
    expect(screen.getByText('Requires upskilling or diagnostic evaluation')).toBeInTheDocument();
  });

  it('renders EmptyState with action button and triggers callback', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Learning Pathway"
        description="Click below to generate a roadmap."
        actionLabel="Generate Pathway"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No Learning Pathway')).toBeInTheDocument();
    expect(screen.getByText('Click below to generate a roadmap.')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Generate Pathway' });
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders ErrorAlert with retry button and triggers callback', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorAlert message="Failed to connect to ML service" onRetry={handleRetry} />
    );

    expect(screen.getByText('Failed to connect to ML service')).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
