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
    const response = await axiosInstance.get<Notification[]>(
      '/api/notifications'
    );
    return response.data || [];
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await axiosInstance.put(`/api/notifications/${notificationId}/read`);
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await axiosInstance.delete(`/api/notifications/${notificationId}`);
  },

  subscribeToNearbyAlerts: async (
    radius: number,
    enabled: boolean
  ): Promise<void> => {
    await axiosInstance.post('/api/notifications/nearby-alerts', {
      radius,
      enabled,
    });
  },
};
