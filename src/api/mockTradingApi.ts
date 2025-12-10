
import { Trade } from '../types/trading';

// Mock database
let trades: Trade[] = [];

export const mockCreateTrade = (trade: Omit<Trade, 'id' | 'status'>): Promise<Trade> => {
  return new Promise((resolve) => {
    const newTrade: Trade = {
      ...trade,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
    };
    trades.push(newTrade);
    resolve(newTrade);
  });
};

export const mockGetTrade = (tradeId: string): Promise<Trade | undefined> => {
  return new Promise((resolve) => {
    const trade = trades.find(t => t.id === tradeId);
    resolve(trade);
  });
};

export const mockUpdateTradeStatus = (tradeId: string, status: 'accepted' | 'declined'): Promise<Trade | undefined> => {
  return new Promise((resolve) => {
    const trade = trades.find(t => t.id === tradeId);
    if (trade) {
      trade.status = status;
      resolve(trade);
    } else {
      resolve(undefined);
    }
  });
};
