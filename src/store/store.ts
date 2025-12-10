// src/store/store.ts - CORRECTED
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';
import userReducer from './slices/userSlice';
import themeReducer from './slices/themeSlice';
import datingReducer from './slices/datingSlice';
import tradingReducer from './slices/tradingSlice';
import taskReducer from './slices/taskSlice';

// Whitelist specific slices to persist (don't persist everything)
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'theme', 'user'], // ✅ Only persist essential data
  blacklist: ['location', 'dating', 'trading', 'task'], // ❌ Don't persist real-time data
  version: 1,
};

const rootReducer = combineReducers({
  auth: authReducer,
  location: locationReducer,
  user: userReducer,
  theme: themeReducer,
  dating: datingReducer,
  trading: tradingReducer,
  task: taskReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // ✅ Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['_persist'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
