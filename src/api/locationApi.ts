// src/api/locationApi.ts
import axiosInstance from './axiosInstance';

export interface NearbyUser {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;
  avatar?: string;
  isOnline?: boolean;
  bio?: string;
  interests?: string[];
  age?: number;
}

interface GetNearbyUsersParams {
  latitude: number;
  longitude: number;
  radius: number;
  limit: number;
}

// Flag to enable mock data when backend is unavailable
const USE_MOCK_FALLBACK = __DEV__;

// Helper to generate nearby coordinates
const generateNearbyCoord = (
  baseLat: number,
  baseLng: number,
  radiusKm: number,
): {latitude: number; longitude: number} => {
  const radiusInDegrees = radiusKm / 111;
  const randomLat = baseLat + (Math.random() - 0.5) * 2 * radiusInDegrees;
  const randomLng = baseLng + (Math.random() - 0.5) * 2 * radiusInDegrees;
  return {latitude: randomLat, longitude: randomLng};
};

// Calculate distance between two points in km
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
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
  return R * c;
};

// Generate mock nearby users based on user location
const generateMockNearbyUsers = (
  baseLat: number,
  baseLng: number,
  limit: number,
): NearbyUser[] => {
  const mockUsers: NearbyUser[] = [
    {
      id: 'nearby-1',
      name: 'Sarah M.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      bio: 'Coffee lover. Always up for a chat!',
      isOnline: true,
      interests: ['Coffee', 'Reading', 'Hiking'],
      age: 27,
    },
    {
      id: 'nearby-2',
      name: 'Mike T.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      bio: 'Tech enthusiast, gamer, and foodie.',
      isOnline: false,
      interests: ['Gaming', 'Tech', 'Food'],
      age: 29,
    },
    {
      id: 'nearby-3',
      name: 'Emily R.',
      avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop',
      bio: 'Yoga instructor. Love meeting new people!',
      isOnline: true,
      interests: ['Yoga', 'Wellness', 'Travel'],
      age: 25,
    },
    {
      id: 'nearby-4',
      name: 'David L.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      bio: 'Photographer exploring the city.',
      isOnline: true,
      interests: ['Photography', 'Art', 'Music'],
      age: 31,
    },
    {
      id: 'nearby-5',
      name: 'Lisa K.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      bio: 'Marketing professional. Let\'s network!',
      isOnline: false,
      interests: ['Business', 'Networking', 'Wine'],
      age: 28,
    },
    {
      id: 'nearby-6',
      name: 'Alex P.',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop',
      bio: 'Musician and coffee shop regular.',
      isOnline: true,
      interests: ['Music', 'Coffee', 'Writing'],
      age: 26,
    },
    {
      id: 'nearby-7',
      name: 'Jessica W.',
      avatar: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=100&h=100&fit=crop',
      bio: 'Runner and outdoor enthusiast.',
      isOnline: false,
      interests: ['Running', 'Hiking', 'Fitness'],
      age: 24,
    },
    {
      id: 'nearby-8',
      name: 'Chris B.',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
      bio: 'Startup founder. Always learning.',
      isOnline: true,
      interests: ['Startups', 'Tech', 'Books'],
      age: 33,
    },
    {
      id: 'nearby-9',
      name: 'Amanda S.',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop',
      bio: 'Chef and food blogger.',
      isOnline: true,
      interests: ['Cooking', 'Food', 'Travel'],
      age: 30,
    },
    {
      id: 'nearby-10',
      name: 'Ryan M.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      bio: 'Fitness trainer. Let\'s work out!',
      isOnline: false,
      interests: ['Fitness', 'Nutrition', 'Sports'],
      age: 28,
    },
    {
      id: 'nearby-11',
      name: 'Megan H.',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
      bio: 'Art student. Love galleries and museums.',
      isOnline: true,
      interests: ['Art', 'Museums', 'Drawing'],
      age: 23,
    },
    {
      id: 'nearby-12',
      name: 'Jason F.',
      avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop',
      bio: 'Software developer. Board game night?',
      isOnline: false,
      interests: ['Coding', 'Board Games', 'Movies'],
      age: 32,
    },
  ];

  // Assign locations near the user and calculate distances
  return mockUsers.slice(0, limit).map(user => {
    const radiusKm = Math.random() * 4 + 0.5; // 0.5 to 4.5 km
    const coords = generateNearbyCoord(baseLat, baseLng, radiusKm);
    const distance = calculateDistance(baseLat, baseLng, coords.latitude, coords.longitude);

    return {
      ...user,
      ...coords,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
    };
  });
};

export const locationApi = {
  async getNearbyUsers(params: GetNearbyUsersParams): Promise<NearbyUser[]> {
    try {
      if (!params.latitude || !params.longitude) {
        throw new Error('Location coordinates are required');
      }
      if (!params.radius || params.radius <= 0) {
        throw new Error('Valid search radius is required');
      }
      if (!params.limit || params.limit <= 0) {
        throw new Error('Valid limit is required');
      }
      const response = await axiosInstance.get('/api/location/nearby', {params});
      return response.data;
    } catch (error: any) {
      // Return mock data in dev mode when backend is unavailable
      if (USE_MOCK_FALLBACK) {
        console.log('[LocationAPI] Using mock nearby users (backend unavailable)');
        return generateMockNearbyUsers(params.latitude, params.longitude, params.limit);
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to load nearby users. Please try again.';
      throw new Error(message);
    }
  },
};
