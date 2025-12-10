// src/store/slices/datingSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DatingProfile, SwipeAction, Match } from '@/types/dating';
import { DatingService } from '@/services/datingService';
import { RootState } from '@/store'; // Ensure RootState is imported

interface DatingState {
  profiles: DatingProfile[];
  matches: Match[];
  recommendations: DatingProfile[];
  loading: boolean;
  error: string | null;
  swipeHistory: SwipeAction[];
}

const initialState: DatingState = {
  profiles: [],
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
        `${process.env.REACT_APP_API_URL}/api/dating/nearby?lat=${params.latitude}&lng=${params.longitude}&radius=${params.radius}`
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

// Generate recommendations based on profiles
export const generateRecommendations = createAsyncThunk<
  DatingProfile[],
  void, // No parameters needed as it uses state
  { state: RootState }
>(
  'dating/generateRecommendations',
  async (_, { getState }) => {
    const state = getState();
    const currentUser = state.auth.user?.profile as DatingProfile; // Assuming user profile is available
    const allProfiles = state.dating.profiles;

    if (!currentUser) {
      return [];
    }

    return DatingService.getRecommendations(currentUser, allProfiles);
  }
);

// Record a swipe action
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
      return rejectWithValue('User not authenticated.');
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
        throw new Error('Swipe action failed on the server.');
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

        // NOTE: This client-side match detection is NOT reliable or scalable.
        // It's a temporary placeholder. Real match logic should be handled on the server,
        // which would then push a 'new_match' event to the clients.
        if (action.payload.action === 'like') {
          const targetSwipedBack = state.swipeHistory.some(
            s =>
              s.userId === action.payload.targetUserId &&
              s.targetUserId === action.payload.userId &&
              s.action === 'like'
          );

          if (targetSwipedBack) {
            state.matches.push({
              id: `match_${Date.now()}`,
              user1Id: action.payload.userId,
              user2Id: action.payload.targetUserId,
              matchedAt: new Date().toISOString(), // Use ISO string for serializable data
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

export const { clearError, removeTopRecommendation } = datingSlice.actions;
export default datingSlice.reducer;
