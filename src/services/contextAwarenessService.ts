// src/services/contextAwarenessService.ts
// Service for gathering context about the user's current state

import { AppState, AppStateStatus } from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '@/store/store';
import {
  NotificationContext,
  AppStateType,
  NetworkType,
  LocationContextType,
  LocationPattern,
  QuietHoursConfig,
} from '@/types/notifications';

const LOCATION_PATTERNS_KEY = 'location_patterns';
const LOCATION_HISTORY_KEY = 'location_history';

// Radius in meters for location clustering
const LOCATION_CLUSTER_RADIUS = 100;
// Minimum visits to consider a location pattern
const MIN_VISITS_FOR_PATTERN = 5;

interface LocationVisit {
  latitude: number;
  longitude: number;
  timestamp: number;
  duration: number;
}

class ContextAwarenessService {
  private static instance: ContextAwarenessService;
  private isInitialized = false;
  private currentAppState: AppStateStatus = 'active';
  private currentNetworkType: NetworkType = 'unknown';
  private locationPatterns: LocationPattern[] = [];
  private locationHistory: LocationVisit[] = [];
  private lastLocationUpdate: { latitude: number; longitude: number; timestamp: number } | null = null;
  private appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
  private netInfoSubscription: (() => void) | null = null;

  private constructor() {}

  static getInstance(): ContextAwarenessService {
    if (!ContextAwarenessService.instance) {
      ContextAwarenessService.instance = new ContextAwarenessService();
    }
    return ContextAwarenessService.instance;
  }

  /**
   * Initialize the context awareness service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[ContextAwareness] Already initialized');
      return;
    }

    try {
      // Load saved location patterns
      await this.loadLocationPatterns();

      // Set up app state tracking
      this.currentAppState = AppState.currentState;
      this.appStateSubscription = AppState.addEventListener('change', (state) => {
        this.currentAppState = state;
      });

      // Set up network state tracking
      this.netInfoSubscription = NetInfo.addEventListener((state) => {
        this.handleNetworkChange(state);
      });

      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.handleNetworkChange(netInfo);

      this.isInitialized = true;
      console.log('[ContextAwareness] Service initialized');
    } catch (error) {
      console.error('[ContextAwareness] Initialization error:', error);
    }
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange(state: NetInfoState): void {
    if (!state.isConnected) {
      this.currentNetworkType = 'none';
    } else if (state.type === 'wifi') {
      this.currentNetworkType = 'wifi';
    } else if (state.type === 'cellular') {
      this.currentNetworkType = 'cellular';
    } else {
      this.currentNetworkType = 'unknown';
    }
  }

  /**
   * Get the current notification context
   */
  async getCurrentContext(quietHours?: QuietHoursConfig): Promise<NotificationContext> {
    const now = new Date();
    const engagementState = store.getState().engagement;

    return {
      timeOfDay: now.getHours(),
      dayOfWeek: now.getDay(),
      isQuietHours: quietHours ? this.isInQuietHours(quietHours) : false,
      appState: this.mapAppState(this.currentAppState),
      batteryLevel: await this.getBatteryLevel(),
      isLowPowerMode: await this.isLowPowerMode(),
      networkType: this.currentNetworkType,
      locationContext: this.getCurrentLocationContext(),
      lastActivityTimestamp: engagementState?.profile?.lastActiveTimestamp || 0,
      minutesSinceLastActivity: this.getMinutesSinceLastActivity(engagementState?.profile?.lastActiveTimestamp),
    };
  }

  /**
   * Map React Native AppState to our AppStateType
   */
  private mapAppState(state: AppStateStatus): AppStateType {
    switch (state) {
      case 'active':
        return 'active';
      case 'background':
        return 'background';
      case 'inactive':
      default:
        return 'inactive';
    }
  }

