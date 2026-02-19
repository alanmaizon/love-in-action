import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../Layout';
import * as AuthContext from '../../context/AuthContext';

vi.mock('../../context/AuthContext');

function renderLayout(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Layout />
    </MemoryRouter>
  );
}

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows brand link', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
    });

    renderLayout();

    // Brand name appears in both navbar and footer
    const brandElements = screen.getAllByText('Love In Action');
    expect(brandElements.length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Love In Action' })).toHaveAttribute('href', '/');
  });

  it('shows charities link', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
    });

    renderLayout();

    expect(screen.getByRole('link', { name: 'Charities' })).toBeInTheDocument();
  });

  it('shows dashboard link when authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: true,
      logout: vi.fn(),
    });

    renderLayout();

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('shows login link when not authenticated', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
    });

    renderLayout();

    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('calls logout handler when logout button is clicked', async () => {
    const mockLogout = vi.fn().mockResolvedValue({});
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
    });

    renderLayout();

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
  });

  it('handles logout failure gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'));
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
    });

    renderLayout();

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('renders footer with copyright', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
    });

    renderLayout();

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
  });

  it('renders footer links', () => {
    AuthContext.useAuth.mockReturnValue({
      isAuthenticated: false,
      logout: vi.fn(),
    });

    renderLayout();

    expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
  });
});
