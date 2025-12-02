import { User } from '../models/User';
import Redis from 'ioredis';
import { Repository } from 'typeorm';

interface NearbyUser {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  avatar?: string;
  isOnline: boolean;
}

interface GeofenceCheckResult {
  insideGeofences: string[];
  exitedGeofences: string[];
}

export class LocationService {
  private redis: Redis;
  private userRepository: Repository<User>;

  constructor(redis: Redis, userRepository: Repository<User>) {
    this.redis = redis;
    this.userRepository = userRepository;
  }

  /**
   * Update user location in database and cache
   */
  async updateUserLocation(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy: number
  ): Promise<User> {
    // Update in database
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new Error('User not found');

    user.location = {
      type: 'Point',
      coordinates: [longitude, latitude], // GeoJSON format: [lng, lat]
    };
    user.lastSeen = new Date();
    user.isOnline = true;

    await this.userRepository.save(user);

    // Cache in Redis with geospatial index
    const geohash = this.latLngToGeohash(latitude, longitude);
    await Promise.all([
      // Store user location with geohash for quick lookups
      this.redis.setex(
        `user:location:${userId}`,
        1800, // 30 min TTL
        JSON.stringify({ latitude, longitude, accuracy, geohash })
      ),
      // Add to geospatial index (Redis GEO commands)
      this.redis.geoadd('users:geo', longitude, latitude, userId),
      // Add to active users set
      this.redis.setex(`user:active:${userId}`, 1800, '1'),
    ]);

    return user;
  }

  /**
   * Find nearby users using Redis geospatial queries
   */
  async findNearbyUsers(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000,
    excludeUserId?: string,
    limit: number = 50
  ): Promise<NearbyUser[]> {
    try {
      // Use Redis GEORADIUS for fast lookup
      const nearbyUserIds = await this.redis.georadius(
        'users:geo',
        longitude,
        latitude,
        radiusMeters / 1000, // Convert to km
        'km',
        'WITHDIST',
        'COUNT',
        limit
      );

      if (!nearbyUserIds || nearbyUserIds.length === 0) {
        return [];
      }

      // Parse results (alternating userId, distance)
      const userDataPromises: Promise<NearbyUser | null>[] = [];

      for (let i = 0; i < nearbyUserIds.length; i += 2) {
        const userId = nearbyUserIds[i];
        const distance = parseFloat(nearbyUserIds[i + 1]) * 1000; // Convert to meters

        if (excludeUserId && userId === excludeUserId) continue;

        userDataPromises.push(
          this.getUserNearbyData(userId as string, distance)
        );
      }

      const nearbyUsers = await Promise.all(userDataPromises);
      return nearbyUsers.filter((u) => u !== null) as NearbyUser[];
    } catch (error) {
      console.error('[LocationService] findNearbyUsers error:', error);
      // Fallback to database query if Redis fails
      return this.findNearbyUsersDatabase(latitude, longitude, radiusMeters, limit);
    }
  }

  /**
   * Get user data for nearby users display
   */
  private async getUserNearbyData(
    userId: string,
    distance: number
  ): Promise<NearbyUser | null> {
    try {
      const locationData = await this.redis.get(`user:location:${userId}`);
      if (!locationData) return null;

      const { latitude, longitude } = JSON.parse(locationData);
      const user = await this.userRepository.findOneBy({ id: userId });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name,
        latitude,
        longitude,
        distance,
        avatar: user.profilePhoto,
        isOnline: user.isOnline,
      };
    } catch (error) {
      console.error('[LocationService] getUserNearbyData error:', error);
      return null;
    }
  }

  /**
   * Fallback: Find nearby users using PostGIS queries
   */
  private async findNearbyUsersDatabase(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    limit: number
  ): Promise<NearbyUser[]> {
    const users = await this.userRepository.query(
      `
      SELECT
        id,
        name,
        "profilePhoto" as avatar,
        "isOnline",
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude,
        ST_Distance(location, ST_GeomFromText('POINT(? ?)', 4326)) as distance
      FROM users
      WHERE ST_DWithin(location, ST_GeomFromText('POINT(? ?)', 4326), ?)
      AND "isOnline" = true
      ORDER BY distance ASC
      LIMIT ?
      `,
      [longitude, latitude, longitude, latitude, radiusMeters, limit]
    );

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      latitude: u.latitude,
      longitude: u.longitude,
      distance: u.distance,
      avatar: u.avatar,
      isOnline: u.isOnline,
    }));
  }

  /**
   * Check if user entered/exited geofences
   */
  async checkGeofences(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<GeofenceCheckResult> {
    // Get active geofences from Redis
    const geofences = await this.redis.smembers('geofences:active');

    const insideGeofences: string[] = [];
    const exitedGeofences: string[] = [];

    for (const geofenceId of geofences) {
      const geofenceData = await this.redis.get(`geofence:${geofenceId}`);
      if (!geofenceData) continue;

      const { centerLat, centerLng, radius } = JSON.parse(geofenceData);
      const isInside = this.isWithinGeofence(
        latitude,
        longitude,
        centerLat,
        centerLng,
        radius
      );

      const previousState = await this.redis.get(
        `user:${userId}:geofence:${geofenceId}`
      );

      if (isInside && !previousState) {
        insideGeofences.push(geofenceId);
        await this.redis.setex(`user:${userId}:geofence:${geofenceId}`, 1800, '1');
      } else if (!isInside && previousState) {
        exitedGeofences.push(geofenceId);
        await this.redis.del(`user:${userId}:geofence:${geofenceId}`);
      }
    }

    return { insideGeofences, exitedGeofences };
  }

  /**
   * Calculate distance between two coordinates (Haversine)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if point is within geofence
   */
  private isWithinGeofence(
    userLat: number,
    userLng: number,
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLng, centerLat, centerLng);
    return distance <= radiusMeters;
  }

  /**
   * Convert lat/lng to geohash for spatial indexing
   */
  private latLngToGeohash(
    lat: number,
    lng: number,
    precision: number = 10
  ): string {
    const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let geohash = '';

    let latMin = -90,
      latMax = 90;
    let lngMin = -180,
      lngMax = 180;

    while (geohash.length < precision) {
      if (evenBit) {
        const lngMid = (lngMin + lngMax) / 2;
        if (lng > lngMid) {
          idx = (idx << 1) + 1;
          lngMin = lngMid;
        } else {
          idx = idx << 1;
          lngMax = lngMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (lat > latMid) {
          idx = (idx << 1) + 1;
          latMin = latMid;
        } else {
          idx = idx << 1;
          latMax = latMid;
        }
      }
      evenBit = !evenBit;

      if (++bit === 5) {
        geohash += BASE32[idx];
        bit = 0;
        idx = 0;
      }
    }

    return geohash;
  }

  /**
   * Set user offline (called on logout/disconnect)
   */
  async setUserOffline(userId: string): Promise<void> {
    await Promise.all([
      this.userRepository.update(userId, { isOnline: false }),
      this.redis.del(`user:active:${userId}`),
      this.redis.del(`user:location:${userId}`),
      this.redis.zrem('users:geo', userId),
    ]);
  }

  /**
   * Get user presence status
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const active = await this.redis.exists(`user:active:${userId}`);
    return active === 1;
  }
}
