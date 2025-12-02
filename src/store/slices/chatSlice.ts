// src/store/slices/chatSlice.ts (ENHANCED)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SocketService } from '@/services/socketService';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface ChatState {
  conversations: any[];
  currentMessages: Message[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentMessages: [],
  loading: false,
  error: null,
};

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (payload: {
    conversationId: string;
    content: string;
    recipientId: string;
  }) => {
    const socket = SocketService.getInstance();
    return new Promise((resolve, reject) => {
      socket.emit('message:send', payload);

      // Listen for acknowledgment
      socket.once('message:sent', (response) => {
        resolve(response);
      });

      socket.once('message:error', (error) => {
        reject(error);
      });
    });
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessageToConversation: (state, action) => {
      state.currentMessages.push(action.payload);
    },
    clearMessages: (state) => {
      state.currentMessages = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      // Message handled by socket listener
    });
  },
});

export const { addMessageToConversation, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
