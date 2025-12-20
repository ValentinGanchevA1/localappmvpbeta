// src/api/localTrendsApi.ts
// Local Trends API with mock data fallback

import axiosInstance from './axiosInstance';
import {
  Trend,
  TrendDetail,
  TrendDiscussion,
  CommunityInsight,
  AreaStats,
  TrendNotification,
  FetchTrendsParams,
  SearchTrendsParams,
  TrendCategory,
} from '@/types/trends';

// Flag to enable mock data when backend is unavailable
const USE_MOCK_FALLBACK = __DEV__;

// ============================================
// Mock Data Generation Helpers
// ============================================

const SF_BASE = {latitude: 37.7749, longitude: -122.4194};

const generateNearbyCoords = (
  baseLat: number,
  baseLng: number,
  maxRadiusKm: number
): {latitude: number; longitude: number} => {
  const radiusInDegrees = maxRadiusKm / 111;
  const randomLat = baseLat + (Math.random() - 0.5) * 2 * radiusInDegrees;
  const randomLng = baseLng + (Math.random() - 0.5) * 2 * radiusInDegrees;
  return {latitude: randomLat, longitude: randomLng};
};

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// ============================================
// Mock Trends Data
// ============================================

const MOCK_TRENDS: Trend[] = [
  {
    id: 'trend-1',
    title: 'New Coffee Shop Opening in Mission District',
    description: 'Artisan coffee shop "Bean There" opening this weekend with free tastings and live music.',
    category: 'event',
    hashtags: ['#MissionDistrict', '#Coffee', '#NewOpening', '#SFEats'],
    engagementScore: 892,
    likesCount: 456,
    commentsCount: 128,
    sharesCount: 89,
    viewsCount: 2340,
    mentionsCount: 219,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 5), city: 'San Francisco', neighborhood: 'Mission District', radius: 3},
    isLocal: true,
    isTrending: true,
    trendingRank: 1,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    peakTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'trend-2',
    title: '#SFTechJobs Hiring Surge',
    description: 'Multiple tech companies announcing major hiring initiatives in the Bay Area. Over 5,000 new positions expected.',
    category: 'hashtag',
    hashtags: ['#SFTechJobs', '#Hiring', '#TechCareers', '#BayArea'],
    engagementScore: 1456,
    likesCount: 789,
    commentsCount: 234,
    sharesCount: 156,
    viewsCount: 5670,
    mentionsCount: 567,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 8), city: 'San Francisco', neighborhood: 'SoMa', radius: 15},
    isLocal: true,
    isTrending: true,
    trendingRank: 2,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-3',
    title: 'Golden Gate Park Cleanup Event',
    description: 'Community volunteers gathering for monthly park cleanup. Free lunch and t-shirts for participants!',
    category: 'community',
    hashtags: ['#GoldenGatePark', '#CommunityCleanup', '#Volunteer', '#SFGreen'],
    engagementScore: 567,
    likesCount: 345,
    commentsCount: 89,
    sharesCount: 67,
    viewsCount: 1234,
    mentionsCount: 123,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 4), city: 'San Francisco', neighborhood: 'Richmond District', radius: 5},
    isLocal: true,
    isTrending: true,
    trendingRank: 3,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-4',
    title: 'BART Delays Expected This Week',
    description: 'Maintenance work on the Yellow Line causing 15-20 minute delays during rush hours through Friday.',
    category: 'alert',
    hashtags: ['#BART', '#CommuterAlert', '#SFTransit', '#TrafficUpdate'],
    engagementScore: 789,
    likesCount: 123,
    commentsCount: 456,
    sharesCount: 234,
    viewsCount: 3456,
    mentionsCount: 345,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 2), city: 'San Francisco', neighborhood: 'Downtown', radius: 20},
    isLocal: true,
    isTrending: true,
    trendingRank: 4,
    sentiment: 'negative',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-5',
    title: 'Best Tacos in the Castro',
    description: 'Local food blogger rates the top 5 taco spots in the Castro neighborhood. El Farolito takes the crown!',
    category: 'discussion',
    hashtags: ['#SFFood', '#Tacos', '#Castro', '#FoodieFinds'],
    engagementScore: 432,
    likesCount: 234,
    commentsCount: 156,
    sharesCount: 45,
    viewsCount: 890,
    mentionsCount: 78,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 3), city: 'San Francisco', neighborhood: 'Castro', radius: 2},
    isLocal: true,
    isTrending: false,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-6',
    title: 'Farmers Market Returns to Ferry Building',
    description: 'The popular Saturday farmers market is back with expanded hours and 50+ local vendors.',
    category: 'place',
    hashtags: ['#FarmersMarket', '#FerryBuilding', '#LocalProduce', '#ShopLocal'],
    engagementScore: 678,
    likesCount: 456,
    commentsCount: 89,
    sharesCount: 78,
    viewsCount: 1567,
    mentionsCount: 134,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 1), city: 'San Francisco', neighborhood: 'Embarcadero', radius: 1},
    isLocal: true,
    isTrending: true,
    trendingRank: 5,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-7',
    title: 'Local Startup Raises $50M Series B',
    description: 'SF-based AI startup "NeuralFlow" secures major funding round, plans to hire 200 engineers.',
    category: 'discussion',
    hashtags: ['#StartupNews', '#AIStartup', '#VentureCapital', '#SFTech'],
    engagementScore: 923,
    likesCount: 567,
    commentsCount: 178,
    sharesCount: 123,
    viewsCount: 2890,
    mentionsCount: 234,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 2), city: 'San Francisco', neighborhood: 'SoMa', radius: 5},
    isLocal: true,
    isTrending: true,
    trendingRank: 6,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-8',
    title: 'Weekend Flash Sale at Union Square',
    description: 'Major retailers offering up to 70% off this weekend only. Best deals found at Macys and Nordstrom.',
    category: 'promotion',
    hashtags: ['#UnionSquare', '#FlashSale', '#Shopping', '#SFDeals'],
    engagementScore: 345,
    likesCount: 178,
    commentsCount: 67,
    sharesCount: 89,
    viewsCount: 1234,
    mentionsCount: 56,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 1), city: 'San Francisco', neighborhood: 'Union Square', radius: 1},
    isLocal: true,
    isTrending: false,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-9',
    title: 'Free Outdoor Yoga in Dolores Park',
    description: 'Join the community for sunrise yoga every Saturday morning. All levels welcome, bring your own mat.',
    category: 'event',
    hashtags: ['#DoloresPark', '#FreeYoga', '#Wellness', '#SFFitness'],
    engagementScore: 456,
    likesCount: 289,
    commentsCount: 78,
    sharesCount: 56,
    viewsCount: 890,
    mentionsCount: 89,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 3), city: 'San Francisco', neighborhood: 'Mission', radius: 2},
    isLocal: true,
    isTrending: false,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'trend-10',
    title: 'New Bike Lane on Market Street',
    description: 'Protected bike lane now open from Embarcadero to Castro. City celebrates safer cycling infrastructure.',
    category: 'community',
    hashtags: ['#BikeSF', '#MarketStreet', '#SafeStreets', '#CyclingCity'],
    engagementScore: 567,
    likesCount: 345,
    commentsCount: 134,
    sharesCount: 67,
    viewsCount: 1456,
    mentionsCount: 123,
    location: {...generateNearbyCoords(SF_BASE.latitude, SF_BASE.longitude, 1), city: 'San Francisco', neighborhood: 'Market Street', radius: 8},
    isLocal: true,
    isTrending: true,
    trendingRank: 7,
    sentiment: 'positive',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// Mock Community Insights
