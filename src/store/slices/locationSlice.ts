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

export const updateCurrentLocation = createAsyncThunk<
  void,
  { latitude: number; longitude: number; accuracy: number }
>('location/updateCurrentLocation', async (data) => {
  await locationApi.updateLocation(data.latitude, data.longitude);
});

export const fetchNearbyData = createAsyncThunk<
  NearbyUser[],
  { latitude: number; longitude: number; radius?: number }
>(
  'location/fetchNearbyData',
  async (params) => {
    return locationApi.getNearbyUsers(params);
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateCurrentLocation: (
      state,
      action: PayloadAction<{ latitude: number; longitude: number; accuracy: number }>
    ) => {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.accuracy = action.payload.accuracy;
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
      .addCase(fetchNearbyData.fulfilled, (state, action) => {
        state.nearbyUsers = action.payload || [];
        state.loading = false;
      })
      .addMatcher(
        isAnyOf(fetchNearbyData.pending, updateCurrentLocation.pending),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(fetchNearbyData.rejected, updateCurrentLocation.rejected),
        (state, action) => {
          state.loading = false;
          state.error = action.error.message || 'Unknown error';
        }
      );
  },
});

export const {
  updateCurrentLocation: setCurrentLocation,
  setLocationTracking,
  setLocationError,
  updateRegion,
} = locationSlice.actions;

export default locationSlice.reducer;
