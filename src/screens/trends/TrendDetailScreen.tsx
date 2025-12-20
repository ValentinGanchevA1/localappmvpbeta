// src/screens/trends/TrendDetailScreen.tsx
// Trend Detail Screen - Full trend view with discussions and engagement

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ActivityIndicator,
  Share,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchTrendDetail,
  likeTrend,
  unlikeTrend,
  addComment,
  selectSelectedTrend,
  selectSelectedTrendLoading,
  optimisticLike,
  optimisticUnlike,
  clearSelectedTrend,
} from '@/store/slices/localTrendsSlice';
import {TrendDiscussion, TrendActivity} from '@/types/trends';
import {LocalTrendsStackParamList} from '@/navigation/LocalTrendsNavigator';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';

// ============================================
// Types
// ============================================

type TrendDetailRouteProp = RouteProp<LocalTrendsStackParamList, 'TrendDetail'>;

// ============================================
// Helper Functions
// ============================================

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
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

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
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

// ============================================
// Discussion Item Component
// ============================================

interface DiscussionItemProps {
  discussion: TrendDiscussion;
  onLike: () => void;
}

const DiscussionItem: React.FC<DiscussionItemProps> = ({discussion, onLike}) => (
  <View style={styles.discussionItem}>
    <Image
      source={{uri: discussion.userAvatar || `https://ui-avatars.com/api/?name=${discussion.userName}&background=random`}}
      style={styles.discussionAvatar}
    />
    <View style={styles.discussionContent}>
      <View style={styles.discussionHeader}>
        <Text style={styles.discussionUserName}>{discussion.userName}</Text>
        <Text style={styles.discussionTime}>{formatTimeAgo(discussion.timestamp)}</Text>
      </View>
      <Text style={styles.discussionText}>{discussion.content}</Text>
      <View style={styles.discussionActions}>
        <TouchableOpacity style={styles.discussionAction} onPress={onLike}>
          <Icon
            name={discussion.isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={discussion.isLiked ? '#FF3B30' : COLORS.GRAY_500}
          />
          <Text style={styles.discussionActionText}>{discussion.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.discussionAction}>
          <Icon name="chatbubble-outline" size={16} color={COLORS.GRAY_500} />
          <Text style={styles.discussionActionText}>{discussion.repliesCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// ============================================
// Main Component
// ============================================

const TrendDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<TrendDetailRouteProp>();
  const dispatch = useAppDispatch();
  const {trendId} = route.params;

  // State
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Selectors
  const trend = useAppSelector(selectSelectedTrend);
  const loading = useAppSelector(selectSelectedTrendLoading);

  // Load trend details
  useEffect(() => {
    dispatch(fetchTrendDetail(trendId));

    return () => {
      dispatch(clearSelectedTrend());
    };
  }, [dispatch, trendId]);

  // Update liked state when trend loads
  useEffect(() => {
    if (trend) {
      setIsLiked(trend.userEngagement?.hasLiked || false);
    }
  }, [trend]);

  // Handle like
  const handleLike = useCallback(() => {
    if (isLiked) {
      setIsLiked(false);
      dispatch(optimisticUnlike(trendId));
      dispatch(unlikeTrend(trendId));
    } else {
      setIsLiked(true);
      dispatch(optimisticLike(trendId));
      dispatch(likeTrend(trendId));
    }
  }, [dispatch, trendId, isLiked]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (!trend) return;

    try {
      await Share.share({
        title: trend.title,
        message: `${trend.title}\n\n${trend.description}\n\nCheck out this local trend!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [trend]);

  // Handle add comment
  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;

    dispatch(addComment({trendId, content: commentText.trim()}));
    setCommentText('');
  }, [dispatch, trendId, commentText]);

  if (loading || !trend) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="close" size={28} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = getCategoryColor(trend.category);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="close" size={28} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
            <Icon name="share-outline" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Icon name="ellipsis-horizontal" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {trend.imageUrl && (
          <Image source={{uri: trend.imageUrl}} style={styles.image} />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Category & Trending Badge */}
          <View style={styles.badges}>
            <View style={[styles.categoryBadge, {backgroundColor: categoryColor + '20'}]}>
              <Text style={[styles.categoryText, {color: categoryColor}]}>
                {trend.category.charAt(0).toUpperCase() + trend.category.slice(1)}
              </Text>
            </View>
            {trend.isTrending && (
              <View style={styles.trendingBadge}>
                <Icon name="flame" size={14} color="#FF9500" />
                <Text style={styles.trendingText}>#{trend.trendingRank} Trending</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{trend.title}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="location-outline" size={16} color={COLORS.GRAY_500} />
              <Text style={styles.metaText}>
                {trend.location.neighborhood || trend.location.city}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="time-outline" size={16} color={COLORS.GRAY_500} />
              <Text style={styles.metaText}>{formatTimeAgo(trend.createdAt)}</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{trend.fullDescription || trend.description}</Text>

          {/* Hashtags */}
          <View style={styles.hashtagsContainer}>
            {trend.hashtags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.hashtagChip}>
                <Text style={styles.hashtagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(trend.viewsCount)}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(trend.likesCount)}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(trend.commentsCount)}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(trend.sharesCount)}</Text>
              <Text style={styles.statLabel}>Shares</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={handleLike}>
              <Icon
                name={isLiked ? 'heart' : 'heart-outline'}
                size={22}
                color={isLiked ? '#FF3B30' : COLORS.TEXT_PRIMARY}
              />
              <Text style={[styles.actionButtonText, isLiked && styles.actionButtonTextActive]}>
                Like
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="chatbubble-outline" size={22} color={COLORS.TEXT_PRIMARY} />
              <Text style={styles.actionButtonText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Icon name="share-outline" size={22} color={COLORS.TEXT_PRIMARY} />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Top Contributors */}
          {trend.topContributors && trend.topContributors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Contributors</Text>
              <View style={styles.contributorsRow}>
                {trend.topContributors.slice(0, 5).map((contributor, index) => (
                  <View key={contributor.userId} style={styles.contributorItem}>
                    <Image
                      source={{uri: contributor.avatar || `https://ui-avatars.com/api/?name=${contributor.name}&background=random`}}
                      style={styles.contributorAvatar}
                    />
                    <Text style={styles.contributorName} numberOfLines={1}>
                      {contributor.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Discussions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Discussions ({trend.discussionCount || 0})
            </Text>
            {trend.discussions?.map(discussion => (
              <DiscussionItem
                key={discussion.id}
                discussion={discussion}
                onLike={() => {}}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={COLORS.GRAY_400}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !commentText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim()}>
          <Icon
            name="send"
            size={20}
            color={commentText.trim() ? COLORS.WHITE : COLORS.GRAY_400}
          />
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  backBtn: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    padding: 8,
  },

  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.GRAY_200,
  },
  content: {
    padding: SPACING.MD,
  },

  // Badges
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.SM,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },

  // Title & Meta
  title: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: SPACING.MD,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.GRAY_500,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
  },

  // Hashtags
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.LG,
  },
  hashtagChip: {
    backgroundColor: COLORS.PRIMARY + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hashtagText: {
    fontSize: 13,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.GRAY_100,
    marginBottom: SPACING.MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    marginTop: 2,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
    marginBottom: SPACING.LG,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionButtonActive: {
    backgroundColor: '#FFE5E5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.TEXT_PRIMARY,
  },
  actionButtonTextActive: {
    color: '#FF3B30',
  },

  // Sections
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },

  // Contributors
  contributorsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  contributorItem: {
    alignItems: 'center',
    width: 60,
  },
  contributorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.GRAY_200,
    marginBottom: 4,
  },
  contributorName: {
    fontSize: 11,
    color: COLORS.GRAY_600,
    textAlign: 'center',
  },

  // Discussions
  discussionItem: {
    flexDirection: 'row',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  discussionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_200,
    marginRight: SPACING.SM,
  },
  discussionContent: {
    flex: 1,
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  discussionUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  discussionTime: {
    fontSize: 12,
    color: COLORS.GRAY_400,
  },
  discussionText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
  },
  discussionActions: {
    flexDirection: 'row',
    gap: 16,
  },
  discussionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discussionActionText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },

  // Comment Input
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    backgroundColor: COLORS.WHITE,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 20,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.SM,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.GRAY_200,
  },
});

export default TrendDetailScreen;
