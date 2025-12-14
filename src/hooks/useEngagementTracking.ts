// src/hooks/useEngagementTracking.ts
// Hook for tracking user engagement and accessing engagement data

import { useEffect, useCallback, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { engagementTrackingService } from '@/services/engagementTrackingService';
import { engagementPredictionEngine } from '@/services/engagementPredictionEngine';
import { EngagementEventType, UserEngagementProfile, TimeWindow } from '@/types/notifications';

interface UseEngagementTrackingReturn {
  profile: UserEngagementProfile;
  isLikelyActiveNow: boolean;
  minutesSinceLastActivity: number;
  trackScreenView: (screenName: string) => void;
  trackFeatureUsed: (featureName: string, metadata?: Record<string, unknown>) => void;
  trackEvent: (type: EngagementEventType, metadata?: Record<string, unknown>) => void;
  getOptimalWindows: () => Promise<TimeWindow[]>;
  getInsights: () => {
    bestHours: number[];
    bestDays: number[];
    responseRate: number;
    totalSessions: number;
  };
}

/**
 * Hook for tracking user engagement
 * Automatically tracks screen views when screenName is provided
 */
export function useEngagementTracking(screenName?: string): UseEngagementTrackingReturn {
  const profile = useAppSelector((state) => state.engagement?.profile) || {
    activeHours: new Array(24).fill(0.5),
    activeDays: new Array(7).fill(0.5),
    avgSessionDuration: 0,
    notificationResponseRate: 0.5,
    lastActiveTimestamp: 0,
    totalSessions: 0,
    totalNotificationsReceived: 0,
    totalNotificationsOpened: 0,
  };

  const lastTrackedScreen = useRef<string | null>(null);

  // Track screen view on mount/screen change
  useEffect(() => {
    if (screenName && screenName !== lastTrackedScreen.current) {
      lastTrackedScreen.current = screenName;
      engagementTrackingService.trackScreenView(screenName);
    }
  }, [screenName]);

  /**
   * Track a screen view
   */
  const trackScreenView = useCallback((name: string) => {
    engagementTrackingService.trackScreenView(name);
  }, []);

  /**
   * Track feature usage
   */
  const trackFeatureUsed = useCallback(
    (featureName: string, metadata?: Record<string, unknown>) => {
      engagementTrackingService.trackFeatureUsed(featureName, metadata);
    },
    []
  );

  /**
   * Track a generic event
   */
  const trackEvent = useCallback(
    (type: EngagementEventType, metadata?: Record<string, unknown>) => {
      engagementTrackingService.trackEvent(type, metadata);
    },
    []
  );

  /**
   * Get optimal delivery windows
   */
  const getOptimalWindows = useCallback(async (): Promise<TimeWindow[]> => {
    return engagementPredictionEngine.getOptimalDeliveryWindows();
  }, []);

  /**
   * Get engagement insights
   */
  const getInsights = useCallback(() => {
    return engagementPredictionEngine.getInsights();
  }, []);

  /**
   * Check if user is likely active now
   */
  const isLikelyActiveNow = engagementTrackingService.isLikelyActiveNow();

  /**
   * Get minutes since last activity
   */
  const minutesSinceLastActivity = engagementTrackingService.getMinutesSinceLastActivity();

  return {
    profile,
    isLikelyActiveNow,
    minutesSinceLastActivity,
    trackScreenView,
    trackFeatureUsed,
    trackEvent,
    getOptimalWindows,
    getInsights,
  };
}

/**
 * Hook for tracking specific feature usage
 * Automatically tracks when feature is used
 */
export function useFeatureTracking(featureName: string): void {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      engagementTrackingService.trackFeatureUsed(featureName);
    }
  }, [featureName]);
}

/**
 * Hook for getting engagement prediction for a notification
 */
export function useEngagementPrediction() {
  const predictEngagement = useCallback(
    async (
      priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal',
      type: 'nearby_user' | 'message' | 'match' | 'event' | 'promotion' = 'event'
    ): Promise<number> => {
      return engagementPredictionEngine.predictEngagement(priority, type);
    },
    []
  );

  const isGoodTimeNow = useCallback(
    async (
      priority: 'urgent' | 'high' | 'normal' | 'low' = 'normal',
      type: 'nearby_user' | 'message' | 'match' | 'event' | 'promotion' = 'event',
      threshold: number = 0.5
    ): Promise<boolean> => {
      return engagementPredictionEngine.isGoodTimeNow(priority, type, threshold);
    },
    []
  );

  return {
    predictEngagement,
    isGoodTimeNow,
  };
}

export default useEngagementTracking;
