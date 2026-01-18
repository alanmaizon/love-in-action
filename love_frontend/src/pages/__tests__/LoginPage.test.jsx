import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import * as AuthContext from '../../context/AuthContext';
import * as api from '../../services/api';

vi.mock('../../context/AuthContext');
vi.mock('../../services/api');

function renderLoginPage(route = '/login') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      login: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });
    api.getSocialProviders.mockResolvedValue({ data: { providers: [] } });
  });

  it('renders login form fields', async () => {
    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows Google button when provider is available', async () => {
    api.getSocialProviders.mockResolvedValue({
      data: {
        providers: [{ provider: 'google', name: 'Google', client_id: 'test-id' }]
      }
    });

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    });
  });

  it('does not show Google button when provider is not available', async () => {
    api.getSocialProviders.mockResolvedValue({ data: { providers: [] } });

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Continue with Google/i })).not.toBeInTheDocument();
  });

  it('submits login form successfully', async () => {
    const mockLogin = vi.fn().mockResolvedValue({});
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin,
      refreshUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    // Use input type selectors
    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]');

    fireEvent.change(emailInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('shows error on login failure', async () => {
    const mockLogin = vi.fn().mockRejectedValue({
      response: { data: { error: 'Invalid credentials' } }
    });
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin,
      refreshUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]');

    fireEvent.change(emailInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    const mockLogin = vi.fn(() => new Promise(() => {})); // Never resolves
    AuthContext.useAuth.mockReturnValue({
      login: mockLogin,
      refreshUser: vi.fn(),
      isAuthenticated: false,
      loading: false,
    });

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    const emailInput = screen.getByRole('textbox');
    const passwordInput = document.querySelector('input[type="password"]');

    fireEvent.change(emailInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Logging in/i })).toBeDisabled();
    });
  });

  it('shows error for failed social login callback', async () => {
    renderLoginPage('/login?social_login=failed');

    await waitFor(() => {
      expect(screen.getByText(/Social login failed/i)).toBeInTheDocument();
    });
  });

  it('redirects to dashboard when already authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      login: vi.fn(),
      refreshUser: vi.fn(),
      isAuthenticated: true,
      loading: false,
    });

    renderLoginPage();

    // Should not render login form
    expect(screen.queryByRole('button', { name: 'Login' })).not.toBeInTheDocument();
  });
});
