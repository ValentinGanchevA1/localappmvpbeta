// src/store/slices/datingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DatingProfile, SwipeAction, Match } from '@/types/dating';
import { DatingService } from '@/services/datingService';
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/dating/nearby?` +
        `lat=${params.latitude}&lng=${params.longitude}&radius=${params.radius}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch nearby profiles.');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
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
    const currentUser = state.auth.user?.profile as DatingProfile;
    const allProfiles = state.dating.profiles;

    if (!currentUser) {
      return rejectWithValue('User not authenticated');
    }

    return DatingService.getRecommendations(currentUser, allProfiles);
  }
);

// Record swipe action
export const recordSwipe = createAsyncThunk<
  SwipeAction,
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/dating/swipe`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            targetUserId: params.targetUserId,
            action: params.action,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Swipe failed');
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
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
      .addCase(recordSwipe.fulfilled, (state, action: PayloadAction<SwipeAction>) => {
        state.swipeHistory.push(action.payload);

        // Check for mutual match
        if (action.payload.action === 'like') {
          const targetSwiped = state.swipeHistory.find(
            s =>
              s.userId === action.payload.targetUserId &&
              s.targetUserId === action.payload.userId &&
              s.action === 'like'
          );

          if (targetSwiped) {
            state.matches.push({
              id: `match_${Date.now()}`,
              user1Id: action.payload.userId,
              user2Id: action.payload.targetUserId,
              matchedAt: new Date().toISOString(),
              messages: [],
              status: 'active',
            });
          }
        }
      })
      .addCase(recordSwipe.rejected, (state, action) => {
        state.error = action.payload ?? 'Swipe failed';
      });
  },
});

export const { setCurrentProfile, clearError, removeTopRecommendation } = datingSlice.actions;
export default datingSlice.reducer;
