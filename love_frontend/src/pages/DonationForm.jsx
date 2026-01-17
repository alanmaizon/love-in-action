import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, createDonationSession } from '../services/api';
import { FaArrowLeft, FaHeart } from 'react-icons/fa';

const PRESET_AMOUNTS = [25, 50, 100, 250];

export default function DonationForm() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    charity_id: '',
    amount: '',
    customAmount: '',
    donor_name: '',
    donor_email: '',
    message: '',
    is_anonymous: false,
  });

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    try {
      const response = await getEvent(slug);
      setEvent(response.data);
      // Pre-select first charity if only one
      if (response.data.event_charities?.length === 1) {
        setFormData(prev => ({
          ...prev,
          charity_id: response.data.event_charities[0].charity.id,
        }));
      }
    } catch (err) {
      setError('Event not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAmountClick = (amount) => {
    setFormData(prev => ({ ...prev, amount: amount.toString(), customAmount: '' }));
  };

  const handleCustomAmount = (e) => {
    setFormData(prev => ({ ...prev, amount: '', customAmount: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const finalAmount = formData.customAmount || formData.amount;

    if (!finalAmount || parseFloat(finalAmount) < 1) {
      setError('Please enter a valid amount (minimum €1)');
      setSubmitting(false);
      return;
    }

    if (!formData.charity_id) {
      setError('Please select a charity');
      setSubmitting(false);
      return;
    }

    try {
      const response = await createDonationSession({
        event_slug: slug,
        charity_id: parseInt(formData.charity_id),
        amount: parseFloat(finalAmount),
        donor_name: formData.donor_name || 'Anonymous',
        donor_email: formData.donor_email,
        message: formData.message,
        is_anonymous: formData.is_anonymous,
      });

      // Redirect to Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="container py-5 text-center">
        <h2>Event not found</h2>
        <Link to="/" className="btn btn-primary mt-3">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <Link to={`/event/${slug}`} className="btn btn-link mb-3 px-0">
            <FaArrowLeft className="me-2" />
            Back to {event.title}
          </Link>

          <div className="card">
            <div className="card-body p-4">
              <h2 className="card-title mb-4">
                <FaHeart className="text-primary me-2" />
                Make a Donation
              </h2>

              {error && (
                <div className="alert alert-danger">{error}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Charity Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Choose a charity</label>
                  <div className="row g-2">
                    {event.event_charities?.map(({ charity }) => (
                      <div key={charity.id} className="col-12">
                        <div
                          className={`card cursor-pointer ${
                            formData.charity_id === charity.id ? 'border-primary' : ''
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, charity_id: charity.id }))}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body py-2 d-flex align-items-center">
                            <input
                              type="radio"
                              name="charity"
                              checked={formData.charity_id === charity.id}
                              onChange={() => {}}
                              className="form-check-input me-3"
                            />
                            {charity.logo && (
                              <img
                                src={charity.logo}
                                alt=""
                                className="me-3"
                                style={{ width: 40, height: 40, objectFit: 'contain' }}
                              />
                            )}
                            <span>{charity.name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amount Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold">Donation amount</label>
                  <div className="row g-2 mb-2">
                    {PRESET_AMOUNTS.map((amount) => (
                      <div key={amount} className="col-3">
                        <button
                          type="button"
                          className={`btn w-100 ${
                            formData.amount === amount.toString()
                              ? 'btn-primary'
                              : 'btn-outline-primary'
                          }`}
                          onClick={() => handleAmountClick(amount)}
                        >
                          €{amount}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="input-group">
                    <span className="input-group-text">€</span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Other amount"
                      min="1"
                      step="0.01"
                      value={formData.customAmount}
                      onChange={handleCustomAmount}
                    />
                  </div>
                </div>

                {/* Donor Info */}
                <div className="mb-3">
                  <label className="form-label">Your name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.donor_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, donor_name: e.target.value }))}
                    placeholder="Optional - leave blank for anonymous"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email (for receipt)</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.donor_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, donor_email: e.target.value }))}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Message (optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Leave a message for the hosts..."
                  />
                </div>

                <div className="mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="anonymous"
                      checked={formData.is_anonymous}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                    />
                    <label className="form-check-label" htmlFor="anonymous">
                      Hide my name from the public donation list
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaHeart className="me-2" />
                      Continue to Payment
                    </>
                  )}
                </button>
              </form>

              <p className="text-muted small text-center mt-3 mb-0">
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
