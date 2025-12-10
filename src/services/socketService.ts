import { AppEnvironment } from '@/config/environment';
import { ChatMessage } from '@/types/social';

// Singleton service for WebSocket connections
class SocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: ((msg: ChatMessage) => void)[] = [];

  connect(userId: string) {
    if (this.socket) return;

    // In production, use a robust library like socket.io-client
    // This is a native WebSocket implementation example
    this.socket = new WebSocket(`${AppEnvironment.API_BASE_URL.replace('http', 'ws')}/chat?userId=${userId}`);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(data));
    };

    this.socket.onopen = () => {
      console.log('Chat socket connected');
    };
  }

  sendMessage(message: Omit<ChatMessage, 'status'>) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'message', payload: message }));
    } else {
      console.warn('Socket not connected');
    }
  }

  sendReadReceipt(messageId: string, senderId: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'read_receipt', messageId, senderId }));
    }
  }

  onMessage(callback: (msg: ChatMessage) => void) {
    this.messageHandlers.push(callback);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== callback);
    };
  }
}

export const socketService = new SocketService();