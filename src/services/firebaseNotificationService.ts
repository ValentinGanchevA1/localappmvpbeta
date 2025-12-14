// src/services/firebaseNotificationService.ts
// Firebase Cloud Messaging service for push notifications

import { Platform, AppState, AppStateStatus } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationPayload,
  NotificationType,
  NotificationPriority,
  PermissionStatus,
  FCMTokenInfo,
} from '@/types/notifications';

const FCM_TOKEN_KEY = 'fcm_token_info';

type NotificationHandler = (notification: NotificationPayload) => void;
type TokenRefreshHandler = (token: string) => void;

class FirebaseNotificationService {
  private static instance: FirebaseNotificationService;
  private isInitialized = false;
  private notificationHandlers: NotificationHandler[] = [];
  private tokenRefreshHandlers: TokenRefreshHandler[] = [];
  private backgroundMessageHandler: ((message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>) | null = null;
  private unsubscribeForeground: (() => void) | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;
  private unsubscribeNotificationOpened: (() => void) | null = null;

  private constructor() {}

  static getInstance(): FirebaseNotificationService {
    if (!FirebaseNotificationService.instance) {
      FirebaseNotificationService.instance = new FirebaseNotificationService();
    }
    return FirebaseNotificationService.instance;
  }

  /**
   * Initialize the Firebase notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[FirebaseNotification] Already initialized');
      return;
    }

    try {
      // Set up foreground message handler
      this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        console.log('[FirebaseNotification] Foreground message received:', remoteMessage.messageId);
        const payload = this.parseRemoteMessage(remoteMessage);
        this.notifyHandlers(payload);
      });

      // Set up notification opened handler (when user taps notification)
      this.unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[FirebaseNotification] Notification opened app:', remoteMessage.messageId);
        const payload = this.parseRemoteMessage(remoteMessage);
        payload.data = { ...payload.data, openedFromNotification: true };
        this.notifyHandlers(payload);
      });

      // Check if app was opened from a notification (cold start)
      const initialNotification = await messaging().getInitialNotification();
      if (initialNotification) {
        console.log('[FirebaseNotification] App opened from notification (cold start)');
        const payload = this.parseRemoteMessage(initialNotification);
        payload.data = { ...payload.data, openedFromNotification: true, coldStart: true };
        // Delay to ensure handlers are registered
        setTimeout(() => this.notifyHandlers(payload), 1000);
      }

      // Set up token refresh handler
      this.unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
        console.log('[FirebaseNotification] Token refreshed');
        this.saveTokenInfo(token);
        this.tokenRefreshHandlers.forEach((handler) => handler(token));
      });

      // Set up background message handler
      this.setupBackgroundHandler();

      this.isInitialized = true;
      console.log('[FirebaseNotification] Service initialized successfully');
    } catch (error) {
      console.error('[FirebaseNotification] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Set up background message handler (must be called outside React lifecycle)
   */
  private setupBackgroundHandler(): void {
    if (this.backgroundMessageHandler) return;

    this.backgroundMessageHandler = async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('[FirebaseNotification] Background message received:', remoteMessage.messageId);
      // Background messages are handled by the system notification tray
      // We just log them here; actual handling happens when user taps
    };

    messaging().setBackgroundMessageHandler(this.backgroundMessageHandler);
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<PermissionStatus> {
    try {
      const authStatus = await messaging().requestPermission();
      return this.mapAuthStatus(authStatus);
    } catch (error) {
      console.error('[FirebaseNotification] Permission request error:', error);
      return 'denied';
    }
  }

  /**
   * Check current notification permission status
   */
  async checkPermission(): Promise<PermissionStatus> {
    try {
      const authStatus = await messaging().hasPermission();
      return this.mapAuthStatus(authStatus);
    } catch (error) {
      console.error('[FirebaseNotification] Permission check error:', error);
      return 'not_determined';
    }
  }

  /**
   * Map Firebase auth status to our PermissionStatus type
   */
  private mapAuthStatus(authStatus: FirebaseMessagingTypes.AuthorizationStatus): PermissionStatus {
    switch (authStatus) {
      case messaging.AuthorizationStatus.AUTHORIZED:
      case messaging.AuthorizationStatus.PROVISIONAL:
        return 'granted';
      case messaging.AuthorizationStatus.DENIED:
        return 'denied';
      case messaging.AuthorizationStatus.NOT_DETERMINED:
      default:
        return 'not_determined';
    }
  }

  /**
   * Get the FCM token for this device
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      if (token) {
        await this.saveTokenInfo(token);
      }
      return token;
    } catch (error) {
      console.error('[FirebaseNotification] Get token error:', error);
      return null;
    }
  }

  /**
   * Save token info to storage
   */
  private async saveTokenInfo(token: string): Promise<void> {
    const tokenInfo: FCMTokenInfo = {
      token,
      updatedAt: Date.now(),
      platform: Platform.OS as 'ios' | 'android',
    };
    await AsyncStorage.setItem(FCM_TOKEN_KEY, JSON.stringify(tokenInfo));
  }

  /**
   * Get stored token info
   */
  async getStoredTokenInfo(): Promise<FCMTokenInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Delete the FCM token (useful for logout)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      console.log('[FirebaseNotification] Token deleted');
    } catch (error) {
      console.error('[FirebaseNotification] Delete token error:', error);
    }
  }

  /**
   * Parse Firebase remote message to our NotificationPayload format
   */
  private parseRemoteMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): NotificationPayload {
    const notification = remoteMessage.notification;
    const data = remoteMessage.data || {};

    return {
      id: remoteMessage.messageId || `notif_${Date.now()}`,
      title: notification?.title || data.title as string || 'Notification',
      body: notification?.body || data.body as string || '',
      type: (data.type as NotificationType) || 'event',
      priority: (data.priority as NotificationPriority) || 'normal',
      data: data,
      createdAt: remoteMessage.sentTime || Date.now(),
    };
  }

  /**
   * Notify all registered handlers of a new notification
   */
  private notifyHandlers(payload: NotificationPayload): void {
    this.notificationHandlers.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error('[FirebaseNotification] Handler error:', error);
      }
    });
  }

  /**
   * Register a handler for incoming notifications
   */
  onNotification(handler: NotificationHandler): () => void {
    this.notificationHandlers.push(handler);
    return () => {
      const index = this.notificationHandlers.indexOf(handler);
      if (index > -1) {
        this.notificationHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Register a handler for token refresh events
   */
  onTokenRefresh(handler: TokenRefreshHandler): () => void {
    this.tokenRefreshHandlers.push(handler);
    return () => {
      const index = this.tokenRefreshHandlers.indexOf(handler);
      if (index > -1) {
        this.tokenRefreshHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to a topic (e.g., for broadcast notifications)
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`[FirebaseNotification] Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error(`[FirebaseNotification] Subscribe to topic error:`, error);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`[FirebaseNotification] Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error(`[FirebaseNotification] Unsubscribe from topic error:`, error);
    }
  }

  /**
   * Get the current badge count (iOS only)
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      // Note: This requires additional setup with @react-native-firebase/messaging
      return 0;
    }
    return 0;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
      this.unsubscribeForeground = null;
    }
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
      this.unsubscribeTokenRefresh = null;
    }
    if (this.unsubscribeNotificationOpened) {
      this.unsubscribeNotificationOpened();
      this.unsubscribeNotificationOpened = null;
    }
    this.notificationHandlers = [];
    this.tokenRefreshHandlers = [];
    this.isInitialized = false;
    console.log('[FirebaseNotification] Service cleaned up');
  }
}

// Export singleton instance
export const firebaseNotificationService = FirebaseNotificationService.getInstance();
export default firebaseNotificationService;
