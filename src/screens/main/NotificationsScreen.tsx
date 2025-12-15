import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@/components/common';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllAsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
} from '@/store/slices/notificationsSlice';
import { useEngagementTracking } from '@/hooks/useEngagementTracking';
import { engagementTrackingService } from '@/services/engagementTrackingService';
import { Notification } from '@/api/notificationsApi';
import { NotificationType } from '@/types/notifications';

// Map notification types to icons
const TYPE_ICONS: Record<NotificationType, string> = {
  nearby_user: 'location',
  message: 'chatbubble',
  match: 'heart',
  event: 'calendar',
  promotion: 'megaphone',
};

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Header component - moved outside to avoid re-creation on each render
interface ListHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onSettingsPress: () => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({ unreadCount, onMarkAllAsRead, onSettingsPress }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerLeft}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </View>
    <View style={styles.headerActions}>
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={onMarkAllAsRead}
        >
          <Text style={styles.headerButtonText}>Mark all read</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={onSettingsPress}
      >
        <Icon name="settings-outline" size={24} color={COLORS.PRIMARY} />
      </TouchableOpacity>
    </View>
  </View>
);

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotificationsLoading);
  useEngagementTracking('Notifications');

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Handle notification press
  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      // Mark as read
      if (!notification.read) {
        dispatch(markNotificationAsRead(notification.id));
        engagementTrackingService.trackNotificationOpened(
          notification.id,
          notification.type
        );
      }

      // Navigate based on type
      switch (notification.type) {
        case 'message':
          // Navigate to chat if data contains conversationId
          if (notification.data?.conversationId) {
            navigation.navigate('Chat', { conversationId: notification.data.conversationId });
          }
          break;
        case 'match':
          navigation.navigate('Dating');
          break;
        case 'nearby_user':
          navigation.navigate('Map');
          break;
        default:
          // Stay on notifications screen
          break;
      }
    },
    [dispatch, navigation]
  );

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  // Navigate to settings
  const handleSettingsPress = useCallback(() => {
    navigation.navigate('NotificationSettings');
  }, [navigation]);

  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = TYPE_ICONS[item.type as NotificationType] || 'notifications';

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <Card
          style={[styles.notificationCard, !item.read && styles.unreadCard]}
          padding="medium"
        >
          <View style={styles.notificationContent}>
            <View style={[styles.iconContainer, !item.read && styles.iconContainerUnread]}>
              <Icon name={icon} size={24} color={item.read ? COLORS.PRIMARY : COLORS.WHITE} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={styles.notificationTime}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ListHeader
        unreadCount={unreadCount}
        onMarkAllAsRead={handleMarkAllAsRead}
        onSettingsPress={handleSettingsPress}
      />
      {loading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="notifications-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>
                When you get matches, messages, or nearby user alerts, they'll appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZES.LG,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
    color: COLORS.BLACK,
  },
  badge: {
    backgroundColor: COLORS.DANGER,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.SM,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerButtonText: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.SIZES.SM,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  settingsButton: {
    padding: 8,
    marginLeft: SPACING.SM,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SPACING.MD,
    flexGrow: 1,
  },
  notificationCard: {
    marginBottom: SPACING.SM,
  },
  unreadCard: {
    backgroundColor: '#F0F8FF',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  iconContainerUnread: {
    backgroundColor: COLORS.PRIMARY,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.BLACK,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.LG,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
    color: '#666',
    marginTop: SPACING.MD,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: '#999',
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
