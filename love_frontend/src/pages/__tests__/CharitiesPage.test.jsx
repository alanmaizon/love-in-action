import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CharitiesPage from '../CharitiesPage';
import * as api from '../../services/api';

vi.mock('../../services/api');

const mockCharities = [
  {
    id: 1,
    name: 'Test Charity One',
    slug: 'test-charity-one',
    description: 'Description one',
    category: 'children',
    website: 'https://charity1.com',
    logo: 'https://example.com/logo1.png',
    is_verified: true,
  },
  {
    id: 2,
    name: 'Test Charity Two',
    slug: 'test-charity-two',
    description: 'Description two',
    category: 'health',
    website: 'https://charity2.com',
    logo: null,
    is_verified: false,
  }
];

describe('CharitiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    api.getCharities.mockImplementation(() => new Promise(() => {}));
    render(<CharitiesPage />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays charities after loading', async () => {
    api.getCharities.mockResolvedValue({ data: mockCharities });
    render(<CharitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Charity One')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Charity Two')).toBeInTheDocument();
  });

  it('displays category badges', async () => {
    api.getCharities.mockResolvedValue({ data: mockCharities });
    render(<CharitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('children')).toBeInTheDocument();
    });

    expect(screen.getByText('health')).toBeInTheDocument();
  });

  it('shows verified badge for verified charities', async () => {
    api.getCharities.mockResolvedValue({ data: mockCharities });
    render(<CharitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    // Only one charity is verified
    expect(screen.getAllByText('Verified')).toHaveLength(1);
  });

  it('displays website links', async () => {
    api.getCharities.mockResolvedValue({ data: mockCharities });
    render(<CharitiesPage />);

    await waitFor(() => {
      const websiteLinks = screen.getAllByRole('link', { name: /Visit Website/i });
      expect(websiteLinks).toHaveLength(2);
      expect(websiteLinks[0]).toHaveAttribute('href', 'https://charity1.com');
      expect(websiteLinks[1]).toHaveAttribute('href', 'https://charity2.com');
    });
  });

  it('has category filter dropdown', async () => {
    api.getCharities.mockResolvedValue({ data: mockCharities });
    render(<CharitiesPage />);

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    expect(screen.getByRole('option', { name: 'All Categories' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Children' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Health' })).toBeInTheDocument();
  });

  it('filters by category', async () => {
    api.getCharities.mockResolvedValue({ data: mockCharities });
    render(<CharitiesPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Charity One')).toBeInTheDocument();
    });

    // Change category
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'children' } });

    // Verify API called with category
    await waitFor(() => {
      expect(api.getCharities).toHaveBeenCalledWith('children');
    });
  });

  it('shows empty message when no charities found', async () => {
    api.getCharities.mockResolvedValue({ data: [] });
    render(<CharitiesPage />);

    await waitFor(() => {
      expect(screen.getByText(/No charities found/i)).toBeInTheDocument();
    });
  });

  it('displays page title and description', async () => {
    api.getCharities.mockResolvedValue({ data: mockCharities });
    render(<CharitiesPage />);

    expect(screen.getByText('Our Partner Charities')).toBeInTheDocument();
    expect(screen.getByText(/verified Irish registered/i)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.getCharities.mockRejectedValue(new Error('Network error'));
    render(<CharitiesPage />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
