// src/components/social/FriendRequestCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {Avatar} from '@/components/common/Avatar';
import {FriendRequest} from '@/types/socialGraph';

interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'incoming' | 'outgoing';
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  onViewProfile?: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
  onViewProfile,
  style,
  loading = false,
}) => {
  const {senderProfile, message, mutualFriendsCount, createdAt} = request;

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onViewProfile}
      activeOpacity={0.7}
      disabled={!onViewProfile}>
      <View style={styles.avatarContainer}>
        <Avatar
          imageUri={senderProfile.avatarUrl}
          name={senderProfile.username}
          size="medium"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {senderProfile.username}
          </Text>
          <Text style={styles.time}>{formatTimeAgo(createdAt)}</Text>
        </View>

        {message && (
          <Text style={styles.message} numberOfLines={2}>
            "{message}"
          </Text>
        )}

        <View style={styles.metaRow}>
          {mutualFriendsCount > 0 && (
            <Text style={styles.mutualFriends}>
              {mutualFriendsCount} mutual friend{mutualFriendsCount > 1 ? 's' : ''}
            </Text>
          )}
          {senderProfile.isOnline && (
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          )}
        </View>

        {type === 'incoming' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
              disabled={loading}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={onReject}
              disabled={loading}>
              <Text style={styles.rejectText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}

        {type === 'outgoing' && (
          <View style={styles.actions}>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: SPACING.SM,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarContainer: {
    marginRight: SPACING.MD,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  message: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  mutualFriends: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    marginRight: SPACING.MD,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.SUCCESS,
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: COLORS.SUCCESS,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: SPACING.SM,
  },
  acceptButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  acceptText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  rejectButton: {
    backgroundColor: COLORS.BACKGROUND,
  },
  rejectText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  cancelButton: {
    backgroundColor: COLORS.BACKGROUND,
  },
  cancelText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  pendingBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.SM,
  },
  pendingText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
});

export default FriendRequestCard;
