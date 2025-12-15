// src/hooks/useNotificationPermissions.ts
// Hook for managing notification permissions

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setPermissionStatus,
  setFcmToken,
} from '@/store/slices/notificationSettingsSlice';
import { firebaseNotificationService } from '@/services/firebaseNotificationService';
import {
  checkNotificationPermission,
  requestNotificationPermission,
  showEnableNotificationsAlert,
  showPermissionRationale,
  shouldShowPermissionRationale,
} from '@/utils/notificationPermissions';
import { PermissionStatus } from '@/types/notifications';

interface UseNotificationPermissionsReturn {
  permissionStatus: PermissionStatus;
  fcmToken: string | null;
  isLoading: boolean;
  isGranted: boolean;
  isDenied: boolean;
  isNotDetermined: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<PermissionStatus>;
  refreshToken: () => Promise<string | null>;
  openSettings: () => void;
}

export function useNotificationPermissions(): UseNotificationPermissionsReturn {
  const dispatch = useAppDispatch();
  const permissionStatus = useAppSelector(
    (state) => state.notificationSettings?.permissionStatus || 'not_determined'
  );
  const fcmToken = useAppSelector(
    (state) => state.notificationSettings?.fcmToken || null
  );

  const [isLoading, setIsLoading] = useState(false);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Refresh FCM token
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await firebaseNotificationService.getToken();
      if (token) {
        dispatch(setFcmToken(token));
      }
      return token;
    } catch (error) {
      console.error('[useNotificationPermissions] Token refresh error:', error);
      return null;
    }
  }, [dispatch]);

  /**
   * Check current permission status
   */
  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    setIsLoading(true);
    try {
      const status = await checkNotificationPermission();
      dispatch(setPermissionStatus(status));

      // If granted, ensure we have a token
      if (status === 'granted' && !fcmToken) {
        await refreshToken();
      }

      return status;
    } catch (error) {
      console.error('[useNotificationPermissions] Check error:', error);
      return 'not_determined';
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, fcmToken, refreshToken]);

  /**
   * Perform the actual permission request
   */
  const performPermissionRequest = useCallback(async (): Promise<boolean> => {
    const status = await requestNotificationPermission();
    dispatch(setPermissionStatus(status));

    if (status === 'granted') {
      await refreshToken();
      return true;
    }

    return false;
  }, [dispatch, refreshToken]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Show rationale on Android first
      if (shouldShowPermissionRationale()) {
        return new Promise((resolve) => {
          showPermissionRationale(async () => {
            const granted = await performPermissionRequest();
            resolve(granted);
          });
        });
      }

      return await performPermissionRequest();
    } catch (error) {
      console.error('[useNotificationPermissions] Request error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [performPermissionRequest]);

  /**
   * Open app settings
   */
  const openSettings = useCallback(() => {
    showEnableNotificationsAlert();
  }, []);

  return {
    permissionStatus,
    fcmToken,
    isLoading,
    isGranted: permissionStatus === 'granted',
    isDenied: permissionStatus === 'denied',
    isNotDetermined: permissionStatus === 'not_determined',
    requestPermission,
    checkPermission,
    refreshToken,
    openSettings,
  };
}

export default useNotificationPermissions;
