import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ValidationUtils } from '@/utils/validation';
import { User } from '@/types/user';
import { SocketService } from '@/services/socketService';
import axiosInstance from '@/api/axiosInstance';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  user: User | null;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  user: null,
};

interface LoginCredentials {
  phone: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  name?: string;
  email?: string;
}

interface AuthResponse {
  access_token: string;
  user: User;
}

export const loginWithPhone = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  {
    rejectValue: string;
  }
>(
  'auth/loginWithPhone',
  async (credentials, { rejectWithValue }) => {
    try {
      const payload = {
        phone: String(credentials.phone).trim(),
        password: String(credentials.password).trim(),
      };

      // Validate before sending
      if (!ValidationUtils.validateAuthPayload(payload)) {
        return rejectWithValue('Invalid phone number or password format');
      }

      if (__DEV__) {
        console.log('[authSlice] Attempting login with:', { phone: payload.phone });
      }

      // Make API request
      const response = await axiosInstance.post<AuthResponse>(
        '/auth/login',
        payload
      );

      if (!response.data.access_token || !response.data.user) {
        return rejectWithValue('Invalid server response - missing token or user');
      }

      if (__DEV__) {
        console.log('[authSlice] Login successful, token received');
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please try again.';

      if (__DEV__) {
        console.error('[authSlice] Login error:', {
          status: error.response?.status,
          message: errorMessage,
          data: error.response?.data,
        });
      }

      return rejectWithValue(errorMessage);
    }
  }
);

export const registerWithPhone = createAsyncThunk<
  AuthResponse,
  RegisterCredentials,
  {
    rejectValue: string;
  }
>(
  'auth/registerWithPhone',
  async (credentials, { rejectWithValue }) => {
    try {
      const payload: any = {
        phone: String(credentials.phone).trim(),
        password: String(credentials.password).trim(),
      };

      if (credentials.name) payload.name = String(credentials.name).trim();
      if (credentials.email) payload.email = String(credentials.email).trim();

      // Validate payload
      if (!ValidationUtils.validateRegisterPayload(payload)) {
        return rejectWithValue('Invalid registration data');
      }

      if (__DEV__) {
        console.log('[authSlice] Attempting registration with:', {
          phone: payload.phone,
        });
      }

      const response = await axiosInstance.post<AuthResponse>(
        '/auth/register',
        payload
      );

      if (!response.data.access_token || !response.data.user) {
        return rejectWithValue('Invalid server response');
      }

      if (__DEV__) {
        console.log('[authSlice] Registration successful');
      }

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';

      if (__DEV__) {
        console.error('[authSlice] Registration error:', errorMessage);
      }

      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (_state) => {
      SocketService.getInstance().disconnect();
      return initialState;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login lifecycle
      .addCase(loginWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;

        if (__DEV__) {
          console.log('[authSlice] Login fulfilled, state updated');
        }
      })
      .addCase(loginWithPhone.rejected, (state, action) => {
        state.loading = false; // ✓ CRITICAL: Reset loading flag
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;

        if (__DEV__) {
          console.error('[authSlice] Login rejected:', state.error);
        }
      })
      // Register lifecycle
      .addCase(registerWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;

        if (__DEV__) {
          console.log('[authSlice] Registration fulfilled');
        }
      })
      .addCase(registerWithPhone.rejected, (state, action) => {
        state.loading = false; // ✓ CRITICAL: Reset loading flag
        state.error = action.payload || 'Registration failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
