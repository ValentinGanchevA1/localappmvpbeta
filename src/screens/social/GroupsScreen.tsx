// src/screens/social/GroupsScreen.tsx
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
  fetchGroups,
  fetchGroupInvites,
  leaveGroup,
  selectGroups,
  selectGroupsLoading,
  selectGroupInvitesCount,
} from '@/store/slices/socialGraphSlice';
import {GroupCard} from '@/components/social';
import {Group} from '@/types/socialGraph';

type FilterType = 'all' | 'my_groups' | 'location_based';

const GroupsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const groups = useAppSelector(selectGroups);
  const loading = useAppSelector(selectGroupsLoading);
  const invitesCount = useAppSelector(selectGroupInvitesCount);

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchGroups());
    dispatch(fetchGroupInvites());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dispatch(fetchGroups()), dispatch(fetchGroupInvites())]);
    setRefreshing(false);
  }, [dispatch]);

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (filter) {
      case 'location_based':
        return group.isLocationBased;
      default:
        return true;
    }
  });

  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupDetail', {groupId: group.id});
  };

  const handleLeaveGroup = async (group: Group) => {
    await dispatch(leaveGroup(group.id));
  };

  const renderGroupItem = ({item}: {item: Group}) => (
    <GroupCard
      group={item}
      onPress={() => handleGroupPress(item)}
      onLeave={() => handleLeaveGroup(item)}
      isMember={true}
      showJoinButton={false}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={COLORS.TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'location_based'] as FilterType[]).map(filterType => (
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
              {filterType === 'all' ? 'All Groups' : 'Nearby'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {invitesCount > 0 && (
        <TouchableOpacity
          style={styles.invitesBanner}
          onPress={() => navigation.navigate('GroupInvites')}>
          <Text style={styles.invitesBannerText}>
            {invitesCount} group invite{invitesCount > 1 ? 's' : ''}
          </Text>
          <Text style={styles.invitesChevron}>›</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.discoverCard}
        onPress={() => navigation.navigate('DiscoverGroups')}>
        <View style={styles.discoverIcon}>
          <Text style={styles.discoverIconText}>🔍</Text>
        </View>
        <View style={styles.discoverContent}>
          <Text style={styles.discoverTitle}>Discover Groups</Text>
          <Text style={styles.discoverSubtitle}>
            Find groups based on your interests and location
          </Text>
        </View>
        <Text style={styles.discoverChevron}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏠</Text>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No groups found' : 'No groups yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try a different search term'
          : 'Join or create a group to get started'}
      </Text>
      {!searchQuery && (
        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={styles.discoverButton}
            onPress={() => navigation.navigate('DiscoverGroups')}>
            <Text style={styles.discoverButtonText}>Discover Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateGroup')}>
            <Text style={styles.createButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading && !refreshing && groups.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupItem}
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
        onPress={() => navigation.navigate('CreateGroup')}>
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
  invitesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.SM,
  },
  invitesBannerText: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: '#2E7D32',
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
  },
  invitesChevron: {
    fontSize: 20,
    color: '#2E7D32',
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: 12,
    marginTop: SPACING.SM,
  },
  discoverIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverIconText: {
    fontSize: 22,
  },
  discoverContent: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  discoverTitle: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  discoverSubtitle: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  discoverChevron: {
    fontSize: 24,
    color: COLORS.TEXT_MUTED,
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
  emptyActions: {
    flexDirection: 'row',
  },
  discoverButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    marginRight: SPACING.SM,
  },
  discoverButtonText: {
    color: COLORS.WHITE,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  createButton: {
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  createButtonText: {
    color: COLORS.PRIMARY,
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

export default GroupsScreen;
