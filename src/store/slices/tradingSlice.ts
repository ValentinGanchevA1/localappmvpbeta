// src/store/slices/tradingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Trade } from '@/types/trading';

interface TradingState {
  trades: Trade[];
}

const initialState: TradingState = {
  trades: [],
};

const tradingSlice = createSlice({
  name: 'trading',
  initialState,
  reducers: {
    addTrade: (state, action: PayloadAction<Trade>) => {
      state.trades.push(action.payload);
    },
    acceptTrade: (state, action: PayloadAction<string>) => {
      const trade = state.trades.find(t => t.id === action.payload);
      if (trade) {
        trade.status = 'accepted';
      }
    },
    declineTrade: (state, action: PayloadAction<string>) => {
      const trade = state.trades.find(t => t.id === action.payload);
      if (trade) {
        trade.status = 'declined';
      }
    },
  },
});

export const { addTrade, acceptTrade, declineTrade } = tradingSlice.actions;
export default tradingSlice.reducer;
