// src/services/engagementTrackingService.ts
// Service for tracking user engagement patterns

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '@/store/store';
import {
  startSession,
  endSession,
  recordEvent,
  recordNotificationReceived,
  recordNotificationOpened,
  recordNotificationDismissed,
  recalculateProfile,
  importEvents,
} from '@/store/slices/engagementSlice';
import { EngagementEvent, EngagementEventType, UserEngagementProfile } from '@/types/notifications';

const ENGAGEMENT_EVENTS_KEY = 'engagement_events';

class EngagementTrackingService {
  private static instance: EngagementTrackingService;
  private isInitialized = false;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private lastAppState: AppStateStatus = 'active';
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {}

  static getInstance(): EngagementTrackingService {
    if (!EngagementTrackingService.instance) {
      EngagementTrackingService.instance = new EngagementTrackingService();
    }
    return EngagementTrackingService.instance;
  }

  /**
   * Initialize the engagement tracking service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[EngagementTracking] Already initialized');
      return;
    }

    try {
      // Load saved engagement data
      await this.loadEngagementData();

      // Set up app state tracking
      this.setupAppStateTracking();

      // Start initial session
      store.dispatch(startSession());

      this.isInitialized = true;
      console.log('[EngagementTracking] Service initialized');
    } catch (error) {
      console.error('[EngagementTracking] Initialization error:', error);
    }
  }

  /**
   * Set up app state change tracking
   */
  private setupAppStateTracking(): void {
    this.lastAppState = AppState.currentState;

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      this.handleAppStateChange(nextAppState);
    });
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const previousState = this.lastAppState;
    this.lastAppState = nextAppState;

    if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
      // App going to background
      this.trackEvent('app_background');
      store.dispatch(endSession());
      this.saveEngagementData();
    } else if (previousState.match(/inactive|background/) && nextAppState === 'active') {
      // App coming to foreground
      this.trackEvent('app_foreground');
      store.dispatch(startSession());
    }
  }

  /**
   * Track a generic engagement event
   */
  trackEvent(type: EngagementEventType, metadata?: Record<string, unknown>): void {
    store.dispatch(recordEvent({ type, metadata }));
    this.scheduleSave();
  }

  /**
   * Track screen view
   */
  trackScreenView(screenName: string): void {
    this.trackEvent('screen_viewed', { screenName });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsed(featureName: string, metadata?: Record<string, unknown>): void {
    this.trackEvent('feature_used', { featureName, ...metadata });
  }

  /**
   * Track notification received
   */
  trackNotificationReceived(notificationId: string, type: string): void {
    store.dispatch(recordNotificationReceived({ notificationId, type }));
    this.scheduleSave();
  }

  /**
   * Track notification opened
   */
  trackNotificationOpened(notificationId: string, type: string): void {
    store.dispatch(recordNotificationOpened({ notificationId, type }));
    this.scheduleSave();
  }

  /**
   * Track notification dismissed
   */
  trackNotificationDismissed(notificationId: string, type: string): void {
    store.dispatch(recordNotificationDismissed({ notificationId, type }));
    this.scheduleSave();
  }

  /**
   * Get the current engagement profile
   */
  getEngagementProfile(): UserEngagementProfile {
    return store.getState().engagement?.profile || {
      activeHours: new Array(24).fill(0.5),
      activeDays: new Array(7).fill(0.5),
      avgSessionDuration: 0,
      notificationResponseRate: 0.5,
      lastActiveTimestamp: 0,
      totalSessions: 0,
      totalNotificationsReceived: 0,
      totalNotificationsOpened: 0,
    };
  }

  /**
   * Get engagement score for a specific hour
   */
  getHourEngagementScore(hour: number): number {
    const profile = this.getEngagementProfile();
    return profile.activeHours[hour] || 0.5;
  }

  /**
   * Get engagement score for a specific day
   */
  getDayEngagementScore(day: number): number {
    const profile = this.getEngagementProfile();
    return profile.activeDays[day] || 0.5;
  }

  /**
   * Get notification response rate
   */
  getNotificationResponseRate(): number {
    const profile = this.getEngagementProfile();
    return profile.notificationResponseRate;
  }

  /**
   * Schedule debounced save to storage
   */
  private scheduleSave(): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveEngagementData();
    }, 5000); // Save after 5 seconds of inactivity
  }

  /**
   * Load engagement data from storage
   */
  private async loadEngagementData(): Promise<void> {
    try {
      const eventsJson = await AsyncStorage.getItem(ENGAGEMENT_EVENTS_KEY);
      if (eventsJson) {
        const events: EngagementEvent[] = JSON.parse(eventsJson);
        store.dispatch(importEvents(events));
        console.log(`[EngagementTracking] Loaded ${events.length} events from storage`);
      }
    } catch (error) {
      console.error('[EngagementTracking] Load error:', error);
    }
  }

  /**
   * Save engagement data to storage
   */
  async saveEngagementData(): Promise<void> {
    try {
      const state = store.getState().engagement;
      if (!state) return;

      await AsyncStorage.setItem(ENGAGEMENT_EVENTS_KEY, JSON.stringify(state.events));
      console.log(`[EngagementTracking] Saved ${state.events.length} events to storage`);
    } catch (error) {
      console.error('[EngagementTracking] Save error:', error);
    }
  }

  /**
   * Force recalculate the engagement profile
   */
  recalculateProfile(): void {
    store.dispatch(recalculateProfile());
  }

  /**
   * Get minutes since last activity
   */
  getMinutesSinceLastActivity(): number {
    const profile = this.getEngagementProfile();
    if (profile.lastActiveTimestamp === 0) return Infinity;
    return (Date.now() - profile.lastActiveTimestamp) / (1000 * 60);
  }

  /**
   * Check if user is likely active right now based on patterns
   */
  isLikelyActiveNow(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const hourScore = this.getHourEngagementScore(hour);
    const dayScore = this.getDayEngagementScore(day);

    // Consider user likely active if both scores are above 0.4
    return hourScore > 0.4 && dayScore > 0.4;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }

    // Save before cleanup
    this.saveEngagementData();

    this.isInitialized = false;
    console.log('[EngagementTracking] Service cleaned up');
  }
}

// Export singleton instance
export const engagementTrackingService = EngagementTrackingService.getInstance();
export default engagementTrackingService;
