import axiosInstance from '@/api/axiosInstance';
import { LoginCredentials, RegisterCredentials, getErrorMessage, isAxiosError } from '@/types';
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

interface RegisterPayload {
  phone: string;
  password: string;
  name?: string;
  email?: string;
}

export const authService = {
  async loginWithPhone(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      const data = response.data || response;

      return {
        token: data.access_token,
        user: {
          id: data.user.id,
          profile: {
            id: data.user.id,
            name: data.user.name || '',
            username: data.user.name || data.user.email || data.user.phone,
            email: data.user.email || '',
            avatar: data.user.avatar || '',
            phone: data.user.phone,
          },
        },
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async registerWithPhone(credentials: RegisterCredentials): Promise<{ token: string; user: User }> {
    try {
      if (!credentials.password) {
        throw new Error('Password is required for registration');
      }
      const payload: RegisterPayload = {
        phone: credentials.phone,
        password: credentials.password,
        name: credentials.name,
        email: credentials.email,
      };

      const response = await axiosInstance.post<AuthResponse>('/auth/register', payload);
      const data = response.data || response;

      return {
        token: data.access_token,
        user: {
          id: data.user.id,
          profile: {
            id: data.user.id,
            name: data.user.name || '',
            username: data.user.name || data.user.email || data.user.phone,
            email: data.user.email || '',
            avatar: data.user.avatar || '',
            phone: data.user.phone,
          },
        },
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async loginWithPassword(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    return this.loginWithPhone(credentials);
  },

  async verifyCode(code: string): Promise<{ verified: boolean }> {
    try {
      if (!code || code.trim() === '') {
        throw new Error('Verification code is required');
      }
      const response = await axiosInstance.post('/auth/verify', { code });
      return response.data || response;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async refreshToken(token: string): Promise<{ token: string }> {
    try {
      if (!token || token.trim() === '') {
        throw new Error('Token is required for refresh');
      }
      const response = await axiosInstance.post('/auth/refresh', { token });
      return response.data || response;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
