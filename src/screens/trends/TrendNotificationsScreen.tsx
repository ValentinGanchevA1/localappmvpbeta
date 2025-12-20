// src/screens/trends/TrendNotificationsScreen.tsx
// Trend Notifications Screen - Area-based trend alerts

import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchTrendNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  selectTrendNotifications,
  selectUnreadNotificationsCount,
} from '@/store/slices/localTrendsSlice';
import {TrendNotification} from '@/types/trends';
import {LocalTrendsStackParamList} from '@/navigation/LocalTrendsNavigator';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';

// ============================================
// Types
// ============================================

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  LocalTrendsStackParamList,
  'TrendNotifications'
>;

// ============================================
// Helper Functions
// ============================================

const getNotificationIcon = (type: TrendNotification['type']): {name: string; color: string} => {
  switch (type) {
    case 'trending_now':
      return {name: 'flame', color: '#FF9500'};
    case 'new_trend':
      return {name: 'trending-up', color: '#007AFF'};
    case 'peak_activity':
      return {name: 'pulse', color: '#5856D6'};
    case 'nearby_event':
      return {name: 'calendar', color: '#34C759'};
    case 'community_alert':
      return {name: 'warning', color: '#FF3B30'};
    default:
      return {name: 'notifications', color: COLORS.PRIMARY};
  }
};

const formatTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// ============================================
// Notification Item Component
// ============================================

interface NotificationItemProps {
  notification: TrendNotification;
  onPress: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({notification, onPress}) => {
  const icon = getNotificationIcon(notification.type);

  return (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.isRead && styles.notificationUnread]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.iconContainer, {backgroundColor: icon.color + '20'}]}>
        <Icon name={icon.name} size={22} color={icon.color} />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <View style={styles.notificationMeta}>
          <View style={styles.metaItem}>
            <Icon name="location-outline" size={12} color={COLORS.GRAY_400} />
            <Text style={styles.metaText}>{notification.location.distance}km away</Text>
          </View>
          <Text style={styles.notificationTime}>{formatTimeAgo(notification.timestamp)}</Text>
        </View>
      </View>

      <Icon name="chevron-forward" size={20} color={COLORS.GRAY_300} />
    </TouchableOpacity>
  );
};

// ============================================
// Main Component
// ============================================

const TrendNotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const dispatch = useAppDispatch();

  const notifications = useAppSelector(selectTrendNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationsCount);
  const [refreshing, setRefreshing] = React.useState(false);

  // Load notifications on mount
  useEffect(() => {
    dispatch(fetchTrendNotifications());
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchTrendNotifications());
    setRefreshing(false);
  }, [dispatch]);

  // Handle notification press
  const handleNotificationPress = useCallback(
    (notification: TrendNotification) => {
      // Mark as read
      if (!notification.isRead) {
        dispatch(markNotificationRead(notification.id));
      }

      // Navigate to trend detail
      navigation.navigate('TrendDetail', {trendId: notification.trendId});
    },
    [dispatch, navigation]
  );

  // Mark all as read
  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);

  // Render notification item
  const renderItem = useCallback(
    ({item}: {item: TrendNotification}) => (
      <NotificationItem
        notification={item}
        onPress={() => handleNotificationPress(item)}
      />
    ),
    [handleNotificationPress]
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="notifications-off-outline" size={64} color={COLORS.GRAY_300} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You'll receive alerts about trending topics and events in your area.
      </Text>
    </View>
  );

  // Group notifications by date
  const groupedNotifications = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return notifications.reduce((acc, notification) => {
      const notifDate = new Date(notification.timestamp);
      notifDate.setHours(0, 0, 0, 0);

      let group: string;
      if (notifDate.getTime() === today.getTime()) {
        group = 'Today';
      } else if (notifDate.getTime() === yesterday.getTime()) {
        group = 'Yesterday';
      } else {
        group = 'Earlier';
      }

      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(notification);
      return acc;
    }, {} as Record<string, TrendNotification[]>);
  }, [notifications]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-back" size={28} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markReadBtn}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginLeft: SPACING.SM,
  },
  markReadBtn: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 6,
  },
  markReadText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },

  // List
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.GRAY_100,
    marginLeft: 76,
  },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  notificationUnread: {
    backgroundColor: COLORS.PRIMARY + '08',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  notificationBody: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
    lineHeight: 20,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.GRAY_400,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.GRAY_400,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.GRAY_900,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    textAlign: 'center',
  },
});

export default TrendNotificationsScreen;
