// src/store/slices/notificationSettingsSlice.ts
// Redux slice for notification preferences and settings

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationSettings,
  NotificationType,
  PermissionStatus,
  FrequencyPreference,
  QuietHoursConfig,
  DEFAULT_NOTIFICATION_SETTINGS,
  FCMTokenInfo,
} from '@/types/notifications';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

interface NotificationSettingsState {
  settings: NotificationSettings;
  fcmToken: string | null;
  fcmTokenUpdatedAt: number | null;
  permissionStatus: PermissionStatus;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationSettingsState = {
  settings: DEFAULT_NOTIFICATION_SETTINGS,
  fcmToken: null,
  fcmTokenUpdatedAt: null,
  permissionStatus: 'not_determined',
  loading: false,
  error: null,
};

/**
 * Load notification settings from storage
 */
export const loadNotificationSettings = createAsyncThunk<NotificationSettings>(
  'notificationSettings/load',
  async (_, { rejectWithValue }) => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NotificationSettings;
        // Merge with defaults to handle any new settings
        return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
      }
      return DEFAULT_NOTIFICATION_SETTINGS;
    } catch (error) {
      console.error('[NotificationSettings] Load error:', error);
      return rejectWithValue('Failed to load notification settings');
    }
  }
);

/**
 * Save notification settings to storage
 */
export const saveNotificationSettings = createAsyncThunk<NotificationSettings, NotificationSettings>(
  'notificationSettings/save',
  async (settings, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('[NotificationSettings] Save error:', error);
      return rejectWithValue('Failed to save notification settings');
    }
  }
);

const notificationSettingsSlice = createSlice({
  name: 'notificationSettings',
  initialState,
  reducers: {
    /**
     * Toggle master notification switch
     */
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.settings.enabled = action.payload;
    },

    /**
     * Toggle a specific notification type
     */
    setNotificationTypeEnabled: (
      state,
      action: PayloadAction<{ type: NotificationType; enabled: boolean }>
    ) => {
      state.settings.types[action.payload.type] = action.payload.enabled;
    },

    /**
     * Update quiet hours configuration
     */
    setQuietHours: (state, action: PayloadAction<QuietHoursConfig>) => {
      state.settings.quietHours = action.payload;
    },

    /**
     * Toggle quiet hours on/off
     */
    toggleQuietHours: (state, action: PayloadAction<boolean>) => {
      state.settings.quietHours.enabled = action.payload;
    },

    /**
     * Set quiet hours start time
     */
    setQuietHoursStart: (state, action: PayloadAction<string>) => {
      state.settings.quietHours.start = action.payload;
    },

    /**
     * Set quiet hours end time
     */
    setQuietHoursEnd: (state, action: PayloadAction<string>) => {
      state.settings.quietHours.end = action.payload;
    },

    /**
     * Set notification frequency preference
     */
    setFrequency: (state, action: PayloadAction<FrequencyPreference>) => {
      state.settings.frequency = action.payload;
    },

    /**
     * Toggle sound
     */
    setSound: (state, action: PayloadAction<boolean>) => {
      state.settings.sound = action.payload;
    },

    /**
     * Toggle vibration
     */
    setVibration: (state, action: PayloadAction<boolean>) => {
      state.settings.vibration = action.payload;
    },

    /**
     * Toggle smart timing (AI-optimized delivery)
     */
    setSmartTiming: (state, action: PayloadAction<boolean>) => {
      state.settings.smartTiming = action.payload;
    },

    /**
     * Update FCM token
     */
    setFcmToken: (state, action: PayloadAction<string | null>) => {
      state.fcmToken = action.payload;
      state.fcmTokenUpdatedAt = action.payload ? Date.now() : null;
    },

    /**
     * Update permission status
     */
    setPermissionStatus: (state, action: PayloadAction<PermissionStatus>) => {
      state.permissionStatus = action.payload;
    },

    /**
     * Reset settings to defaults
     */
    resetSettings: (state) => {
      state.settings = DEFAULT_NOTIFICATION_SETTINGS;
    },

    /**
     * Bulk update settings
     */
    updateSettings: (state, action: PayloadAction<Partial<NotificationSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load settings
      .addCase(loadNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.loading = false;
      })
      .addCase(loadNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Save settings
      .addCase(saveNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveNotificationSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.loading = false;
      })
      .addCase(saveNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setNotificationsEnabled,
  setNotificationTypeEnabled,
  setQuietHours,
  toggleQuietHours,
  setQuietHoursStart,
  setQuietHoursEnd,
  setFrequency,
  setSound,
  setVibration,
  setSmartTiming,
  setFcmToken,
  setPermissionStatus,
  resetSettings,
  updateSettings,
  clearError,
} = notificationSettingsSlice.actions;

export default notificationSettingsSlice.reducer;

// Selectors
export const selectNotificationSettings = (state: { notificationSettings: NotificationSettingsState }) =>
  state.notificationSettings.settings;

export const selectNotificationsEnabled = (state: { notificationSettings: NotificationSettingsState }) =>
  state.notificationSettings.settings.enabled;

export const selectPermissionStatus = (state: { notificationSettings: NotificationSettingsState }) =>
  state.notificationSettings.permissionStatus;

export const selectQuietHours = (state: { notificationSettings: NotificationSettingsState }) =>
  state.notificationSettings.settings.quietHours;

export const selectFcmToken = (state: { notificationSettings: NotificationSettingsState }) =>
  state.notificationSettings.fcmToken;

export const selectIsTypeEnabled = (
  state: { notificationSettings: NotificationSettingsState },
  type: NotificationType
) => state.notificationSettings.settings.enabled && state.notificationSettings.settings.types[type];
