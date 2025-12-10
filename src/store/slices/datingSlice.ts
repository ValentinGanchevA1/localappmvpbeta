// src/store/slices/datingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DatingProfile, SwipeAction, Match } from '@/types/dating';
import { DatingService } from '@/services/datingService';
import { datingApi } from '@/api/datingApi';
import { RootState } from '@/store';

interface DatingState {
  profiles: DatingProfile[];
  currentProfile: DatingProfile | null;
  matches: Match[];
  recommendations: DatingProfile[];
  loading: boolean;
  error: string | null;
  swipeHistory: SwipeAction[];
}

const initialState: DatingState = {
  profiles: [],
  currentProfile: null,
  matches: [],
  recommendations: [],
  loading: false,
  error: null,
  swipeHistory: [],
};

// Fetch profiles near user location
export const fetchNearbyDatingProfiles = createAsyncThunk<
  DatingProfile[],
  { latitude: number; longitude: number; radius: number },
  { rejectValue: string }
>(
  'dating/fetchNearbyProfiles',
  async (params, { rejectWithValue }) => {
    try {
      return await datingApi.getNearbyProfiles(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch nearby profiles.';
      return rejectWithValue(message);
    }
  }
);

// Calculate recommendations
export const generateRecommendations = createAsyncThunk<
  DatingProfile[],
  void,
  { state: RootState; rejectValue: string }
>(
  'dating/generateRecommendations',
  async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const baseProfile = state.user.profile;
    const allProfiles = state.dating.profiles;

    if (!baseProfile) {
      return rejectWithValue('User not authenticated');
    }

    // Type guard to ensure profile has dating fields
    const isDatingProfile = (p: any): p is DatingProfile => {
      return (
        typeof p?.age === 'number' &&
        typeof p?.gender === 'string' &&
        typeof p?.lookingFor === 'string' &&
        Array.isArray(p?.interests) &&
        p?.location && typeof p.location.latitude === 'number' && typeof p.location.longitude === 'number' &&
        p?.datingPreferences &&
        typeof p.datingPreferences.maxDistance === 'number' &&
        p.datingPreferences.ageRange &&
        typeof p.datingPreferences.ageRange.min === 'number' &&
        typeof p.datingPreferences.ageRange.max === 'number'
      );
    };

    if (!isDatingProfile(baseProfile)) {
      return rejectWithValue('User profile incomplete for dating');
    }

    const currentUser: DatingProfile = baseProfile;
    return DatingService.getRecommendations(currentUser, allProfiles);
  }
);

// Record swipe action
export const recordSwipe = createAsyncThunk<
  { swipe: SwipeAction; match: Match | null },
  { targetUserId: string; action: 'like' | 'pass' | 'super_like' },
  { rejectValue: string; state: RootState }
>(
  'dating/recordSwipe',
  async (params, { getState, rejectWithValue }) => {
    const state = getState();
    const userId = state.auth.user?.id;

    if (!userId) {
      return rejectWithValue('Not authenticated');
    }

    try {
      return await datingApi.recordSwipe({ ...params, userId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Swipe failed';
      return rejectWithValue(message);
    }
  }
);

const datingSlice = createSlice({
  name: 'dating',
  initialState,
  reducers: {
    setCurrentProfile: (state, action: PayloadAction<DatingProfile>) => {
      state.currentProfile = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    removeTopRecommendation: (state) => {
      state.recommendations.shift();
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profiles
      .addCase(fetchNearbyDatingProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNearbyDatingProfiles.fulfilled, (state, action: PayloadAction<DatingProfile[]>) => {
        state.profiles = action.payload;
        state.loading = false;
      })
      .addCase(fetchNearbyDatingProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch profiles';
      })
      // Generate recommendations
      .addCase(generateRecommendations.fulfilled, (state, action: PayloadAction<DatingProfile[]>) => {
        state.recommendations = action.payload;
      })
      // Record swipe
      .addCase(recordSwipe.fulfilled, (state, action: PayloadAction<{ swipe: SwipeAction; match: Match | null }>) => {
        state.swipeHistory.push(action.payload.swipe);
        if (action.payload.match) {
          state.matches.push(action.payload.match);
        }
      })
      .addCase(recordSwipe.rejected, (state, action) => {
        state.error = action.payload ?? 'Swipe failed';
      });
  },
});

export const { setCurrentProfile, clearError, removeTopRecommendation } = datingSlice.actions;
export default datingSlice.reducer;
