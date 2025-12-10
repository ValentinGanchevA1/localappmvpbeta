// src/store/slices/authSlice.ts - UPDATED
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

export const loginWithPhone = createAsyncThunk<
  { token: string; user: User },
  { phone: string; password: string }
>(
  'auth/loginWithPhone',
  async (credentials, thunkAPI) => {
    try {
      // Dynamic import to break circular dependency
      const { authService } = await import('@/services/authService');
      const { token, user } = await authService.loginWithPhone(credentials);
      await StorageService.saveAuthToken(token);
      return { token, user };
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Apply similar dynamic import to other thunks, e.g., in userSlice.ts:
export const fetchUserProfile = createAsyncThunk<UserProfile, void>(
  'user/fetchUserProfile',
  async (_, thunkAPI) => {
    try {
      const { userService } = await import('@/services/userService');
      const profile = await userService.getProfile(thunkAPI.getState().auth.user?.id || '');
      return profile;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

// In locationSlice.ts for fetchNearbyData:
export const fetchNearbyData = createAsyncThunk(
  'location/fetchNearbyData',
  async (params: { latitude: number; longitude: number; radius: number }, thunkAPI) => {
    try {
      const { locationApi } = await import('@/api/locationApi');
      const users = await locationApi.getNearbyUsers({
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius,
        limit: 50,
      });
      return users;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message || 'Failed to fetch nearby data');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // ✅ Clear storage on logout
      await StorageService.clearAuth();
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message);
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
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
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
