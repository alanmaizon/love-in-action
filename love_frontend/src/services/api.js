import axios from 'axios';
import { getIdToken } from './cognito';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Cognito JWT token to all requests (replaces CSRF cookie approach)
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Auth - Cognito config
export const getCognitoConfig = () =>
  api.get('/auth/cognito-config/');

// User profile (authenticated via Cognito JWT)
export const getMe = () =>
  api.get('/auth/me/');

// Events (public)
export const getEvent = (slug) =>
  api.get(`/events/${slug}/`);

// Charities
export const getCharities = (category = null) => {
  const params = category ? { category } : {};
  return api.get('/charities/', { params });
};

export const getCharity = (slug) =>
  api.get(`/charities/${slug}/`);

// Donations
export const createDonationSession = (data) =>
  api.post('/donations/create-session/', data);

// Dashboard (authenticated via Cognito JWT)
export const getDashboardEvents = () =>
  api.get('/dashboard/events/');

export const getDashboardEvent = (id) =>
  api.get(`/dashboard/events/${id}/`);

export const createEvent = (data) =>
  api.post('/dashboard/events/', data);

export const updateEvent = (id, data) =>
  api.patch(`/dashboard/events/${id}/`, data);

export const deleteEvent = (id) =>
  api.delete(`/dashboard/events/${id}/`);

export const getEventDonations = (id) =>
  api.get(`/dashboard/events/${id}/donations/`);

// S3 Upload (Phase 2)
export const getUploadUrl = (filename, contentType) =>
  api.post('/dashboard/upload/', { filename, content_type: contentType });

export default api;
