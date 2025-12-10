// src/types/dating.ts
import { ChatMessage } from './social';

export interface DatingProfile {
  id: string;
  username: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bio: string;
  interests: string[];
  photos: string[];
}

export interface SwipeAction {
  userId: string;
  targetUserId: string;
  action: 'like' | 'pass' | 'super_like';
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: string; // ISO 8601 date string
  messages: ChatMessage[];
  status: 'active' | 'archived';
}
