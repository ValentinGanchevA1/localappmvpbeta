// src/utils/notificationPermissions.ts
// Notification permission utilities with platform-specific handling

import { Platform, Linking, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { PermissionStatus } from '@/types/notifications';

/**
 * Check current notification permission status
 */
export async function checkNotificationPermission(): Promise<PermissionStatus> {
  try {
    const authStatus = await messaging().hasPermission();
    return mapAuthorizationStatus(authStatus);
  } catch (error) {
    console.error('[NotificationPermissions] Check permission error:', error);
    return 'not_determined';
  }
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  try {
    // On Android 13+, we need to request POST_NOTIFICATIONS permission
    // Firebase handles this automatically when we call requestPermission()
    const authStatus = await messaging().requestPermission({
      sound: true,
      badge: true,
      alert: true,
      provisional: false, // Set to true for provisional (quiet) notifications on iOS
    });

    const status = mapAuthorizationStatus(authStatus);
    console.log('[NotificationPermissions] Permission result:', status);
    return status;
  } catch (error) {
    console.error('[NotificationPermissions] Request permission error:', error);
    return 'denied';
  }
}

/**
 * Request provisional (quiet) notification permission on iOS
 * Provisional notifications appear silently in Notification Center
 */
export async function requestProvisionalPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') {
    return requestNotificationPermission();
  }

  try {
    const authStatus = await messaging().requestPermission({
      sound: false,
      badge: true,
      alert: true,
      provisional: true,
    });

    return mapAuthorizationStatus(authStatus);
  } catch (error) {
    console.error('[NotificationPermissions] Provisional permission error:', error);
    return 'denied';
  }
}

/**
 * Map Firebase AuthorizationStatus to our PermissionStatus type
 */
function mapAuthorizationStatus(
  status: typeof messaging.AuthorizationStatus[keyof typeof messaging.AuthorizationStatus]
): PermissionStatus {
  switch (status) {
    case messaging.AuthorizationStatus.AUTHORIZED:
      return 'granted';
    case messaging.AuthorizationStatus.PROVISIONAL:
      return 'granted'; // Treat provisional as granted for simplicity
    case messaging.AuthorizationStatus.DENIED:
      return 'denied';
    case messaging.AuthorizationStatus.NOT_DETERMINED:
    default:
      return 'not_determined';
  }
}

/**
 * Check if notifications are blocked at system level
 */
export async function isNotificationBlocked(): Promise<boolean> {
  const status = await checkNotificationPermission();
  return status === 'denied';
}

/**
 * Open app settings so user can enable notifications
 */
export async function openNotificationSettings(): Promise<void> {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('[NotificationPermissions] Open settings error:', error);
  }
}

/**
 * Show alert to prompt user to enable notifications in settings
 */
export function showEnableNotificationsAlert(): void {
  Alert.alert(
    'Enable Notifications',
    'To receive updates about matches, messages, and nearby users, please enable notifications in your device settings.',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: openNotificationSettings,
      },
    ],
    { cancelable: true }
  );
}

/**
 * Request permission with fallback to settings prompt
 * Returns true if permission was granted
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const currentStatus = await checkNotificationPermission();

  if (currentStatus === 'granted') {
    return true;
  }

  if (currentStatus === 'not_determined') {
    const newStatus = await requestNotificationPermission();
    return newStatus === 'granted';
  }

  // Permission was denied - prompt user to enable in settings
  showEnableNotificationsAlert();
  return false;
}

/**
 * Check if we should show permission rationale
 * (Called before requesting permission to explain why we need it)
 */
export function shouldShowPermissionRationale(): boolean {
  // On Android, we might want to show rationale before requesting
  // On iOS, the system handles this automatically
  return Platform.OS === 'android';
}

/**
 * Show permission rationale alert
 */
export function showPermissionRationale(onProceed: () => void): void {
  Alert.alert(
    'Stay Connected',
    'Enable notifications to get alerts when someone matches with you, sends you a message, or is nearby. You can customize which notifications you receive in the app settings.',
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Enable',
        onPress: onProceed,
      },
    ],
    { cancelable: true }
  );
}
