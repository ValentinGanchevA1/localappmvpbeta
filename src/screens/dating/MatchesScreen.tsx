// src/screens/dating/MatchesScreen.tsx
// Matches Screen - View and manage dating matches

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchMatches,
  fetchLikes,
  fetchLikesCount,
  unmatchUser,
  archiveMatch,
  selectMatches,
  selectActiveMatches,
  selectArchivedMatches,
  selectLikes,
  selectLikesCount,
} from '@/store/slices/datingSlice';
import {Match, Like, DatingProfile} from '@/types/dating';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';

// ============================================
// Types
// ============================================

type TabType = 'matches' | 'likes';

interface MatchCardProps {
  match: Match;
  currentUserId: string;
  onPress: () => void;
  onUnmatch: () => void;
}

interface LikeCardProps {
  like: Like;
  onLike: () => void;
  onPass: () => void;
}

// ============================================
// Match Card Component
// ============================================

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  currentUserId,
  onPress,
  onUnmatch,
}) => {
  // Get the other user's profile
  const otherProfile =
    match.user1Id === currentUserId ? match.user2Profile : match.user1Profile;

  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getPhotoUrl = (profile: DatingProfile) => {
    if (profile.photos && profile.photos.length > 0) {
      const photo = profile.photos[0];
      return typeof photo === 'string' ? photo : photo.url;
    }
    return 'https://via.placeholder.com/100';
  };

  return (
    <TouchableOpacity style={styles.matchCard} onPress={onPress}>
      <Image
        source={{uri: getPhotoUrl(otherProfile)}}
        style={styles.matchAvatar}
      />

      {/* Online indicator */}
      {otherProfile.isActive && <View style={styles.onlineIndicator} />}

      {/* New match badge */}
      {match.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{match.unreadCount}</Text>
        </View>
      )}

      <View style={styles.matchInfo}>
        <View style={styles.matchHeader}>
          <Text style={styles.matchName} numberOfLines={1}>
            {otherProfile.name}, {otherProfile.age}
          </Text>
          {match.matchedVia === 'super_like' && (
            <Text style={styles.superLikeIcon}>*</Text>
          )}
        </View>

        {match.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {match.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.newMatchText}>New match! Say hello</Text>
        )}

        <Text style={styles.matchTime}>
          {formatLastActive(match.lastMessageAt || match.matchedAt)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => {
          Alert.alert(
            'Match Options',
            `Options for ${otherProfile.name}`,
            [
              {text: 'View Profile', onPress: onPress},
              {
                text: 'Unmatch',
                style: 'destructive',
                onPress: () => {
                  Alert.alert(
                    'Unmatch',
                    `Are you sure you want to unmatch with ${otherProfile.name}?`,
                    [
                      {text: 'Cancel', style: 'cancel'},
                      {text: 'Unmatch', style: 'destructive', onPress: onUnmatch},
                    ]
                  );
                },
              },
              {text: 'Cancel', style: 'cancel'},
            ]
          );
        }}>
        <Text style={styles.menuIcon}>...</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ============================================
// Like Card Component
// ============================================

