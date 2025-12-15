// src/services/notificationScheduler.ts
// Intelligent notification scheduling with optimal timing and rate limiting

import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '@/store/store';
import { addNotification } from '@/store/slices/notificationsSlice';
import { engagementPredictionEngine } from './engagementPredictionEngine';
import { contextAwarenessService } from './contextAwarenessService';
import { engagementTrackingService } from './engagementTrackingService';
import {
  NotificationPayload,
  ScheduledNotification,
  NotificationPriority,
  DeliveryStats,
  RateLimitConfig,
  DEFAULT_RATE_LIMIT,
} from '@/types/notifications';

const QUEUE_STORAGE_KEY = 'notification_queue';
const DELIVERY_STATS_KEY = 'notification_delivery_stats';

// Thresholds for delivery decisions
const DELIVERY_THRESHOLDS = {
  urgent: 0.2,   // Always deliver urgent unless very bad time
  high: 0.4,    // Deliver high priority at decent times
  normal: 0.5,  // Normal threshold
  low: 0.6,     // Only deliver low priority at good times
};

type DeliveryCallback = (notification: NotificationPayload) => void;

class NotificationScheduler {
  private static instance: NotificationScheduler;
  private queue: ScheduledNotification[] = [];
  private deliveryStats: DeliveryStats = {
    lastHourCount: 0,
    lastDayCount: 0,
    lastDeliveryTimestamp: 0,
    timestamps: [],
  };
  private rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT;
  private processingInterval: ReturnType<typeof setInterval> | null = null;
  private deliveryCallbacks: DeliveryCallback[] = [];
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler();
    }
    return NotificationScheduler.instance;
  }

  /**
   * Initialize the scheduler
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[NotificationScheduler] Already initialized');
      return;
    }

    try {
      // Load persisted queue and stats
      await this.loadQueue();
      await this.loadDeliveryStats();

      // Start processing interval (check every minute)
      this.processingInterval = setInterval(() => {
        this.processQueue();
      }, 60 * 1000);

      // Process immediately on init
      this.processQueue();

      this.isInitialized = true;
      console.log('[NotificationScheduler] Service initialized');
    } catch (error) {
      console.error('[NotificationScheduler] Initialization error:', error);
    }
  }

  /**
   * Schedule a notification for optimal delivery
   */
  async scheduleNotification(notification: NotificationPayload): Promise<void> {
    const settings = store.getState().notificationSettings?.settings;

    // Check if notifications are enabled
    if (!settings?.enabled) {
      console.log('[NotificationScheduler] Notifications disabled, dropping');
      return;
    }

    // Check if this type is enabled
    if (!settings.types[notification.type]) {
      console.log(`[NotificationScheduler] Type ${notification.type} disabled, dropping`);
      return;
    }

    // Track notification received
    engagementTrackingService.trackNotificationReceived(notification.id, notification.type);

    // Check if should deliver immediately
    const shouldDeliverNow = await this.shouldDeliverImmediately(notification);

    if (shouldDeliverNow) {
      await this.deliverNotification(notification);
    } else {
      // Add to queue for later delivery
      await this.addToQueue(notification);
    }
  }

  /**
   * Check if notification should be delivered immediately
   */
  private async shouldDeliverImmediately(notification: NotificationPayload): Promise<boolean> {
    const settings = store.getState().notificationSettings?.settings;

    // Urgent notifications always go through (unless blocked by rate limit)
    if (notification.priority === 'urgent') {
      return this.isWithinRateLimit();
    }

    // If smart timing is disabled, deliver immediately
    if (!settings?.smartTiming) {
      return this.isWithinRateLimit();
    }

    // Check engagement prediction
    const engagementScore = await engagementPredictionEngine.predictEngagement(
      notification.priority,
      notification.type
    );

    const threshold = DELIVERY_THRESHOLDS[notification.priority];

    // If score is above threshold and within rate limit, deliver now
    if (engagementScore >= threshold && this.isWithinRateLimit()) {
      console.log(
        `[NotificationScheduler] Good time to deliver (score: ${engagementScore.toFixed(2)}, threshold: ${threshold})`
      );
      return true;
    }

    console.log(
      `[NotificationScheduler] Scheduling for later (score: ${engagementScore.toFixed(2)}, threshold: ${threshold})`
    );
    return false;
  }

  /**
   * Check if we're within rate limits
   */
  private isWithinRateLimit(): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Clean old timestamps
    this.deliveryStats.timestamps = this.deliveryStats.timestamps.filter(
      (ts) => ts > oneDayAgo
    );

    // Count recent deliveries
    const hourCount = this.deliveryStats.timestamps.filter((ts) => ts > oneHourAgo).length;
    const dayCount = this.deliveryStats.timestamps.length;

    // Check minimum interval
    const timeSinceLastDelivery = now - this.deliveryStats.lastDeliveryTimestamp;
    if (timeSinceLastDelivery < this.rateLimitConfig.minIntervalMs) {
      console.log('[NotificationScheduler] Rate limited: minimum interval not met');
      return false;
    }

    // Check hourly limit
    if (hourCount >= this.rateLimitConfig.maxPerHour) {
      console.log('[NotificationScheduler] Rate limited: hourly limit reached');
      return false;
    }

    // Check daily limit
    if (dayCount >= this.rateLimitConfig.maxPerDay) {
      console.log('[NotificationScheduler] Rate limited: daily limit reached');
      return false;
    }

    return true;
  }

  /**
   * Add notification to queue
   */
  private async addToQueue(notification: NotificationPayload): Promise<void> {
    const deliveryScore = await engagementPredictionEngine.predictEngagement(
      notification.priority,
      notification.type
    );

    const scheduled: ScheduledNotification = {
      ...notification,
      originalReceivedAt: Date.now(),
      deliveryScore,
      attempts: 0,
    };

    this.queue.push(scheduled);

    // Sort queue by priority and score
    this.queue.sort((a, b) => {
      // Priority order: urgent > high > normal > low
      const priorityOrder: Record<NotificationPriority, number> = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3,
      };

      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Same priority - sort by score (higher first)
      return b.deliveryScore - a.deliveryScore;
    });

    // Limit queue size
    if (this.queue.length > 50) {
      this.queue = this.queue.slice(0, 50);
    }

    await this.saveQueue();
    console.log(`[NotificationScheduler] Added to queue, size: ${this.queue.length}`);
  }

  /**
   * Process the notification queue
   */
  async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const settings = store.getState().notificationSettings?.settings;
    const now = Date.now();
    const delivered: string[] = [];
    const expired: string[] = [];

    for (const notification of this.queue) {
      // Check if notification has expired (older than 24 hours)
      if (now - notification.originalReceivedAt > 24 * 60 * 60 * 1000) {
        expired.push(notification.id);
        continue;
      }

      // Check if we can deliver
      if (!this.isWithinRateLimit()) {
        break; // Stop processing if rate limited
      }

      // Re-evaluate engagement score
      const currentScore = await engagementPredictionEngine.predictEngagement(
        notification.priority,
        notification.type
      );

      const threshold = DELIVERY_THRESHOLDS[notification.priority];

      // Check quiet hours for non-urgent
      const context = await contextAwarenessService.getCurrentContext(settings?.quietHours);
      if (context.isQuietHours && notification.priority !== 'urgent') {
        continue; // Skip during quiet hours
      }

      // Check if score is now above threshold
      if (currentScore >= threshold * 0.9) { // 90% of threshold for queued items
        await this.deliverNotification(notification);
        delivered.push(notification.id);
      } else {
        // Increment attempts
        notification.attempts++;
        notification.deliveryScore = currentScore;

        // Force delivery after 5 attempts (5+ hours)
        if (notification.attempts >= 5 && notification.priority !== 'low') {
          await this.deliverNotification(notification);
          delivered.push(notification.id);
        }
      }
    }

    // Remove delivered and expired notifications
    this.queue = this.queue.filter(
      (n) => !delivered.includes(n.id) && !expired.includes(n.id)
    );

    if (delivered.length > 0 || expired.length > 0) {
      await this.saveQueue();
      console.log(
        `[NotificationScheduler] Processed queue: ${delivered.length} delivered, ${expired.length} expired, ${this.queue.length} remaining`
      );
    }
  }

  /**
   * Deliver a notification
   */
  private async deliverNotification(notification: NotificationPayload): Promise<void> {
    const now = Date.now();

    // Update delivery stats
    this.deliveryStats.lastDeliveryTimestamp = now;
    this.deliveryStats.timestamps.push(now);
    await this.saveDeliveryStats();

    // Add to Redux store
    store.dispatch(
      addNotification({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        data: notification.data as Record<string, any>,
        read: false,
        createdAt: new Date(notification.createdAt).toISOString(),
      })
    );

    // Notify callbacks (for displaying local notification)
    this.deliveryCallbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('[NotificationScheduler] Callback error:', error);
      }
    });

    console.log(`[NotificationScheduler] Delivered notification: ${notification.id}`);
  }

  /**
   * Register a callback for notification delivery
   */
  onDeliver(callback: DeliveryCallback): () => void {
    this.deliveryCallbacks.push(callback);
    return () => {
      const index = this.deliveryCallbacks.indexOf(callback);
      if (index > -1) {
        this.deliveryCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get queued notifications
   */
  getQueue(): ScheduledNotification[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(id: string): Promise<boolean> {
    const index = this.queue.findIndex((n) => n.id === id);
    if (index > -1) {
      this.queue.splice(index, 1);
      await this.saveQueue();
      return true;
    }
    return false;
  }

  /**
   * Clear all scheduled notifications
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Update rate limit configuration
   */
  setRateLimitConfig(config: Partial<RateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config };
  }

  /**
   * Get delivery statistics
   */
  getDeliveryStats(): DeliveryStats {
    return { ...this.deliveryStats };
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[NotificationScheduler] Loaded ${this.queue.length} queued notifications`);
      }
    } catch (error) {
      console.error('[NotificationScheduler] Load queue error:', error);
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[NotificationScheduler] Save queue error:', error);
    }
  }

  /**
   * Load delivery stats from storage
   */
  private async loadDeliveryStats(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(DELIVERY_STATS_KEY);
      if (stored) {
        this.deliveryStats = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[NotificationScheduler] Load stats error:', error);
    }
  }

  /**
   * Save delivery stats to storage
   */
  private async saveDeliveryStats(): Promise<void> {
    try {
      await AsyncStorage.setItem(DELIVERY_STATS_KEY, JSON.stringify(this.deliveryStats));
    } catch (error) {
      console.error('[NotificationScheduler] Save stats error:', error);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.saveQueue();
    this.saveDeliveryStats();

    this.deliveryCallbacks = [];
    this.isInitialized = false;
    console.log('[NotificationScheduler] Service cleaned up');
  }
}

// Export singleton instance
export const notificationScheduler = NotificationScheduler.getInstance();
export default notificationScheduler;
