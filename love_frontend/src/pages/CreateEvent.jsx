import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCharities, createEvent, getUploadUrl } from '../services/api';
import { FaHeart, FaGift, FaBirthdayCake, FaDove } from 'react-icons/fa';

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: FaHeart },
  { value: 'christening', label: 'Christening', icon: FaDove },
  { value: 'birthday', label: 'Birthday', icon: FaBirthdayCake },
  { value: 'memorial', label: 'Memorial', icon: FaGift },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    event_type: '',
    title: '',
    slug: '',
    story: '',
    cover_photo: '',
    event_date: '',
    location: '',
    goal_amount: '',
    charity_ids: [],
    status: 'draft',
  });

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const response = await getCharities();
      setCharities(response.data);
    } catch (error) {
      console.error('Failed to fetch charities:', error);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Step 1: Get a presigned URL from our backend
      const response = await getUploadUrl(file.name, file.type);
      const { upload_url, file_url } = response.data;

      // Step 2: Upload directly to S3 using the presigned URL
      await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // Step 3: Save the S3 URL in the form
      setFormData(prev => ({ ...prev, cover_photo: file_url }));
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload photo. You can still paste a URL instead.');
    } finally {
      setUploading(false);
    }
  };

  const toggleCharity = (id) => {
    setFormData(prev => ({
      ...prev,
      charity_ids: prev.charity_ids.includes(id)
        ? prev.charity_ids.filter(c => c !== id)
        : [...prev.charity_ids, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = {
        ...formData,
        goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
        event_date: formData.event_date || null,
      };
      const response = await createEvent(data);
      navigate(`/dashboard/event/${response.data.id || response.data.pk}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event. Please try again.');
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <h1 className="mb-4">Create New Event</h1>

          {/* Progress */}
          <div className="mb-4">
            <div className="d-flex justify-content-between mb-2">
              {['Event Type', 'Details', 'Charities'].map((label, i) => (
                <span
                  key={label}
                  className={`badge ${step > i ? 'bg-success' : step === i + 1 ? 'bg-primary' : 'bg-secondary'}`}
                >
                  {i + 1}. {label}
                </span>
              ))}
            </div>
            <div className="progress" style={{ height: '4px' }}>
              <div
                className="progress-bar"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <div className="card">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* Step 1: Event Type */}
                {step === 1 && (
                  <>
                    <h4 className="mb-4">What type of event?</h4>
                    <div className="row g-3 mb-4">
                      {EVENT_TYPES.map(({ value, label, icon: Icon }) => (
                        <div key={value} className="col-6 col-md-3">
                          <div
                            className={`card text-center h-100 cursor-pointer ${
                              formData.event_type === value ? 'border-primary bg-light' : ''
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, event_type: value }))}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <Icon
                                size={32}
                                className={formData.event_type === value ? 'text-primary' : 'text-muted'}
                              />
                              <p className="mb-0 mt-2">{label}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={nextStep}
                      disabled={!formData.event_type}
                    >
                      Continue
                    </button>
                  </>
                )}

                {/* Step 2: Details */}
                {step === 2 && (
                  <>
                    <h4 className="mb-4">Event Details</h4>

                    <div className="mb-3">
                      <label className="form-label">Event Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="e.g., Welcome Baby Maizon"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">URL Slug</label>
                      <div className="input-group">
                        <span className="input-group-text">loveinaction.com/event/</span>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label className="form-label">Event Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.event_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Location</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.location}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="e.g., Dublin, Ireland"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Your Story</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={formData.story}
                        onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                        placeholder="Share your story with your guests..."
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Cover Photo</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      {uploading && (
                        <div className="form-text text-primary">Uploading to S3...</div>
                      )}
                      {formData.cover_photo && (
                        <div className="mt-2">
                          <img
                            src={formData.cover_photo}
                            alt="Cover preview"
                            className="img-thumbnail"
                            style={{ maxHeight: 120 }}
                          />
                        </div>
                      )}
                      <div className="form-text">
                        Or paste a URL directly:
                      </div>
                      <input
                        type="url"
                        className="form-control mt-1"
                        value={formData.cover_photo}
                        onChange={(e) => setFormData(prev => ({ ...prev, cover_photo: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Fundraising Goal (optional)</label>
                      <div className="input-group" style={{ maxWidth: '200px' }}>
                        <span className="input-group-text">€</span>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.goal_amount}
                          onChange={(e) => setFormData(prev => ({ ...prev, goal_amount: e.target.value }))}
                          placeholder="1000"
                        />
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>
                        Back
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={nextStep}
                        disabled={!formData.title || !formData.slug}
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )}

                {/* Step 3: Charities */}
                {step === 3 && (
                  <>
                    <h4 className="mb-4">Select Charities</h4>
                    <p className="text-muted mb-4">
                      Choose the charities your guests can donate to. Select at least one.
                    </p>

                    <div className="row g-3 mb-4">
                      {charities.map((charity) => (
                        <div key={charity.id} className="col-md-6">
                          <div
                            className={`card h-100 cursor-pointer ${
                              formData.charity_ids.includes(charity.id) ? 'border-primary bg-light' : ''
                            }`}
                            onClick={() => toggleCharity(charity.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body d-flex align-items-center">
                              <input
                                type="checkbox"
                                className="form-check-input me-3"
                                checked={formData.charity_ids.includes(charity.id)}
                                onChange={() => {}}
                              />
                              {charity.logo && (
                                <img
                                  src={charity.logo}
                                  alt=""
                                  className="me-3"
                                  style={{ width: 40, height: 40, objectFit: 'contain' }}
                                />
                              )}
                              <div>
                                <strong>{charity.name}</strong>
                                <br />
                                <small className="text-muted text-capitalize">
                                  {charity.category?.replace('_', ' ')}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-outline-secondary" onClick={prevStep}>
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || formData.charity_ids.length === 0}
                      >
                        {loading ? 'Creating...' : 'Create Event'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
