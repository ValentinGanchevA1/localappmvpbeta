import axiosInstance from './axiosInstance';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'nearby_user' | 'message' | 'match' | 'event' | 'promotion';
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await axiosInstance.get<Notification[]>(
        '/api/notifications'
      );
      return response.data || [];
    } catch (error: any) {
      console.error('[notificationsApi] Error:', error.message);
      return [];
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('[notificationsApi] Mark as read failed:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`);
    } catch (error) {
      console.error('[notificationsApi] Delete failed:', error);
      throw error;
    }
  },

  subscribeToNearbyAlerts: async (
    radius: number,
    enabled: boolean
  ): Promise<void> => {
    try {
      await axiosInstance.post('/api/notifications/nearby-alerts', {
        radius,
        enabled,
      });
    } catch (error) {
      console.error('[notificationsApi] Subscribe failed:', error);
      throw error;
    }
  },
};
