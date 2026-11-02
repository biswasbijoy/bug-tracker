import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const url: string = error.config?.url || '';
      // a wrong password on the login form is not an expired session
      const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthCall && !window.location.pathname.startsWith('/auth')) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch {}
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

/** Base URL of the API server without `/api` — used for uploaded files. */
export const FILES_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default api;
