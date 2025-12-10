// src/screens/dating/SwipeScreen.tsx
import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchNearbyDatingProfiles,
  generateRecommendations,
  recordSwipe,
  removeTopRecommendation,
} from '@/store/slices/datingSlice';
import { useLocation } from '@/hooks/useLocation';
import { SwipeCard } from '@/components/dating/SwipeCard';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';
import { DatingProfile } from '@/types/dating';

export const SwipeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { latitude, longitude } = useLocation();
  const { user } = useAppSelector(state => state.auth);
  const { recommendations, loading, matches, profiles } = useAppSelector(
    state => state.dating
  );

  // Fetch profiles when location is available
  useEffect(() => {
    if (latitude && longitude) {
      dispatch(
        fetchNearbyDatingProfiles({
          latitude,
          longitude,
          radius: 50, // 50km radius
        })
      );
    }
  }, [latitude, longitude, dispatch]);

  // Generate recommendations when profiles are fetched
  useEffect(() => {
    if (profiles.length > 0 && user) {
      dispatch(generateRecommendations());
    }
  }, [profiles, user, dispatch]);

  const handleSwipe = (action: 'like' | 'pass' | 'super_like') => {
    const currentProfile = recommendations[0];
    if (!currentProfile) return;

    dispatch(recordSwipe({ targetUserId: currentProfile.id, action }));
    dispatch(removeTopRecommendation());
  };

  const currentProfile = useMemo(() => recommendations[0] as DatingProfile | undefined, [recommendations]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Finding profiles...</Text>
      </View>
    );
  }

  if (!currentProfile) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="heart-dislike-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No Profiles Left</Text>
        <Text style={styles.emptySubtext}>Check back later or adjust your filters.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <TouchableOpacity>
          <Icon name="options-outline" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.swipeStack}>
        {recommendations.slice(0, 2).reverse().map((profile, index) => (
          <SwipeCard
            key={profile.id}
            profile={profile}
            onSwipe={handleSwipe}
            index={index}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSwipe('pass')}>
          <Icon name="close" size={32} color="#FF6B6B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSwipe('super_like')}>
          <Icon name="star" size={28} color="#20B2AA" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSwipe('like')}>
          <Icon name="heart" size={32} color="#51CF66" />
        </TouchableOpacity>
      </View>

      {matches.length > 0 && (
        <View style={styles.matchesBadge}>
          <Text style={styles.matchesText}>
            {matches.length} New Match{matches.length > 1 ? 'es' : ''}! 🎉
          </Text>
        </View>
      )}
    </View>
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
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.MD,
  },
  title: {
    ...TYPOGRAPHY.H1,
  },
  swipeStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: SPACING.LG,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: SPACING.LG,
  },
  emptyText: {
    ...TYPOGRAPHY.H2,
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
  emptySubtext: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.TEXT_MUTED,
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
  matchesBadge: {
    position: 'absolute',
    top: SPACING.LG,
    left: SPACING.LG,
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    elevation: 5,
  },
  matchesText: {
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
});
