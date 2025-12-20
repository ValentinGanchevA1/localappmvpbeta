// src/components/trends/TrendCard.tsx
// Trend Card Component - Displays trend info with engagement actions

import React, {memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Trend, TrendCategory} from '@/types/trends';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';

// ============================================
// Types
// ============================================

interface TrendCardProps {
  trend: Trend;
  onPress: () => void;
  onLike?: () => void;
  onShare?: () => void;
  isLiked?: boolean;
  compact?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const getCategoryIcon = (category: TrendCategory): string => {
  const icons: Record<TrendCategory, string> = {
    event: 'calendar',
    discussion: 'chatbubbles',
    hashtag: 'pricetag',
    place: 'location',
    alert: 'warning',
    community: 'people',
    promotion: 'megaphone',
  };
  return icons[category] || 'trending-up';
};

const getCategoryColor = (category: TrendCategory): string => {
  const colors: Record<TrendCategory, string> = {
    event: '#FF9500',
    discussion: '#007AFF',
    hashtag: '#5856D6',
    place: '#34C759',
    alert: '#FF3B30',
    community: '#FF2D55',
    promotion: '#AF52DE',
  };
  return colors[category] || COLORS.PRIMARY;
};

const getSentimentColor = (sentiment: string): string => {
  switch (sentiment) {
    case 'positive':
      return '#34C759';
    case 'negative':
      return '#FF3B30';
    case 'mixed':
      return '#FF9500';
    default:
      return COLORS.GRAY_500;
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
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
// Component
// ============================================

const TrendCard: React.FC<TrendCardProps> = memo(({
  trend,
  onPress,
  onLike,
  onShare,
  isLiked = false,
  compact = false,
}) => {
  const categoryColor = getCategoryColor(trend.category);
  const categoryIcon = getCategoryIcon(trend.category);

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress}>
        <View style={[styles.compactCategoryBadge, {backgroundColor: categoryColor + '20'}]}>
          <Icon name={categoryIcon} size={14} color={categoryColor} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>
            {trend.title}
          </Text>
          <View style={styles.compactMeta}>
            <Icon name="trending-up" size={12} color={COLORS.GRAY_500} />
            <Text style={styles.compactMetaText}>
              {formatNumber(trend.engagementScore)} engagement
            </Text>
          </View>
        </View>
        {trend.isTrending && trend.trendingRank && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{trend.trendingRank}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Image */}
      {trend.imageUrl && (
        <Image source={{uri: trend.imageUrl}} style={styles.image} />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.categoryBadge, {backgroundColor: categoryColor + '20'}]}>
            <Icon name={categoryIcon} size={12} color={categoryColor} />
            <Text style={[styles.categoryText, {color: categoryColor}]}>
              {trend.category.charAt(0).toUpperCase() + trend.category.slice(1)}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {trend.isTrending && (
              <View style={styles.trendingBadge}>
                <Icon name="flame" size={12} color="#FF9500" />
                <Text style={styles.trendingText}>Trending</Text>
              </View>
            )}
            {trend.trendingRank && (
              <View style={styles.rankBadgeCard}>
                <Text style={styles.rankTextCard}>#{trend.trendingRank}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title} numberOfLines={2}>
          {trend.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {trend.description}
        </Text>

        {/* Hashtags */}
        {trend.hashtags.length > 0 && (
          <View style={styles.hashtagsContainer}>
            {trend.hashtags.slice(0, 3).map((tag, index) => (
              <Text key={index} style={styles.hashtag}>
                {tag}
              </Text>
            ))}
            {trend.hashtags.length > 3 && (
              <Text style={styles.moreHashtags}>+{trend.hashtags.length - 3}</Text>
            )}
          </View>
        )}

        {/* Location & Time */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="location-outline" size={14} color={COLORS.GRAY_500} />
            <Text style={styles.metaText}>
              {trend.location.neighborhood || trend.location.city}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="time-outline" size={14} color={COLORS.GRAY_500} />
            <Text style={styles.metaText}>{formatTimeAgo(trend.createdAt)}</Text>
          </View>
          <View style={[styles.sentimentDot, {backgroundColor: getSentimentColor(trend.sentiment)}]} />
        </View>

        {/* Engagement Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="eye-outline" size={16} color={COLORS.GRAY_500} />
            <Text style={styles.statText}>{formatNumber(trend.viewsCount)}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="chatbubble-outline" size={16} color={COLORS.GRAY_500} />
            <Text style={styles.statText}>{formatNumber(trend.commentsCount)}</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="share-social-outline" size={16} color={COLORS.GRAY_500} />
            <Text style={styles.statText}>{formatNumber(trend.sharesCount)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {onShare && (
              <TouchableOpacity style={styles.actionBtn} onPress={onShare}>
                <Icon name="share-outline" size={20} color={COLORS.GRAY_600} />
              </TouchableOpacity>
            )}
            {onLike && (
              <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
                <Icon
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isLiked ? '#FF3B30' : COLORS.GRAY_600}
                />
                <Text style={[styles.likeCount, isLiked && styles.likedText]}>
                  {formatNumber(trend.likesCount)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: COLORS.GRAY_200,
  },
  content: {
    padding: SPACING.MD,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  rankBadgeCard: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankTextCard: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.WHITE,
  },

  // Title & Description
  title: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.SM,
  },

  // Hashtags
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.SM,
  },
  hashtag: {
    fontSize: 12,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  moreHashtags: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.SM,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 'auto',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_100,
    paddingTop: SPACING.SM,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    color: COLORS.GRAY_600,
    fontWeight: '500',
  },
  likedText: {
    color: '#FF3B30',
  },

  // Compact Card
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.SM,
    marginHorizontal: SPACING.MD,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compactCategoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactMetaText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },
  rankBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
});

export default TrendCard;
