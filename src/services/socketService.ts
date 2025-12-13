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
        transports: ['websocket'],
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
    try {
      if (!userId) {
        throw new Error('User ID is required to connect to socket');
      }
      if (!this.socket) {
        throw new Error('Socket not initialized. Call initialize() first.');
      }
      if (!this.socket.connected) {
        this.socket.auth = { userId };
        this.socket.connect();
      }
    } catch (error) {
      console.error('[SocketService] Connect failed:', error);
      throw error;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  public sendMessage(message: ChatMessage): void {
    try {
      if (!this.socket) {
        throw new Error('Socket not initialized. Cannot send message.');
      }
      if (!this.socket.connected) {
        throw new Error('Socket not connected. Cannot send message.');
      }
      if (!message || !message.content) {
        throw new Error('Invalid message: content is required');
      }
      this.socket.emit('chat:message', message);
    } catch (error) {
      console.error('[SocketService] Send message failed:', error);
      throw error;
    }
  }

  public onMessage(callback: (message: ChatMessage) => void): () => void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Cannot listen for messages.');
    }
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.socket.on('chat:message', callback);
    return () => this.socket?.off('chat:message', callback);
  }

  public sendReadReceipt(messageId: string, recipientId: string): void {
    try {
      if (!this.socket) {
        throw new Error('Socket not initialized. Cannot send read receipt.');
      }
      if (!this.socket.connected) {
        throw new Error('Socket not connected. Cannot send read receipt.');
      }
      if (!messageId || !recipientId) {
        throw new Error('Message ID and recipient ID are required');
      }
      this.socket.emit('chat:read', { messageId, recipientId });
    } catch (error) {
      console.error('[SocketService] Send read receipt failed:', error);
      throw error;
    }
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
