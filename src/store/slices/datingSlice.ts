// src/store/slices/datingSlice.ts
// Comprehensive Dating State Management with Matches, Likes, and Preferences

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  DatingProfile,
  DatingPreferences,
  SwipeActionType,
  Match,
  Like,
  UserDatingStats,
  Boost,
  DatingState,
  DEFAULT_DATING_PREFERENCES,
  FREE_DAILY_LIMITS,
  SwipeResponse,
} from '@/types/dating';
import {DatingService} from '@/services/datingService';
import {datingApi} from '@/api/datingApi';
import {RootState} from '@/store';

// ============================================
// Initial State
// ============================================

const initialStats: UserDatingStats = {
  totalLikes: 0,
  totalPasses: 0,
  totalSuperLikes: 0,
  totalMatches: 0,
  likesRemaining: FREE_DAILY_LIMITS.likes,
  superLikesRemaining: FREE_DAILY_LIMITS.superLikes,
  rewindsRemaining: FREE_DAILY_LIMITS.rewinds,
  boostsRemaining: FREE_DAILY_LIMITS.boosts,
  nextRefresh: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  isBoostActive: false,
};

const initialState: DatingState = {
  // My Profile
  myProfile: null,
  myProfileLoading: false,
  myProfileError: null,

  // Profiles to swipe
  profiles: [],
  currentIndex: 0,
  profilesLoading: false,
  profilesError: null,

  // Recommendations
  recommendations: [],
  recommendationsLoading: false,

  // Matches
  matches: [],
  matchesLoading: false,
  matchesError: null,
  newMatchesCount: 0,

  // Likes (who liked you)
  receivedLikes: [],
  likesLoading: false,
  likesCount: 0,

  // Swipe History
  swipeHistory: [],
  lastSwipedProfile: null,

  // Preferences
  preferences: DEFAULT_DATING_PREFERENCES,
  preferencesLoading: false,

  // Stats & Limits
  stats: initialStats,

  // UI State
  showMatchModal: false,
  currentMatch: null,
  viewingProfile: null,
};

// ============================================
// Profile Thunks
// ============================================

export const fetchMyDatingProfile = createAsyncThunk<
  DatingProfile,
  void,
  {rejectValue: string}
>('dating/fetchMyProfile', async (_, {rejectWithValue}) => {
  try {
    return await datingApi.getMyProfile();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch profile';
    return rejectWithValue(message);
  }
});

export const updateMyDatingProfile = createAsyncThunk<
  DatingProfile,
  Partial<DatingProfile>,
  {rejectValue: string}
>('dating/updateMyProfile', async (updates, {rejectWithValue}) => {
  try {
    return await datingApi.updateProfile(updates);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update profile';
    return rejectWithValue(message);
  }
});

export const toggleDatingProfileActive = createAsyncThunk<
  DatingProfile,
  boolean,
  {rejectValue: string}
>('dating/toggleActive', async (isActive, {rejectWithValue}) => {
  try {
    return await datingApi.toggleProfileActive(isActive);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update status';
    return rejectWithValue(message);
  }
});

// ============================================
// Discovery Thunks
// ============================================

export const fetchNearbyDatingProfiles = createAsyncThunk<
  DatingProfile[],
  {latitude: number; longitude: number; radius?: number},
  {rejectValue: string}
>('dating/fetchNearbyProfiles', async (params, {rejectWithValue}) => {
  try {
    return await datingApi.getNearbyProfiles(params);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch profiles';
    return rejectWithValue(message);
  }
});

export const fetchRecommendations = createAsyncThunk<
  DatingProfile[],
  {latitude: number; longitude: number},
  {rejectValue: string}
>('dating/fetchRecommendations', async (params, {rejectWithValue}) => {
  try {
    return await datingApi.getRecommendations(params);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch recommendations';
    return rejectWithValue(message);
  }
});

export const generateRecommendations = createAsyncThunk<
  DatingProfile[],
  void,
  {state: RootState; rejectValue: string}
>('dating/generateRecommendations', async (_, {getState, rejectWithValue}) => {
  const state = getState();
  const baseProfile = state.dating.myProfile;
  const allProfiles = state.dating.profiles;

  if (!baseProfile) {
    return rejectWithValue('Dating profile not loaded');
  }

  return DatingService.getRecommendations(baseProfile, allProfiles);
});

