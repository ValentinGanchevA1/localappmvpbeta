export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  location: GeoLocation;
  isOnline: boolean;
  interests: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
}