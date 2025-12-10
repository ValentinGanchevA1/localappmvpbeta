import { socketService } from './socketService';
import { addNotification } from '@/store/slices/notificationsSlice';

export class NotificationService {
  private socket = socketService;

  setupListeners(dispatch: any): void {
    this.socket.getSocket()?.on('notification:received', (notification) => {
      dispatch(addNotification(notification));
    });

    this.socket.getSocket()?.on('nearbyUser:detected', (user) => {
      dispatch(
        addNotification({
          id: `nearby-${user.id}`,
          title: 'User Nearby',
          body: `${user.name} is ${user.distance}m away`,
          type: 'nearby_user',
          data: { userId: user.id },
          read: false,
          createdAt: new Date().toISOString(),
        })
      );
    });

    this.socket.getSocket()?.on('message:received', (message) => {
      dispatch(
        addNotification({
          id: `msg-${message.id}`,
          title: 'New Message',
          body: message.preview || 'New message received',
          type: 'message',
          data: { conversationId: message.conversationId },
          read: false,
          createdAt: new Date().toISOString(),
        })
      );
    });
  }

  cleanup(): void {
    this.socket.getSocket()?.off('notification:received');
    this.socket.getSocket()?.off('nearbyUser:detected');
    this.socket.getSocket()?.off('message:received');
  }
}