export const refreshProfiles = createAsyncThunk<
  DatingProfile[],
  {latitude: number; longitude: number},
  {rejectValue: string}
>('dating/refreshProfiles', async (params, {rejectWithValue}) => {
  try {
    return await datingApi.refreshProfiles(params);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to refresh profiles';
    return rejectWithValue(message);
  }
});

// ============================================
// Swipe Thunks
// ============================================

export const recordSwipe = createAsyncThunk<
  SwipeResponse,
  {targetUserId: string; action: SwipeActionType},
  {rejectValue: string; state: RootState}
>('dating/recordSwipe', async (params, {getState, rejectWithValue}) => {
  const state = getState();
  const userId = state.auth.user?.id;

  if (!userId) {
    return rejectWithValue('Not authenticated');
  }

  // Check limits
  const stats = state.dating.stats;
  if (params.action === 'like' && stats.likesRemaining === 0) {
    return rejectWithValue('No likes remaining today');
  }
  if (params.action === 'super_like' && stats.superLikesRemaining === 0) {
    return rejectWithValue('No super likes remaining today');
  }

  try {
    return await datingApi.recordSwipe({...params, userId});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Swipe failed';
    return rejectWithValue(message);
  }
});

export const rewindLastSwipe = createAsyncThunk<
  {profile: DatingProfile; rewindsRemaining: number},
  void,
  {rejectValue: string; state: RootState}
>('dating/rewindSwipe', async (_, {getState, rejectWithValue}) => {
  const state = getState();
  if (state.dating.stats.rewindsRemaining === 0) {
    return rejectWithValue('No rewinds remaining');
  }

  try {
    return await datingApi.rewindSwipe();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Rewind failed';
    return rejectWithValue(message);
  }
});

// ============================================
// Matches Thunks
// ============================================

export const fetchMatches = createAsyncThunk<
  Match[],
  {status?: 'active' | 'archived' | 'unmatched'} | void,
  {rejectValue: string}
>('dating/fetchMatches', async (params, {rejectWithValue}) => {
  try {
    return await datingApi.getMatches(params || undefined);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch matches';
    return rejectWithValue(message);
  }
});

export const fetchNewMatchesCount = createAsyncThunk<number, void, {rejectValue: string}>(
  'dating/fetchNewMatchesCount',
  async (_, {rejectWithValue}) => {
    try {
      return await datingApi.getNewMatchesCount();
    } catch {
      return rejectWithValue('Failed to fetch count');
    }
  }
);

export const unmatchUser = createAsyncThunk<
  string,
  {matchId: string; reason?: string},
  {rejectValue: string}
>('dating/unmatch', async (params, {rejectWithValue}) => {
  try {
    await datingApi.unmatch(params);
    return params.matchId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unmatch failed';
    return rejectWithValue(message);
  }
});

export const archiveMatch = createAsyncThunk<
  Match,
  string,
  {rejectValue: string}
