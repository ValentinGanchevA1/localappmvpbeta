// src/api/axiosInstance.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { AppEnvironment } from '@/config/environment';

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: AppEnvironment.API_BASE_URL,
    timeout: AppEnvironment.API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor with dynamic import to avoid circular import issues
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const { store } = await import('@/store');
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (AppEnvironment.ENABLE_API_LOGGING) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor with dynamic import for logout
  instance.interceptors.response.use(
    (response) => {
      if (AppEnvironment.ENABLE_API_LOGGING) {
        console.log(`[API] Response: ${response.status}`);
      }
      return response;
    },
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        const { logout } = await import('@/store/slices/authSlice');
        const { store } = await import('@/store');
        store.dispatch(logout());
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createAxiosInstance();
