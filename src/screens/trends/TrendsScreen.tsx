// src/screens/trends/TrendsScreen.tsx
// Main Trends Screen - Local trends feed with community insights

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchTrends,
  fetchInsights,
  fetchTrendNotifications,
  loadMoreTrends,
  likeTrend,
  unlikeTrend,
  setFilter,
  selectTrends,
  selectTrendsLoading,
  selectInsights,
  selectUnreadNotificationsCount,
  selectActiveFilter,
  selectHasMore,
  optimisticLike,
  optimisticUnlike,
} from '@/store/slices/localTrendsSlice';
import {Trend, TrendCategory, TREND_CATEGORIES} from '@/types/trends';
import {LocalTrendsStackParamList} from '@/navigation/LocalTrendsNavigator';
import {TrendCard, InsightCard} from '@/components/trends';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';

// ============================================
// Types
// ============================================

type TrendsScreenNavigationProp = NativeStackNavigationProp<
  LocalTrendsStackParamList,
  'TrendsList'
>;

// ============================================
// Component
// ============================================

const TrendsScreen: React.FC = () => {
  const navigation = useNavigation<TrendsScreenNavigationProp>();
  const dispatch = useAppDispatch();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [likedTrends, setLikedTrends] = useState<Set<string>>(new Set());

  // Selectors
  const trends = useAppSelector(selectTrends);
  const loading = useAppSelector(selectTrendsLoading);
  const insights = useAppSelector(selectInsights);
  const unreadCount = useAppSelector(selectUnreadNotificationsCount);
  const activeFilter = useAppSelector(selectActiveFilter);
  const hasMore = useAppSelector(selectHasMore);
  const location = useAppSelector(state => state.location);

  // Default location (SF)
  const userLat = location.latitude || 37.7749;
  const userLng = location.longitude || -122.4194;

  // Initial data load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    dispatch(fetchTrends({
      latitude: userLat,
      longitude: userLng,
      radius: activeFilter.radius,
      limit: 10,
    }));
    dispatch(fetchInsights({latitude: userLat, longitude: userLng}));
    dispatch(fetchTrendNotifications());
  }, [dispatch, userLat, userLng, activeFilter.radius]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchTrends({
        latitude: userLat,
        longitude: userLng,
        radius: activeFilter.radius,
        limit: 10,
      })),
      dispatch(fetchInsights({latitude: userLat, longitude: userLng})),
    ]);
    setRefreshing(false);
  }, [dispatch, userLat, userLng, activeFilter.radius]);

  // Load more
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      dispatch(loadMoreTrends({latitude: userLat, longitude: userLng}));
    }
  }, [dispatch, loading, hasMore, userLat, userLng]);

  // Navigate to detail
  const handleTrendPress = useCallback((trend: Trend) => {
    navigation.navigate('TrendDetail', {trendId: trend.id, trend});
  }, [navigation]);

  // Like/unlike trend
  const handleLike = useCallback((trend: Trend) => {
    const isLiked = likedTrends.has(trend.id);

    if (isLiked) {
      setLikedTrends(prev => {
        const next = new Set(prev);
        next.delete(trend.id);
        return next;
      });
      dispatch(optimisticUnlike(trend.id));
      dispatch(unlikeTrend(trend.id));
    } else {
      setLikedTrends(prev => new Set(prev).add(trend.id));
      dispatch(optimisticLike(trend.id));
      dispatch(likeTrend(trend.id));
    }
  }, [dispatch, likedTrends]);

  // Filter by category
  const handleCategoryFilter = useCallback((category: TrendCategory | null) => {
    dispatch(setFilter({
      categories: category ? [category] : undefined,
    }));
    dispatch(fetchTrends({
      latitude: userLat,
      longitude: userLng,
      radius: activeFilter.radius,
      limit: 10,
    }));
  }, [dispatch, userLat, userLng, activeFilter.radius]);

  // Render insight cards (horizontal scroll)
  const renderInsights = () => (
    <View style={styles.insightsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Community Insights</Text>
        <Text style={styles.sectionSubtitle}>Your area today</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsScroll}>
        {insights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </ScrollView>
    </View>
  );

  // Render category filters
  const renderCategoryFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filtersContainer}
      contentContainerStyle={styles.filtersContent}>
      <TouchableOpacity
        style={[
          styles.filterChip,
          !activeFilter.categories?.length && styles.filterChipActive,
        ]}
        onPress={() => handleCategoryFilter(null)}>
        <Text
          style={[
            styles.filterChipText,
            !activeFilter.categories?.length && styles.filterChipTextActive,
          ]}>
          All
        </Text>
      </TouchableOpacity>

      {TREND_CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat.value}
          style={[
            styles.filterChip,
            activeFilter.categories?.includes(cat.value) && styles.filterChipActive,
          ]}
          onPress={() => handleCategoryFilter(cat.value)}>
          <Icon
            name={cat.icon}
            size={14}
            color={
              activeFilter.categories?.includes(cat.value)
                ? COLORS.WHITE
                : COLORS.GRAY_600
            }
          />
          <Text
            style={[
              styles.filterChipText,
              activeFilter.categories?.includes(cat.value) && styles.filterChipTextActive,
            ]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render header
  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={COLORS.GRAY_400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search local trends..."
            placeholderTextColor={COLORS.GRAY_400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color={COLORS.GRAY_400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Insights */}
      {insights.length > 0 && renderInsights()}

      {/* Category Filters */}
      {renderCategoryFilters()}

      {/* Trending Header */}
      <View style={styles.trendingHeader}>
        <View>
          <Text style={styles.trendingTitle}>Trending Near You</Text>
          <Text style={styles.trendingSubtitle}>
            {trends.length} trends within {activeFilter.radius}km
          </Text>
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowFilters(!showFilters)}>
          <Icon name="options-outline" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render trend item
  const renderTrendItem = useCallback(
    ({item}: {item: Trend}) => (
      <TrendCard
        trend={item}
        onPress={() => handleTrendPress(item)}
        onLike={() => handleLike(item)}
        isLiked={likedTrends.has(item.id)}
      />
    ),
    [handleTrendPress, handleLike, likedTrends]
  );

  // Render footer (loading indicator)
  const renderFooter = () => {
    if (!loading || trends.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.emptyText}>Loading local trends...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="trending-up-outline" size={64} color={COLORS.GRAY_300} />
        <Text style={styles.emptyTitle}>No Trends Found</Text>
        <Text style={styles.emptyText}>
          There are no trending topics in your area right now.
          Check back later!
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Local Trends</Text>
          <View style={styles.locationRow}>
            <Icon name="location" size={14} color={COLORS.PRIMARY} />
            <Text style={styles.locationText}>San Francisco Bay Area</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => navigation.navigate('TrendNotifications')}>
          <Icon name="notifications-outline" size={24} color={COLORS.TEXT_PRIMARY} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Trends List */}
      <FlatList
        data={trends}
        renderItem={renderTrendItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_50,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  headerTitle: {
    ...TYPOGRAPHY.H1,
    color: COLORS.TEXT_PRIMARY,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },
  notificationBtn: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 10,
    fontWeight: '700',
  },

  // Search
  searchContainer: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    padding: 0,
  },

  // Insights Section
  insightsSection: {
    backgroundColor: COLORS.WHITE,
    paddingBottom: SPACING.MD,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.SM,
    paddingBottom: SPACING.SM,
  },
  sectionTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    marginTop: 2,
  },
  insightsScroll: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.XS,
  },

  // Filters
  filtersContainer: {
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  filtersContent: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_100,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.GRAY_600,
  },
  filterChipTextActive: {
    color: COLORS.WHITE,
  },

  // Trending Header
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
  },
  trendingTitle: {
    ...TYPOGRAPHY.H3,
    color: COLORS.TEXT_PRIMARY,
  },
  trendingSubtitle: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    marginTop: 2,
  },
  sortButton: {
    padding: 8,
    backgroundColor: COLORS.PRIMARY + '10',
    borderRadius: 8,
  },

  // List
  listContent: {
    paddingBottom: SPACING.XL,
    flexGrow: 1,
  },
  footer: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingTop: 100,
  },
  emptyTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.GRAY_900,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    textAlign: 'center',
  },
});

export default TrendsScreen;
