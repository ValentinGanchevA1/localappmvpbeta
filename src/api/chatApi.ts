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
    const response = await axiosInstance.get<Conversation[]>(
      '/api/chat/conversations'
    );
    return response.data || [];
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await axiosInstance.get<Message[]>(
      `/api/chat/conversations/${conversationId}/messages`
    );
    return response.data || [];
  },

  sendMessage: async (
    conversationId: string,
    content: string
  ): Promise<Message> => {
    const response = await axiosInstance.post<Message>(
      `/api/chat/conversations/${conversationId}/messages`,
      { content }
    );
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await axiosInstance.put(
      `/api/chat/conversations/${conversationId}/read`
    );
  },

  createConversation: async (userId: string): Promise<Conversation> => {
    const response = await axiosInstance.post<Conversation>(
      '/api/chat/conversations',
      { participantId: userId }
    );
    return response.data;
  },
};
