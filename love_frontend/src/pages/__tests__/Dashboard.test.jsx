import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../Dashboard';
import * as api from '../../services/api';

vi.mock('../../services/api');

const mockEvents = [
  {
    id: 1,
    slug: 'wedding-event',
    title: 'Our Wedding',
    event_type: 'wedding',
    event_date: '2024-06-15',
    status: 'active',
    cover_photo: 'https://example.com/photo.jpg',
    total_raised: 500,
    donor_count: 10,
  },
  {
    id: 2,
    slug: 'birthday-event',
    title: 'Birthday Party',
    event_type: 'birthday',
    event_date: null,
    status: 'draft',
    cover_photo: null,
    total_raised: 0,
    donor_count: 0,
  }
];

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/create" element={<div>Create Event</div>} />
        <Route path="/dashboard/event/:id" element={<div>Manage Event</div>} />
        <Route path="/event/:slug" element={<div>Event Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    // Mock alert
    global.alert = vi.fn();
  });

  it('shows loading spinner initially', () => {
    api.getDashboardEvents.mockImplementation(() => new Promise(() => {}));
    renderDashboard();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no events', async () => {
    api.getDashboardEvents.mockResolvedValue({ data: [] });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No events yet')).toBeInTheDocument();
    });

    expect(screen.getByText(/Create your first celebration page/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Your First Event/i })).toBeInTheDocument();
  });

  it('displays event cards', async () => {
    api.getDashboardEvents.mockResolvedValue({ data: mockEvents });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Our Wedding')).toBeInTheDocument();
    });

    expect(screen.getByText('Birthday Party')).toBeInTheDocument();
    expect(screen.getByText('€500 raised')).toBeInTheDocument();
    expect(screen.getByText('10 donors')).toBeInTheDocument();
  });

  it('shows correct status badges', async () => {
    api.getDashboardEvents.mockResolvedValue({ data: mockEvents });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('has create event button', async () => {
    api.getDashboardEvents.mockResolvedValue({ data: mockEvents });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Create Event/i })).toHaveAttribute('href', '/dashboard/create');
    });
  });

  it('has view, manage, and share buttons for each event', async () => {
    api.getDashboardEvents.mockResolvedValue({ data: mockEvents });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Our Wedding')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('link', { name: /View/i });
    const manageButtons = screen.getAllByRole('link', { name: /Manage/i });
    const shareButtons = screen.getAllByRole('button', { name: /Share/i });

    expect(viewButtons).toHaveLength(2);
    expect(manageButtons).toHaveLength(2);
    expect(shareButtons).toHaveLength(2);
  });

  it('copies share link when share button clicked', async () => {
    api.getDashboardEvents.mockResolvedValue({ data: mockEvents });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Our Wedding')).toBeInTheDocument();
    });

    const shareButtons = screen.getAllByRole('button', { name: /Share/i });
    fireEvent.click(shareButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('/event/wedding-event')
    );
    expect(global.alert).toHaveBeenCalledWith('Link copied to clipboard!');
  });

  it('displays event date when available', async () => {
    api.getDashboardEvents.mockResolvedValue({ data: mockEvents });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Our Wedding')).toBeInTheDocument();
    });

    // The first event has a date (6/15/2024)
    expect(screen.getByText(/6\/15\/2024/)).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.getDashboardEvents.mockRejectedValue(new Error('Network error'));
    renderDashboard();

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});
