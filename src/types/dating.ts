// src/types/dating.ts
// Enhanced Dating Types with Advanced Preferences

import {ChatMessage} from './social';

// ============================================
// Basic Enums and Types
// ============================================

export type Gender = 'male' | 'female' | 'non-binary' | 'other';
export type GenderPreference = 'male' | 'female' | 'everyone';
export type RelationshipGoal =
  | 'long_term'
  | 'short_term'
  | 'casual'
  | 'friendship'
  | 'not_sure';
export type EducationLevel =
  | 'high_school'
  | 'some_college'
  | 'bachelors'
  | 'masters'
  | 'doctorate'
  | 'trade_school'
  | 'other';
export type DrinkingHabit = 'never' | 'rarely' | 'socially' | 'regularly';
export type SmokingHabit = 'never' | 'sometimes' | 'regularly';
export type ExerciseFrequency = 'never' | 'sometimes' | 'often' | 'daily';
export type DietType = 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'other';
export type PetPreference = 'love_them' | 'allergic' | 'have_pets' | 'no_preference';
export type ChildrenPreference =
  | 'want_someday'
  | 'dont_want'
  | 'have_kids'
  | 'open_to_kids'
  | 'not_sure';
export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

// ============================================
// Profile Types
// ============================================

export interface DatingPhoto {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
  uploadedAt: string;
}

export interface DatingProfileBasics {
  height?: number; // in cm
  bodyType?: 'slim' | 'athletic' | 'average' | 'curvy' | 'plus_size';
  ethnicity?: string;
  religion?: string;
  politicalViews?: string;
  languages?: string[];
}

export interface DatingProfileLifestyle {
  drinking: DrinkingHabit;
  smoking: SmokingHabit;
  exercise: ExerciseFrequency;
  diet?: DietType;
  pets?: PetPreference;
  children?: ChildrenPreference;
}

export interface DatingProfileWork {
  jobTitle?: string;
  company?: string;
  education?: EducationLevel;
  school?: string;
}

export interface DatingProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  birthDate?: string;
  gender: Gender;
  lookingFor: GenderPreference;
  relationshipGoal: RelationshipGoal;
  interests: string[];
  bio: string;
  prompts: DatingPrompt[];
  photos: DatingPhoto[];
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  basics: DatingProfileBasics;
  lifestyle: DatingProfileLifestyle;
  work: DatingProfileWork;
  zodiacSign?: ZodiacSign;
  datingPreferences: DatingPreferences;
  verificationStatus: 'none' | 'pending' | 'verified';
  isActive: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
  // Computed/runtime fields
  distance?: number;
  compatibilityScore?: number;
}

export interface DatingPrompt {
  id: string;
  question: string;
  answer: string;
}

// ============================================
// Preferences Types
// ============================================

export interface DatingPreferences {
  // Basic filters
  ageRange: {min: number; max: number};
  maxDistance: number; // in kilometers
  genderPreference: GenderPreference;
  relationshipGoals: RelationshipGoal[];

  // Advanced filters
  heightRange?: {min: number; max: number}; // in cm
  educationLevels?: EducationLevel[];
  drinking?: DrinkingHabit[];
  smoking?: SmokingHabit[];
  exercise?: ExerciseFrequency[];
  hasKids?: boolean;
  wantsKids?: ChildrenPreference[];
  religions?: string[];
  ethnicities?: string[];
  languages?: string[];

  // Discovery settings
  showOnlyVerified: boolean;
  showOnlyWithBio: boolean;
  showOnlyWithPhotos: boolean;
  showOnlyActive: boolean; // Active in last 7 days
  prioritizeSharedInterests: boolean;

  // Privacy
  hideAge: boolean;
  hideDistance: boolean;
  incognitoMode: boolean; // Only visible to people you like
}

export const DEFAULT_DATING_PREFERENCES: DatingPreferences = {
  ageRange: {min: 18, max: 50},
  maxDistance: 50,
  genderPreference: 'everyone',
  relationshipGoals: ['long_term', 'short_term', 'casual'],
  showOnlyVerified: false,
  showOnlyWithBio: false,
  showOnlyWithPhotos: true,
  showOnlyActive: false,
  prioritizeSharedInterests: true,
  hideAge: false,
  hideDistance: false,
  incognitoMode: false,
};

