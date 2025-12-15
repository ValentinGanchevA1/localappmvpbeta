// src/components/social/FriendCard.tsx
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
import {FriendRelationship, ConnectionStrength} from '@/types/socialGraph';

interface FriendCardProps {
  friend: FriendRelationship;
  onPress?: () => void;
  onMessage?: () => void;
  onOptions?: () => void;
  style?: StyleProp<ViewStyle>;
  showConnectionStrength?: boolean;
  compact?: boolean;
}

const connectionStrengthColors: Record<ConnectionStrength, string> = {
  best_friend: '#FF6B6B',
  strong: '#4ECDC4',
  moderate: '#45B7D1',
  weak: '#96CEB4',
};

const connectionStrengthLabels: Record<ConnectionStrength, string> = {
  best_friend: 'Best Friend',
  strong: 'Close',
  moderate: 'Friend',
  weak: 'Acquaintance',
};

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  onPress,
  onMessage,
  onOptions,
  style,
  showConnectionStrength = true,
  compact = false,
}) => {
  const {friendProfile, connectionStrength, nickname, isFavorite, mutualFriendsCount} =
    friend;

  const displayName = nickname || friendProfile.username;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={onPress}
        activeOpacity={0.7}>
        <Avatar
          imageUri={friendProfile.avatarUrl}
          name={displayName}
          size="small"
        />
        <Text style={styles.compactName} numberOfLines={1}>
          {displayName}
        </Text>
        {friendProfile.isOnline && <View style={styles.onlineIndicatorSmall} />}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.avatarContainer}>
        <Avatar
          imageUri={friendProfile.avatarUrl}
          name={displayName}
          size="medium"
        />
        {friendProfile.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          {isFavorite && <Text style={styles.favoriteIcon}>★</Text>}
        </View>

        {friendProfile.bio && (
          <Text style={styles.bio} numberOfLines={1}>
            {friendProfile.bio}
          </Text>
        )}

        <View style={styles.metaRow}>
          {showConnectionStrength && (
            <View
              style={[
                styles.strengthBadge,
                {backgroundColor: connectionStrengthColors[connectionStrength] + '20'},
              ]}>
              <Text
                style={[
                  styles.strengthText,
                  {color: connectionStrengthColors[connectionStrength]},
                ]}>
                {connectionStrengthLabels[connectionStrength]}
              </Text>
            </View>
          )}

          {mutualFriendsCount > 0 && (
            <Text style={styles.mutualFriends}>
              {mutualFriendsCount} mutual
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {onMessage && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onMessage}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>
        )}
        {onOptions && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onOptions}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.actionIcon}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
  compactContainer: {
    alignItems: 'center',
    padding: SPACING.SM,
    width: 70,
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.SUCCESS,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  onlineIndicatorSmall: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.SUCCESS,
    borderWidth: 1.5,
    borderColor: COLORS.WHITE,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  compactName: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginTop: 4,
    textAlign: 'center',
  },
  favoriteIcon: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
  },
  bio: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  strengthText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  mutualFriends: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 20,
  },
});

export default FriendCard;
