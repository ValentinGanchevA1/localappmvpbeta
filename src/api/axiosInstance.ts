// src/api/axiosInstance.ts
import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { AppEnvironment } from '@/config/environment';

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: AppEnvironment.API_BASE_URL,
    timeout: AppEnvironment.API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });

  // Request interceptor with dynamic import to avoid circular dependencies
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
    (error: AxiosError) => {
      throw error;
    }
  );

  // Response interceptor with token refresh support
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (AppEnvironment.ENABLE_API_LOGGING) {
        console.log(`[API] Response: ${response.status} ${response.config.url}`);
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 Unauthorized with token refresh
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue requests while token refresh is in progress
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => {
              throw err;
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Attempt token refresh
          const { data } = await instance.post('/auth/refresh-token');
          const { accessToken } = data;

          // Update token in store
          const { setToken } = await import('@/store/slices/authSlice');
          const { store } = await import('@/store');
          store.dispatch(setToken(accessToken));

          // Process queued requests with new token
          processQueue(null, accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return instance(originalRequest);
        } catch {
          // Token refresh failed - logout user
          processQueue(new Error('Session expired'), null);
          const { logout } = await import('@/store/slices/authSlice');
          const { store } = await import('@/store');
          store.dispatch(logout());
          throw new Error('Session expired. Please login again.');
        } finally {
          isRefreshing = false;
        }
      }

      throw error;
    }
  );

  return instance;
};

export default createAxiosInstance();
