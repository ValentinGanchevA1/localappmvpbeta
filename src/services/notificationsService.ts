// src/services/notificationsService.ts
// Socket-based notification listener service integrated with intelligent scheduler

import { socketService } from './socketService';
import { notificationScheduler } from './notificationScheduler';
import { addNotification } from '@/store/slices/notificationsSlice';
import { NotificationPayload, NotificationType, NotificationPriority } from '@/types/notifications';

// Map notification types to priorities
const TYPE_PRIORITIES: Record<NotificationType, NotificationPriority> = {
  match: 'high',
  message: 'high',
  nearby_user: 'normal',
  event: 'normal',
  promotion: 'low',
};

export class NotificationService {
  private socket = socketService;
  private dispatch: any = null;

  /**
   * Set up socket event listeners for real-time notifications
   * Routes notifications through the intelligent scheduler
   */
  setupListeners(dispatch: any): void {
    this.dispatch = dispatch;
    const socket = this.socket.getSocket();
    if (!socket) {
      console.warn('[NotificationService] Socket not available');
      return;
    }

    // Handle generic notifications from server
    socket.on('notification:received', (notification: any) => {
      this.handleIncomingNotification(notification);
    });

    // Handle nearby user detection
    socket.on('nearbyUser:detected', (user: any) => {
      const payload: NotificationPayload = {
        id: `nearby-${user.id}-${Date.now()}`,
        title: 'User Nearby',
        body: `${user.name} is ${user.distance}m away`,
        type: 'nearby_user',
        priority: 'normal',
        data: { userId: user.id, distance: user.distance },
        createdAt: Date.now(),
      };
      this.scheduleOrDeliver(payload);
    });

    // Handle incoming chat messages
    socket.on('message:received', (message: any) => {
      const payload: NotificationPayload = {
        id: `msg-${message.id}-${Date.now()}`,
        title: message.senderName || 'New Message',
        body: message.preview || 'You received a new message',
        type: 'message',
        priority: 'high', // Messages are high priority
        data: {
          conversationId: message.conversationId,
          senderId: message.senderId,
          messageId: message.id,
        },
        createdAt: Date.now(),
      };
      this.scheduleOrDeliver(payload);
    });

    // Handle new match notifications
    socket.on('match:created', (match: any) => {
      const payload: NotificationPayload = {
        id: `match-${match.id}-${Date.now()}`,
        title: 'New Match!',
        body: `You matched with ${match.userName}`,
        type: 'match',
        priority: 'high', // Matches are high priority
        data: {
          matchId: match.id,
          userId: match.userId,
          userName: match.userName,
        },
        createdAt: Date.now(),
      };
      this.scheduleOrDeliver(payload);
    });

    // Handle event notifications
    socket.on('event:notification', (event: any) => {
      const payload: NotificationPayload = {
        id: `event-${event.id}-${Date.now()}`,
        title: event.title || 'Event Update',
        body: event.body || event.message,
        type: 'event',
        priority: 'normal',
        data: event.data,
        createdAt: Date.now(),
      };
      this.scheduleOrDeliver(payload);
    });

    // Handle promotional notifications
    socket.on('promotion:received', (promo: any) => {
      const payload: NotificationPayload = {
        id: `promo-${promo.id}-${Date.now()}`,
        title: promo.title || 'Special Offer',
        body: promo.body || promo.message,
        type: 'promotion',
        priority: 'low', // Promotions are low priority
        data: promo.data,
        createdAt: Date.now(),
      };
      this.scheduleOrDeliver(payload);
    });

    console.log('[NotificationService] Socket listeners set up');
  }

  /**
   * Handle incoming notification from server
   */
  private handleIncomingNotification(notification: any): void {
    const type = (notification.type as NotificationType) || 'event';
    const priority = TYPE_PRIORITIES[type] || 'normal';

    const payload: NotificationPayload = {
      id: notification.id || `notif-${Date.now()}`,
      title: notification.title || 'Notification',
      body: notification.body || notification.message || '',
      type,
      priority,
      data: notification.data,
      createdAt: notification.createdAt ? new Date(notification.createdAt).getTime() : Date.now(),
    };

    this.scheduleOrDeliver(payload);
  }

  /**
   * Route notification through scheduler or deliver directly
   */
  private scheduleOrDeliver(payload: NotificationPayload): void {
    // Route through intelligent scheduler for optimal timing
    notificationScheduler.scheduleNotification(payload);
  }

  /**
   * Deliver notification directly to Redux store (bypass scheduler)
   * Use for urgent notifications that must be shown immediately
   */
  deliverImmediately(payload: NotificationPayload): void {
    if (this.dispatch) {
      this.dispatch(
        addNotification({
          id: payload.id,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          data: payload.data as Record<string, any>,
          read: false,
          createdAt: new Date(payload.createdAt).toISOString(),
        })
      );
    }
  }

  /**
   * Clean up socket listeners
   */
  cleanup(): void {
    const socket = this.socket.getSocket();
    if (socket) {
      socket.off('notification:received');
      socket.off('nearbyUser:detected');
      socket.off('message:received');
      socket.off('match:created');
      socket.off('event:notification');
      socket.off('promotion:received');
    }
    this.dispatch = null;
    console.log('[NotificationService] Cleaned up');
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
