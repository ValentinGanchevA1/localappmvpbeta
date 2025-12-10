// src/store/slices/chatSlice.ts (ENHANCED)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { socketService } from '@/services/socketService';

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
    const sock = socketService.getSocket();
    if (!sock) {
      throw new Error('Socket not connected');
    }
    return new Promise((resolve, reject) => {
      sock.emit('message:send', payload);

      // Listen for acknowledgment
      const onSent = (response: any) => {
        cleanup();
        resolve(response);
      };
      const onError = (error: any) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        sock.off('message:sent', onSent);
        sock.off('message:error', onError);
      };

      sock.once('message:sent', onSent);
      sock.once('message:error', onError);
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
    builder.addCase(sendMessage.fulfilled, (_state, _action) => {
      // Message handled by socket listener
    });
  },
});

export const { addMessageToConversation, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
