// src/store/slices/localTrendsSlice.ts
// Local Trends State Management - Area-based notifications, trending topics, community insights

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  Trend,
  TrendDetail,
  TrendDiscussion,
  CommunityInsight,
  AreaStats,
  TrendNotification,
  TrendsFilter,
  LocalTrendsState,
  DEFAULT_TRENDS_FILTER,
  FetchTrendsParams,
  SearchTrendsParams,
} from '@/types/trends';
import {localTrendsApi} from '@/api/localTrendsApi';
import {RootState} from '@/store';

// ============================================
// Initial State
// ============================================

const initialState: LocalTrendsState = {
  // Trends data
  trends: [],
  trendsLoading: false,
  trendsError: null,

  // Selected trend detail
  selectedTrend: null,
  selectedTrendLoading: false,

  // Nearby/local trends
  nearbyTrends: [],
  nearbyTrendsLoading: false,

  // Search results
  searchResults: [],
  searchQuery: '',
  searchLoading: false,

  // Community insights
  insights: [],
  areaStats: null,
  insightsLoading: false,

  // Trend notifications
  trendNotifications: [],
  unreadNotificationsCount: 0,

  // Filters
  activeFilter: DEFAULT_TRENDS_FILTER,

  // Pagination
  hasMore: true,
  currentPage: 0,

  // Last update
  lastUpdated: null,
};

// ============================================
// Async Thunks
// ============================================

/**
 * Fetch trends for the area
 */
export const fetchTrends = createAsyncThunk<
  {trends: Trend[]; hasMore: boolean},
  FetchTrendsParams,
  {rejectValue: string; state: RootState}
>('localTrends/fetchTrends', async (params, {getState, rejectWithValue}) => {
  try {
    const state = getState();
    const filter = state.localTrends.activeFilter;
    return await localTrendsApi.getTrends({...params, filter});
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch trends';
    return rejectWithValue(message);
  }
});

/**
 * Load more trends (pagination)
 */
export const loadMoreTrends = createAsyncThunk<
  {trends: Trend[]; hasMore: boolean},
  {latitude: number; longitude: number},
  {rejectValue: string; state: RootState}
