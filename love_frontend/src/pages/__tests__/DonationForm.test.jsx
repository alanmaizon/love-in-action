import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DonationForm from '../DonationForm';
import * as api from '../../services/api';

vi.mock('../../services/api');

const mockEvent = {
  id: 1,
  slug: 'test-event',
  title: 'Test Event',
  event_charities: [
    {
      charity: {
        id: 1,
        name: 'Charity One',
        logo: 'https://example.com/logo1.png',
      }
    },
    {
      charity: {
        id: 2,
        name: 'Charity Two',
        logo: 'https://example.com/logo2.png',
      }
    }
  ]
};

function renderDonationForm(route = '/donate/test-event') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/donate/:slug" element={<DonationForm />} />
        <Route path="/event/:slug" element={<div>Event Page</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DonationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location.href
    delete window.location;
    window.location = { href: '' };
  });

  it('shows loading spinner initially', () => {
    api.getEvent.mockImplementation(() => new Promise(() => {}));
    renderDonationForm();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders charity selection', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByText('Charity One')).toBeInTheDocument();
    });

    expect(screen.getByText('Charity Two')).toBeInTheDocument();
  });

  it('renders amount buttons', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '€25' })).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: '€50' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '€100' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '€250' })).toBeInTheDocument();
  });

  it('selects preset amount', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '€50' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '€50' }));

    // The button should have the active class
    expect(screen.getByRole('button', { name: '€50' })).toHaveClass('btn-primary');
    expect(screen.getByRole('button', { name: '€25' })).toHaveClass('btn-outline-primary');
  });

  it('validates amount is required', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByText('Charity One')).toBeInTheDocument();
    });

    // Select a charity but no amount
    fireEvent.click(screen.getByText('Charity One'));

    // Submit without selecting amount
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid amount/i)).toBeInTheDocument();
    });
  });

  it('validates charity selection', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '€50' })).toBeInTheDocument();
    });

    // Select amount but not charity
    fireEvent.click(screen.getByRole('button', { name: '€50' }));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please select a charity/i)).toBeInTheDocument();
    });
  });

  it('submit creates session and redirects to Stripe', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    api.createDonationSession.mockResolvedValue({
      data: { checkout_url: 'https://checkout.stripe.com/test' }
    });

    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByText('Charity One')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.click(screen.getByText('Charity One'));
    fireEvent.click(screen.getByRole('button', { name: '€50' }));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(api.createDonationSession).toHaveBeenCalledWith({
        event_slug: 'test-event',
        charity_id: 1,
        amount: 50,
        donor_name: 'Anonymous',
        donor_email: '',
        message: '',
        is_anonymous: false,
      });
    });

    expect(window.location.href).toBe('https://checkout.stripe.com/test');
  });

  it('pre-selects charity when only one exists', async () => {
    const singleCharityEvent = {
      ...mockEvent,
      event_charities: [mockEvent.event_charities[0]]
    };
    api.getEvent.mockResolvedValue({ data: singleCharityEvent });
    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByText('Charity One')).toBeInTheDocument();
    });

    // The single charity should be pre-selected
    const radioButton = screen.getByRole('radio');
    expect(radioButton).toBeChecked();
  });

  it('shows error when event not found', async () => {
    api.getEvent.mockRejectedValue({ response: { status: 404 } });
    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByText('Event not found')).toBeInTheDocument();
    });
  });

  it('shows error from API on submit failure', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    api.createDonationSession.mockRejectedValue({
      response: { data: { error: 'Payment service error' } }
    });

    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByText('Charity One')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.click(screen.getByText('Charity One'));
    fireEvent.click(screen.getByRole('button', { name: '€50' }));

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(screen.getByText('Payment service error')).toBeInTheDocument();
    });
  });

  it('handles custom amount input', async () => {
    api.getEvent.mockResolvedValue({ data: mockEvent });
    api.createDonationSession.mockResolvedValue({
      data: { checkout_url: 'https://checkout.stripe.com/test' }
    });

    renderDonationForm();

    await waitFor(() => {
      expect(screen.getByText('Charity One')).toBeInTheDocument();
    });

    // Fill form with custom amount
    fireEvent.click(screen.getByText('Charity One'));
    const customAmountInput = screen.getByPlaceholderText('Other amount');
    fireEvent.change(customAmountInput, { target: { value: '75' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }));

    await waitFor(() => {
      expect(api.createDonationSession).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 75 })
      );
    });
  });
});