const LikeCard: React.FC<LikeCardProps> = ({like, onLike, onPass}) => {
  const profile = like.fromProfile;

  const getPhotoUrl = (p: DatingProfile) => {
    if (p.photos && p.photos.length > 0) {
      const photo = p.photos[0];
      return typeof photo === 'string' ? photo : photo.url;
    }
    return 'https://via.placeholder.com/100';
  };

  return (
    <View style={styles.likeCard}>
      <Image source={{uri: getPhotoUrl(profile)}} style={styles.likePhoto} />

      {like.isSuperLike && (
        <View style={styles.superLikeBadge}>
          <Text style={styles.superLikeBadgeText}>*</Text>
        </View>
      )}

      <View style={styles.likeOverlay}>
        <Text style={styles.likeName}>
          {profile.name}, {profile.age}
        </Text>

        <View style={styles.likeActions}>
          <TouchableOpacity style={styles.passBtn} onPress={onPass}>
            <Text style={styles.passBtnText}>X</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeBtn} onPress={onLike}>
            <Text style={styles.likeBtnText}>heart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============================================
// Main Screen Component
// ============================================

export const MatchesScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [refreshing, setRefreshing] = useState(false);

  // Selectors
  const matches = useAppSelector(selectActiveMatches);
  const archivedMatches = useAppSelector(selectArchivedMatches);
  const likes = useAppSelector(selectLikes);
  const likesCount = useAppSelector(selectLikesCount);
  const {matchesLoading, likesLoading} = useAppSelector(state => state.dating);
  const currentUserId = useAppSelector(state => state.auth.user?.id || '');

  // Initial load
  useEffect(() => {
    dispatch(fetchMatches());
    dispatch(fetchLikes());
    dispatch(fetchLikesCount());
  }, [dispatch]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchMatches()),
      dispatch(fetchLikes()),
      dispatch(fetchLikesCount()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  // Handle unmatch
  const handleUnmatch = useCallback(
    (matchId: string) => {
      dispatch(unmatchUser({matchId}));
    },
    [dispatch]
  );

  // Handle like back
  const handleLikeBack = useCallback(
    (userId: string) => {
      // This would trigger a swipe action that creates a match
      Alert.alert('Liked!', 'Match created!');
      dispatch(fetchMatches());
    },
    [dispatch]
  );

  // Handle pass on like
  const handlePassLike = useCallback((userId: string) => {
    Alert.alert('Passed', 'They wont know you passed');
    // Remove from likes locally
  }, []);

  // Navigate to chat
  const navigateToChat = useCallback(
    (match: Match) => {
      const otherProfile =
        match.user1Id === currentUserId ? match.user2Profile : match.user1Profile;

      // @ts-ignore - navigation typing
      navigation.navigate('Chat', {
        matchId: match.id,
        userId: otherProfile.userId,
        username: otherProfile.name,
      });
    },
    [navigation, currentUserId]
  );

  // Render match item
  const renderMatchItem = useCallback(
    ({item}: {item: Match}) => (
      <MatchCard
        match={item}
        currentUserId={currentUserId}
        onPress={() => navigateToChat(item)}
        onUnmatch={() => handleUnmatch(item.id)}
      />
    ),
    [currentUserId, navigateToChat, handleUnmatch]
  );

  // Render like item
  const renderLikeItem = useCallback(
    ({item}: {item: Like}) => (
      <LikeCard
        like={item}
        onLike={() => handleLikeBack(item.fromUserId)}
        onPass={() => handlePassLike(item.fromUserId)}
      />
    ),
    [handleLikeBack, handlePassLike]
  );

  // Empty states
  const renderEmptyMatches = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>heart</Text>
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySubtitle}>
        Keep swiping to find your match!
      </Text>
      <TouchableOpacity
        style={styles.swipeButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.swipeButtonText}>Start Swiping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyLikes = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>*</Text>
      <Text style={styles.emptyTitle}>No likes yet</Text>
      <Text style={styles.emptySubtitle}>
        When someone likes you, they will appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'matches' && styles.activeTabText,
            ]}>
            Matches ({matches.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
          onPress={() => setActiveTab('likes')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'likes' && styles.activeTabText,
            ]}>
            Likes ({likesCount})
          </Text>
          {likesCount > 0 && <View style={styles.likesIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'matches' ? (
        <FlatList
          data={matches}
          renderItem={renderMatchItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            matchesLoading ? (
              <ActivityIndicator size="large" color={COLORS.PRIMARY} style={styles.loader} />
            ) : (
              renderEmptyMatches()
            )
          }
        />
      ) : (
        <FlatList
          data={likes}
          renderItem={renderLikeItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.likesRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            likesLoading ? (
              <ActivityIndicator size="large" color={COLORS.PRIMARY} style={styles.loader} />
            ) : (
              renderEmptyLikes()
            )
          }
        />
      )}
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
  header: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  headerTitle: {
    ...TYPOGRAPHY.H1,
    color: COLORS.GRAY_900,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.GRAY_500,
  },
  activeTabText: {
    color: COLORS.PRIMARY,
  },
  likesIndicator: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },

  // List
  listContent: {
    paddingVertical: SPACING.MD,
    flexGrow: 1,
  },
  loader: {
    marginTop: 50,
  },

  // Match Card
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  matchAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.GRAY_200,
  },
  onlineIndicator: {
    position: 'absolute',
    left: 52,
    top: 12,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#51CF66',
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  unreadBadge: {
    position: 'absolute',
    left: 48,
    bottom: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '700',
  },
  matchInfo: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.GRAY_900,
  },
  superLikeIcon: {
    fontSize: 14,
    color: '#339AF0',
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginTop: 2,
  },
  newMatchText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginTop: 2,
  },
  matchTime: {
    fontSize: 12,
    color: COLORS.GRAY_400,
    marginTop: 4,
  },
  menuButton: {
    padding: SPACING.SM,
  },
  menuIcon: {
    fontSize: 20,
    color: COLORS.GRAY_400,
  },

  // Like Card
  likesRow: {
    paddingHorizontal: SPACING.MD,
    gap: SPACING.SM,
  },
  likeCard: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.GRAY_200,
    marginBottom: SPACING.SM,
    maxWidth: '48%',
  },
  likePhoto: {
    width: '100%',
    height: '100%',
  },
  superLikeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#339AF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  superLikeBadgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
  },
  likeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.SM,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  likeName: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  likeActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  passBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passBtnText: {
    color: '#FF6B6B',
    fontSize: 18,
  },
  likeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#51CF66',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeBtnText: {
    color: COLORS.WHITE,
    fontSize: 16,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.MD,
  },
  emptyTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.GRAY_900,
    marginBottom: SPACING.SM,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  swipeButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 25,
  },
  swipeButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchesScreen;
