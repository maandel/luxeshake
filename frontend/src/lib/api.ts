import axios from 'axios';
import { useAuthStore } from './store/authStore';

let rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
if (!rawBaseUrl.endsWith('/api/v1')) {
  rawBaseUrl = `${rawBaseUrl.replace(/\/$/, '')}/api/v1`;
}

const API_BASE_URL = rawBaseUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for HttpOnly refresh token cookies
});

// --- Refresh-lock to prevent concurrent token refresh race conditions ---
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshSuccess(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function onRefreshFailure() {
  refreshSubscribers = [];
}

// Request interceptor — inject JWT access token from in-memory store
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

// Response interceptor — silent token refresh on 401 with request queuing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh completes
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          originalRequest._retry = true;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const resp = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const { access_token, role } = resp.data;

      useAuthStore.getState().setAuth(access_token, role);
      onRefreshSuccess(access_token);

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      onRefreshFailure();
      useAuthStore.getState().clearAuth();
      // Only redirect if on a protected admin page
      if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/luxe-control') &&
        window.location.pathname !== '/luxe-control'
      ) {
        window.location.href = '/luxe-control';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