  /**
   * Check if current time is within quiet hours
   */
  isInQuietHours(quietHours: QuietHoursConfig): boolean {
    if (!quietHours.enabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    // Regular quiet hours (e.g., 14:00 to 16:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Get battery level (0-1)
   */
  private async getBatteryLevel(): Promise<number> {
    // Note: Would need react-native-device-info or similar for actual battery level
    // For now, return a default value
    return 0.8;
  }

  /**
   * Check if device is in low power mode
   */
  private async isLowPowerMode(): Promise<boolean> {
    // Note: Would need react-native-device-info for actual low power mode check
    return false;
  }

  /**
   * Get minutes since last activity
   */
  private getMinutesSinceLastActivity(lastActivityTimestamp?: number): number {
    if (!lastActivityTimestamp || lastActivityTimestamp === 0) return Infinity;
    return (Date.now() - lastActivityTimestamp) / (1000 * 60);
  }

  /**
   * Update current location for pattern detection
   */
  updateLocation(latitude: number, longitude: number): void {
    const now = Date.now();

    // If we have a previous location, record the visit
    if (this.lastLocationUpdate) {
      const duration = now - this.lastLocationUpdate.timestamp;
      // Only record if user was at location for more than 5 minutes
      if (duration > 5 * 60 * 1000) {
        this.recordLocationVisit(
          this.lastLocationUpdate.latitude,
          this.lastLocationUpdate.longitude,
          this.lastLocationUpdate.timestamp,
          duration
        );
      }
    }

    this.lastLocationUpdate = { latitude, longitude, timestamp: now };
  }

  /**
   * Record a location visit for pattern analysis
   */
  private recordLocationVisit(
    latitude: number,
    longitude: number,
    timestamp: number,
    duration: number
  ): void {
    this.locationHistory.push({ latitude, longitude, timestamp, duration });

    // Keep only last 500 visits
    if (this.locationHistory.length > 500) {
      this.locationHistory = this.locationHistory.slice(-500);
    }

    // Recalculate patterns periodically
    if (this.locationHistory.length % 10 === 0) {
      this.calculateLocationPatterns();
    }

    this.saveLocationPatterns();
  }

  /**
   * Calculate location patterns from visit history
   */
  private calculateLocationPatterns(): void {
    const clusters: Map<string, LocationVisit[]> = new Map();

    // Cluster visits by location (simplified grid-based clustering)
    for (const visit of this.locationHistory) {
      // Create a grid key (approximately 100m resolution)
      const gridKey = `${Math.floor(visit.latitude * 1000)},${Math.floor(visit.longitude * 1000)}`;

      if (!clusters.has(gridKey)) {
        clusters.set(gridKey, []);
      }
      clusters.get(gridKey)!.push(visit);
    }

    // Convert clusters to patterns
    this.locationPatterns = [];
    for (const [_key, visits] of clusters) {
      if (visits.length >= MIN_VISITS_FOR_PATTERN) {
        const avgLat = visits.reduce((sum, v) => sum + v.latitude, 0) / visits.length;
        const avgLong = visits.reduce((sum, v) => sum + v.longitude, 0) / visits.length;
        const totalDuration = visits.reduce((sum, v) => sum + v.duration, 0);
        const avgHour =
          visits.reduce((sum, v) => sum + new Date(v.timestamp).getHours(), 0) / visits.length;

        // Classify location based on typical visit times
        let label: LocationContextType = 'unknown';
        if (avgHour >= 9 && avgHour <= 17 && visits.length >= 10) {
          label = 'work';
        } else if ((avgHour < 9 || avgHour > 20) && visits.length >= 10) {
          label = 'home';
        }

        this.locationPatterns.push({
          latitude: avgLat,
          longitude: avgLong,
          visits: visits.length,
          totalDuration,
          avgHour,
          label,
        });
      }
    }

    // Sort by visit count (most visited first)
    this.locationPatterns.sort((a, b) => b.visits - a.visits);

    // Mark the most visited evening/night location as home
    const homeCandidate = this.locationPatterns.find(
      (p) => p.label === 'unknown' && (p.avgHour < 9 || p.avgHour > 20)
    );
    if (homeCandidate) {
      homeCandidate.label = 'home';
    }

    // Mark the most visited work-hours location as work
    const workCandidate = this.locationPatterns.find(
      (p) => p.label === 'unknown' && p.avgHour >= 9 && p.avgHour <= 17
    );
    if (workCandidate) {
      workCandidate.label = 'work';
    }
  }

  /**
   * Get current location context based on patterns
   */
  getCurrentLocationContext(): LocationContextType {
    if (!this.lastLocationUpdate || this.locationPatterns.length === 0) {
      return 'unknown';
    }

    const { latitude, longitude } = this.lastLocationUpdate;

    // Find the closest pattern
    for (const pattern of this.locationPatterns) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        pattern.latitude,
        pattern.longitude
      );
      if (distance < LOCATION_CLUSTER_RADIUS) {
        return pattern.label;
      }
    }

    // If not near any known location, might be commuting
    const now = new Date();
    const hour = now.getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      return 'commuting';
    }

    return 'unknown';
  }

  /**
   * Calculate distance between two coordinates in meters (Haversine formula)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Load location patterns from storage
   */
  private async loadLocationPatterns(): Promise<void> {
    try {
      const patternsJson = await AsyncStorage.getItem(LOCATION_PATTERNS_KEY);
      if (patternsJson) {
        this.locationPatterns = JSON.parse(patternsJson);
      }

      const historyJson = await AsyncStorage.getItem(LOCATION_HISTORY_KEY);
      if (historyJson) {
        this.locationHistory = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error('[ContextAwareness] Load patterns error:', error);
    }
  }

  /**
   * Save location patterns to storage
   */
  private async saveLocationPatterns(): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_PATTERNS_KEY, JSON.stringify(this.locationPatterns));
      await AsyncStorage.setItem(LOCATION_HISTORY_KEY, JSON.stringify(this.locationHistory));
    } catch (error) {
      console.error('[ContextAwareness] Save patterns error:', error);
    }
  }

  /**
   * Get app state
   */
  getAppState(): AppStateType {
    return this.mapAppState(this.currentAppState);
  }

  /**
   * Get network type
   */
  getNetworkType(): NetworkType {
    return this.currentNetworkType;
  }

  /**
   * Check if device is connected to network
   */
  isConnected(): boolean {
    return this.currentNetworkType !== 'none';
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    if (this.netInfoSubscription) {
      this.netInfoSubscription();
      this.netInfoSubscription = null;
    }

    // Save before cleanup
    this.saveLocationPatterns();

    this.isInitialized = false;
    console.log('[ContextAwareness] Service cleaned up');
  }
}

// Export singleton instance
export const contextAwarenessService = ContextAwarenessService.getInstance();
export default contextAwarenessService;
