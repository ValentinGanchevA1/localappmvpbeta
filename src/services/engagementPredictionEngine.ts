// src/services/engagementPredictionEngine.ts
// On-device ML engine for predicting user engagement and optimal notification timing

import { store } from '@/store/store';
import { engagementTrackingService } from './engagementTrackingService';
import { contextAwarenessService } from './contextAwarenessService';
import {
  NotificationContext,
  NotificationPriority,
  NotificationType,
  TimeWindow,
  UserEngagementProfile,
} from '@/types/notifications';

// Weights for prediction factors
const WEIGHTS = {
  hourOfDay: 0.30,      // 30% - User typically active at this hour
  dayOfWeek: 0.15,      // 15% - User engagement pattern for this day
  recentActivity: 0.25, // 25% - User was recently active in app
  responseRate: 0.15,   // 15% - Historical response to notifications
  contextScore: 0.15,   // 15% - Current context (location, battery, network)
};

// Priority multipliers for urgent notifications
const PRIORITY_MULTIPLIERS: Record<NotificationPriority, number> = {
  urgent: 1.5,   // Always boost urgent
  high: 1.2,    // Slight boost for high priority
  normal: 1.0,  // No change
  low: 0.8,     // Reduce score for low priority
};

// Notification type importance scores
const TYPE_IMPORTANCE: Record<NotificationType, number> = {
  match: 0.9,       // Very important - new match
  message: 0.85,    // Important - someone messaged
  nearby_user: 0.6, // Moderate - location-based
  event: 0.5,       // Lower priority
  promotion: 0.3,   // Lowest priority
};

class EngagementPredictionEngine {
  private static instance: EngagementPredictionEngine;

  private constructor() {}

  static getInstance(): EngagementPredictionEngine {
    if (!EngagementPredictionEngine.instance) {
      EngagementPredictionEngine.instance = new EngagementPredictionEngine();
    }
    return EngagementPredictionEngine.instance;
  }

  /**
   * Predict engagement likelihood for the current context
   * Returns a score between 0 and 1
   */
  async predictEngagement(
    priority: NotificationPriority = 'normal',
    type: NotificationType = 'event'
  ): Promise<number> {
    const profile = engagementTrackingService.getEngagementProfile();
    const settings = store.getState().notificationSettings?.settings;
    const context = await contextAwarenessService.getCurrentContext(settings?.quietHours);

    return this.calculateEngagementScore(context, profile, priority, type);
  }

  /**
   * Calculate engagement score based on all factors
   */
  private calculateEngagementScore(
    context: NotificationContext,
    profile: UserEngagementProfile,
    priority: NotificationPriority,
    type: NotificationType
  ): number {
    // If in quiet hours and not urgent, return very low score
    if (context.isQuietHours && priority !== 'urgent') {
      return 0.1;
    }

    // Calculate individual factor scores
    const hourScore = this.calculateHourScore(context.timeOfDay, profile);
    const dayScore = this.calculateDayScore(context.dayOfWeek, profile);
    const activityScore = this.calculateActivityScore(context.minutesSinceLastActivity);
    const responseScore = profile.notificationResponseRate;
    const contextScore = this.calculateContextScore(context);

    // Weighted sum of all factors
    let baseScore =
      hourScore * WEIGHTS.hourOfDay +
      dayScore * WEIGHTS.dayOfWeek +
      activityScore * WEIGHTS.recentActivity +
      responseScore * WEIGHTS.responseRate +
      contextScore * WEIGHTS.contextScore;

    // Apply priority multiplier
    baseScore *= PRIORITY_MULTIPLIERS[priority];

    // Apply type importance
    baseScore *= TYPE_IMPORTANCE[type];

    // Clamp to 0-1 range
    return Math.max(0, Math.min(1, baseScore));
  }

  /**
   * Calculate score based on hour of day
   */
  private calculateHourScore(hour: number, profile: UserEngagementProfile): number {
    // Use historical engagement for this hour, with some smoothing
    const directScore = profile.activeHours[hour] || 0.5;
    const prevHour = profile.activeHours[(hour + 23) % 24] || 0.5;
    const nextHour = profile.activeHours[(hour + 1) % 24] || 0.5;

    // Weighted average with neighbors for smoothing
    return directScore * 0.6 + prevHour * 0.2 + nextHour * 0.2;
  }

  /**
   * Calculate score based on day of week
   */
  private calculateDayScore(day: number, profile: UserEngagementProfile): number {
    return profile.activeDays[day] || 0.5;
  }

  /**
   * Calculate score based on recent activity
   */
  private calculateActivityScore(minutesSinceLastActivity: number): number {
    if (minutesSinceLastActivity === Infinity) return 0.5;

    // Score decreases as time since activity increases
    // Peak score if active within last 30 minutes
    if (minutesSinceLastActivity < 5) return 1.0;
    if (minutesSinceLastActivity < 30) return 0.9;
    if (minutesSinceLastActivity < 60) return 0.7;
    if (minutesSinceLastActivity < 120) return 0.5;
    if (minutesSinceLastActivity < 360) return 0.3;
    return 0.2;
  }

