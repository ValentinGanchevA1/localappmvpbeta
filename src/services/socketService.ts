import io, { Socket } from 'socket.io-client';
import { ChatMessage } from '@/types/social';

class SocketService {
  private socket: Socket | null = null;

  public initialize(url: string): void {
    if (this.socket) {
      return;
    }

    console.log('[SocketService] Initializing with URL:', url);

    try {
      this.socket = io(url, {
        autoConnect: false, // Connect manually
        reconnection: true,
      });

      this.setupListeners();
    } catch (error) {
      console.error('[SocketService] Initialization failed:', error);
    }
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketService] Disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('[SocketService] Connection error:', err);
    });
  }

  public connect(userId: string): void {
    if (this.socket && !this.socket.connected) {
      this.socket.auth = { userId };
      this.socket.connect();
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public sendMessage(message: ChatMessage): void {
    this.socket?.emit('chat:message', message);
  }

  public onMessage(callback: (message: ChatMessage) => void): () => void {
    this.socket?.on('chat:message', callback);
    return () => this.socket?.off('chat:message', callback);
  }

  public sendReadReceipt(messageId: string, recipientId: string): void {
    this.socket?.emit('chat:read', { messageId, recipientId });
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
