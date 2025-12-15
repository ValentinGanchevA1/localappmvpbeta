// src/screens/social/SocialCirclesScreen.tsx
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchCircles,
  deleteCircle,
  selectCircles,
  selectCirclesLoading,
} from '@/store/slices/socialGraphSlice';
import {SocialCircleCard} from '@/components/social';
import {SocialCircle} from '@/types/socialGraph';

const SocialCirclesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const circles = useAppSelector(selectCircles);
  const loading = useAppSelector(selectCirclesLoading);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchCircles());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchCircles());
    setRefreshing(false);
  }, [dispatch]);

  const handleCirclePress = (circle: SocialCircle) => {
    navigation.navigate('CircleDetail', {circleId: circle.id});
  };

  const handleEditCircle = (circle: SocialCircle) => {
    navigation.navigate('EditCircle', {circleId: circle.id});
  };

  const handleDeleteCircle = (circle: SocialCircle) => {
    Alert.alert(
      'Delete Circle',
      `Are you sure you want to delete "${circle.name}"? This action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteCircle(circle.id)),
        },
      ],
    );
  };

  const defaultCircles = circles.filter(c => c.isDefault);
  const customCircles = circles.filter(c => !c.isDefault);

  const renderCircleItem = ({item}: {item: SocialCircle}) => (
    <SocialCircleCard
      circle={item}
      onPress={() => handleCirclePress(item)}
      onEdit={() => handleEditCircle(item)}
      onDelete={() => handleDeleteCircle(item)}
      showActions={true}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🔐</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>What are Social Circles?</Text>
          <Text style={styles.infoDescription}>
            Organize your friends into groups and control what each group can
            see. Share different content with different circles.
          </Text>
        </View>
      </View>

      {defaultCircles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Circles</Text>
          {defaultCircles.map(circle => (
            <SocialCircleCard
              key={circle.id}
              circle={circle}
              onPress={() => handleCirclePress(circle)}
              showActions={false}
            />
          ))}
        </View>
      )}

      {customCircles.length > 0 && (
        <Text style={styles.sectionTitle}>Your Circles</Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⭕</Text>
      <Text style={styles.emptyTitle}>No custom circles yet</Text>
      <Text style={styles.emptySubtitle}>
        Create circles to organize your friends and control your privacy
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateCircle')}>
        <Text style={styles.createButtonText}>Create Circle</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing && circles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={customCircles}
        renderItem={renderCircleItem}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={customCircles.length === 0 ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateCircle')}>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.LG,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: '#1565C0',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: '#1976D2',
    lineHeight: 20,
  },
  section: {
    marginBottom: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.SM,
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
    paddingHorizontal: SPACING.LG,
  },
  createButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
  },
  createButtonText: {
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

export default SocialCirclesScreen;
