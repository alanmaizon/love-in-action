import { useState, useEffect } from 'react';
import { getCharities } from '../services/api';
import { FaExternalLinkAlt, FaCheckCircle } from 'react-icons/fa';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'children', label: 'Children' },
  { value: 'health', label: 'Health' },
  { value: 'animals', label: 'Animals' },
  { value: 'environment', label: 'Environment' },
  { value: 'international', label: 'International' },
  { value: 'homelessness', label: 'Homelessness' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'other', label: 'Other' },
];

export default function CharitiesPage() {
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchCharities();
  }, [category]);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const response = await getCharities(category || null);
      setCharities(response.data);
    } catch (error) {
      console.error('Failed to fetch charities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h1 className="mb-4">Our Partner Charities</h1>
      <p className="lead text-muted mb-4">
        All our charities are verified Irish registered organisations.
      </p>

      {/* Filter */}
      <div className="mb-4">
        <select
          className="form-select"
          style={{ maxWidth: '250px' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {charities.map((charity) => (
            <div key={charity.id} className="col-md-6 col-lg-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start mb-3">
                    {charity.logo && (
                      <img
                        src={charity.logo}
                        alt={charity.name}
                        className="me-3"
                        style={{ width: 60, height: 60, objectFit: 'contain' }}
                      />
                    )}
                    <div>
                      <h5 className="card-title mb-1">{charity.name}</h5>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary text-capitalize">
                          {charity.category?.replace('_', ' ')}
                        </span>
                        {charity.is_verified && (
                          <span className="text-success small">
                            <FaCheckCircle className="me-1" />
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-footer bg-transparent">
                  <a
                    href={charity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >
                    Visit Website <FaExternalLinkAlt className="ms-1" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {charities.length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No charities found in this category.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
