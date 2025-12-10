import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { StorageService } from '@/services/storageService';
import { User } from '@/types/user';

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

// Existing Login Thunk
export const loginWithPhone = createAsyncThunk<
  { token: string; user: User },
  { phone: string; password: string }
>(
  'auth/loginWithPhone',
  async (credentials, thunkAPI) => {
    try {
      const { authService } = await import('@/services/authService');
      const { token, user } = await authService.loginWithPhone(credentials);
      await StorageService.saveAuthToken(token);
      return { token, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ✅ NEW: Missing Register Thunk
export const registerWithPhone = createAsyncThunk<
  { token: string; user: User },
  { phone: string; password: string; name?: string; email?: string }
>(
  'auth/registerWithPhone',
  async (credentials, thunkAPI) => {
    try {
      // Dynamic import to break circular dependency
      const { authService } = await import('@/services/authService');
      // Assuming authService has a 'registerWithPhone' method similar to login
      const { token, user } = await authService.registerWithPhone(credentials);
      await StorageService.saveAuthToken(token);
      return { token, user };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await StorageService.clearAuth();
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Handlers
      .addCase(loginWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginWithPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Login failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })

      // ✅ NEW: Register Handlers
      .addCase(registerWithPhone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerWithPhone.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerWithPhone.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Registration failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })

      // Logout Handlers
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  },
});

export const { setToken, clearError } = authSlice.actions;
export default authSlice.reducer;
