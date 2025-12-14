// src/store/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { socketService } from '@/services/socketService';
import { Conversation, SocketMessageResponse } from '@/types/social';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

interface ChatState {
  conversations: Conversation[];
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

export const sendMessage = createAsyncThunk<
  SocketMessageResponse,
  { conversationId: string; content: string; recipientId: string }
>(
  'chat/sendMessage',
  async (payload, { rejectWithValue }) => {
    const sock = socketService.getSocket();
    if (!sock) {
      return rejectWithValue('Socket not connected');
    }
    return new Promise<SocketMessageResponse>((resolve, reject) => {
      sock.emit('message:send', payload);

      const onSent = (response: SocketMessageResponse) => {
        cleanup();
        resolve(response);
      };
      const onError = (error: { message?: string }) => {
        cleanup();
        reject(new Error(error.message || 'Failed to send message'));
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
    addMessageToConversation: (state, action: PayloadAction<Message>) => {
      state.currentMessages.push(action.payload);
    },
    clearMessages: (state) => {
      state.currentMessages = [];
    },
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string'
          ? action.payload
          : action.error.message || 'Failed to send message';
      });
  },
});

export const { addMessageToConversation, clearMessages, setConversations, clearError } = chatSlice.actions;
export default chatSlice.reducer;
