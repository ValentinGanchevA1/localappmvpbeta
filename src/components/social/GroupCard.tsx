// src/components/social/GroupCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {Group, GroupType} from '@/types/socialGraph';

interface GroupCardProps {
  group: Group;
  onPress?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  style?: StyleProp<ViewStyle>;
  showJoinButton?: boolean;
  isMember?: boolean;
  compact?: boolean;
}

const groupTypeLabels: Record<GroupType, string> = {
  public: 'Public',
  private: 'Private',
  secret: 'Secret',
};

const groupTypeColors: Record<GroupType, string> = {
  public: COLORS.SUCCESS,
  private: COLORS.PRIMARY,
  secret: '#9B59B6',
};

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onPress,
  onJoin,
  onLeave,
  style,
  showJoinButton = false,
  isMember = false,
  compact = false,
}) => {
  const {
    name,
    description,
    avatar,
    type,
    memberCount,
    category,
    isLocationBased,
    locationName,
    tags,
  } = group;

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={onPress}
        activeOpacity={0.7}>
        {avatar ? (
          <Image source={{uri: avatar}} style={styles.compactAvatar} />
        ) : (
          <View style={[styles.compactAvatar, styles.placeholderAvatar]}>
            <Text style={styles.placeholderText}>{name.charAt(0)}</Text>
          </View>
        )}
        <Text style={styles.compactName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.compactMembers}>{memberCount} members</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        {avatar ? (
          <Image source={{uri: avatar}} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.placeholderTextLarge}>{name.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.headerContent}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <View
              style={[
                styles.typeBadge,
                {backgroundColor: groupTypeColors[type] + '20'},
              ]}>
              <Text style={[styles.typeText, {color: groupTypeColors[type]}]}>
                {groupTypeLabels[type]}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.memberCount}>
              {memberCount.toLocaleString()} member{memberCount !== 1 ? 's' : ''}
            </Text>
            {category && (
              <>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.category}>{category}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {description && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}

      {isLocationBased && locationName && (
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{locationName}</Text>
        </View>
      )}

      {tags && tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {tags.length > 3 && (
            <Text style={styles.moreTags}>+{tags.length - 3}</Text>
          )}
        </View>
      )}

      {showJoinButton && (
        <View style={styles.footer}>
          {isMember ? (
            <TouchableOpacity
              style={[styles.button, styles.leaveButton]}
              onPress={onLeave}>
              <Text style={styles.leaveText}>Leave</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.joinButton]}
              onPress={onJoin}>
              <Text style={styles.joinText}>
                {type === 'public' ? 'Join' : 'Request to Join'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
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
    width: 120,
    padding: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: SPACING.SM,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  compactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#eee',
    marginBottom: SPACING.SM,
  },
  placeholderAvatar: {
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
    color: COLORS.PRIMARY,
  },
  placeholderTextLarge: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
    color: COLORS.PRIMARY,
  },
  headerContent: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  name: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
    marginRight: SPACING.SM,
  },
  compactName: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  compactMembers: {
    fontSize: 11,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  memberCount: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  dot: {
    marginHorizontal: 6,
    color: COLORS.TEXT_MUTED,
  },
  category: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  description: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  locationText: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.SM,
  },
  tag: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  moreTags: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    alignSelf: 'center',
  },
  footer: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  joinText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  leaveButton: {
    backgroundColor: COLORS.BACKGROUND,
  },
  leaveText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
});

export default GroupCard;
