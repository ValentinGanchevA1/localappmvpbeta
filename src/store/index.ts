// src/store/index.ts
export * from './store';
export * from './hooks';

// Explicit exports to avoid naming collisions across slices
export { loginWithPhone, logout, setToken, clearError as clearAuthError } from './slices/authSlice';
export { default as authReducer } from './slices/authSlice';

export { fetchUserProfile, updateUserProfile, updatePreferences, uploadProfileImage, deleteAccount } from './slices/userSlice';
export { default as userReducer } from './slices/userSlice';

export { fetchTasks, deleteTask, selectTask } from './slices/taskSlice';
export { default as taskReducer } from './slices/taskSlice';

export { fetchNearbyData, setCurrentLocation, setLocationTracking, setLocationError, updateRegion, clearLocationError } from './slices/locationSlice';
export { default as locationReducer } from './slices/locationSlice';

export { default as themeReducer } from './slices/themeSlice';

// Local Trends exports
export {
  fetchTrends,
  fetchTrendDetail,
  fetchInsights,
  fetchTrendNotifications,
  likeTrend,
  unlikeTrend,
  setFilter,
  selectTrends,
  selectInsights,
  selectTrendNotifications,
} from './slices/localTrendsSlice';
export { default as localTrendsReducer } from './slices/localTrendsSlice';