// ============================================
// Swipe & Interaction Types
// ============================================

export type SwipeActionType = 'like' | 'pass' | 'super_like' | 'rewind';

export interface SwipeAction {
  id: string;
  userId: string;
  targetUserId: string;
  action: SwipeActionType;
  timestamp: string;
  seen: boolean;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromProfile: DatingProfile;
  isSuperLike: boolean;
  createdAt: string;
  expiresAt?: string; // For time-limited likes
  seen: boolean;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  user1Profile: DatingProfile;
  user2Profile: DatingProfile;
  matchedAt: string;
  lastMessage?: ChatMessage;
  lastMessageAt?: string;
  unreadCount: number;
  status: 'active' | 'archived' | 'unmatched';
  matchedVia: 'mutual_like' | 'super_like';
  iceBreakers?: string[];
}

export interface Conversation {
  matchId: string;
  messages: ChatMessage[];
  isTyping: boolean;
  canMessage: boolean;
}

// ============================================
// Scoring & Algorithm Types
// ============================================

export interface DatingScore {
  userId: string;
  targetUserId: string;
  // Component scores (0-100)
  proximityScore: number;
  interestMatch: number;
  compatibilityScore: number;
  lifestyleMatch: number;
  activityScore: number;
  // Final weighted score
  finalScore: number;
  // Breakdown for debugging/display
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  distance: {value: number; weight: number; score: number};
  interests: {shared: number; total: number; weight: number; score: number};
  age: {inRange: boolean; weight: number; score: number};
  lifestyle: {matches: string[]; weight: number; score: number};
  activity: {daysAgo: number; weight: number; score: number};
  goals: {compatible: boolean; weight: number; score: number};
}

export interface MatchingWeights {
  proximity: number;
  interests: number;
  age: number;
  lifestyle: number;
  activity: number;
  goals: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  proximity: 0.2,
  interests: 0.25,
  age: 0.15,
  lifestyle: 0.15,
  activity: 0.1,
  goals: 0.15,
};

// ============================================
// User Actions & Limits
// ============================================

export interface DailyLimits {
  likes: number;
  superLikes: number;
  rewinds: number;
  boosts: number;
}

export interface UserDatingStats {
  totalLikes: number;
  totalPasses: number;
  totalSuperLikes: number;
  totalMatches: number;
  likesRemaining: number;
  superLikesRemaining: number;
  rewindsRemaining: number;
  boostsRemaining: number;
  nextRefresh: string; // When daily limits reset
  lastBoostAt?: string;
  isBoostActive: boolean;
  boostExpiresAt?: string;
}

export const FREE_DAILY_LIMITS: DailyLimits = {
  likes: 100,
  superLikes: 1,
  rewinds: 0,
  boosts: 0,
};

export const PREMIUM_DAILY_LIMITS: DailyLimits = {
  likes: -1, // Unlimited
  superLikes: 5,
  rewinds: 3,
  boosts: 1,
};

// ============================================
// Boost & Premium Features
// ============================================

export interface Boost {
  id: string;
  userId: string;
  startedAt: string;
  expiresAt: string;
  multiplier: number; // Profile visibility multiplier
  isActive: boolean;
}

export interface PremiumFeatures {
  unlimitedLikes: boolean;
  seeWhoLikesYou: boolean;
  superLikesPerDay: number;
  rewindsPerDay: number;
  boostsPerMonth: number;
  advancedFilters: boolean;
  readReceipts: boolean;
  incognitoMode: boolean;
  priorityLikes: boolean;
  noAds: boolean;
}

// ============================================
// Report & Block Types
// ============================================

export type ReportReason =
  | 'fake_profile'
  | 'inappropriate_photos'
  | 'harassment'
  | 'spam'
  | 'underage'
  | 'other';

export interface ProfileReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  details?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

// ============================================
// State Types
// ============================================

