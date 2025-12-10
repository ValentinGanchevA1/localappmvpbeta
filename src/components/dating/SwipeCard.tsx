// src/components/dating/SwipeCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { DatingProfile } from '@/types/dating';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';

interface SwipeCardProps {
  profile: DatingProfile;
  onSwipe: (action: 'like' | 'pass' | 'super_like') => void;
  index: number;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ profile, index }) => {
  // This is a placeholder component. A real implementation would use a library
  // like react-native-deck-swiper or a custom animated view.
  return (
    <View style={[styles.card, { zIndex: -index, bottom: index * 10 }]}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{profile.username}, {profile.age}</Text>
        <Text style={styles.bio}>{profile.bio}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: Dimensions.get('window').width - SPACING.MD * 2,
    height: Dimensions.get('window').height * 0.6,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
  },
  infoContainer: {
    padding: SPACING.MD,
  },
  name: {
    ...TYPOGRAPHY.H2,
    color: COLORS.TEXT_PRIMARY,
  },
  bio: {
    ...TYPOGRAPHY.BODY,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.SM,
  },
});
