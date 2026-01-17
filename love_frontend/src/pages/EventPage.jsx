import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent } from '../services/api';
import { FaCalendar, FaMapMarkerAlt, FaHeart, FaUsers } from 'react-icons/fa';

export default function EventPage() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const fetchEvent = async () => {
    try {
      const response = await getEvent(slug);
      setEvent(response.data);
    } catch (err) {
      setError('Event not found');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="container py-5 text-center">
        <h2>{error}</h2>
        <Link to="/" className="btn btn-primary mt-3">Go Home</Link>
      </div>
    );
  }

  const progress = event.goal_amount
    ? Math.min((event.total_raised / event.goal_amount) * 100, 100)
    : 0;

  return (
    <>
      {/* Hero */}
      <section
        className="py-5 text-white"
        style={{
          background: event.cover_photo
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${event.cover_photo}) center/cover`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '40vh',
        }}
      >
        <div className="container py-5">
          <span className="badge bg-light text-dark mb-3 text-capitalize">
            {event.event_type}
          </span>
          <h1 className="display-4 fw-bold">{event.title}</h1>
          {event.event_date && (
            <p className="lead">
              <FaCalendar className="me-2" />
              {new Date(event.event_date).toLocaleDateString('en-IE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
          {event.location && (
            <p>
              <FaMapMarkerAlt className="me-2" />
              {event.location}
            </p>
          )}
        </div>
      </section>

      <div className="container py-5">
        <div className="row g-4">
          {/* Main Content */}
          <div className="col-lg-8">
            {/* Story */}
            {event.story && (
              <div className="card mb-4">
                <div className="card-body">
                  <h4 className="card-title mb-3">Our Story</h4>
                  <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {event.story}
                  </p>
                </div>
              </div>
            )}

            {/* Charities */}
            <div className="card">
              <div className="card-body">
                <h4 className="card-title mb-4">Charities We Support</h4>
                <div className="row g-3">
                  {event.event_charities?.map(({ charity, custom_message }) => (
                    <div key={charity.id} className="col-md-6">
                      <div className="card h-100 border">
                        <div className="card-body">
                          <div className="d-flex align-items-center mb-2">
                            {charity.logo && (
                              <img
                                src={charity.logo}
                                alt={charity.name}
                                className="me-3"
                                style={{ width: 48, height: 48, objectFit: 'contain' }}
                              />
                            )}
                            <div>
                              <h6 className="mb-0">{charity.name}</h6>
                              {charity.is_verified && (
                                <small className="text-success">Verified</small>
                              )}
                            </div>
                          </div>
                          {custom_message && (
                            <p className="small text-muted mb-0">{custom_message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card sticky-top" style={{ top: '1rem' }}>
              <div className="card-body">
                {/* Stats */}
                <div className="text-center mb-4">
                  <h2 className="text-primary mb-0">
                    €{parseFloat(event.total_raised || 0).toLocaleString()}
                  </h2>
                  <small className="text-muted">
                    raised{event.goal_amount && ` of €${parseFloat(event.goal_amount).toLocaleString()} goal`}
                  </small>

                  {event.goal_amount && (
                    <div className="progress mt-3" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <div className="d-flex justify-content-around mt-3 text-muted">
                    <div>
                      <FaUsers className="me-1" />
                      {event.donor_count} donors
                    </div>
                  </div>
                </div>

                {/* Donate Button */}
                <Link
                  to={`/donate/${event.slug}`}
                  className="btn btn-primary btn-lg w-100"
                >
                  <FaHeart className="me-2" />
                  Donate Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