>('localTrends/loadMoreTrends', async (params, {getState, rejectWithValue}) => {
  try {
    const state = getState();
    const {currentPage, activeFilter} = state.localTrends;
    const offset = (currentPage + 1) * 10;

    return await localTrendsApi.getTrends({
      ...params,
      offset,
      limit: 10,
      filter: activeFilter,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load more trends';
    return rejectWithValue(message);
  }
});

/**
 * Fetch trend details
 */
export const fetchTrendDetail = createAsyncThunk<
  TrendDetail,
  string,
  {rejectValue: string}
>('localTrends/fetchTrendDetail', async (trendId, {rejectWithValue}) => {
  try {
    return await localTrendsApi.getTrendDetail(trendId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch trend details';
    return rejectWithValue(message);
  }
});

/**
 * Search trends
 */
export const searchTrends = createAsyncThunk<
  Trend[],
  SearchTrendsParams,
  {rejectValue: string}
>('localTrends/searchTrends', async (params, {rejectWithValue}) => {
  try {
    return await localTrendsApi.searchTrends(params);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to search trends';
    return rejectWithValue(message);
  }
});

/**
 * Fetch community insights
 */
export const fetchInsights = createAsyncThunk<
  CommunityInsight[],
  {latitude: number; longitude: number},
  {rejectValue: string}
>('localTrends/fetchInsights', async (params, {rejectWithValue}) => {
  try {
    return await localTrendsApi.getInsights(params.latitude, params.longitude);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch insights';
    return rejectWithValue(message);
  }
});

/**
 * Fetch area statistics
 */
export const fetchAreaStats = createAsyncThunk<
  AreaStats,
  {latitude: number; longitude: number; radius?: number},
  {rejectValue: string}
>('localTrends/fetchAreaStats', async (params, {rejectWithValue}) => {
  try {
    return await localTrendsApi.getAreaStats(params.latitude, params.longitude, params.radius);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch area stats';
    return rejectWithValue(message);
  }
});

/**
 * Fetch trend notifications
 */
export const fetchTrendNotifications = createAsyncThunk<
  TrendNotification[],
  void,
  {rejectValue: string}
>('localTrends/fetchTrendNotifications', async (_, {rejectWithValue}) => {
  try {
    return await localTrendsApi.getTrendNotifications();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch notifications';
    return rejectWithValue(message);
  }
});

/**
 * Like a trend
 */
export const likeTrend = createAsyncThunk<
  {trendId: string; likesCount: number},
  string,
  {rejectValue: string}
>('localTrends/likeTrend', async (trendId, {rejectWithValue}) => {
  try {
    const result = await localTrendsApi.likeTrend(trendId);
    return {trendId, likesCount: result.likesCount};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to like trend';
    return rejectWithValue(message);
  }
});

/**
 * Unlike a trend
 */
export const unlikeTrend = createAsyncThunk<
  {trendId: string; likesCount: number},
  string,
  {rejectValue: string}
>('localTrends/unlikeTrend', async (trendId, {rejectWithValue}) => {
  try {
    const result = await localTrendsApi.unlikeTrend(trendId);
    return {trendId, likesCount: result.likesCount};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to unlike trend';
    return rejectWithValue(message);
  }
});

/**
 * Add comment to trend
 */
export const addComment = createAsyncThunk<
  {trendId: string; comment: TrendDiscussion},
  {trendId: string; content: string},
  {rejectValue: string}
>('localTrends/addComment', async ({trendId, content}, {rejectWithValue}) => {
  try {
    const comment = await localTrendsApi.addComment(trendId, content);
    return {trendId, comment};
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add comment';
    return rejectWithValue(message);
  }
});

/**
 * Mark notification as read
 */
export const markNotificationRead = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('localTrends/markNotificationRead', async (notificationId, {rejectWithValue}) => {
  try {
    await localTrendsApi.markNotificationRead(notificationId);
    return notificationId;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark as read';
    return rejectWithValue(message);
  }
});

// ============================================
// Slice
// ============================================

const localTrendsSlice = createSlice({
  name: 'localTrends',
  initialState,
  reducers: {
    // Set active filter
    setFilter: (state, action: PayloadAction<Partial<TrendsFilter>>) => {
      state.activeFilter = {...state.activeFilter, ...action.payload};
      // Reset pagination when filter changes
      state.currentPage = 0;
      state.hasMore = true;
    },

    // Reset filter
    resetFilter: (state) => {
      state.activeFilter = DEFAULT_TRENDS_FILTER;
      state.currentPage = 0;
      state.hasMore = true;
    },

    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Clear search
    clearSearch: (state) => {
      state.searchQuery = '';
      state.searchResults = [];
    },

    // Clear selected trend
    clearSelectedTrend: (state) => {
      state.selectedTrend = null;
    },

    // Clear errors
    clearError: (state) => {
      state.trendsError = null;
    },

    // Optimistic like update
    optimisticLike: (state, action: PayloadAction<string>) => {
      const trend = state.trends.find(t => t.id === action.payload);
      if (trend) {
        trend.likesCount += 1;
      }
      if (state.selectedTrend?.id === action.payload) {
        state.selectedTrend.likesCount += 1;
        state.selectedTrend.userEngagement.hasLiked = true;
      }
    },

    // Optimistic unlike update
    optimisticUnlike: (state, action: PayloadAction<string>) => {
      const trend = state.trends.find(t => t.id === action.payload);
      if (trend) {
        trend.likesCount = Math.max(0, trend.likesCount - 1);
      }
      if (state.selectedTrend?.id === action.payload) {
        state.selectedTrend.likesCount = Math.max(0, state.selectedTrend.likesCount - 1);
        state.selectedTrend.userEngagement.hasLiked = false;
      }
    },

    // Mark all notifications as read
    markAllNotificationsRead: (state) => {
      state.trendNotifications = state.trendNotifications.map(n => ({
        ...n,
        isRead: true,
      }));
      state.unreadNotificationsCount = 0;
    },

    // Clear all state
    clearLocalTrendsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // Fetch Trends
      // ============================================
      .addCase(fetchTrends.pending, (state) => {
        state.trendsLoading = true;
        state.trendsError = null;
      })
      .addCase(fetchTrends.fulfilled, (state, action) => {
        state.trends = action.payload.trends;
        state.hasMore = action.payload.hasMore;
        state.trendsLoading = false;
        state.currentPage = 0;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchTrends.rejected, (state, action) => {
        state.trendsLoading = false;
        state.trendsError = action.payload ?? 'Failed to fetch trends';
      })

      // ============================================
      // Load More Trends
      // ============================================
      .addCase(loadMoreTrends.pending, (state) => {
        state.trendsLoading = true;
      })
      .addCase(loadMoreTrends.fulfilled, (state, action) => {
        state.trends = [...state.trends, ...action.payload.trends];
        state.hasMore = action.payload.hasMore;
        state.trendsLoading = false;
        state.currentPage += 1;
      })
      .addCase(loadMoreTrends.rejected, (state) => {
        state.trendsLoading = false;
      })

      // ============================================
      // Fetch Trend Detail
      // ============================================
      .addCase(fetchTrendDetail.pending, (state) => {
        state.selectedTrendLoading = true;
      })
      .addCase(fetchTrendDetail.fulfilled, (state, action) => {
        state.selectedTrend = action.payload;
        state.selectedTrendLoading = false;
      })
      .addCase(fetchTrendDetail.rejected, (state) => {
        state.selectedTrendLoading = false;
      })

      // ============================================
      // Search Trends
      // ============================================
      .addCase(searchTrends.pending, (state) => {
        state.searchLoading = true;
      })
      .addCase(searchTrends.fulfilled, (state, action) => {
        state.searchResults = action.payload;
        state.searchLoading = false;
      })
      .addCase(searchTrends.rejected, (state) => {
        state.searchLoading = false;
      })

      // ============================================
      // Fetch Insights
      // ============================================
      .addCase(fetchInsights.pending, (state) => {
        state.insightsLoading = true;
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.insights = action.payload;
        state.insightsLoading = false;
      })
      .addCase(fetchInsights.rejected, (state) => {
        state.insightsLoading = false;
      })

      // ============================================
      // Fetch Area Stats
      // ============================================
      .addCase(fetchAreaStats.fulfilled, (state, action) => {
        state.areaStats = action.payload;
      })

      // ============================================
      // Fetch Notifications
      // ============================================
      .addCase(fetchTrendNotifications.fulfilled, (state, action) => {
        state.trendNotifications = action.payload;
        state.unreadNotificationsCount = action.payload.filter(n => !n.isRead).length;
      })

      // ============================================
      // Like/Unlike
      // ============================================
      .addCase(likeTrend.fulfilled, (state, action) => {
        const trend = state.trends.find(t => t.id === action.payload.trendId);
        if (trend) {
          trend.likesCount = action.payload.likesCount;
        }
        if (state.selectedTrend?.id === action.payload.trendId) {
          state.selectedTrend.likesCount = action.payload.likesCount;
          state.selectedTrend.userEngagement.hasLiked = true;
        }
      })
      .addCase(unlikeTrend.fulfilled, (state, action) => {
        const trend = state.trends.find(t => t.id === action.payload.trendId);
        if (trend) {
          trend.likesCount = action.payload.likesCount;
        }
        if (state.selectedTrend?.id === action.payload.trendId) {
          state.selectedTrend.likesCount = action.payload.likesCount;
          state.selectedTrend.userEngagement.hasLiked = false;
        }
      })

      // ============================================
      // Add Comment
      // ============================================
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.selectedTrend?.id === action.payload.trendId) {
          state.selectedTrend.discussions.unshift(action.payload.comment);
          state.selectedTrend.discussionCount += 1;
          state.selectedTrend.commentsCount += 1;
          state.selectedTrend.userEngagement.hasCommented = true;
        }
      })

      // ============================================
      // Mark Notification Read
      // ============================================
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = state.trendNotifications.find(n => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadNotificationsCount = Math.max(0, state.unreadNotificationsCount - 1);
        }
      });
  },
});