// ============================================

const MOCK_INSIGHTS: CommunityInsight[] = [
  {
    id: 'insight-1',
    title: 'Active Users',
    description: 'Users active in your area today',
    type: 'stat',
    value: 1247,
    change: 12.5,
    changeDirection: 'up',
    icon: 'people',
    color: '#007AFF',
    period: 'day',
  },
  {
    id: 'insight-2',
    title: 'Trending Topics',
    description: 'New trends in the last hour',
    type: 'activity',
    value: 8,
    change: 25,
    changeDirection: 'up',
    icon: 'trending-up',
    color: '#28A745',
    period: 'hour',
  },
  {
    id: 'insight-3',
    title: 'Community Events',
    description: 'Upcoming events this week',
    type: 'stat',
    value: 23,
    change: 5,
    changeDirection: 'up',
    icon: 'calendar',
    color: '#FF9500',
    period: 'week',
  },
  {
    id: 'insight-4',
    title: 'Engagement Rate',
    description: 'Average engagement per trend',
    type: 'growth',
    value: '4.2%',
    change: -2.1,
    changeDirection: 'down',
    icon: 'pulse',
    color: '#5856D6',
    period: 'day',
  },
  {
    id: 'insight-5',
    title: 'Local Discussions',
    description: 'Active conversations nearby',
    type: 'activity',
    value: 156,
    change: 8.3,
    changeDirection: 'up',
    icon: 'chatbubbles',
    color: '#FF2D55',
    period: 'day',
  },
  {
    id: 'insight-6',
    title: 'New Connections',
    description: 'People meeting through trends',
    type: 'growth',
    value: 89,
    change: 15.7,
    changeDirection: 'up',
    icon: 'link',
    color: '#34C759',
    period: 'week',
  },
];

