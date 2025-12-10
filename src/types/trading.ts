// src/types/trading.ts
export interface Trade {
  id: string;
  fromUserId: string;
  toUserId: string;
  items: any[]; // Replace 'any' with a proper item type
  status: 'pending' | 'accepted' | 'declined';
}
