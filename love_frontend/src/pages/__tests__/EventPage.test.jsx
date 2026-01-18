import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import EventPage from '../EventPage';
import * as api from '../../services/api';

vi.mock('../../services/api');

const mockEvent = {
  id: 1,
  slug: 'test-event',
  title: 'Test Event',
  event_type: 'wedding',
  story: 'This is our story',
  event_date: '2024-06-15',
  location: 'Dublin, Ireland',
  total_raised: 500,
  goal_amount: 1000,
  donor_count: 10,
  event_charities: [
    {
      charity: {
        id: 1,
        name: 'Test Charity',
        logo: 'https://example.com/logo.png',
        is_verified: true,
      },
      custom_message: 'We love this charity',
    }
  ]
};

function renderEventPage(route = '/event/test-event') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/event/:slug" element={<EventPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EventPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner initially', () => {
    api.getEvent.mockImplementation(() => new Promise(() => {}));
    renderEventPage();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays event details after loading', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderEventPage();

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    expect(screen.getByText('wedding')).toBeInTheDocument();
    expect(screen.getByText('Dublin, Ireland')).toBeInTheDocument();
    expect(screen.getByText('This is our story')).toBeInTheDocument();
  });

  it('displays charities', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderEventPage();

    await waitFor(() => {
      expect(screen.getByText('Test Charity')).toBeInTheDocument();
    });

    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('We love this charity')).toBeInTheDocument();
  });

  it('shows donation stats', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderEventPage();

    await waitFor(() => {
      expect(screen.getByText(/€500/)).toBeInTheDocument();
    });

    expect(screen.getByText(/of €1,000 goal/)).toBeInTheDocument();
    expect(screen.getByText('10 donors')).toBeInTheDocument();
  });

  it('shows donate button with link', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderEventPage();

    await waitFor(() => {
      const donateButton = screen.getByRole('link', { name: /Donate Now/i });
      expect(donateButton).toHaveAttribute('href', '/donate/test-event');
    });
  });

  it('shows error for missing event', async () => {
    api.getEvent.mockRejectedValue({ response: { status: 404 } });
    renderEventPage();

    await waitFor(() => {
      expect(screen.getByText('Event not found')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/');
  });

  it('handles event without goal amount', async () => {
    const eventWithoutGoal = { ...mockEvent, goal_amount: null };
    api.getEvent.mockResolvedValue({ data: eventWithoutGoal });
    renderEventPage();

    await waitFor(() => {
      expect(screen.getByText(/€500/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/goal/)).not.toBeInTheDocument();
  });

  it('handles event without story', async () => {
    const eventWithoutStory = { ...mockEvent, story: '' };
    api.getEvent.mockResolvedValue({ data: eventWithoutStory });
    renderEventPage();

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    expect(screen.queryByText('Our Story')).not.toBeInTheDocument();
  });
});
