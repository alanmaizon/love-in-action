import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add CSRF token to all non-GET requests
api.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }
  return config;
});

// Auth
export const getCsrfToken = () =>
  api.get('/auth/csrf/');

export const login = (username, password) =>
  api.post('/auth/login/', { username, password });

export const logout = () =>
  api.post('/auth/logout/');

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

// Dashboard (authenticated)
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

export default api;