  /**
   * Calculate score based on current context
   */
  private calculateContextScore(context: NotificationContext): number {
    let score = 0.5; // Base score

    // App state influence
    switch (context.appState) {
      case 'active':
        score += 0.3; // App is open - good time
        break;
      case 'background':
        score += 0.1; // App recently used
        break;
      case 'inactive':
        score -= 0.1; // App not active
        break;
    }

    // Network type influence
    if (context.networkType === 'wifi') {
      score += 0.1; // On WiFi - likely stationary
    } else if (context.networkType === 'none') {
      score -= 0.2; // No network - bad time
    }

    // Battery level influence
    if (context.batteryLevel < 0.2) {
      score -= 0.2; // Low battery - user might be conserving
    }

    // Low power mode influence
    if (context.isLowPowerMode) {
      score -= 0.1;
    }

    // Location context influence
    switch (context.locationContext) {
      case 'home':
        score += 0.1; // Relaxed, more likely to engage
        break;
      case 'work':
        score -= 0.1; // Busy, less likely to engage
        break;
      case 'commuting':
        score += 0.05; // Might have time to check
        break;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get optimal delivery windows for the next 24 hours
   */
  async getOptimalDeliveryWindows(count: number = 5): Promise<TimeWindow[]> {
    const profile = engagementTrackingService.getEngagementProfile();
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();

    const windows: TimeWindow[] = [];

    // Score each hour in the next 24 hours
    for (let offset = 0; offset < 24; offset++) {
      const hour = (currentHour + offset) % 24;
      const day = offset < (24 - currentHour) ? currentDay : (currentDay + 1) % 7;

      const hourScore = profile.activeHours[hour] || 0.5;
      const dayScore = profile.activeDays[day] || 0.5;

      // Combined score
      const score = hourScore * 0.7 + dayScore * 0.3;

      // Find or extend window
      const lastWindow = windows[windows.length - 1];
      if (lastWindow && lastWindow.end === hour && Math.abs(lastWindow.score - score) < 0.2) {
        // Extend existing window
        lastWindow.end = (hour + 1) % 24;
        lastWindow.score = (lastWindow.score + score) / 2;
      } else if (score > 0.5) {
        // Create new window
        windows.push({
          start: hour,
          end: (hour + 1) % 24,
          score,
        });
      }
    }

    // Sort by score and return top windows
    return windows
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }

  /**
   * Score a specific timestamp for notification delivery
   */
  async scoreDeliveryTime(timestamp: number): Promise<number> {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const day = date.getDay();

    const profile = engagementTrackingService.getEngagementProfile();
    const hourScore = profile.activeHours[hour] || 0.5;
    const dayScore = profile.activeDays[day] || 0.5;

    return hourScore * 0.7 + dayScore * 0.3;
  }

  /**
   * Get the next optimal delivery time
   */
  async getNextOptimalTime(
    minimumDelay: number = 0, // Minimum delay in milliseconds
    maxDelay: number = 24 * 60 * 60 * 1000 // Maximum delay (default 24 hours)
  ): Promise<number> {
    const now = Date.now();
    const earliest = now + minimumDelay;
    const latest = now + maxDelay;

    const windows = await this.getOptimalDeliveryWindows(3);
    if (windows.length === 0) {
      return earliest; // No good windows, deliver immediately
    }

    // Find the first window that's within our range
    const currentHour = new Date().getHours();

    for (const window of windows) {
      // Calculate when this window starts
      let hoursUntilWindow = window.start - currentHour;
      if (hoursUntilWindow < 0) hoursUntilWindow += 24;

      const windowStart = now + hoursUntilWindow * 60 * 60 * 1000;

      if (windowStart >= earliest && windowStart <= latest) {
        return windowStart;
      }
    }

    // No suitable window found, use earliest time
    return earliest;
  }

  /**
   * Check if now is a good time to deliver a notification
   */
  async isGoodTimeNow(
    priority: NotificationPriority = 'normal',
    type: NotificationType = 'event',
    threshold: number = 0.5
  ): Promise<boolean> {
    const score = await this.predictEngagement(priority, type);
    return score >= threshold;
  }

  /**
   * Get engagement insights for debugging/analytics
   */
  getInsights(): {
    bestHours: number[];
    bestDays: number[];
    responseRate: number;
    totalSessions: number;
  } {
    const profile = engagementTrackingService.getEngagementProfile();

    // Find top 3 best hours
    const hourScores = profile.activeHours
      .map((score, hour) => ({ hour, score }))
      .sort((a, b) => b.score - a.score);
    const bestHours = hourScores.slice(0, 3).map((h) => h.hour);

    // Find top 2 best days
    const dayScores = profile.activeDays
      .map((score, day) => ({ day, score }))
      .sort((a, b) => b.score - a.score);
    const bestDays = dayScores.slice(0, 2).map((d) => d.day);

    return {
      bestHours,
      bestDays,
      responseRate: profile.notificationResponseRate,
      totalSessions: profile.totalSessions,
    };
  }
}

// Export singleton instance
export const engagementPredictionEngine = EngagementPredictionEngine.getInstance();
export default engagementPredictionEngine;
