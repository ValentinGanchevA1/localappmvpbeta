import axiosInstance from '@/api/axiosInstance';
import { LoginCredentials, RegisterCredentials } from '@/types';
import { User } from '@/types/user';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export const authService = {
  async loginWithPhone(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    try {
      // ✅ axiosInstance already has interceptor, get data directly
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      const data = response.data || response;

      return {
        token: data.access_token,
        user: {
          id: data.user.id,
          phone: data.user.phone,
          username: data.user.name || data.user.email || data.user.phone,
          name: data.user.name || '',
          email: data.user.email || '',
          avatar: data.user.avatar || '',
          profile: {
            id: data.user.id,
            name: data.user.name || '',
            username: data.user.name || data.user.email || data.user.phone,
            email: data.user.email || '',
            avatar: data.user.avatar || '',
          },
        },
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    }
  },

  async registerWithPhone(credentials: RegisterCredentials): Promise<{ token: string; user: User }> {
    try {
      const payload: any = {
        phone: credentials.phone,
        password: credentials.password,
      };
      if (credentials.name) payload.name = credentials.name;
      if (credentials.email) payload.email = credentials.email;

      const response = await axiosInstance.post<AuthResponse>('/auth/register', payload);
      const data = response.data || response;

      return {
        token: data.access_token,
        user: {
          id: data.user.id,
          phone: data.user.phone,
          username: data.user.name || data.user.email || data.user.phone,
          name: data.user.name || '',
          email: data.user.email || '',
          avatar: data.user.avatar || '',
          profile: {
            id: data.user.id,
            name: data.user.name || '',
            username: data.user.name || data.user.email || data.user.phone,
            email: data.user.email || '',
            avatar: data.user.avatar || '',
          },
        },
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(message);
    }
  },

  async loginWithPassword(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    return this.loginWithPhone(credentials); // Reuse same endpoint
  },

  async verifyCode(code: string): Promise<{ verified: boolean }> {
    const response = await axiosInstance.post('/auth/verify', { code });
    return response.data || response;
  },

  async refreshToken(token: string): Promise<{ token: string }> {
    const response = await axiosInstance.post('/auth/refresh', { token });
    return response.data || response;
  },
};
