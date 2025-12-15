// src/screens/social/FriendRequestsScreen.tsx
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchIncomingRequests,
  fetchOutgoingRequests,
  respondToFriendRequest,
  cancelFriendRequest,
  selectIncomingRequests,
  selectOutgoingRequests,
  selectRequestsLoading,
} from '@/store/slices/socialGraphSlice';
import {FriendRequestCard} from '@/components/social';
import {FriendRequest} from '@/types/socialGraph';

type TabType = 'incoming' | 'outgoing';

const FriendRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const incomingRequests = useAppSelector(selectIncomingRequests);
  const outgoingRequests = useAppSelector(selectOutgoingRequests);
  const loading = useAppSelector(selectRequestsLoading);

  const [activeTab, setActiveTab] = useState<TabType>('incoming');
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    dispatch(fetchIncomingRequests());
    dispatch(fetchOutgoingRequests());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchIncomingRequests()),
      dispatch(fetchOutgoingRequests()),
    ]);
    setRefreshing(false);
  }, [dispatch]);

  const handleAccept = async (request: FriendRequest) => {
    setProcessingIds(prev => new Set(prev).add(request.id));
    try {
      await dispatch(
        respondToFriendRequest({requestId: request.id, action: 'accept'}),
      );
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleReject = async (request: FriendRequest) => {
    setProcessingIds(prev => new Set(prev).add(request.id));
    try {
      await dispatch(
        respondToFriendRequest({requestId: request.id, action: 'reject'}),
      );
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleCancel = async (request: FriendRequest) => {
    setProcessingIds(prev => new Set(prev).add(request.id));
    try {
      await dispatch(cancelFriendRequest(request.id));
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const handleViewProfile = (request: FriendRequest) => {
    navigation.navigate('UserProfile', {userId: request.senderId});
  };

  const currentRequests =
    activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  const renderRequestItem = ({item}: {item: FriendRequest}) => (
    <FriendRequestCard
      request={item}
      type={activeTab}
      onAccept={() => handleAccept(item)}
      onReject={() => handleReject(item)}
      onCancel={() => handleCancel(item)}
      onViewProfile={() => handleViewProfile(item)}
      loading={processingIds.has(item.id)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {activeTab === 'incoming' ? '📬' : '📤'}
      </Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'incoming'
          ? 'No pending requests'
          : 'No sent requests'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'incoming'
          ? "When someone sends you a friend request, it will appear here"
          : "Friend requests you've sent will appear here"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'incoming' && styles.tabActive]}
          onPress={() => setActiveTab('incoming')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'incoming' && styles.tabTextActive,
            ]}>
            Received
          </Text>
          {incomingRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{incomingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'outgoing' && styles.tabActive]}
          onPress={() => setActiveTab('outgoing')}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'outgoing' && styles.tabTextActive,
            ]}>
            Sent
          </Text>
          {outgoingRequests.length > 0 && (
            <View style={[styles.badge, styles.badgeOutgoing]}>
              <Text style={styles.badgeText}>{outgoingRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && currentRequests.length === 0 && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={currentRequests}
          renderItem={renderRequestItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  badge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  badgeOutgoing: {
    backgroundColor: COLORS.TEXT_MUTED,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
  },
  listContent: {
    padding: SPACING.MD,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: SPACING.LG,
  },
});

export default FriendRequestsScreen;
