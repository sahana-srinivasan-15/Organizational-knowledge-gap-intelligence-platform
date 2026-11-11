import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import PublicTransparencyPortal from '../pages/PublicTransparencyPortal';
import LoginPage from '../pages/LoginPage';

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Competency & Governance Platform Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders landing page with title, Four Pillars, and dual CTAs without mentioning Public Transparency Portal or fake statistics', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <PublicTransparencyPortal />
        </MemoryRouter>
      </AuthProvider>
    );

    // Title and Branding
    expect(screen.getByText('OrgKGI')).toBeInTheDocument();
    expect(screen.getByText('Organizational Knowledge Gap Intelligence Platform')).toBeInTheDocument();
    expect(screen.getByText(/Competency & Governance Platform/i)).toBeInTheDocument();

    // Verify "Public Transparency Portal" is NOT mentioned
    expect(screen.queryByText(/Public Transparency Portal/i)).not.toBeInTheDocument();

    // Verify "Ready to bring..." section is removed
    expect(screen.queryByText(/Ready to bring/i)).not.toBeInTheDocument();

    // Verify navbar header does NOT have create company account, login, sign in, or workspace buttons
    const headerEl = screen.getByRole('banner');
    expect(headerEl).not.toHaveTextContent('Transparency Portal');
    expect(headerEl).not.toHaveTextContent('Create Account for Company');
    expect(headerEl).not.toHaveTextContent('Login');
    expect(headerEl).not.toHaveTextContent('Sign In');
    expect(headerEl).not.toHaveTextContent('Go to Workspace');

    // Key dual CTAs in Hero: Create Account for Company & Login
    const createCompanyBtns = screen.getAllByRole('button', { name: /Create Account for Company/i });
    expect(createCompanyBtns.length).toBeGreaterThanOrEqual(1);

    const loginBtns = screen.getAllByRole('button', { name: /Login/i });
    expect(loginBtns.length).toBeGreaterThanOrEqual(1);

    // Verify fake marketing metrics are NOT present
    expect(screen.queryByText('2,450+')).not.toBeInTheDocument();
    expect(screen.queryByText('120+')).not.toBeInTheDocument();
  });

  it('clicking Login navigates to /login', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <PublicTransparencyPortal />
        </MemoryRouter>
      </AuthProvider>
    );

    const loginBtn = screen.getAllByRole('button', { name: /Login/i })[0];
    fireEvent.click(loginBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders Four Pillars cards prominently without redundant heading', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <PublicTransparencyPortal />
        </MemoryRouter>
      </AuthProvider>
    );

    // Verify Four Pillars heading is rendered
    expect(screen.getByText('Four Pillars')).toBeInTheDocument();
    expect(screen.queryByText('Verification Kernel')).not.toBeInTheDocument();

    // Pillar 1: Tamper-Proof Certifications
    expect(screen.getByText('Tamper-Proof Certifications')).toBeInTheDocument();
    expect(screen.getByText(/ML-verified course credentials/i)).toBeInTheDocument();

    // Pillar 2: Peer Mentorship Governance
    expect(screen.getByText('Peer Mentorship Governance')).toBeInTheDocument();
    expect(screen.getByText(/1-on-1 mentor guidance/i)).toBeInTheDocument();

    // Pillar 3: Diagnostic Knowledge Radar
    expect(screen.getByText('Diagnostic Knowledge Radar')).toBeInTheDocument();
    expect(screen.getByText(/Topic-level assessments/i)).toBeInTheDocument();

    // Pillar 4: ML Outcome Predictions
    expect(screen.getByText('ML Outcome Predictions')).toBeInTheDocument();
    expect(screen.getByText(/Predictive models forecasting training completion/i)).toBeInTheDocument();
  });

  it('clicking Create Account for Company opens the modal and provisions new company workspace', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <PublicTransparencyPortal />
        </MemoryRouter>
      </AuthProvider>
    );

    // Open modal
    const createBtn = screen.getAllByRole('button', { name: /Create Account for Company/i })[0];
    fireEvent.click(createBtn);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Acme Cloud Innovations/i), {
      target: { value: 'Wayne Enterprises' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. acme\.io/i), {
      target: { value: 'wayne.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/admin@acme\.io/i), {
      target: { value: 'bruce@wayne.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\. Sarah Connor/i), {
      target: { value: 'Bruce Wayne' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Minimum 6 characters/i), {
      target: { value: 'Batcave@123' },
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Register Company Workspace/i });
    fireEvent.click(submitBtn);

    // Expect provisioned success message
    await waitFor(() => {
      expect(screen.getByText(/Company Workspace Provisioned!/i)).toBeInTheDocument();
      expect(screen.getByText('bruce@wayne.com')).toBeInTheDocument();
      expect(screen.getByText(/Wayne Enterprises/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Click Proceed to Login
    const proceedBtn = screen.getByRole('button', { name: /Proceed to Login/i });
    fireEvent.click(proceedBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login?email=bruce%40wayne.com');
  });

  it('verifies Home navigation button is removed from LoginPage', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    const homeBtn = screen.queryByRole('button', { name: /Home/i });
    expect(homeBtn).not.toBeInTheDocument();
  });
});