>('dating/archiveMatch', async (matchId, {rejectWithValue}) => {
  try {
    return await datingApi.archiveMatch(matchId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Archive failed';
    return rejectWithValue(message);
  }
});

export const unarchiveMatch = createAsyncThunk<
  Match,
  string,
  {rejectValue: string}
>('dating/unarchiveMatch', async (matchId, {rejectWithValue}) => {
  try {
    return await datingApi.unarchiveMatch(matchId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unarchive failed';
    return rejectWithValue(message);
  }
});

// ============================================
// Likes Thunks
// ============================================

export const fetchLikes = createAsyncThunk<
  Like[],
  {unseenOnly?: boolean} | void,
  {rejectValue: string}
>('dating/fetchLikes', async (params, {rejectWithValue}) => {
  try {
    return await datingApi.getLikes(params || undefined);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch likes';
    return rejectWithValue(message);
  }
});

export const fetchLikesCount = createAsyncThunk<number, void, {rejectValue: string}>(
  'dating/fetchLikesCount',
  async (_, {rejectWithValue}) => {
    try {
      return await datingApi.getLikesCount();
    } catch {
      return rejectWithValue('Failed to fetch count');
    }
  }
);

// ============================================
// Preferences Thunks
// ============================================

export const fetchPreferences = createAsyncThunk<
  DatingPreferences,
  void,
  {rejectValue: string}
>('dating/fetchPreferences', async (_, {rejectWithValue}) => {
  try {
    return await datingApi.getPreferences();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch preferences';
    return rejectWithValue(message);
  }
});

export const updatePreferences = createAsyncThunk<
  DatingPreferences,
  Partial<DatingPreferences>,
  {rejectValue: string}
>('dating/updatePreferences', async (preferences, {rejectWithValue}) => {
  try {
    return await datingApi.updatePreferences(preferences);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update preferences';
    return rejectWithValue(message);
  }
});

// ============================================
// Stats & Boost Thunks
// ============================================

export const fetchStats = createAsyncThunk<
  UserDatingStats,
  void,
  {rejectValue: string}
>('dating/fetchStats', async (_, {rejectWithValue}) => {
  try {
    return await datingApi.getStats();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch stats';
    return rejectWithValue(message);
  }
});

export const activateBoost = createAsyncThunk<
  Boost,
  void,
  {rejectValue: string; state: RootState}
>('dating/activateBoost', async (_, {getState, rejectWithValue}) => {
  const state = getState();
  if (state.dating.stats.boostsRemaining === 0) {
    return rejectWithValue('No boosts remaining');
  }
  if (state.dating.stats.isBoostActive) {
    return rejectWithValue('Boost already active');
  }

  try {
    return await datingApi.activateBoost();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to activate boost';
    return rejectWithValue(message);
  }
});

// ============================================
// Report & Block Thunks
// ============================================

export const reportProfile = createAsyncThunk<
  void,
  {reportedUserId: string; reason: string; details?: string},
  {rejectValue: string}
>('dating/reportProfile', async (params, {rejectWithValue}) => {
  try {
    await datingApi.reportProfile(params as any);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to report profile';
    return rejectWithValue(message);
  }
});

export const blockDatingUser = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('dating/blockUser', async (userId, {rejectWithValue}) => {
  try {
    await datingApi.blockUser(userId);
    return userId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to block user';
    return rejectWithValue(message);
  }
});

// ============================================
// Slice Definition
// ============================================

const datingSlice = createSlice({
  name: 'dating',
  initialState,
  reducers: {
    // Profile navigation
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    nextProfile: (state) => {
      if (state.currentIndex < state.profiles.length - 1) {
        state.currentIndex += 1;
      }
    },
    previousProfile: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },
    removeTopRecommendation: (state) => {
      if (state.recommendations.length > 0) {
        state.lastSwipedProfile = state.recommendations[0];
        state.recommendations.shift();
      }
    },

    // View profile
    setViewingProfile: (state, action: PayloadAction<DatingProfile | null>) => {
      state.viewingProfile = action.payload;
    },

    // Match modal
    showMatchModal: (state, action: PayloadAction<Match>) => {
      state.currentMatch = action.payload;
      state.showMatchModal = true;
    },
    hideMatchModal: (state) => {
      state.showMatchModal = false;
      state.currentMatch = null;
    },

    // Local preference updates
    setPreferences: (state, action: PayloadAction<Partial<DatingPreferences>>) => {
      state.preferences = {...state.preferences, ...action.payload};
    },

    // Clear states
    clearError: (state) => {
      state.profilesError = null;
      state.matchesError = null;
      state.myProfileError = null;
    },
    clearDatingState: () => initialState,

    // Optimistic UI updates
    addMatchOptimistic: (state, action: PayloadAction<Match>) => {
      state.matches.unshift(action.payload);
      state.newMatchesCount += 1;
    },
    updateMatchLastMessage: (
      state,
      action: PayloadAction<{matchId: string; message: any; timestamp: string}>
    ) => {
      const match = state.matches.find(m => m.id === action.payload.matchId);
      if (match) {
        match.lastMessage = action.payload.message;
        match.lastMessageAt = action.payload.timestamp;
      }
    },
    incrementUnreadCount: (state, action: PayloadAction<string>) => {
      const match = state.matches.find(m => m.id === action.payload);
      if (match) {
        match.unreadCount += 1;
      }
    },
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const match = state.matches.find(m => m.id === action.payload);
      if (match) {
        match.unreadCount = 0;
      }
    },
    decrementNewMatchesCount: (state) => {
      if (state.newMatchesCount > 0) {
        state.newMatchesCount -= 1;
      }
    },

    // Update stats locally after swipe
    decrementLikes: (state) => {
      if (state.stats.likesRemaining > 0) {
        state.stats.likesRemaining -= 1;
        state.stats.totalLikes += 1;
      }
    },
    decrementSuperLikes: (state) => {
      if (state.stats.superLikesRemaining > 0) {
        state.stats.superLikesRemaining -= 1;
        state.stats.totalSuperLikes += 1;
      }
    },
    incrementPasses: (state) => {
      state.stats.totalPasses += 1;
    },
  },
  extraReducers: builder => {
    builder
      // ============================================
      // My Profile
      // ============================================
      .addCase(fetchMyDatingProfile.pending, state => {
        state.myProfileLoading = true;
        state.myProfileError = null;
      })
      .addCase(fetchMyDatingProfile.fulfilled, (state, action) => {
        state.myProfile = action.payload;
        state.myProfileLoading = false;
      })
      .addCase(fetchMyDatingProfile.rejected, (state, action) => {
        state.myProfileLoading = false;
        state.myProfileError = action.payload ?? 'Failed to fetch profile';
      })
      .addCase(updateMyDatingProfile.fulfilled, (state, action) => {
        state.myProfile = action.payload;
      })
      .addCase(toggleDatingProfileActive.fulfilled, (state, action) => {
        state.myProfile = action.payload;
      })

      // ============================================
      // Discovery
      // ============================================
      .addCase(fetchNearbyDatingProfiles.pending, state => {
        state.profilesLoading = true;
        state.profilesError = null;
      })
      .addCase(fetchNearbyDatingProfiles.fulfilled, (state, action) => {
        state.profiles = action.payload;
        state.currentIndex = 0;
        state.profilesLoading = false;
      })
      .addCase(fetchNearbyDatingProfiles.rejected, (state, action) => {
        state.profilesLoading = false;
        state.profilesError = action.payload ?? 'Failed to fetch profiles';
      })
      .addCase(fetchRecommendations.pending, state => {
        state.recommendationsLoading = true;
      })
      .addCase(fetchRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
        state.recommendationsLoading = false;
      })
      .addCase(fetchRecommendations.rejected, state => {
        state.recommendationsLoading = false;
      })
      .addCase(generateRecommendations.fulfilled, (state, action) => {
        state.recommendations = action.payload;
      })
      .addCase(refreshProfiles.fulfilled, (state, action) => {
        state.profiles = action.payload;
        state.currentIndex = 0;
      })

      // ============================================
      // Swipe
      // ============================================
      .addCase(recordSwipe.fulfilled, (state, action) => {
        const {swipe, match, likesRemaining, superLikesRemaining} = action.payload;

        // Add to swipe history
        state.swipeHistory.push(swipe);

        // Update stats from server
        state.stats.likesRemaining = likesRemaining;
        state.stats.superLikesRemaining = superLikesRemaining;

        // Track stats locally
        if (swipe.action === 'like') {
          state.stats.totalLikes += 1;
        } else if (swipe.action === 'super_like') {
          state.stats.totalSuperLikes += 1;
        } else if (swipe.action === 'pass') {
          state.stats.totalPasses += 1;
        }

        // Handle match
        if (match) {
          state.matches.unshift(match);
          state.stats.totalMatches += 1;
          state.currentMatch = match;
          state.showMatchModal = true;
          state.newMatchesCount += 1;
        }

        // Move to next profile
        if (state.recommendations.length > 0) {
          state.lastSwipedProfile = state.recommendations[0];
          state.recommendations.shift();
        }
      })
      .addCase(recordSwipe.rejected, (state, action) => {
        state.profilesError = action.payload ?? 'Swipe failed';
      })
      .addCase(rewindLastSwipe.fulfilled, (state, action) => {
        // Add profile back to front
        state.recommendations.unshift(action.payload.profile);
        state.stats.rewindsRemaining = action.payload.rewindsRemaining;
        // Remove from swipe history
        state.swipeHistory.pop();
        state.lastSwipedProfile = null;
      })

      // ============================================
      // Matches
      // ============================================
      .addCase(fetchMatches.pending, state => {
        state.matchesLoading = true;
        state.matchesError = null;
      })
      .addCase(fetchMatches.fulfilled, (state, action) => {
        state.matches = action.payload;
        state.matchesLoading = false;
      })
      .addCase(fetchMatches.rejected, (state, action) => {
        state.matchesLoading = false;
        state.matchesError = action.payload ?? 'Failed to fetch matches';
      })
      .addCase(fetchNewMatchesCount.fulfilled, (state, action) => {
        state.newMatchesCount = action.payload;
      })
      .addCase(unmatchUser.fulfilled, (state, action) => {
        state.matches = state.matches.filter(m => m.id !== action.payload);
      })
      .addCase(archiveMatch.fulfilled, (state, action) => {
        const index = state.matches.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.matches[index] = action.payload;
        }
      })
      .addCase(unarchiveMatch.fulfilled, (state, action) => {
        const index = state.matches.findIndex(m => m.id === action.payload.id);
        if (index !== -1) {
          state.matches[index] = action.payload;
        }
      })

      // ============================================
      // Likes
      // ============================================
      .addCase(fetchLikes.pending, state => {
        state.likesLoading = true;
      })
      .addCase(fetchLikes.fulfilled, (state, action) => {
        state.receivedLikes = action.payload;
        state.likesLoading = false;
      })
      .addCase(fetchLikes.rejected, state => {
        state.likesLoading = false;
      })
      .addCase(fetchLikesCount.fulfilled, (state, action) => {
        state.likesCount = action.payload;
      })

      // ============================================
      // Preferences
      // ============================================
      .addCase(fetchPreferences.pending, state => {
        state.preferencesLoading = true;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
        state.preferencesLoading = false;
      })
      .addCase(fetchPreferences.rejected, state => {
        state.preferencesLoading = false;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })

      // ============================================
      // Stats & Boost
      // ============================================
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(activateBoost.fulfilled, (state, action) => {
        state.stats.isBoostActive = true;
        state.stats.boostsRemaining -= 1;
        state.stats.lastBoostAt = action.payload.startedAt;
        state.stats.boostExpiresAt = action.payload.expiresAt;
      })

      // ============================================
      // Block
      // ============================================
      .addCase(blockDatingUser.fulfilled, (state, action) => {
        // Remove blocked user from all lists
        state.profiles = state.profiles.filter(
          p => p.userId !== action.payload
        );
        state.recommendations = state.recommendations.filter(
          p => p.userId !== action.payload
        );
        state.matches = state.matches.filter(
          m =>
            m.user1Id !== action.payload && m.user2Id !== action.payload
        );
        state.receivedLikes = state.receivedLikes.filter(
          l => l.fromUserId !== action.payload
        );
      });
  },
});

