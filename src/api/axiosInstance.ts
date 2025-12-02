import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { store } from '@/store';
import { AppEnvironment } from '@/config/environment';
import { logout } from '@/store/slices/authSlice';

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: AppEnvironment.API_BASE_URL,
    timeout: AppEnvironment.API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = store.getState().auth.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (AppEnvironment.ENABLE_LOGGING) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      if (AppEnvironment.ENABLE_LOGGING) {
        console.log(`[API] Response: ${response.status}`);
      }
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        store.dispatch(logout());
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createAxiosInstance();
