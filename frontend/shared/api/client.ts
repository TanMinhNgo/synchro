import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // We do not need to send refreshToken from localStorage because it is sent via httpOnly cookie now.
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const newToken = response.data.accessToken;
        if (newToken && typeof window !== 'undefined') {
          localStorage.setItem('access_token', newToken);

          apiClient.defaults.headers.common['Authorization'] =
            `Bearer ${newToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

          processQueue(null, newToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No refresh token returned');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);

        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
