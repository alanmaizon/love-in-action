import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import * as api from '../../services/api';

vi.mock('../../services/api');

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{auth.loading.toString()}</span>
      <span data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</span>
      <span data-testid="username">{auth.user?.username || 'none'}</span>
      <button onClick={() => auth.login('testuser', 'password')}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.refreshUser()}>Refresh</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with loading true', async () => {
    api.getCsrfToken.mockResolvedValue({});
    api.getMe.mockRejectedValue(new Error('Not authenticated'));

    let loadingValue;
    function CaptureLoading() {
      const { loading } = useAuth();
      loadingValue = loading;
      return null;
    }

    render(
      <AuthProvider>
        <CaptureLoading />
      </AuthProvider>
    );

    // Initial render should have loading as true
    expect(loadingValue).toBe(true);
  });

  it('fetches user on mount when authenticated', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    api.getCsrfToken.mockResolvedValue({});
    api.getMe.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(api.getCsrfToken).toHaveBeenCalled();
    expect(api.getMe).toHaveBeenCalled();
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('testuser');
  });

  it('sets user to null when not authenticated', async () => {
    api.getCsrfToken.mockResolvedValue({});
    api.getMe.mockRejectedValue({ response: { status: 401 } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('username').textContent).toBe('none');
  });

  it('login calls api and sets user', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    api.getCsrfToken.mockResolvedValue({});
    api.getMe.mockRejectedValue({ response: { status: 401 } });
    api.login.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Login' }).click();
    });

    expect(api.login).toHaveBeenCalledWith('testuser', 'password');
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('testuser');
  });

  it('logout clears user', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    api.getCsrfToken.mockResolvedValue({});
    api.getMe.mockResolvedValue({ data: mockUser });
    api.logout.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    expect(api.logout).toHaveBeenCalled();
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('username').textContent).toBe('none');
  });

  it('refreshUser updates user data', async () => {
    const initialUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    const updatedUser = { id: 1, username: 'testuser', email: 'new@example.com' };

    api.getCsrfToken.mockResolvedValue({});
    api.getMe
      .mockResolvedValueOnce({ data: initialUser })
      .mockResolvedValueOnce({ data: updatedUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await act(async () => {
      screen.getByRole('button', { name: 'Refresh' }).click();
    });

    // getCsrfToken called twice (init + refresh)
    expect(api.getCsrfToken).toHaveBeenCalledTimes(2);
    expect(api.getMe).toHaveBeenCalledTimes(2);
  });

  it('isAuthenticated returns true when user exists', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    api.getCsrfToken.mockResolvedValue({});
    api.getMe.mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    });
  });

  it('isAuthenticated returns false when user is null', async () => {
    api.getCsrfToken.mockResolvedValue({});
    api.getMe.mockRejectedValue({ response: { status: 401 } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});
