import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as AuthContext from '../../context/AuthContext';

vi.mock('../../context/AuthContext');

function renderWithRouter(ui, { route = '/protected' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows spinner while loading', () => {
    AuthContext.useAuth.mockReturnValue({
      loading: true,
      isAuthenticated: false,
    });

    renderWithRouter(<ProtectedRoute><div>Content</div></ProtectedRoute>);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
    });

    renderWithRouter(<ProtectedRoute><div>Content</div></ProtectedRoute>);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: false,
    });

    renderWithRouter(<ProtectedRoute><div>Content</div></ProtectedRoute>);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not show spinner when not loading', () => {
    AuthContext.useAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
    });

    renderWithRouter(<ProtectedRoute><div>Content</div></ProtectedRoute>);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
