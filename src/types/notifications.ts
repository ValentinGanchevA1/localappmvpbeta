// src/types/notifications.ts
// Intelligent Notification Engine type definitions

export type NotificationType = 'nearby_user' | 'message' | 'match' | 'event' | 'promotion';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';
export type PermissionStatus = 'granted' | 'denied' | 'not_determined' | 'blocked';
export type FrequencyPreference = 'all' | 'important' | 'minimal';

// Core notification payload
export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  data?: Record<string, unknown>;
  scheduledFor?: number;
  createdAt: number;
}

// Scheduled notification in queue
export interface ScheduledNotification extends NotificationPayload {
  originalReceivedAt: number;
  deliveryScore: number;
  attempts: number;
}

// User notification settings
export interface NotificationSettings {
  enabled: boolean;
  types: Record<NotificationType, boolean>;
  quietHours: QuietHoursConfig;
  frequency: FrequencyPreference;
  sound: boolean;
  vibration: boolean;
  smartTiming: boolean;
}

export interface QuietHoursConfig {
  enabled: boolean;
  start: string; // HH:mm format (e.g., "22:00")
  end: string;   // HH:mm format (e.g., "07:00")
}

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  types: {
    nearby_user: true,
    message: true,
    match: true,
    event: true,
    promotion: false,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
  frequency: 'all',
  sound: true,
  vibration: true,
  smartTiming: true,
};

// Engagement tracking types
export type EngagementEventType =
  | 'app_open'
  | 'app_close'
  | 'app_background'
  | 'app_foreground'
  | 'notification_received'
  | 'notification_opened'
  | 'notification_dismissed'
  | 'feature_used'
  | 'screen_viewed';

export interface EngagementEvent {
  id: string;
  type: EngagementEventType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// User engagement profile (computed from events)
export interface UserEngagementProfile {
  // Hourly engagement scores (0-23 hours, scores 0-1)
  activeHours: number[];
  // Daily engagement scores (0=Sunday to 6=Saturday, scores 0-1)
  activeDays: number[];
  // Average session duration in milliseconds
  avgSessionDuration: number;
  // Notification response rate (0-1)
  notificationResponseRate: number;
  // Timestamp of last activity
  lastActiveTimestamp: number;
  // Total number of sessions
  totalSessions: number;
  // Total notifications received
  totalNotificationsReceived: number;
  // Total notifications opened
  totalNotificationsOpened: number;
}

// Default engagement profile (neutral/uniform)
export const DEFAULT_ENGAGEMENT_PROFILE: UserEngagementProfile = {
  activeHours: new Array(24).fill(0.5), // Neutral 0.5 for all hours
  activeDays: new Array(7).fill(0.5),   // Neutral 0.5 for all days
  avgSessionDuration: 0,
  notificationResponseRate: 0.5,
  lastActiveTimestamp: 0,
  totalSessions: 0,
  totalNotificationsReceived: 0,
  totalNotificationsOpened: 0,
};

// Context for notification delivery decisions
export interface NotificationContext {
  timeOfDay: number;      // Hour 0-23
  dayOfWeek: number;      // 0=Sunday to 6=Saturday
  isQuietHours: boolean;
  appState: AppStateType;
  batteryLevel: number;   // 0-1
  isLowPowerMode: boolean;
  networkType: NetworkType;
  locationContext: LocationContextType;
  lastActivityTimestamp: number;
  minutesSinceLastActivity: number;
}

export type AppStateType = 'active' | 'background' | 'inactive';
export type NetworkType = 'wifi' | 'cellular' | 'none' | 'unknown';
export type LocationContextType = 'home' | 'work' | 'commuting' | 'unknown';

// Time window for optimal delivery
export interface TimeWindow {
  start: number;  // Hour 0-23
  end: number;    // Hour 0-23
  score: number;  // Engagement score 0-1
}

// Rate limiting configuration
export interface RateLimitConfig {
  maxPerHour: number;
  maxPerDay: number;
  minIntervalMs: number;  // Minimum milliseconds between notifications
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxPerHour: 5,
  maxPerDay: 20,
  minIntervalMs: 5 * 60 * 1000, // 5 minutes
};

// Delivery statistics for tracking
export interface DeliveryStats {
  lastHourCount: number;
  lastDayCount: number;
  lastDeliveryTimestamp: number;
  timestamps: number[]; // Recent delivery timestamps for rate limiting
}

// Location pattern for home/work detection
export interface LocationPattern {
  latitude: number;
  longitude: number;
  visits: number;
  totalDuration: number; // Total time spent in ms
  avgHour: number;       // Average hour of visits
  label: LocationContextType;
}

// FCM Token info
export interface FCMTokenInfo {
  token: string;
  updatedAt: number;
  platform: 'ios' | 'android';
}
