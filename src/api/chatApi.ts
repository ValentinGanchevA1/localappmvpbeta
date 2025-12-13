import axiosInstance from './axiosInstance';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  lastMessage?: Message;
  unreadCount: number;
}

export const chatApi = {
  getConversations: async (): Promise<Conversation[]> => {
    try {
      const response = await axiosInstance.get<Conversation[]>(
        '/api/chat/conversations'
      );
      return response.data || [];
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load conversations. Please try again.';
      throw new Error(message);
    }
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      const response = await axiosInstance.get<Message[]>(
        `/api/chat/conversations/${conversationId}/messages`
      );
      return response.data || [];
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load messages. Please try again.';
      throw new Error(message);
    }
  },

  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<Message> => {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      if (!content || content.trim() === '') {
        throw new Error('Message content cannot be empty');
      }
      const response = await axiosInstance.post<Message>(
        `/api/chat/conversations/${conversationId}/messages`,
        { content }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send message. Please try again.';
      throw new Error(message);
    }
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    try {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }
      await axiosInstance.put(
        `/api/chat/conversations/${conversationId}/read`
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to mark conversation as read.';
      throw new Error(message);
    }
  },

  createConversation: async (userId: string): Promise<Conversation> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await axiosInstance.post<Conversation>(
        '/api/chat/conversations',
        { participantId: userId }
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create conversation. Please try again.';
      throw new Error(message);
    }
  },
};
