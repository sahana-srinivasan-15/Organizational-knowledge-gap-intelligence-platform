import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from '../pages/WelcomePage';
import AuthContext from '../context/AuthContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('WelcomePage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Welcome back greeting with employee name and stylish loading animation for EMPLOYEE', () => {
    const mockUser = {
      id: 4,
      fullName: 'David Kim',
      role: 'EMPLOYEE',
      departmentName: 'Engineering',
    };

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <WelcomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Welcome message with employee name
    expect(screen.getByText('Welcome back, David Kim!')).toBeInTheDocument();

    // Role badge
    expect(screen.getByText('Employee / Engineer')).toBeInTheDocument();

    // Loading status text below
    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();

    // Animated spinner element
    expect(screen.getByRole('status', { name: /Loading your dashboard/i })).toBeInTheDocument();
  });

  it('renders correctly for MANAGER with manager badge and loading animation', () => {
    const mockUser = {
      id: 2,
      fullName: 'Sarah Connor',
      role: 'MANAGER',
    };

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <WelcomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome back, Sarah Connor!')).toBeInTheDocument();
    expect(screen.getByText('Engineering Manager')).toBeInTheDocument();
    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });

  it('renders correctly for ADMIN with administrator badge and loading animation', () => {
    const mockUser = {
      id: 1,
      fullName: 'Master Admin',
      role: 'ADMIN',
    };

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <WelcomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome back, Master Admin!')).toBeInTheDocument();
    expect(screen.getByText('Platform Administrator')).toBeInTheDocument();
    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });

  it('renders correctly for MENTOR with mentor badge and loading animation', () => {
    const mockUser = {
      id: 3,
      fullName: 'Alex River',
      role: 'MENTOR',
    };

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <WelcomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome back, Alex River!')).toBeInTheDocument();
    expect(screen.getByText('Technical Mentor')).toBeInTheDocument();
    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });

  it('automatically navigates to /dashboard when the loading timer completes', () => {
    const mockUser = {
      id: 4,
      fullName: 'David Kim',
      role: 'EMPLOYEE',
    };

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <WelcomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(mockNavigate).not.toHaveBeenCalled();

    // Advance timer past 1800ms
    act(() => {
      vi.advanceTimersByTime(1900);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('falls back gracefully to email prefix when fullName is not provided', () => {
    const mockUser = {
      id: 5,
      email: 'robert.smith@orgkgi.dev',
      role: 'EMPLOYEE',
    };

    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter>
          <WelcomePage />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Welcome back, robert.smith!')).toBeInTheDocument();
    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });
});
