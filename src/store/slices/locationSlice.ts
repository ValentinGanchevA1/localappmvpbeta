import { createSlice, createAsyncThunk, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
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

// ✅ Properly defined async thunk
export const fetchNearbyData = createAsyncThunk<
  NearbyUser[],
  { latitude: number; longitude: number; radius?: number },
  { rejectValue: string }
>(
  'location/fetchNearbyData',
  async (params, { rejectWithValue }) => {
    try {
      return await locationApi.getNearbyUsers(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch nearby users');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    // ✅ Synchronous actions for immediate updates
    setCurrentLocation: (
      state,
      action: PayloadAction<{ latitude: number; longitude: number; accuracy?: number | null }>
    ) => {
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
    },
    updateRegion: (state, action: PayloadAction<Region>) => {
      state.region = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Pending state
      .addCase(fetchNearbyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Success state
      .addCase(fetchNearbyData.fulfilled, (state, action) => {
        state.nearbyUsers = action.payload || [];
        state.loading = false;
        state.error = null;
      })
      // Error state
      .addCase(fetchNearbyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unknown error occurred';
        state.nearbyUsers = [];
      });
  },
});

export const {
  setCurrentLocation,
  setLocationTracking,
  setLocationError,
  updateRegion,
} = locationSlice.actions;

export default locationSlice.reducer;
