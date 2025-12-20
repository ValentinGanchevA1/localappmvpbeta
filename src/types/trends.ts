// src/types/trends.ts
// Local Trends Types - Area-based notifications, trending topics, community insights

// ============================================
// Core Trend Types
// ============================================

export type TrendCategory =
  | 'event'
  | 'discussion'
  | 'hashtag'
  | 'place'
  | 'alert'
  | 'community'
  | 'promotion';

export type TrendSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

export type TrendTimeRange = 'hour' | 'day' | 'week' | 'month';

export type TrendEngagementType = 'like' | 'comment' | 'share' | 'view' | 'mention';

// ============================================
// Trend Interface
// ============================================

export interface Trend {
  id: string;
  title: string;
  description: string;
  category: TrendCategory;
  hashtags: string[];

  // Engagement metrics
  engagementScore: number; // Composite score
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  mentionsCount: number;

  // Location data
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    neighborhood?: string;
    radius: number; // Coverage radius in km
  };

  // Metadata
  isLocal: boolean;
  isTrending: boolean;
  trendingRank?: number;
  sentiment: TrendSentiment;

  // Media
  imageUrl?: string;
  thumbnailUrl?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  peakTime?: string;

  // Creator info (optional, for user-created trends)
  createdBy?: {
    userId: string;
    name: string;
    avatar?: string;
  };
}

// ============================================
// Trend Detail (Extended)
// ============================================

export interface TrendDetail extends Trend {
  // Full description
  fullDescription: string;

  // Related content
  relatedTrends: Trend[];

  // Top contributors
  topContributors: TrendContributor[];

  // Recent activity
  recentActivity: TrendActivity[];

  // Engagement history (for charts)
  engagementHistory: EngagementDataPoint[];

  // User's engagement
  userEngagement: {
    hasLiked: boolean;
    hasShared: boolean;
    hasCommented: boolean;
    lastViewed?: string;
  };

  // Discussions/Comments
  discussions: TrendDiscussion[];
  discussionCount: number;
}

// ============================================
// Trend Activity
// ============================================

export interface TrendActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: TrendEngagementType;
  content?: string;
  timestamp: string;
}

export interface TrendContributor {
  userId: string;
  name: string;
  avatar?: string;
  contributionCount: number;
  isVerified?: boolean;
}

export interface TrendDiscussion {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  likesCount: number;
  repliesCount: number;
  timestamp: string;
  isLiked?: boolean;
  replies?: TrendDiscussion[];
}

// ============================================
// Engagement Data (for charts)
// ============================================

export interface EngagementDataPoint {
  timestamp: string;
  value: number;
  type: TrendEngagementType;
}

// ============================================
// Community Insights
// ============================================

export interface CommunityInsight {
  id: string;
  title: string;
  description: string;
  type: 'stat' | 'activity' | 'growth' | 'comparison';
  value: number | string;
  change?: number; // Percentage change
  changeDirection?: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  period: TrendTimeRange;
}

export interface AreaStats {
  totalUsers: number;
  activeUsers: number;
  totalTrends: number;
  activeTrends: number;
  topCategory: TrendCategory;
  averageEngagement: number;
  growthRate: number;
  peakHours: string[];
}

// ============================================
// Area-based Notifications
// ============================================

export interface TrendNotification {
  id: string;
  trendId: string;
  type: 'new_trend' | 'trending_now' | 'peak_activity' | 'nearby_event' | 'community_alert';
  title: string;
  body: string;
  priority: 'low' | 'medium' | 'high';
  location: {
    latitude: number;
    longitude: number;
    distance: number; // Distance from user in km
  };
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

// ============================================
// Filters & Params
// ============================================

export interface TrendsFilter {
  categories?: TrendCategory[];
  sentiment?: TrendSentiment[];
  timeRange?: TrendTimeRange;
  minEngagement?: number;
  radius?: number; // km
  isLocal?: boolean;
  hashtags?: string[];
  sortBy?: 'trending' | 'recent' | 'nearby' | 'engagement';
}

export interface FetchTrendsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  offset?: number;
  filter?: TrendsFilter;
}

export interface SearchTrendsParams {
  query: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

// ============================================
// State Interface
// ============================================

export interface LocalTrendsState {
  // Trends data
  trends: Trend[];
  trendsLoading: boolean;
  trendsError: string | null;

  // Selected trend detail
  selectedTrend: TrendDetail | null;
  selectedTrendLoading: boolean;

  // Nearby/local trends
  nearbyTrends: Trend[];
  nearbyTrendsLoading: boolean;

  // Search results
  searchResults: Trend[];
  searchQuery: string;
  searchLoading: boolean;

  // Community insights
  insights: CommunityInsight[];
  areaStats: AreaStats | null;
  insightsLoading: boolean;

  // Trend notifications
  trendNotifications: TrendNotification[];
  unreadNotificationsCount: number;

  // Filters
  activeFilter: TrendsFilter;

  // Pagination
  hasMore: boolean;
  currentPage: number;

  // Last update
  lastUpdated: string | null;
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_TRENDS_FILTER: TrendsFilter = {
  categories: undefined,
  sentiment: undefined,
  timeRange: 'day',
  minEngagement: 0,
  radius: 25, // 25km default
  isLocal: true,
  sortBy: 'trending',
};

export const TREND_CATEGORIES: {label: string; value: TrendCategory; icon: string}[] = [
  {label: 'Events', value: 'event', icon: 'calendar'},
  {label: 'Discussions', value: 'discussion', icon: 'chatbubbles'},
  {label: 'Hashtags', value: 'hashtag', icon: 'pricetag'},
  {label: 'Places', value: 'place', icon: 'location'},
  {label: 'Alerts', value: 'alert', icon: 'warning'},
  {label: 'Community', value: 'community', icon: 'people'},
  {label: 'Promotions', value: 'promotion', icon: 'megaphone'},
];
