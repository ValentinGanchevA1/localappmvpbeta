// src/screens/social/FriendDiscoveryScreen.tsx
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  fetchSuggestions,
  dismissSuggestion,
  sendFriendRequest,
  selectSuggestions,
  selectSuggestionsLoading,
  selectDiscoveryPreferences,
} from '@/store/slices/socialGraphSlice';
import {SuggestionCard} from '@/components/social';
import {discoveryApi} from '@/api/socialGraphApi';
import {DiscoverySuggestion, UserConnection} from '@/types/socialGraph';

const FriendDiscoveryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const suggestions = useAppSelector(selectSuggestions);
  const loading = useAppSelector(selectSuggestionsLoading);
  const preferences = useAppSelector(selectDiscoveryPreferences);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserConnection[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    dispatch(fetchSuggestions());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchSuggestions());
    setRefreshing(false);
  }, [dispatch]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await discoveryApi.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    setSendingRequests(prev => new Set(prev).add(userId));
    try {
      await dispatch(sendFriendRequest({targetUserId: userId}));
    } finally {
      setSendingRequests(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDismiss = async (userId: string) => {
    await dispatch(dismissSuggestion(userId));
  };

  const handleViewProfile = (userId: string) => {
    navigation.navigate('UserProfile', {userId});
  };

  const mutualFriendSuggestions = suggestions.filter(
    s => s.source === 'mutual_friends',
  );
  const interestBasedSuggestions = suggestions.filter(
    s => s.source === 'interest_based',
  );
  const nearbySuggestions = suggestions.filter(
    s => s.source === 'location_based',
  );

  const renderSuggestionRow = (
    title: string,
    data: DiscoverySuggestion[],
    icon: string,
  ) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={data.slice(0, 10)}
          renderItem={({item}) => (
            <SuggestionCard
              suggestion={item}
              onAddFriend={() => handleAddFriend(item.userId)}
              onDismiss={() => handleDismiss(item.userId)}
              onViewProfile={() => handleViewProfile(item.userId)}
              loading={sendingRequests.has(item.userId)}
            />
          )}
          keyExtractor={item => item.userId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>
    );
  };

  const renderSearchResult = ({item}: {item: UserConnection}) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleViewProfile(item.userId)}>
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultName}>{item.profile.username}</Text>
        {item.mutualFriendsCount > 0 && (
          <Text style={styles.searchResultMeta}>
            {item.mutualFriendsCount} mutual friends
          </Text>
        )}
        {item.degreeOfSeparation > 0 && item.degreeOfSeparation <= 3 && (
          <Text style={styles.searchResultMeta}>
            {item.degreeOfSeparation === 1
              ? 'Direct connection'
              : `${item.degreeOfSeparation} degrees away`}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddFriend(item.userId)}
        disabled={sendingRequests.has(item.userId)}>
        <Text style={styles.addButtonText}>
          {sendingRequests.has(item.userId) ? '...' : 'Add'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or username..."
          placeholderTextColor={COLORS.TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {searchQuery && searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={item => item.userId}
          contentContainerStyle={styles.searchResults}
          ListHeaderComponent={
            <Text style={styles.searchResultsHeader}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      ) : searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {loading && suggestions.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>Finding friends for you...</Text>
            </View>
          ) : (
            <>
              {renderSuggestionRow(
                'People you may know',
                mutualFriendSuggestions,
                '👥',
              )}
              {renderSuggestionRow(
                'Similar interests',
                interestBasedSuggestions,
                '⭐',
              )}
              {renderSuggestionRow('People nearby', nearbySuggestions, '📍')}

              {suggestions.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No suggestions yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Try searching for friends or check back later
                  </Text>
                </View>
              )}

              <View style={styles.preferencesCard}>
                <Text style={styles.preferencesTitle}>Discovery Settings</Text>
                <Text style={styles.preferencesSubtitle}>
                  Customize how you discover new friends
                </Text>
                <TouchableOpacity
                  style={styles.preferencesButton}
                  onPress={() => navigation.navigate('DiscoveryPreferences')}>
                  <Text style={styles.preferencesButtonText}>
                    Manage Preferences
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 10,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 10,
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginRight: SPACING.SM,
  },
  searchButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingHorizontal: SPACING.MD,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.LG * 2,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  section: {
    marginTop: SPACING.LG,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sectionTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  seeAll: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.PRIMARY,
  },
  horizontalList: {
    paddingHorizontal: SPACING.MD,
    paddingBottom: SPACING.SM,
  },
  searchResults: {
    padding: SPACING.MD,
  },
  searchResultsHeader: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.SM,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  searchResultMeta: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
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
  },
  preferencesCard: {
    margin: SPACING.MD,
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
  },
  preferencesTitle: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  preferencesSubtitle: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    marginBottom: SPACING.MD,
  },
  preferencesButton: {
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.SM,
    borderRadius: 8,
    alignItems: 'center',
  },
  preferencesButtonText: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
});

export default FriendDiscoveryScreen;
