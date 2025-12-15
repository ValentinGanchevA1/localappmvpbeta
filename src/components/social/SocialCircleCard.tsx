// src/components/social/SocialCircleCard.tsx
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
import {SocialCircle} from '@/types/socialGraph';

interface SocialCircleCardProps {
  circle: SocialCircle;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: StyleProp<ViewStyle>;
  showActions?: boolean;
}

export const SocialCircleCard: React.FC<SocialCircleCardProps> = ({
  circle,
  onPress,
  onEdit,
  onDelete,
  style,
  showActions = false,
}) => {
  const {name, description, color, members, visibility, isDefault} = circle;

  const visibilityLabels = {
    private: 'Only you',
    friends_only: 'Friends',
    public: 'Everyone',
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, {backgroundColor: color + '20'}]}>
          <Text style={styles.icon}>{circle.icon}</Text>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>

          <Text style={styles.memberCount}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {showActions && !isDefault && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onEdit}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.actionIcon}>✏️</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onDelete}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.actionIcon}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {description && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.membersPreview}>
          {members.slice(0, 4).map((member, index) => (
            <View
              key={member.id}
              style={[styles.memberAvatar, {marginLeft: index > 0 ? -8 : 0}]}>
              <Avatar
                imageUri={member.avatarUrl}
                name={member.username}
                size="small"
              />
            </View>
          ))}
          {members.length > 4 && (
            <View style={[styles.memberAvatar, styles.moreMembers]}>
              <Text style={styles.moreMembersText}>+{members.length - 4}</Text>
            </View>
          )}
        </View>

        <View style={styles.visibilityBadge}>
          <Text style={styles.visibilityIcon}>
            {visibility === 'private' ? '🔒' : visibility === 'friends_only' ? '👥' : '🌐'}
          </Text>
          <Text style={styles.visibilityText}>
            {visibilityLabels[visibility]}
          </Text>
        </View>
      </View>

      <View style={styles.permissionsRow}>
        {circle.permissions.canViewLocation && (
          <View style={styles.permissionBadge}>
            <Text style={styles.permissionText}>📍 Location</Text>
          </View>
        )}
        {circle.permissions.canViewPosts && (
          <View style={styles.permissionBadge}>
            <Text style={styles.permissionText}>📝 Posts</Text>
          </View>
        )}
        {circle.permissions.canSendMessages && (
          <View style={styles.permissionBadge}>
            <Text style={styles.permissionText}>💬 Messages</Text>
          </View>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  headerContent: {
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
    marginRight: SPACING.SM,
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  defaultText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  memberCount: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  actionIcon: {
    fontSize: 16,
  },
  description: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.MD,
    paddingTop: SPACING.SM,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  membersPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    borderWidth: 2,
    borderColor: COLORS.WHITE,
    borderRadius: 14,
  },
  moreMembers: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  moreMembersText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visibilityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  visibilityText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  permissionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.SM,
  },
  permissionBadge: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 4,
  },
  permissionText: {
    fontSize: 11,
    color: COLORS.PRIMARY,
  },
});

export default SocialCircleCard;
