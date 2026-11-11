import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import { authApi } from '../api/authApi';

vi.mock('../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe('Authentication & Protected Routing Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders login page with title, inputs, and quick-fill buttons', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Org Knowledge Gap Platform/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/name@orgkgi.dev/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••••••/i)).toBeInTheDocument();

    // Verify quick fill buttons
    expect(screen.getByRole('button', { name: /^Employee$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Manager$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Mentor$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Admin$/i })).toBeInTheDocument();
  });

  it('quick fill button populates credentials for employee', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const empButton = screen.getByRole('button', { name: /^Employee$/i });
    fireEvent.click(empButton);

    const emailInput = screen.getByPlaceholderText(/name@orgkgi.dev/i);
    const passInput = screen.getByPlaceholderText(/••••••••••••/i);

    expect(emailInput.value).toBe('david.junior@orgkgi.dev');
    expect(passInput.value).toBe('Password@123');
  });

  it('quick fill button populates credentials for mentor', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const mentorBtn = screen.getByRole('button', { name: /^Mentor$/i });
    fireEvent.click(mentorBtn);

    const emailInput = screen.getByPlaceholderText(/name@orgkgi.dev/i);
    const passInput = screen.getByPlaceholderText(/••••••••••••/i);

    expect(emailInput.value).toBe('mentor.alex@orgkgi.dev');
    expect(passInput.value).toBe('Password@123');
  });

  it('allows user to select role first and choose preset or type custom credentials', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    // Verify "Active:" badge is not shown
    expect(screen.queryByText(/Active:/i)).not.toBeInTheDocument();

    // Select MENTOR role
    const mentorBtn = screen.getByRole('button', { name: /^Mentor$/i });
    fireEvent.click(mentorBtn);

    expect(screen.queryByText(/Active:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Guide assigned mentees/i)).not.toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/name@orgkgi.dev/i);
    expect(emailInput.value).toBe('mentor.alex@orgkgi.dev');

    // Type custom credentials
    fireEvent.change(emailInput, { target: { value: 'custom.mentor@orgkgi.dev' } });
    expect(emailInput.value).toBe('custom.mentor@orgkgi.dev');
  });

  it('submitting login form calls authApi.login and stores token and mapped user on success with actual Spring Boot shape', async () => {
    authApi.login.mockResolvedValueOnce({
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken: 'mock-access-token-jwt-secure',
        tokenType: 'Bearer',
        userId: 4,
        email: 'david.junior@orgkgi.dev',
        fullName: 'David Kim',
        role: 'EMPLOYEE',
        departmentId: 1,
        departmentName: 'Engineering',
      },
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Employee$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Portal/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('david.junior@orgkgi.dev', 'Password@123');
      // Verify token is stored without printing secret JWT in output
      const storedToken = localStorage.getItem('token');
      expect(storedToken).toBeTruthy();
      expect(typeof storedToken).toBe('string');

      // Verify user fields mapped correctly from Spring Boot response
      const storedUser = JSON.parse(localStorage.getItem('user'));
      expect(storedUser).toBeDefined();
      expect(storedUser.userId).toBe(4);
      expect(storedUser.id).toBe(4);
      expect(storedUser.email).toBe('david.junior@orgkgi.dev');
      expect(storedUser.fullName).toBe('David Kim');
      expect(storedUser.role).toBe('EMPLOYEE');
      expect(storedUser.departmentId).toBe(1);
      expect(storedUser.departmentName).toBe('Engineering');
      expect(storedUser.department).toBeDefined();
      expect(storedUser.department.id).toBe(1);
      expect(storedUser.department.name).toBe('Engineering');

      // Verify success message is NOT rendered as an error alert
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText(/Authentication successful/i)).not.toBeInTheDocument();
    });
  });

  it('displays error alert with appropriate styling when login fails with 401 unauthorized', async () => {
    authApi.login.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          status: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          path: '/api/v1/auth/login',
        },
      },
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Employee$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Portal/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalled();
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('handles server failure response with success=false gracefully', async () => {
    authApi.login.mockResolvedValueOnce({
      success: false,
      message: 'User account is deactivated',
      data: null,
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /^Employee$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Sign In to Portal/i }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(screen.getByText('User account is deactivated')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('preserves authentication context API and role helpers', async () => {
    const TestConsumer = () => {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="auth-state">{auth.isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
          <span data-testid="is-employee">{auth.isEmployee ? 'true' : 'false'}</span>
          <span data-testid="is-manager">{auth.isManager ? 'true' : 'false'}</span>
          <span data-testid="is-admin">{auth.isAdmin ? 'true' : 'false'}</span>
          <span data-testid="is-mentor">{auth.isMentor ? 'true' : 'false'}</span>
          <button
            onClick={() =>
              auth.login('manager.eng@orgkgi.dev', 'Password@123')
            }
          >
            Login Manager
          </button>
          <button
            onClick={() =>
              auth.login('mentor.alex@orgkgi.dev', 'Password@123')
            }
          >
            Login Mentor
          </button>
        </div>
      );
    };

    authApi.login.mockResolvedValueOnce({
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken: 'mock-manager-jwt',
        tokenType: 'Bearer',
        userId: 2,
        email: 'manager.eng@orgkgi.dev',
        fullName: 'Sarah Connor',
        role: 'MANAGER',
        departmentId: 1,
        departmentName: 'Engineering',
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-state').textContent).toBe('unauthenticated');

    fireEvent.click(screen.getByRole('button', { name: /Login Manager/i }));

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('authenticated');
      expect(screen.getByTestId('is-manager').textContent).toBe('true');
      expect(screen.getByTestId('is-employee').textContent).toBe('false');
      expect(screen.getByTestId('is-admin').textContent).toBe('false');
      expect(screen.getByTestId('is-mentor').textContent).toBe('false');
    });
  });

  it('authenticates mentor role and sets isMentor flag correctly', async () => {
    const MentorConsumer = () => {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="mentor-auth">{auth.isAuthenticated ? 'authenticated' : 'unauthenticated'}</span>
          <span data-testid="mentor-is-mentor">{auth.isMentor ? 'true' : 'false'}</span>
          <span data-testid="mentor-is-employee">{auth.isEmployee ? 'true' : 'false'}</span>
          <button onClick={() => auth.login('mentor.alex@orgkgi.dev', 'Password@123')}>
            Login Mentor
          </button>
        </div>
      );
    };

    authApi.login.mockResolvedValueOnce({
      success: true,
      message: 'Authentication successful',
      data: {
        accessToken: 'mock-mentor-jwt-token',
        tokenType: 'Bearer',
        userId: 6,
        email: 'mentor.alex@orgkgi.dev',
        fullName: 'Alex Vance',
        role: 'MENTOR',
        departmentId: 1,
        departmentName: 'Engineering',
      },
    });

    render(
      <AuthProvider>
        <MentorConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Login Mentor/i }));

    await waitFor(() => {
      expect(screen.getByTestId('mentor-auth').textContent).toBe('authenticated');
      expect(screen.getByTestId('mentor-is-mentor').textContent).toBe('true');
      expect(screen.getByTestId('mentor-is-employee').textContent).toBe('false');
    });
  });

  it('renders unauthorized page with return button', () => {
    render(
      <MemoryRouter>
        <UnauthorizedPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/Return to Dashboard/i)).toBeInTheDocument();
  });
});
