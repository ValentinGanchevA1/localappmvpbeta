// src/types/trading.ts
export interface TradeItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  imageUrl?: string;
}

export interface Trade {
  id: string;
  fromUserId: string;
  toUserId: string;
  items: TradeItem[];
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
  updatedAt?: string;
}
