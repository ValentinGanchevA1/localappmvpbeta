
export interface TradeItem {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

export interface Trade {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemsOffered: TradeItem[];
  itemsRequested: TradeItem[];
  status: 'pending' | 'accepted' | 'declined';
}
