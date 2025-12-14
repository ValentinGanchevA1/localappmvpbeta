// src/store/slices/engagementSlice.ts
// Redux slice for tracking user engagement patterns

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  EngagementEvent,
  EngagementEventType,
  UserEngagementProfile,
  DEFAULT_ENGAGEMENT_PROFILE,
} from '@/types/notifications';

// Maximum number of events to keep in memory
const MAX_EVENTS = 1000;
// Number of days of data to consider for profile calculation
const PROFILE_WINDOW_DAYS = 30;

interface EngagementState {
  events: EngagementEvent[];
  profile: UserEngagementProfile;
  sessionStart: number | null;
  currentSessionDuration: number;
  lastUpdated: number;
}

const initialState: EngagementState = {
  events: [],
  profile: DEFAULT_ENGAGEMENT_PROFILE,
  sessionStart: null,
  currentSessionDuration: 0,
  lastUpdated: 0,
};

/**
 * Generate a unique ID for events
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate engagement profile from events
 */
function calculateProfile(events: EngagementEvent[]): UserEngagementProfile {
  const now = Date.now();
  const windowStart = now - PROFILE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recentEvents = events.filter((e) => e.timestamp >= windowStart);

  if (recentEvents.length === 0) {
    return DEFAULT_ENGAGEMENT_PROFILE;
  }

  // Calculate hourly engagement scores
  const hourCounts = new Array(24).fill(0);
  const hourTotals = new Array(24).fill(0);

  // Calculate daily engagement scores
  const dayCounts = new Array(7).fill(0);
  const dayTotals = new Array(7).fill(0);

  // Track sessions
  let totalSessions = 0;
  let totalSessionDuration = 0;
  let lastAppOpen: number | null = null;

  // Track notifications
  let totalNotificationsReceived = 0;
  let totalNotificationsOpened = 0;
  let lastActiveTimestamp = 0;

  for (const event of recentEvents) {
    const date = new Date(event.timestamp);
    const hour = date.getHours();
    const day = date.getDay();

    // Update activity timestamp
    if (event.timestamp > lastActiveTimestamp) {
      lastActiveTimestamp = event.timestamp;
    }

    // Count activity by hour and day
    if (event.type === 'app_open' || event.type === 'app_foreground' || event.type === 'feature_used') {
      hourCounts[hour]++;
      dayCounts[day]++;
    }
    hourTotals[hour]++;
    dayTotals[day]++;

    // Track sessions
    if (event.type === 'app_open') {
      lastAppOpen = event.timestamp;
      totalSessions++;
    } else if (event.type === 'app_close' && lastAppOpen !== null) {
      totalSessionDuration += event.timestamp - lastAppOpen;
      lastAppOpen = null;
    }

    // Track notifications
    if (event.type === 'notification_received') {
      totalNotificationsReceived++;
    } else if (event.type === 'notification_opened') {
      totalNotificationsOpened++;
    }
  }

  // Normalize hourly scores to 0-1 range
  const maxHourCount = Math.max(...hourCounts, 1);
  const activeHours = hourCounts.map((count) => count / maxHourCount);

  // Normalize daily scores to 0-1 range
  const maxDayCount = Math.max(...dayCounts, 1);
  const activeDays = dayCounts.map((count) => count / maxDayCount);

  // Calculate average session duration
  const avgSessionDuration = totalSessions > 0 ? totalSessionDuration / totalSessions : 0;

  // Calculate notification response rate
  const notificationResponseRate =
    totalNotificationsReceived > 0
      ? totalNotificationsOpened / totalNotificationsReceived
      : 0.5; // Default to 50% if no data

  return {
    activeHours,
    activeDays,
    avgSessionDuration,
    notificationResponseRate,
    lastActiveTimestamp,
    totalSessions,
    totalNotificationsReceived,
    totalNotificationsOpened,
  };
}

