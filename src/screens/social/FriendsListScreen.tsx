// src/screens/social/FriendsListScreen.tsx
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchFriends,
  selectFriends,
  selectFriendsLoading,
  selectFriendsError,
  selectPendingRequestsCount,
  removeFriend,
  updateFriend,
} from '@/store/slices/socialGraphSlice';
import {FriendCard} from '@/components/social';
import {FriendRelationship} from '@/types/socialGraph';

type FilterType = 'all' | 'online' | 'favorites';

const FriendsListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const friends = useAppSelector(selectFriends);
  const loading = useAppSelector(selectFriendsLoading);
  const error = useAppSelector(selectFriendsError);
  const pendingRequestsCount = useAppSelector(selectPendingRequestsCount);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchFriends());
    setRefreshing(false);
  }, [dispatch]);

  const filteredFriends = friends.filter(friend => {
    const matchesSearch =
      friend.friendProfile.username
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      friend.nickname?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'online':
        return friend.friendProfile.isOnline;
      case 'favorites':
        return friend.isFavorite;
      default:
        return true;
    }
  });

  const handleFriendPress = (friend: FriendRelationship) => {
    navigation.navigate('UserProfile', {userId: friend.friendId});
  };

  const handleMessage = (friend: FriendRelationship) => {
    navigation.navigate('Chat', {
      userId: friend.friendId,
      username: friend.nickname || friend.friendProfile.username,
    });
  };

  const handleToggleFavorite = async (friend: FriendRelationship) => {
    await dispatch(
      updateFriend({
        friendId: friend.friendId,
        updates: {isFavorite: !friend.isFavorite},
      }),
    );
  };

  const handleRemoveFriend = async (friend: FriendRelationship) => {
    await dispatch(removeFriend(friend.friendId));
  };

  const renderFriendItem = ({item}: {item: FriendRelationship}) => (
    <FriendCard
      friend={item}
      onPress={() => handleFriendPress(item)}
      onMessage={() => handleMessage(item)}
      onOptions={() => {
        // Show action sheet with options
      }}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor={COLORS.TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'online', 'favorites'] as FilterType[]).map(filterType => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              filter === filterType && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterType)}>
            <Text
              style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive,
              ]}>
              {filterType === 'all'
                ? 'All'
                : filterType === 'online'
                  ? 'Online'
                  : 'Favorites'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {pendingRequestsCount > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => navigation.navigate('FriendRequests')}>
          <Text style={styles.requestsBannerText}>
            {pendingRequestsCount} pending friend request
            {pendingRequestsCount > 1 ? 's' : ''}
          </Text>
          <Text style={styles.requestsChevron}>›</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No friends found' : 'No friends yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try a different search term'
          : 'Discover new friends to connect with'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={() => navigation.navigate('FriendDiscovery')}>
          <Text style={styles.discoverButtonText}>Discover Friends</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing && friends.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('FriendDiscovery')}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  listContent: {
    padding: SPACING.MD,
    paddingBottom: 100,
  },
  header: {
    marginBottom: SPACING.MD,
  },
  searchContainer: {
    marginBottom: SPACING.SM,
  },
  searchInput: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 12,
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  filterButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    marginRight: SPACING.SM,
  },
  filterButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterText: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  filterTextActive: {
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3CD',
    padding: SPACING.MD,
    borderRadius: 12,
    marginTop: SPACING.SM,
  },
  requestsBannerText: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: '#856404',
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  requestsChevron: {
    fontSize: 20,
    color: '#856404',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.LG * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZES.LG,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  discoverButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
  },
  discoverButtonText: {
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.LG,
    right: SPACING.LG,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.WHITE,
    lineHeight: 32,
  },
});

export default FriendsListScreen;
