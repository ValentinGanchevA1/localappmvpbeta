// src/screens/main/NotificationSettingsScreen.tsx
// Full notification settings screen with all preferences

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setNotificationsEnabled,
  setNotificationTypeEnabled,
  toggleQuietHours,
  setQuietHoursStart,
  setQuietHoursEnd,
  setFrequency,
  setSound,
  setVibration,
  setSmartTiming,
  saveNotificationSettings,
} from '@/store/slices/notificationSettingsSlice';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';
import { useEngagementTracking } from '@/hooks/useEngagementTracking';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';
import { NotificationType, FrequencyPreference } from '@/types/notifications';

type TimePickerMode = 'start' | 'end' | null;

const NOTIFICATION_TYPES: { type: NotificationType; label: string; icon: string; description: string }[] = [
  { type: 'match', label: 'Matches', icon: 'heart', description: 'New match alerts' },
  { type: 'message', label: 'Messages', icon: 'chatbubble', description: 'Chat messages' },
  { type: 'nearby_user', label: 'Nearby Users', icon: 'location', description: 'Location-based alerts' },
  { type: 'event', label: 'Events', icon: 'calendar', description: 'App events and updates' },
  { type: 'promotion', label: 'Promotions', icon: 'megaphone', description: 'Special offers' },
];

const FREQUENCY_OPTIONS: { value: FrequencyPreference; label: string; description: string }[] = [
  { value: 'all', label: 'All', description: 'Receive all notifications' },
  { value: 'important', label: 'Important Only', description: 'Matches and messages only' },
  { value: 'minimal', label: 'Minimal', description: 'Only urgent notifications' },
];