const engagementSlice = createSlice({
  name: 'engagement',
  initialState,
  reducers: {
    /**
     * Record a new engagement event
     */
    recordEvent: (
      state,
      action: PayloadAction<{ type: EngagementEventType; metadata?: Record<string, unknown> }>
    ) => {
      const event: EngagementEvent = {
        id: generateEventId(),
        type: action.payload.type,
        timestamp: Date.now(),
        metadata: action.payload.metadata,
      };

      state.events.push(event);

      // Keep only the most recent events
      if (state.events.length > MAX_EVENTS) {
        state.events = state.events.slice(-MAX_EVENTS);
      }

      // Update last active timestamp in profile
      state.profile.lastActiveTimestamp = event.timestamp;
      state.lastUpdated = Date.now();
    },

    /**
     * Start a new session
     */
    startSession: (state) => {
      state.sessionStart = Date.now();
      state.currentSessionDuration = 0;

      // Record app open event
      const event: EngagementEvent = {
        id: generateEventId(),
        type: 'app_open',
        timestamp: Date.now(),
      };
      state.events.push(event);

      if (state.events.length > MAX_EVENTS) {
        state.events = state.events.slice(-MAX_EVENTS);
      }

      state.profile.totalSessions++;
      state.profile.lastActiveTimestamp = Date.now();
      state.lastUpdated = Date.now();
    },

    /**
     * End current session
     */
    endSession: (state) => {
      if (state.sessionStart !== null) {
        const duration = Date.now() - state.sessionStart;
        state.currentSessionDuration = duration;

        // Update average session duration
        const totalDuration =
          state.profile.avgSessionDuration * (state.profile.totalSessions - 1) + duration;
        state.profile.avgSessionDuration = totalDuration / state.profile.totalSessions;

        // Record app close event
        const event: EngagementEvent = {
          id: generateEventId(),
          type: 'app_close',
          timestamp: Date.now(),
          metadata: { duration },
        };
        state.events.push(event);

        if (state.events.length > MAX_EVENTS) {
          state.events = state.events.slice(-MAX_EVENTS);
        }

        state.sessionStart = null;
        state.lastUpdated = Date.now();
      }
    },

    /**
     * Record notification received
     */
    recordNotificationReceived: (
      state,
      action: PayloadAction<{ notificationId: string; type: string }>
    ) => {
      const event: EngagementEvent = {
        id: generateEventId(),
        type: 'notification_received',
        timestamp: Date.now(),
        metadata: action.payload,
      };
      state.events.push(event);

      if (state.events.length > MAX_EVENTS) {
        state.events = state.events.slice(-MAX_EVENTS);
      }

      state.profile.totalNotificationsReceived++;
      state.lastUpdated = Date.now();
    },

    /**
     * Record notification opened
     */
    recordNotificationOpened: (
      state,
      action: PayloadAction<{ notificationId: string; type: string }>
    ) => {
      const event: EngagementEvent = {
        id: generateEventId(),
        type: 'notification_opened',
        timestamp: Date.now(),
        metadata: action.payload,
      };
      state.events.push(event);

      if (state.events.length > MAX_EVENTS) {
        state.events = state.events.slice(-MAX_EVENTS);
      }

      state.profile.totalNotificationsOpened++;

      // Update notification response rate
      if (state.profile.totalNotificationsReceived > 0) {
        state.profile.notificationResponseRate =
          state.profile.totalNotificationsOpened / state.profile.totalNotificationsReceived;
      }

      state.lastUpdated = Date.now();
    },

    /**
     * Record notification dismissed
     */
    recordNotificationDismissed: (
      state,
      action: PayloadAction<{ notificationId: string; type: string }>
    ) => {
      const event: EngagementEvent = {
        id: generateEventId(),
        type: 'notification_dismissed',
        timestamp: Date.now(),
        metadata: action.payload,
      };
      state.events.push(event);

      if (state.events.length > MAX_EVENTS) {
        state.events = state.events.slice(-MAX_EVENTS);
      }

      state.lastUpdated = Date.now();
    },

    /**
     * Recalculate the engagement profile from all events
     */
    recalculateProfile: (state) => {
      state.profile = calculateProfile(state.events);
      state.lastUpdated = Date.now();
    },

    /**
     * Clear all engagement data
     */
    clearEngagementData: (state) => {
      state.events = [];
      state.profile = DEFAULT_ENGAGEMENT_PROFILE;
      state.sessionStart = null;
      state.currentSessionDuration = 0;
      state.lastUpdated = Date.now();
    },

    /**
     * Import engagement events (for data restoration)
     */
    importEvents: (state, action: PayloadAction<EngagementEvent[]>) => {
      state.events = action.payload.slice(-MAX_EVENTS);
      state.profile = calculateProfile(state.events);
      state.lastUpdated = Date.now();
    },
  },
});

export const {
  recordEvent,
  startSession,
  endSession,
  recordNotificationReceived,
  recordNotificationOpened,
  recordNotificationDismissed,
  recalculateProfile,
  clearEngagementData,
  importEvents,
} = engagementSlice.actions;

export default engagementSlice.reducer;
