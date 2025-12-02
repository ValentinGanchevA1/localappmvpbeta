// src/store/store.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';
import userReducer from './slices/userSlice';
import themeReducer from './slices/themeSlice';
import mapReducer from './slices/mapSlice';
import taskReducer from './slices/taskSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  location: locationReducer,
  user: userReducer,
  theme: themeReducer,
  map: mapReducer,
  task: taskReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'theme'],
  timeout: 0, // Don't wait indefinitely for rehydration
  throttle: 1000, // Only persist every 1 second
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
