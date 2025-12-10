// src/components/dating/SwipeCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { DatingProfile } from '@/types/dating';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';
import LinearGradient from 'react-native-linear-gradient';

interface SwipeCardProps {
  profile: DatingProfile;
  onSwipe: (action: 'like' | 'pass' | 'super_like') => void;
  index: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

export const SwipeCard: React.FC<SwipeCardProps> = ({
                                                      profile,
                                                      onSwipe,
                                                      index,
                                                    }) => {
  const pan = useState(new Animated.ValueXY())[0];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (e, { dx, vx }) => {
      const direction = dx > 0 ? 1 : -1;

      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        // Swipe complete
        const action = direction > 0 ? 'like' : 'pass';
        onSwipe(action);
        resetCard();
      } else {
        // Snap back
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
      }
    },
  });

  const resetCard = () => {
    pan.setValue({ x: 0, y: 0 });
  };

  const rotateCard = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  const opacityPass = pan.x.interpolate({
    inputRange: [-200, -100, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const opacityLike = pan.x.interpolate({
    inputRange: [0, 100, 200],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: rotateCard },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* Pass Label */}
      <Animated.View style={[styles.label, { opacity: opacityPass }]}>
        <Text style={styles.passText}>PASS</Text>
      </Animated.View>

      {/* Like Label */}
      <Animated.View style={[styles.label, { opacity: opacityLike }]}>
        <Text style={styles.likeText}>LIKE</Text>
      </Animated.View>

      {/* Profile Photo */}
      <Image
        source={{ uri: profile.photos[0] }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Profile Info Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.overlay}
      >
        <View style={styles.info}>
          <Text style={styles.name}>
            {profile.name}, {profile.age}
          </Text>
          <Text style={styles.distance}>📍 12 km away</Text>

          {/* Interests */}
          <View style={styles.interestsContainer}>
            {profile.interests.slice(0, 3).map((interest, idx) => (
              <View key={idx} style={styles.interestBadge}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>

          {/* Bio Preview */}
          <Text style={styles.bio} numberOfLines={2}>
            {profile.bio}
          </Text>
        </View>
      </LinearGradient>

      {/* Compatibility Score */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreLabel}>89% Match</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: 550,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
    padding: SPACING.MD,
  },
  info: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SPACING.MD,
    borderRadius: 12,
  },
  name: {
    ...TYPOGRAPHY.H2,
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  distance: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: SPACING.SM,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: SPACING.SM,
  },
  interestBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    color: COLORS.WHITE,
    fontSize: 12,
  },
  bio: {
    color: '#ddd',
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  passText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FF6B6B',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  likeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#51CF66',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  scoreContainer: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
});
