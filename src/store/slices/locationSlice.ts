// src/store/slices/locationSlice.ts - FIXED
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { locationApi, NearbyUser } from '@/api/locationApi';
import { Region } from 'react-native-maps';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  tracking: boolean;
  nearbyUsers: NearbyUser[];
  loading: boolean;
  error: string | null;
  region: Region | null;
  lastUpdated: number | null;
}

const initialState: LocationState = {
  latitude: null,
  longitude: null,
  accuracy: null,
  tracking: false,
  nearbyUsers: [],
  loading: false,
  error: null,
  region: null,
  lastUpdated: null,
};

// ✅ FIXED: Properly typed async thunk with error handling
export const fetchNearbyData = createAsyncThunk<
  NearbyUser[], // Return type
  { latitude: number; longitude: number; radius?: number }, // Param type
  { rejectValue: string } // Error type
>(
  'location/fetchNearbyData',
  async (params, { rejectWithValue }) => {
    try {
      console.log('[Location] Fetching nearby users at', params);

      const result = await locationApi.getNearbyUsers({
        latitude: params.latitude,
        longitude: params.longitude,
        radius: params.radius || 5000,
        limit: 50,
      });

      if (!Array.isArray(result)) {
        throw new Error('Invalid response format');
      }

      console.log('[Location] ✅ Fetched', result.length, 'nearby users');
      return result;
    } catch (error: any) {
      const message = error?.message || 'Network error - is backend running on :3001?';
      console.error('[Location] ❌ Fetch failed:', message);
      return rejectWithValue(message);
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<{ latitude: number; longitude: number; accuracy?: number }>) => {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.accuracy = action.payload.accuracy ?? null;
      state.lastUpdated = Date.now();
    },
    setLocationTracking: (state, action: PayloadAction<boolean>) => {
      state.tracking = action.payload;
    },
    setLocationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        state.loading = false; // ✅ Reset loading on error
      }
    },
    updateRegion: (state, action: PayloadAction<Region>) => {
      state.region = action.payload;
    },
    clearLocationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Pending
      .addCase(fetchNearbyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Success - ✅ ALWAYS reset loading flag
      .addCase(fetchNearbyData.fulfilled, (state, action) => {
        state.nearbyUsers = action.payload || [];
        state.loading = false;
        state.error = null;
        state.lastUpdated = Date.now();

        if (__DEV__) {
          console.log('[Location] State updated:', {
            nearbyUsersCount: action.payload?.length,
            loading: false,
          });
        }
      })
      // Error - ✅ ALWAYS reset loading flag
      .addCase(fetchNearbyData.rejected, (state, action) => {
        state.loading = false; // ✅ CRITICAL: Reset loading!
        state.error = action.payload || 'Unknown error';
        state.nearbyUsers = []; // Clear stale data

        if (__DEV__) {
          console.error('[Location] ❌ Fetch rejected:', state.error);
        }
      });
  },
});

export const {
  setCurrentLocation,
  setLocationTracking,
  setLocationError,
  updateRegion,
  clearLocationError,
} = locationSlice.actions;

export default locationSlice.reducer;
