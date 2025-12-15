// src/screens/dating/SwipeScreen.tsx
import React, {useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchNearbyDatingProfiles,
  fetchMyDatingProfile,
  generateRecommendations,
  recordSwipe,
  removeTopRecommendation,
  setViewingProfile,
} from '@/store/slices/datingSlice';
import {useLocation} from '@/hooks/useLocation';
import {SwipeCard} from '@/components/dating/SwipeCard';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {DatingProfile} from '@/types/dating';

export const SwipeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const {latitude, longitude} = useLocation();
  const {user} = useAppSelector(state => state.auth);
  const {
    recommendations,
    profilesLoading,
    matches,
    profiles,
    newMatchesCount,
    stats,
  } = useAppSelector(state => state.dating);

  // Fetch my profile and nearby profiles when location is available
  useEffect(() => {
    dispatch(fetchMyDatingProfile());
  }, [dispatch]);

  useEffect(() => {
    if (latitude && longitude) {
      dispatch(
        fetchNearbyDatingProfiles({
          latitude,
          longitude,
          radius: 50, // 50km radius
        }),
      );
    }
  }, [latitude, longitude, dispatch]);

  // Generate recommendations when profiles are fetched
  useEffect(() => {
    if (profiles.length > 0 && user) {
      dispatch(generateRecommendations());
    }
  }, [profiles, user, dispatch]);

  const handleSwipe = useCallback(
    (action: 'like' | 'pass' | 'super_like') => {
      const currentProfile = recommendations[0];
      if (!currentProfile) return;

      // Check limits
      if (action === 'super_like' && stats.superLikesRemaining === 0) {
        Alert.alert('No Super Likes', 'You have no super likes remaining today.');
        return;
      }

      dispatch(recordSwipe({targetUserId: currentProfile.userId, action}));
      dispatch(removeTopRecommendation());
    },
    [dispatch, recommendations, stats.superLikesRemaining],
  );

  const handleViewProfile = useCallback(
    (profile: DatingProfile) => {
      dispatch(setViewingProfile(profile));
      navigation.navigate('ProfileDetail', {profile});
    },
    [dispatch, navigation],
  );

  const handleNavigateToPreferences = useCallback(() => {
    navigation.navigate('DatingPreferences');
  }, [navigation]);

  const handleNavigateToMatches = useCallback(() => {
    navigation.navigate('Matches');
  }, [navigation]);

  const handleRefresh = useCallback(() => {
    if (latitude && longitude) {
      dispatch(
        fetchNearbyDatingProfiles({
          latitude,
          longitude,
          radius: 50,
        }),
      );
    }
  }, [dispatch, latitude, longitude]);

  const currentProfile = useMemo(
    () => recommendations[0] as DatingProfile | undefined,
    [recommendations],
  );

  if (profilesLoading && recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Finding profiles near you...</Text>
      </SafeAreaView>
    );
  }

  if (!currentProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNavigateToMatches}>
            <Icon name="chatbubbles-outline" size={26} color={COLORS.TEXT_PRIMARY} />
            {newMatchesCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{newMatchesCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.title}>Discover</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNavigateToPreferences}>
            <Icon name="options-outline" size={26} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContainer}>
          <Icon name="heart-dislike-outline" size={80} color={COLORS.GRAY_300} />
          <Text style={styles.emptyText}>No More Profiles</Text>
          <Text style={styles.emptySubtext}>
            You've seen everyone nearby!{'\n'}Try adjusting your preferences or check back later.
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleNavigateToPreferences}>
              <Icon name="options" size={20} color={COLORS.WHITE} />
              <Text style={styles.emptyButtonText}>Adjust Preferences</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.emptyButton, styles.refreshButton]}
              onPress={handleRefresh}>
              <Icon name="refresh" size={20} color={COLORS.PRIMARY} />
              <Text style={[styles.emptyButtonText, styles.refreshButtonText]}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNavigateToMatches}>
          <Icon name="chatbubbles-outline" size={26} color={COLORS.TEXT_PRIMARY} />
          {newMatchesCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{newMatchesCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            {recommendations.length} profile{recommendations.length !== 1 ? 's' : ''} nearby
          </Text>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNavigateToPreferences}>
          <Icon name="options-outline" size={26} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Swipe Stack */}
      <View style={styles.swipeStack}>
        {recommendations
          .slice(0, 3)
          .reverse()
          .map((profile, index) => (
            <SwipeCard
              key={profile.id}
              profile={profile}
              onSwipe={handleSwipe}
              onViewProfile={() => handleViewProfile(profile)}
              index={index}
              isFirst={index === recommendations.slice(0, 3).length - 1}
            />
          ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.smallActionButton]}
          onPress={handleRefresh}>
          <Icon name="refresh" size={24} color={COLORS.GRAY_500} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipe('pass')}>
          <Icon name="close" size={32} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.superLikeButton,
            stats.superLikesRemaining === 0 && styles.disabledButton,
          ]}
          onPress={() => handleSwipe('super_like')}>
          <Icon name="star" size={24} color={COLORS.WHITE} />
          {stats.superLikesRemaining > 0 && (
            <View style={styles.limitBadge}>
              <Text style={styles.limitText}>{stats.superLikesRemaining}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('like')}>
          <Icon name="heart" size={32} color={COLORS.WHITE} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.smallActionButton]}
          onPress={() => handleViewProfile(currentProfile)}>
          <Icon name="information-circle-outline" size={24} color={COLORS.GRAY_500} />
        </TouchableOpacity>
      </View>

      {/* Matches Badge */}
      {matches.length > 0 && (
        <TouchableOpacity
          style={styles.matchesBadge}
          onPress={handleNavigateToMatches}>
          <Text style={styles.matchesText}>
            {matches.length} New Match{matches.length > 1 ? 'es' : ''}!
          </Text>
          <Icon name="chevron-forward" size={16} color={COLORS.WHITE} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.SM,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  subtitle: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.TEXT_MUTED,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '700',
  },
  swipeStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    gap: 12,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  smallActionButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.GRAY_50,
    elevation: 2,
  },
  passButton: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  likeButton: {
    backgroundColor: '#51CF66',
  },
  superLikeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#339AF0',
  },
  disabledButton: {
    opacity: 0.4,
  },
  limitBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD43B',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitText: {
    color: '#333',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingText: {
    ...TYPOGRAPHY.BODY,
    marginTop: SPACING.MD,
    color: COLORS.TEXT_MUTED,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyText: {
    ...TYPOGRAPHY.H2,
    marginTop: SPACING.LG,
    textAlign: 'center',
    color: COLORS.TEXT_PRIMARY,
  },
  emptySubtext: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.TEXT_MUTED,
    marginTop: SPACING.SM,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.XL,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 25,
    gap: 8,
  },
  emptyButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
  refreshButton: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  refreshButtonText: {
    color: COLORS.PRIMARY,
  },
  matchesBadge: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    elevation: 5,
    gap: 4,
  },
  matchesText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    fontSize: 14,
  },
});
