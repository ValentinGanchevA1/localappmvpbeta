// src/store/slices/tradingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Trade } from '@/types/trading';

interface TradingState {
  trades: Trade[];
  selectedTrade: Trade | null;
  loading: boolean;
  error: string | null;
}

const initialState: TradingState = {
  trades: [],
  selectedTrade: null,
  loading: false,
  error: null,
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTrades: (state, action: PayloadAction<Trade[]>) => {
      state.trades = action.payload;
    },
    addTrade: (state, action: PayloadAction<Trade>) => {
      state.trades.push(action.payload);
    },
    selectTrade: (state, action: PayloadAction<Trade | null>) => {
      state.selectedTrade = action.payload;
    },
    acceptTrade: (state, action: PayloadAction<string>) => {
      const trade = state.trades.find(t => t.id === action.payload);
      if (trade) {
        trade.status = 'accepted';
        trade.updatedAt = new Date().toISOString();
      }
    },
    declineTrade: (state, action: PayloadAction<string>) => {
      const trade = state.trades.find(t => t.id === action.payload);
      if (trade) {
        trade.status = 'declined';
        trade.updatedAt = new Date().toISOString();
      }
    },
    removeTrade: (state, action: PayloadAction<string>) => {
      state.trades = state.trades.filter(t => t.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setTrades,
  addTrade,
  selectTrade,
  acceptTrade,
  declineTrade,
  removeTrade,
  clearError,
} = tradingSlice.actions;
export default tradingSlice.reducer;
