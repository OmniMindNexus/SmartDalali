import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Use Vite env variable if provided. For local development we prefer a relative
// URL ('/api') so the Vite dev server proxy forwards requests to the backend
// and avoids CORS. If you need to point directly to a backend, set
// VITE_API_URL in your .env (e.g. http://127.0.0.1:8000/api).
const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to every request if present
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Simple refresh handling to retry the original request once when access token expired
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      if (token && prom.config.headers) {
        prom.config.headers['Authorization'] = `Bearer ${token}`;
      }
      prom.resolve(api(prom.config));
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError & { config?: InternalAxiosRequestConfig }) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If unauthorized and we haven't retried yet, try refreshing
    type ReqWithRetry = InternalAxiosRequestConfig & { _retry?: boolean };
    const req = originalRequest as ReqWithRetry;
    if (error.response?.status === 401 && !req._retry) {
      req._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // no refresh token -> redirect to login in app logic
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // queue the request until refresh finishes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      isRefreshing = true;

      try {
        const resp = await axios.post(`${API_BASE}/accounts/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccess = resp.data?.access;
        if (newAccess) {
          localStorage.setItem('access_token', newAccess);
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          processQueue(null, newAccess);
          return api(originalRequest);
        }
        processQueue(new Error('No access token in refresh response'), null);
        return Promise.reject(error);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // clear tokens if refresh failed
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Redirect to login so the user can re-authenticate. Use a hard
        // navigation to ensure the app resets auth state even outside React.
        try {
          window.location.href = '/login';
        } catch (e) {
          // ignore if window isn't available (e.g. SSR)
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