// ============================================
// Mock Area Stats
// ============================================

const MOCK_AREA_STATS: AreaStats = {
  totalUsers: 15678,
  activeUsers: 3421,
  totalTrends: 234,
  activeTrends: 45,
  topCategory: 'event',
  averageEngagement: 567,
  growthRate: 8.5,
  peakHours: ['12:00', '18:00', '20:00'],
};

// ============================================
// Mock Trend Notifications
// ============================================

const MOCK_NOTIFICATIONS: TrendNotification[] = [
  {
    id: 'notif-1',
    trendId: 'trend-1',
    type: 'trending_now',
    title: 'Trending Near You',
    body: 'New Coffee Shop Opening in Mission District is trending in your area!',
    priority: 'high',
    location: {latitude: 37.7599, longitude: -122.4148, distance: 0.8},
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-2',
    trendId: 'trend-4',
    type: 'community_alert',
    title: 'Transit Alert',
    body: 'BART delays expected on your usual commute route.',
    priority: 'high',
    location: {latitude: 37.7749, longitude: -122.4194, distance: 0.2},
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-3',
    trendId: 'trend-6',
    type: 'nearby_event',
    title: 'Event This Weekend',
    body: 'Farmers Market at Ferry Building - just 1.2km away!',
    priority: 'medium',
    location: {latitude: 37.7955, longitude: -122.3937, distance: 1.2},
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: 'notif-4',
    trendId: 'trend-3',
    type: 'new_trend',
    title: 'Community Activity',
    body: 'Golden Gate Park Cleanup Event is gaining traction.',
    priority: 'low',
    location: {latitude: 37.7694, longitude: -122.4862, distance: 3.5},
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

// ============================================
// Mock Discussions
// ============================================

const generateMockDiscussions = (): TrendDiscussion[] => [
  {
    id: 'disc-1',
    userId: 'user-1',
    userName: 'Sarah M.',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    content: 'This is so exciting! I\'ve been waiting for a good coffee shop in the neighborhood.',
    likesCount: 24,
    repliesCount: 3,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isLiked: false,
  },
  {
    id: 'disc-2',
    userId: 'user-2',
    userName: 'Mike T.',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    content: 'Do they have outdoor seating? Would love to bring my dog!',
    likesCount: 12,
    repliesCount: 2,
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isLiked: true,
  },
  {
    id: 'disc-3',
    userId: 'user-3',
    userName: 'Emily R.',
    userAvatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop',
    content: 'I heard they source beans directly from small farms in Colombia. Very ethical!',
    likesCount: 45,
    repliesCount: 5,
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isLiked: false,
  },
];

// ============================================
// API Functions
// ============================================

export const localTrendsApi = {
  /**
   * Fetch trending topics in the area
   */
  async getTrends(params: FetchTrendsParams): Promise<{trends: Trend[]; hasMore: boolean}> {
    try {
      const response = await axiosInstance.get('/api/trends', {params});
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        console.log('[TrendsAPI] Using mock trends (backend unavailable)');

        let filtered = [...MOCK_TRENDS];

        // Apply filters
        if (params.filter?.categories?.length) {
          filtered = filtered.filter(t => params.filter!.categories!.includes(t.category));
        }
        if (params.filter?.sentiment?.length) {
          filtered = filtered.filter(t => params.filter!.sentiment!.includes(t.sentiment));
        }
        if (params.filter?.isLocal !== undefined) {
          filtered = filtered.filter(t => t.isLocal === params.filter!.isLocal);
        }

        // Calculate distances and filter by radius
        if (params.latitude && params.longitude) {
          filtered = filtered.map(t => ({
            ...t,
            distance: calculateDistance(params.latitude, params.longitude, t.location.latitude, t.location.longitude),
          }));

          if (params.radius) {
            filtered = filtered.filter((t: any) => t.distance <= params.radius!);
          }
        }

        // Sort
        if (params.filter?.sortBy === 'trending') {
          filtered.sort((a, b) => (a.trendingRank || 999) - (b.trendingRank || 999));
        } else if (params.filter?.sortBy === 'engagement') {
          filtered.sort((a, b) => b.engagementScore - a.engagementScore);
        } else if (params.filter?.sortBy === 'recent') {
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        // Pagination
        const offset = params.offset || 0;
        const limit = params.limit || 10;
        const paginatedTrends = filtered.slice(offset, offset + limit);

        return {
          trends: paginatedTrends,
          hasMore: offset + limit < filtered.length,
        };
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch trends');
    }
  },

  /**
   * Get trend details
   */
  async getTrendDetail(trendId: string): Promise<TrendDetail> {
    try {
      const response = await axiosInstance.get(`/api/trends/${trendId}`);
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        console.log('[TrendsAPI] Using mock trend detail (backend unavailable)');

        const trend = MOCK_TRENDS.find(t => t.id === trendId);
        if (!trend) {
          throw new Error('Trend not found');
        }

        // Generate engagement history
        const engagementHistory = Array.from({length: 24}, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          value: Math.floor(Math.random() * 100) + 20,
          type: 'view' as const,
        }));

        // Generate related trends
        const relatedTrends = MOCK_TRENDS.filter(t => t.id !== trendId && t.category === trend.category).slice(0, 3);

        return {
          ...trend,
          fullDescription: trend.description + ' This is an expanded description with more details about the trend, including background information and why it matters to the local community.',
          relatedTrends,
          topContributors: [
            {userId: 'user-1', name: 'Sarah M.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', contributionCount: 15, isVerified: true},
            {userId: 'user-2', name: 'Mike T.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', contributionCount: 12},
            {userId: 'user-3', name: 'Emily R.', avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop', contributionCount: 8},
          ],
          recentActivity: [
            {id: 'act-1', userId: 'user-4', userName: 'David L.', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', action: 'comment', content: 'Great find!', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()},
            {id: 'act-2', userId: 'user-5', userName: 'Lisa K.', action: 'like', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()},
            {id: 'act-3', userId: 'user-6', userName: 'Alex P.', action: 'share', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()},
          ],
          engagementHistory,
          userEngagement: {
            hasLiked: false,
            hasShared: false,
            hasCommented: false,
          },
          discussions: generateMockDiscussions(),
          discussionCount: 47,
        };
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch trend details');
    }
  },

  /**
   * Search trends
   */
  async searchTrends(params: SearchTrendsParams): Promise<Trend[]> {
    try {
      const response = await axiosInstance.get('/api/trends/search', {params});
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        console.log('[TrendsAPI] Using mock search (backend unavailable)');

        const query = params.query.toLowerCase();
        return MOCK_TRENDS.filter(
          t =>
            t.title.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            t.hashtags.some(h => h.toLowerCase().includes(query))
        ).slice(0, params.limit || 10);
      }

      throw new Error(error.response?.data?.message || 'Failed to search trends');
    }
  },

  /**
   * Get community insights
   */
  async getInsights(latitude: number, longitude: number): Promise<CommunityInsight[]> {
    try {
      const response = await axiosInstance.get('/api/trends/insights', {
        params: {latitude, longitude},
      });
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        console.log('[TrendsAPI] Using mock insights (backend unavailable)');
        return MOCK_INSIGHTS;
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch insights');
    }
  },

  /**
   * Get area statistics
   */
  async getAreaStats(latitude: number, longitude: number, radius?: number): Promise<AreaStats> {
    try {
      const response = await axiosInstance.get('/api/trends/stats', {
        params: {latitude, longitude, radius},
      });
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        console.log('[TrendsAPI] Using mock area stats (backend unavailable)');
        return MOCK_AREA_STATS;
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch area stats');
    }
  },

  /**
   * Get trend notifications
   */
  async getTrendNotifications(): Promise<TrendNotification[]> {
    try {
      const response = await axiosInstance.get('/api/trends/notifications');
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        console.log('[TrendsAPI] Using mock notifications (backend unavailable)');
        return MOCK_NOTIFICATIONS;
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch notifications');
    }
  },

  /**
   * Like a trend
   */
  async likeTrend(trendId: string): Promise<{likesCount: number}> {
    try {
      const response = await axiosInstance.post(`/api/trends/${trendId}/like`);
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        const trend = MOCK_TRENDS.find(t => t.id === trendId);
        return {likesCount: (trend?.likesCount || 0) + 1};
      }

      throw new Error(error.response?.data?.message || 'Failed to like trend');
    }
  },

  /**
   * Unlike a trend
   */
  async unlikeTrend(trendId: string): Promise<{likesCount: number}> {
    try {
      const response = await axiosInstance.delete(`/api/trends/${trendId}/like`);
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        const trend = MOCK_TRENDS.find(t => t.id === trendId);
        return {likesCount: Math.max(0, (trend?.likesCount || 1) - 1)};
      }

      throw new Error(error.response?.data?.message || 'Failed to unlike trend');
    }
  },

  /**
   * Share a trend
   */
  async shareTrend(trendId: string): Promise<void> {
    try {
      await axiosInstance.post(`/api/trends/${trendId}/share`);
    } catch (error: any) {
      if (!USE_MOCK_FALLBACK) {
        throw new Error(error.response?.data?.message || 'Failed to share trend');
      }
    }
  },

  /**
   * Add comment to trend
   */
  async addComment(trendId: string, content: string): Promise<TrendDiscussion> {
    try {
      const response = await axiosInstance.post(`/api/trends/${trendId}/comments`, {content});
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        return {
          id: `disc-${Date.now()}`,
          userId: 'current-user',
          userName: 'You',
          content,
          likesCount: 0,
          repliesCount: 0,
          timestamp: new Date().toISOString(),
          isLiked: false,
        };
      }

      throw new Error(error.response?.data?.message || 'Failed to add comment');
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      await axiosInstance.patch(`/api/trends/notifications/${notificationId}/read`);
    } catch {
      // Silent fail
    }
  },

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(latitude: number, longitude: number, limit?: number): Promise<string[]> {
    try {
      const response = await axiosInstance.get('/api/trends/hashtags', {
        params: {latitude, longitude, limit},
      });
      return response.data;
    } catch (error: any) {
      if (USE_MOCK_FALLBACK) {
        const allHashtags = MOCK_TRENDS.flatMap(t => t.hashtags);
        const uniqueHashtags = [...new Set(allHashtags)];
        return uniqueHashtags.slice(0, limit || 10);
      }

      throw new Error(error.response?.data?.message || 'Failed to fetch hashtags');
    }
  },
};

export default localTrendsApi;
