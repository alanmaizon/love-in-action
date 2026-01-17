import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardEvents } from '../services/api';
import { FaPlus, FaEye, FaEdit, FaShare, FaUsers } from 'react-icons/fa';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await getDashboardEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (slug) => {
    const url = `${window.location.origin}/event/${slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const getStatusBadge = (status) => {
    const classes = {
      draft: 'bg-secondary',
      active: 'bg-success',
      closed: 'bg-dark',
    };
    return <span className={`badge ${classes[status]} text-capitalize`}>{status}</span>;
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

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Events</h1>
        <Link to="/dashboard/create" className="btn btn-primary">
          <FaPlus className="me-2" />
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card text-center py-5">
          <div className="card-body">
            <h4>No events yet</h4>
            <p className="text-muted">Create your first celebration page to get started.</p>
            <Link to="/dashboard/create" className="btn btn-primary">
              <FaPlus className="me-2" />
              Create Your First Event
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {events.map((event) => (
            <div key={event.id} className="col-md-6 col-lg-4">
              <div className="card h-100">
                {event.cover_photo && (
                  <img
                    src={event.cover_photo}
                    className="card-img-top"
                    alt={event.title}
                    style={{ height: 150, objectFit: 'cover' }}
                  />
                )}
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{event.title}</h5>
                    {getStatusBadge(event.status)}
                  </div>
                  <p className="text-muted small text-capitalize mb-3">
                    {event.event_type}
                    {event.event_date && ` • ${new Date(event.event_date).toLocaleDateString()}`}
                  </p>

                  <div className="d-flex justify-content-between text-muted small mb-3">
                    <span>€{parseFloat(event.total_raised || 0).toLocaleString()} raised</span>
                    <span>
                      <FaUsers className="me-1" />
                      {event.donor_count} donors
                    </span>
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <div className="btn-group w-100">
                    <Link
                      to={`/event/${event.slug}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <FaEye className="me-1" /> View
                    </Link>
                    <Link
                      to={`/dashboard/event/${event.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <FaEdit className="me-1" /> Manage
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => copyShareLink(event.slug)}
                    >
                      <FaShare className="me-1" /> Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