// ============================================
// Exports
// ============================================

export const {
  setCurrentIndex,
  nextProfile,
  previousProfile,
  removeTopRecommendation,
  setViewingProfile,
  showMatchModal,
  hideMatchModal,
  setPreferences,
  clearError,
  clearDatingState,
  addMatchOptimistic,
  updateMatchLastMessage,
  incrementUnreadCount,
  resetUnreadCount,
  decrementNewMatchesCount,
  decrementLikes,
  decrementSuperLikes,
  incrementPasses,
} = datingSlice.actions;

export default datingSlice.reducer;

// ============================================
// Selectors
// ============================================

export const selectMyProfile = (state: RootState) => state.dating.myProfile;
export const selectProfiles = (state: RootState) => state.dating.profiles;
export const selectRecommendations = (state: RootState) => state.dating.recommendations;
export const selectCurrentProfile = (state: RootState) => {
  const {recommendations} = state.dating;
  return recommendations[0] ?? null;
};
export const selectMatches = (state: RootState) => state.dating.matches;
export const selectActiveMatches = (state: RootState) =>
  state.dating.matches.filter(m => m.status === 'active');
export const selectArchivedMatches = (state: RootState) =>
  state.dating.matches.filter(m => m.status === 'archived');
export const selectLikes = (state: RootState) => state.dating.receivedLikes;
export const selectPreferences = (state: RootState) => state.dating.preferences;
export const selectStats = (state: RootState) => state.dating.stats;
export const selectNewMatchesCount = (state: RootState) => state.dating.newMatchesCount;
export const selectLikesCount = (state: RootState) => state.dating.likesCount;
export const selectIsBoostActive = (state: RootState) => state.dating.stats.isBoostActive;
export const selectCanSwipe = (state: RootState) => state.dating.stats.likesRemaining > 0;
export const selectCanSuperLike = (state: RootState) => state.dating.stats.superLikesRemaining > 0;
export const selectCanRewind = (state: RootState) =>
  state.dating.stats.rewindsRemaining > 0 && state.dating.lastSwipedProfile !== null;