// ============================================
// Exports
// ============================================

export const {
  setFilter,
  resetFilter,
  setSearchQuery,
  clearSearch,
  clearSelectedTrend,
  clearError,
  optimisticLike,
  optimisticUnlike,
  markAllNotificationsRead,
  clearLocalTrendsState,
} = localTrendsSlice.actions;

export default localTrendsSlice.reducer;

// ============================================
// Selectors
// ============================================

export const selectTrends = (state: RootState) => state.localTrends.trends;
export const selectTrendsLoading = (state: RootState) => state.localTrends.trendsLoading;
export const selectTrendsError = (state: RootState) => state.localTrends.trendsError;
export const selectSelectedTrend = (state: RootState) => state.localTrends.selectedTrend;
export const selectSelectedTrendLoading = (state: RootState) => state.localTrends.selectedTrendLoading;
export const selectSearchResults = (state: RootState) => state.localTrends.searchResults;
export const selectSearchQuery = (state: RootState) => state.localTrends.searchQuery;
export const selectSearchLoading = (state: RootState) => state.localTrends.searchLoading;
export const selectInsights = (state: RootState) => state.localTrends.insights;
export const selectAreaStats = (state: RootState) => state.localTrends.areaStats;
export const selectInsightsLoading = (state: RootState) => state.localTrends.insightsLoading;
export const selectTrendNotifications = (state: RootState) => state.localTrends.trendNotifications;
export const selectUnreadNotificationsCount = (state: RootState) => state.localTrends.unreadNotificationsCount;
export const selectActiveFilter = (state: RootState) => state.localTrends.activeFilter;
export const selectHasMore = (state: RootState) => state.localTrends.hasMore;
export const selectLastUpdated = (state: RootState) => state.localTrends.lastUpdated;

// Derived selectors
export const selectTrendingTrends = (state: RootState) =>
  state.localTrends.trends.filter(t => t.isTrending).sort((a, b) => (a.trendingRank || 999) - (b.trendingRank || 999));

export const selectTrendsByCategory = (state: RootState, category: string) =>
  state.localTrends.trends.filter(t => t.category === category);

export const selectUnreadTrendNotifications = (state: RootState) =>
  state.localTrends.trendNotifications.filter(n => !n.isRead);