export const NotificationSettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.notificationSettings?.settings);
  const { isGranted, requestPermission, openSettings } = useNotificationPermissions();
  const { getInsights } = useEngagementTracking('NotificationSettings');

  const [showTimePicker, setShowTimePicker] = useState<TimePickerMode>(null);
  const [insights, setInsights] = useState<ReturnType<typeof getInsights> | null>(null);

  // Load insights on mount
  useEffect(() => {
    setInsights(getInsights());
  }, [getInsights]);

  // Save settings when they change
  const saveSettings = useCallback(() => {
    if (settings) {
      dispatch(saveNotificationSettings(settings));
    }
  }, [dispatch, settings]);

  // Handle master toggle
  const handleMasterToggle = useCallback(async (value: boolean) => {
    if (value && !isGranted) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return;
      }
    }
    dispatch(setNotificationsEnabled(value));
    saveSettings();
  }, [dispatch, isGranted, requestPermission, openSettings, saveSettings]);

  // Handle type toggle
  const handleTypeToggle = useCallback((type: NotificationType, value: boolean) => {
    dispatch(setNotificationTypeEnabled({ type, enabled: value }));
    saveSettings();
  }, [dispatch, saveSettings]);

  // Handle quiet hours toggle
  const handleQuietHoursToggle = useCallback((value: boolean) => {
    dispatch(toggleQuietHours(value));
    saveSettings();
  }, [dispatch, saveSettings]);

  // Handle time picker
  const handleTimeChange = useCallback((_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(null);
    }

    if (selectedDate && showTimePicker) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      if (showTimePicker === 'start') {
        dispatch(setQuietHoursStart(timeString));
      } else {
        dispatch(setQuietHoursEnd(timeString));
      }
      saveSettings();
    }

    if (Platform.OS === 'ios') {
      // iOS keeps picker open
    }
  }, [dispatch, showTimePicker, saveSettings]);

  // Parse time string to Date
  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Handle frequency change
  const handleFrequencyChange = useCallback((value: FrequencyPreference) => {
    dispatch(setFrequency(value));
    saveSettings();
  }, [dispatch, saveSettings]);

  // Handle sound toggle
  const handleSoundToggle = useCallback((value: boolean) => {
    dispatch(setSound(value));
    saveSettings();
  }, [dispatch, saveSettings]);

  // Handle vibration toggle
  const handleVibrationToggle = useCallback((value: boolean) => {
    dispatch(setVibration(value));
    saveSettings();
  }, [dispatch, saveSettings]);

  // Handle smart timing toggle
  const handleSmartTimingToggle = useCallback((value: boolean) => {
    dispatch(setSmartTiming(value));
    saveSettings();
  }, [dispatch, saveSettings]);

  // Format best hours for display
  const formatBestHours = (hours: number[]): string => {
    return hours.map((h) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}${ampm}`;
    }).join(', ');
  };

  // Format best days for display
  const formatBestDays = (days: number[]): string => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map((d) => dayNames[d]).join(', ');
  };

  if (!settings) {
    return (
      <View style={styles.container}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Permission Status Banner */}
      {!isGranted && (
        <TouchableOpacity style={styles.permissionBanner} onPress={requestPermission}>
          <Icon name="warning" size={24} color={COLORS.WHITE} />
          <View style={styles.permissionBannerText}>
            <Text style={styles.permissionTitle}>Notifications Disabled</Text>
            <Text style={styles.permissionSubtitle}>Tap to enable notifications</Text>
          </View>
          <Icon name="chevron-forward" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
      )}

      {/* Master Toggle */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Notifications</Text>
            <Text style={styles.settingDescription}>Receive push notifications</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={handleMasterToggle}
            trackColor={{ false: '#ddd', true: COLORS.PRIMARY }}
            thumbColor={COLORS.WHITE}
          />
        </View>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notification Types</Text>
        </View>
        {NOTIFICATION_TYPES.map((item) => (
          <View key={item.type} style={styles.settingRow}>
            <Icon name={item.icon} size={24} color={COLORS.PRIMARY} style={styles.typeIcon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{item.label}</Text>
              <Text style={styles.settingDescription}>{item.description}</Text>
            </View>
            <Switch
              value={settings.types[item.type]}
              onValueChange={(value) => handleTypeToggle(item.type, value)}
              trackColor={{ false: '#ddd', true: COLORS.PRIMARY }}
              thumbColor={COLORS.WHITE}
              disabled={!settings.enabled}
            />
          </View>
        ))}
      </View>

      {/* Quiet Hours */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
            <Text style={styles.settingDescription}>Silence notifications during set times</Text>
          </View>
          <Switch
            value={settings.quietHours.enabled}
            onValueChange={handleQuietHoursToggle}
            trackColor={{ false: '#ddd', true: COLORS.PRIMARY }}
            thumbColor={COLORS.WHITE}
            disabled={!settings.enabled}
          />
        </View>

        {settings.quietHours.enabled && (
          <>
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowTimePicker('start')}
              disabled={!settings.enabled}
            >
              <Text style={styles.timeLabel}>Start Time</Text>
              <Text style={styles.timeValue}>{settings.quietHours.start}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setShowTimePicker('end')}
              disabled={!settings.enabled}
            >
              <Text style={styles.timeLabel}>End Time</Text>
              <Text style={styles.timeValue}>{settings.quietHours.end}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Frequency */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Frequency</Text>
        </View>
        {FREQUENCY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioRow}
            onPress={() => handleFrequencyChange(option.value)}
            disabled={!settings.enabled}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{option.label}</Text>
              <Text style={styles.settingDescription}>{option.description}</Text>
            </View>
            <View style={[
              styles.radioButton,
              settings.frequency === option.value && styles.radioButtonSelected
            ]}>
              {settings.frequency === option.value && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sound & Vibration */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alerts</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Sound</Text>
            <Text style={styles.settingDescription}>Play notification sound</Text>
          </View>
          <Switch
            value={settings.sound}
            onValueChange={handleSoundToggle}
            trackColor={{ false: '#ddd', true: COLORS.PRIMARY }}
            thumbColor={COLORS.WHITE}
            disabled={!settings.enabled}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Text style={styles.settingDescription}>Vibrate on notification</Text>
          </View>
          <Switch
            value={settings.vibration}
            onValueChange={handleVibrationToggle}
            trackColor={{ false: '#ddd', true: COLORS.PRIMARY }}
            thumbColor={COLORS.WHITE}
            disabled={!settings.enabled}
          />
        </View>
      </View>

      {/* Smart Timing */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Smart Delivery</Text>
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Smart Timing</Text>
            <Text style={styles.settingDescription}>
              AI-optimized delivery based on your activity patterns
            </Text>
          </View>
          <Switch
            value={settings.smartTiming}
            onValueChange={handleSmartTimingToggle}
            trackColor={{ false: '#ddd', true: COLORS.PRIMARY }}
            thumbColor={COLORS.WHITE}
            disabled={!settings.enabled}
          />
        </View>

        {/* Insights */}
        {settings.smartTiming && insights && insights.totalSessions > 5 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>Your Activity Patterns</Text>
            <View style={styles.insightRow}>
              <Icon name="time" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.insightText}>
                Most active: {formatBestHours(insights.bestHours)}
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Icon name="calendar" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.insightText}>
                Best days: {formatBestDays(insights.bestDays)}
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Icon name="notifications" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.insightText}>
                Response rate: {Math.round(insights.responseRate * 100)}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={parseTime(
            showTimePicker === 'start' ? settings.quietHours.start : settings.quietHours.end
          )}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {Platform.OS === 'ios' && showTimePicker && (
        <View style={styles.timePickerFooter}>
          <TouchableOpacity
            style={styles.timePickerDone}
            onPress={() => setShowTimePicker(null)}
          >
            <Text style={styles.timePickerDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: SPACING.MD,
    paddingBottom: SPACING.LG * 2,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DANGER,
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.MD,
  },
  permissionBannerText: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  permissionTitle: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
  },
  permissionSubtitle: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.SIZES.SM,
    opacity: 0.9,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: SPACING.MD,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: SPACING.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_MUTED,
    textTransform: 'uppercase',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  typeIcon: {
    marginRight: SPACING.MD,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  timeLabel: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  timeValue: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.PRIMARY,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
  insightsContainer: {
    padding: SPACING.MD,
    backgroundColor: '#f8f9fa',
  },
  insightsTitle: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_MUTED,
    marginBottom: SPACING.SM,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  insightText: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  timePickerFooter: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  timePickerDone: {
    alignItems: 'center',
    padding: SPACING.SM,
  },
  timePickerDoneText: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
});

export default NotificationSettingsScreen;
