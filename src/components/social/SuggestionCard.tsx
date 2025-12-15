// src/components/social/SuggestionCard.tsx
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
import {DiscoverySuggestion, DiscoverySource} from '@/types/socialGraph';

interface SuggestionCardProps {
  suggestion: DiscoverySuggestion;
  onAddFriend?: () => void;
  onDismiss?: () => void;
  onViewProfile?: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
}

const sourceLabels: Record<DiscoverySource, string> = {
  mutual_friends: 'Mutual friends',
  location_based: 'Nearby',
  interest_based: 'Similar interests',
  contacts_sync: 'From contacts',
  group_members: 'Group member',
  event_attendees: 'Event attendee',
  algorithm: 'Suggested for you',
};

const sourceIcons: Record<DiscoverySource, string> = {
  mutual_friends: '👥',
  location_based: '📍',
  interest_based: '⭐',
  contacts_sync: '📱',
  group_members: '🏠',
  event_attendees: '📅',
  algorithm: '✨',
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAddFriend,
  onDismiss,
  onViewProfile,
  style,
  loading = false,
}) => {
  const {
    profile,
    source,
    score,
    mutualFriendsCount,
    mutualFriends,
    commonInterests,
    commonGroups,
    distance,
  } = suggestion;

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onViewProfile}
      activeOpacity={0.7}
      disabled={!onViewProfile}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar
            imageUri={profile.avatarUrl}
            name={profile.username}
            size="large"
          />
          {profile.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          disabled={loading}>
          <Text style={styles.dismissIcon}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.username}
        </Text>

        {profile.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        )}

        <View style={styles.sourceBadge}>
          <Text style={styles.sourceIcon}>{sourceIcons[source]}</Text>
          <Text style={styles.sourceText}>{sourceLabels[source]}</Text>
        </View>

        <View style={styles.details}>
          {mutualFriendsCount > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.mutualAvatars}>
                {mutualFriends.slice(0, 3).map((friend, index) => (
                  <View
                    key={friend.id}
                    style={[styles.mutualAvatar, {marginLeft: index > 0 ? -6 : 0}]}>
                    <Avatar
                      imageUri={friend.avatarUrl}
                      name={friend.username}
                      size="small"
                    />
                  </View>
                ))}
              </View>
              <Text style={styles.detailText}>
                {mutualFriendsCount} mutual friend{mutualFriendsCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {commonInterests.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>⭐</Text>
              <Text style={styles.detailText} numberOfLines={1}>
                {commonInterests.slice(0, 2).join(', ')}
                {commonInterests.length > 2 && ` +${commonInterests.length - 2}`}
              </Text>
            </View>
          )}

          {commonGroups.length > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>🏠</Text>
              <Text style={styles.detailText} numberOfLines={1}>
                {commonGroups.length} common group{commonGroups.length > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {distance !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText}>{formatDistance(distance)}</Text>
            </View>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <View style={[styles.scoreBar, {width: `${score}%`}]} />
          <Text style={styles.scoreText}>{score}% match</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.addButton, loading && styles.addButtonDisabled]}
        onPress={onAddFriend}
        disabled={loading}>
        <Text style={styles.addButtonText}>
          {loading ? 'Sending...' : 'Add Friend'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MD,
    marginRight: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.SUCCESS,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissIcon: {
    fontSize: 18,
    color: COLORS.TEXT_MUTED,
    lineHeight: 20,
  },
  content: {
    marginTop: SPACING.MD,
  },
  name: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  bio: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    lineHeight: 18,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.SM,
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  sourceIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  sourceText: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  details: {
    marginTop: SPACING.MD,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mutualAvatars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  mutualAvatar: {
    borderWidth: 1.5,
    borderColor: COLORS.WHITE,
    borderRadius: 14,
  },
  detailIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  scoreContainer: {
    marginTop: SPACING.MD,
    height: 20,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY + '30',
    borderRadius: 10,
  },
  scoreText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  addButton: {
    marginTop: SPACING.MD,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
});

export default SuggestionCard;
