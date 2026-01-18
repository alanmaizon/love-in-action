import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing api module
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Service', () => {
  let api;
  let mockAxiosInstance;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset modules to get fresh import
    vi.resetModules();

    // Setup mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
      },
    };
    axios.create.mockReturnValue(mockAxiosInstance);

    // Import the api module
    api = await import('../api');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('axios instance configuration', () => {
    it('creates axios instance with correct base config', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.stringContaining('/api'),
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('registers request interceptor', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('auth endpoints', () => {
    it('getCsrfToken calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { csrfToken: 'token' } });
      await api.getCsrfToken();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/csrf/');
    });

    it('login calls correct endpoint with credentials', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1, username: 'test' } });
      await api.login('testuser', 'password123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login/', {
        username: 'testuser',
        password: 'password123',
      });
    });

    it('logout calls correct endpoint', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { message: 'Logged out' } });
      await api.logout();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout/');
    });

    it('getMe calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 } });
      await api.getMe();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/me/');
    });

    it('getSocialProviders calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { providers: [] } });
      await api.getSocialProviders();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/social/providers/');
    });
  });

  describe('getSocialLoginUrl', () => {
    it('returns correct URL for google provider', () => {
      const url = api.getSocialLoginUrl('google');
      expect(url).toContain('/accounts/google/login/');
    });

    it('returns correct URL for other providers', () => {
      const url = api.getSocialLoginUrl('facebook');
      expect(url).toContain('/accounts/facebook/login/');
    });
  });

  describe('public endpoints', () => {
    it('getEvent calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1, slug: 'test' } });
      await api.getEvent('test-slug');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/events/test-slug/');
    });

    it('getCharities calls correct endpoint without category', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      await api.getCharities();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/charities/', { params: {} });
    });

    it('getCharities calls correct endpoint with category', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      await api.getCharities('children');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/charities/', { params: { category: 'children' } });
    });

    it('getCharity calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 } });
      await api.getCharity('charity-slug');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/charities/charity-slug/');
    });
  });

  describe('donation endpoints', () => {
    it('createDonationSession calls correct endpoint', async () => {
      const donationData = {
        event_slug: 'test-event',
        charity_id: 1,
        amount: 50,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: { checkout_url: 'https://stripe.com' } });
      await api.createDonationSession(donationData);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/donations/create-session/', donationData);
    });
  });

  describe('dashboard endpoints', () => {
    it('getDashboardEvents calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      await api.getDashboardEvents();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/dashboard/events/');
    });

    it('getDashboardEvent calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 } });
      await api.getDashboardEvent(123);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/dashboard/events/123/');
    });

    it('createEvent calls correct endpoint', async () => {
      const eventData = { title: 'Test Event', event_type: 'wedding' };
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1 } });
      await api.createEvent(eventData);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/dashboard/events/', eventData);
    });

    it('updateEvent calls correct endpoint', async () => {
      const updateData = { title: 'Updated Event' };
      mockAxiosInstance.patch.mockResolvedValue({ data: { id: 1 } });
      await api.updateEvent(123, updateData);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/dashboard/events/123/', updateData);
    });

    it('deleteEvent calls correct endpoint', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });
      await api.deleteEvent(123);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/dashboard/events/123/');
    });

    it('getEventDonations calls correct endpoint', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      await api.getEventDonations(123);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/dashboard/events/123/donations/');
    });
  });
});
