// src/types/dating.ts
import { ChatMessage } from './social';

export interface DatingProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'non-binary';
  lookingFor: 'male' | 'female' | 'any';
  interests: string[];
  bio: string;
  photos: string[]; // Photo URLs in order (first is primary)
  location: {
    latitude: number;
    longitude: number;
  };
  datingPreferences: {
    ageRange: { min: number; max: number };
    maxDistance: number; // kilometers
    sharedInterests: boolean; // Match on interests
  };
  createdAt: Date;
}

export interface SwipeAction {
  userId: string;
  targetUserId: string;
  action: 'like' | 'pass' | 'super_like';
  timestamp: Date;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  matchedAt: Date;
  messages: ChatMessage[];
  status: 'active' | 'archived';
}

export interface DatingScore {
  userId: string;
  targetUserId: string;
  compatibilityScore: number; // 0-100
  proximityScore: number; // 0-100
  interestMatch: number; // 0-100 (% of shared interests)
  finalScore: number; // Weighted average
}
