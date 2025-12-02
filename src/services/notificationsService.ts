import { SocketService } from './socketService';

export class NotificationService {
  private socket = SocketService.getInstance();

  setupListeners(dispatch: any): void {
    this.socket.on('notification:received', (notification) => {
      dispatch(addNotification(notification));
    });

    this.socket.on('nearbyUser:detected', (user) => {
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

    this.socket.on('message:received', (message) => {
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
    this.socket.off('notification:received');
    this.socket.off('nearbyUser:detected');
    this.socket.off('message:received');
  }
}
