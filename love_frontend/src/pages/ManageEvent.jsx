import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDashboardEvent, getEventDonations, updateEvent } from '../services/api';
import { FaArrowLeft, FaEye, FaShare, FaUsers, FaDownload } from 'react-icons/fa';

export default function ManageEvent() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [eventRes, donationsRes] = await Promise.all([
        getDashboardEvent(id),
        getEventDonations(id),
      ]);
      setEvent(eventRes.data);
      setDonations(donationsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await updateEvent(id, { status: newStatus });
      setEvent(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      alert('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/event/${event.slug}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const exportDonations = () => {
    const csv = [
      ['Name', 'Email', 'Amount', 'Charity', 'Message', 'Date', 'Status'].join(','),
      ...donations.map(d => [
        d.display_name,
        d.is_anonymous ? '' : d.donor_email || '',
        d.amount,
        d.charity_name,
        `"${(d.message || '').replace(/"/g, '""')}"`,
        new Date(d.created_at).toLocaleDateString(),
        d.status,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug}-donations.csv`;
    a.click();
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

  if (!event) {
    return (
      <div className="container py-5 text-center">
        <h2>Event not found</h2>
        <Link to="/dashboard" className="btn btn-primary mt-3">Back to Dashboard</Link>
      </div>
    );
  }

  const succeededDonations = donations.filter(d => d.status === 'succeeded');
  const totalRaised = succeededDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0);

  return (
    <div className="container py-5">
      <Link to="/dashboard" className="btn btn-link mb-3 px-0">
        <FaArrowLeft className="me-2" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h1>{event.title}</h1>
          <p className="text-muted mb-0">
            {event.event_type} • Created {new Date(event.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/event/${event.slug}`} className="btn btn-outline-primary">
            <FaEye className="me-2" />
            View Page
          </Link>
          <button className="btn btn-outline-primary" onClick={copyShareLink}>
            <FaShare className="me-2" />
            Share
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h5 className="mb-0">Status</h5>
            </div>
            <div className="col-md-6">
              <div className="btn-group">
                {['draft', 'active', 'closed'].map((status) => (
                  <button
                    key={status}
                    className={`btn ${event.status === status ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => handleStatusChange(status)}
                    disabled={saving}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h2 className="mb-0">€{totalRaised.toLocaleString()}</h2>
              <small>Total Raised</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h2 className="mb-0">
                <FaUsers className="me-2" />
                {succeededDonations.length}
              </h2>
              <small className="text-muted">Donors</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body text-center">
              <h2 className="mb-0">
                €{succeededDonations.length > 0
                  ? (totalRaised / succeededDonations.length).toFixed(0)
                  : 0}
              </h2>
              <small className="text-muted">Average Donation</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'donations' ? 'active' : ''}`}
            onClick={() => setActiveTab('donations')}
          >
            Donations ({donations.length})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card">
          <div className="card-body">
            <h5>Event Details</h5>
            <dl className="row mb-0">
              <dt className="col-sm-3">Type</dt>
              <dd className="col-sm-9 text-capitalize">{event.event_type}</dd>

              <dt className="col-sm-3">Date</dt>
              <dd className="col-sm-9">
                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Not set'}
              </dd>

              <dt className="col-sm-3">Location</dt>
              <dd className="col-sm-9">{event.location || 'Not set'}</dd>

              <dt className="col-sm-3">Goal</dt>
              <dd className="col-sm-9">
                {event.goal_amount ? `€${parseFloat(event.goal_amount).toLocaleString()}` : 'Not set'}
              </dd>

              <dt className="col-sm-3">Charities</dt>
              <dd className="col-sm-9">
                {event.event_charities?.map(ec => ec.charity.name).join(', ') || 'None selected'}
              </dd>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'donations' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>All Donations</span>
            {donations.length > 0 && (
              <button className="btn btn-sm btn-outline-primary" onClick={exportDonations}>
                <FaDownload className="me-1" />
                Export CSV
              </button>
            )}
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Amount</th>
                  <th>Charity</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No donations yet
                    </td>
                  </tr>
                ) : (
                  donations.map((donation) => (
                    <tr key={donation.id}>
                      <td>{donation.display_name}</td>
                      <td>€{parseFloat(donation.amount).toFixed(2)}</td>
                      <td>{donation.charity_name}</td>
                      <td className="text-truncate" style={{ maxWidth: '200px' }}>
                        {donation.message || '-'}
                      </td>
                      <td>{new Date(donation.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${
                          donation.status === 'succeeded' ? 'bg-success' :
                          donation.status === 'pending' ? 'bg-warning' : 'bg-secondary'
                        }`}>
                          {donation.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
