import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DonationSuccess from '../DonationSuccess';

function renderDonationSuccess(route = '/donate/test-event/success') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/donate/:slug/success" element={<DonationSuccess />} />
        <Route path="/event/:slug" element={<div>Event Page</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DonationSuccess', () => {
  it('displays thank you message', () => {
    renderDonationSuccess();

    expect(screen.getByText('Thank You!')).toBeInTheDocument();
    expect(screen.getByText(/Your donation has been received/i)).toBeInTheDocument();
  });

  it('shows return to event link', () => {
    renderDonationSuccess();

    const eventLink = screen.getByRole('link', { name: 'Return to Event Page' });
    expect(eventLink).toHaveAttribute('href', '/event/test-event');
  });

  it('shows go home link', () => {
    renderDonationSuccess();

    const homeLink = screen.getByRole('link', { name: 'Go Home' });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('shows session reference when provided', () => {
    renderDonationSuccess('/donate/test-event/success?session_id=cs_test_1234567890abcdef');

    expect(screen.getByText(/Reference:/)).toBeInTheDocument();
    expect(screen.getByText(/cs_test_1234567890ab/)).toBeInTheDocument();
  });

  it('does not show reference when session_id not provided', () => {
    renderDonationSuccess('/donate/test-event/success');

    expect(screen.queryByText(/Reference:/)).not.toBeInTheDocument();
  });

  it('shows notification message', () => {
    renderDonationSuccess();

    expect(screen.getByText(/The hosts will be notified/i)).toBeInTheDocument();
  });
});