export interface DatingState {
  // Current user's dating profile
  myProfile: DatingProfile | null;
  myProfileLoading: boolean;
  myProfileError: string | null;

  // Profiles to swipe
  profiles: DatingProfile[];
  currentIndex: number;
  profilesLoading: boolean;
  profilesError: string | null;

  // Recommendations
  recommendations: DatingProfile[];
  recommendationsLoading: boolean;

  // Matches
  matches: Match[];
  matchesLoading: boolean;
  matchesError: string | null;
  newMatchesCount: number;

  // Likes (people who liked you)
  receivedLikes: Like[];
  likesLoading: boolean;
  likesCount: number;

  // Swipe history (for rewind)
  swipeHistory: SwipeAction[];
  lastSwipedProfile: DatingProfile | null;

  // Preferences
  preferences: DatingPreferences;
  preferencesLoading: boolean;

  // Stats & Limits
  stats: UserDatingStats;

  // UI State
  showMatchModal: boolean;
  currentMatch: Match | null;
  viewingProfile: DatingProfile | null;
}

// ============================================
// API Request/Response Types
// ============================================

export interface UpdateDatingProfilePayload {
  name?: string;
  bio?: string;
  interests?: string[];
  prompts?: DatingPrompt[];
  basics?: Partial<DatingProfileBasics>;
  lifestyle?: Partial<DatingProfileLifestyle>;
  work?: Partial<DatingProfileWork>;
  relationshipGoal?: RelationshipGoal;
}

export interface SwipePayload {
  targetUserId: string;
  action: SwipeActionType;
}

export interface SwipeResponse {
  swipe: SwipeAction;
  match: Match | null;
  likesRemaining: number;
  superLikesRemaining: number;
}

export interface FetchProfilesParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

export interface UpdatePreferencesPayload {
  preferences: Partial<DatingPreferences>;
}

// ============================================
// Prompt Templates
// ============================================

export const DATING_PROMPTS = [
  "I'm looking for someone who...",
  'My ideal first date would be...',
  "The way to win me over is...",
  'My most controversial opinion is...',
  "I'm weirdly attracted to...",
  "Two truths and a lie...",
  'My simple pleasures are...',
  "I'll know it's time to delete this app when...",
  'The key to my heart is...',
  'My love language is...',
  "I'm convinced that...",
  'A shower thought I recently had...',
  'My biggest date fail...',
  'What I order at the bar...',
  "I'm a regular at...",
  'The best travel story I have is...',
  'My most irrational fear is...',
  "I'm looking for a +1 for...",
  'My go-to karaoke song is...',
  "I won't shut up about...",
];

// ============================================
// Interest Categories
// ============================================

export const INTEREST_CATEGORIES = {
  sports: [
    'Running',
    'Gym',
    'Yoga',
    'Swimming',
    'Tennis',
    'Basketball',
    'Football',
    'Hiking',
    'Cycling',
    'Skiing',
  ],
  music: [
    'Pop',
    'Rock',
    'Hip-Hop',
    'Jazz',
    'Classical',
    'Electronic',
    'Country',
    'R&B',
    'Indie',
    'Metal',
  ],
  food: [
    'Cooking',
    'Baking',
    'Sushi',
    'Italian',
    'Mexican',
    'Vegan',
    'Wine',
    'Coffee',
    'Craft Beer',
    'Foodie',
  ],
  entertainment: [
    'Movies',
    'TV Shows',
    'Reading',
    'Gaming',
    'Podcasts',
    'Stand-up',
    'Theater',
    'Concerts',
    'Art',
    'Photography',
  ],
  lifestyle: [
    'Travel',
    'Fashion',
    'Volunteering',
    'Meditation',
    'Pets',
    'Gardening',
    'DIY',
    'Outdoors',
    'Beach',
    'Camping',
  ],
  social: [
    'Dancing',
    'Parties',
    'Board Games',
    'Trivia',
    'Brunch',
    'Happy Hour',
    'Karaoke',
    'Museums',
    'Festivals',
    'Networking',
  ],
};
