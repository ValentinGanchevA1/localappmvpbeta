// src/components/trends/InsightCard.tsx
// Community Insight Card Component

import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {CommunityInsight} from '@/types/trends';
import {COLORS, SPACING} from '@/config/theme';

interface InsightCardProps {
  insight: CommunityInsight;
}

const InsightCard: React.FC<InsightCardProps> = memo(({insight}) => {
  const getChangeIcon = () => {
    if (insight.changeDirection === 'up') return 'arrow-up';
    if (insight.changeDirection === 'down') return 'arrow-down';
    return 'remove';
  };

  const getChangeColor = () => {
    if (insight.changeDirection === 'up') return '#34C759';
    if (insight.changeDirection === 'down') return '#FF3B30';
    return COLORS.GRAY_500;
  };

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, {backgroundColor: insight.color + '20'}]}>
        <Icon name={insight.icon} size={24} color={insight.color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.value}>
          {typeof insight.value === 'number' ? insight.value.toLocaleString() : insight.value}
        </Text>
        <Text style={styles.title}>{insight.title}</Text>
      </View>

      {insight.change !== undefined && (
        <View style={styles.changeContainer}>
          <Icon name={getChangeIcon()} size={14} color={getChangeColor()} />
          <Text style={[styles.changeText, {color: getChangeColor()}]}>
            {Math.abs(insight.change)}%
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MD,
    width: 140,
    marginRight: SPACING.SM,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.TEXT_PRIMARY,
  },
  title: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default InsightCard;
