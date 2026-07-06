import axios from 'axios';
import { useAuthStore } from './store/authStore';

let rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
if (!rawBaseUrl.endsWith('/api/v1')) {
  // Ensure we don't have double trailing slashes
  rawBaseUrl = `${rawBaseUrl.replace(/\/$/, '')}/api/v1`;
}

const API_BASE_URL = rawBaseUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for HttpOnly refresh token cookies
});

// Request interceptor to inject JWT access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to exchange refresh token cookie for new access token
        const resp = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { access_token, role } = resp.data;
        
        // Update Zustand store
        useAuthStore.getState().setAuth(access_token, role);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear auth state if refresh fails
        useAuthStore.getState().clearAuth();
        // Force redirect to login if on an admin portal page
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/luxe-control') && window.location.pathname !== '/luxe-control') {
          window.location.href = '/luxe-control';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
