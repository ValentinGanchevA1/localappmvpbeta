// src/services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences } from '@/types/user';

const AUTH_TOKEN_KEY = 'authToken';
const PREFERENCES_KEY = 'preferences';

export class StorageService {
  static async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw new Error('Failed to save auth token.');
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  static async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing auth token:', error);
    }
  }

  // Preferences
  static async savePreferences(prefs: UserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save preferences.');
    }
  }

  static async getPreferences(): Promise<UserPreferences | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
      return raw ? (JSON.parse(raw) as UserPreferences) : null;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return null;
    }
  }
}
