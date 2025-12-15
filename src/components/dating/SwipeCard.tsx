// src/components/dating/SwipeCard.tsx
// Enhanced Swipe Card with Photo Carousel and Advanced Gestures

import React, {useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {DatingProfile, DatingPhoto} from '@/types/dating';
import {COLORS} from '@/config/theme';

// ============================================
// Types
// ============================================

interface SwipeCardProps {
  profile: DatingProfile;
  onSwipe: (action: 'like' | 'pass' | 'super_like') => void;
  onViewProfile?: () => void;
  index?: number;
  isFirst?: boolean;
}

// ============================================
// Constants
// ============================================

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.7;
const SWIPE_THRESHOLD = 100;
const SWIPE_OUT_DURATION = 300;
const SUPER_LIKE_THRESHOLD = -100; // Swipe up

// ============================================
// Photo Carousel Component
// ============================================

interface PhotoCarouselProps {
  photos: DatingPhoto[] | string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onTapLeft: () => void;
  onTapRight: () => void;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  photos,
  currentIndex,
  onTapLeft,
  onTapRight,
}) => {
  const getPhotoUrl = (photo: DatingPhoto | string): string => {
    if (typeof photo === 'string') return photo;
    return photo.url;
  };

  return (
    <View style={styles.carouselContainer}>
      {/* Photo */}
      <Image
        source={{uri: getPhotoUrl(photos[currentIndex])}}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Tap zones for navigation */}
      <View style={styles.tapZones}>
        <TouchableWithoutFeedback onPress={onTapLeft}>
          <View style={styles.tapZoneLeft} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={onTapRight}>
          <View style={styles.tapZoneRight} />
        </TouchableWithoutFeedback>
      </View>

      {/* Photo indicators */}
      {photos.length > 1 && (
        <View style={styles.indicatorContainer}>
          {photos.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                idx === currentIndex && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ============================================
// Info Badge Component
// ============================================

interface InfoBadgeProps {
  icon: string;
  text: string;
  style?: object;
}

const InfoBadge: React.FC<InfoBadgeProps> = ({icon, text, style}) => (
  <View style={[styles.infoBadge, style]}>
    <Text style={styles.infoBadgeIcon}>{icon}</Text>
    <Text style={styles.infoBadgeText}>{text}</Text>
  </View>
);

// ============================================
// Main SwipeCard Component
// ============================================

export const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  onSwipe,
  onViewProfile,
  isFirst = true,
}) => {
  // State
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  // Scale is kept for potential future animation use
  useRef(new Animated.Value(isFirst ? 1 : 0.95));

  // Get photos array (handle both DatingPhoto[] and string[])
  const photos = useMemo(() => {
    if (!profile.photos || profile.photos.length === 0) {
      return ['https://via.placeholder.com/400x600?text=No+Photo'];
    }
    return profile.photos;
  }, [profile.photos]);

  // Photo navigation
  const handleTapLeft = useCallback(() => {
    setCurrentPhotoIndex(prev => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleTapRight = useCallback(() => {
    setCurrentPhotoIndex(prev =>
      prev < photos.length - 1 ? prev + 1 : prev
    );
  }, [photos.length]);

  // Reset card position
  const resetCard = useCallback(() => {
    Animated.spring(pan, {
      toValue: {x: 0, y: 0},
      useNativeDriver: false,
      friction: 5,
    }).start();
  }, [pan]);

  // Swipe out animation
  const swipeOut = useCallback(
    (direction: 'left' | 'right' | 'up', callback: () => void) => {
      const toValue = {
        x: direction === 'left' ? -SCREEN_WIDTH * 1.5 : direction === 'right' ? SCREEN_WIDTH * 1.5 : 0,
        y: direction === 'up' ? -SCREEN_HEIGHT : 0,
      };

      Animated.timing(pan, {
        toValue,
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start(() => {
        callback();
        pan.setValue({x: 0, y: 0});
      });
    },
    [pan]
  );

  // Pan responder for swipe gestures
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, {dx, dy}) => {
          // Only respond to significant moves
          return Math.abs(dx) > 5 || Math.abs(dy) > 5;
        },
        onPanResponderGrant: () => {
          // Store the current offset
          pan.setOffset({
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          });
        },
        onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, {dx, dy, vx, vy: _vy}) => {
          pan.flattenOffset();

          // Check for super like (swipe up)
          if (dy < SUPER_LIKE_THRESHOLD && Math.abs(dx) < 50) {
            swipeOut('up', () => onSwipe('super_like'));
            return;
          }

          // Check for horizontal swipe
          if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5) {
            const direction = dx > 0 ? 'right' : 'left';
            const action = direction === 'right' ? 'like' : 'pass';
            swipeOut(direction, () => onSwipe(action));
          } else {
            // Reset to center
            resetCard();
          }
        },
      }),
    [pan, onSwipe, swipeOut, resetCard]
  );

  // Animated values
  const rotateCard = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const opacityNope = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const opacityLike = pan.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const opacitySuperLike = pan.y.interpolate({
    inputRange: [-SCREEN_HEIGHT / 6, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cardScale = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [0.95, 1, 0.95],
    extrapolate: 'clamp',
  });

  // Helper to get lifestyle info
  const getLifestyleInfo = () => {
    const info: {icon: string; text: string}[] = [];

    if (profile.work?.jobTitle) {
      info.push({icon: '💼', text: profile.work.jobTitle});
    }
    if (profile.work?.school) {
      info.push({icon: '🎓', text: profile.work.school});
    }
    if (profile.basics?.height) {
      const heightFeet = Math.floor(profile.basics.height / 30.48);
      const heightInches = Math.round((profile.basics.height % 30.48) / 2.54);
      info.push({icon: '📏', text: `${heightFeet}'${heightInches}"`});
    }
    if (profile.lifestyle?.smoking === 'never') {
      info.push({icon: '🚭', text: 'Non-smoker'});
    }
    if (profile.lifestyle?.exercise === 'daily' || profile.lifestyle?.exercise === 'often') {
      info.push({icon: '💪', text: 'Active'});
    }

    return info.slice(0, 4);
  };

  // Get relationship goal label
  const getGoalLabel = (goal: string) => {
    const labels: Record<string, string> = {
      long_term: 'Long-term relationship',
      short_term: 'Short-term dating',
      casual: 'Casual dating',
      friendship: 'New friends',
      not_sure: 'Figuring it out',
    };
    return labels[goal] || goal;
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            {translateX: pan.x},
            {translateY: pan.y},
            {rotate: rotateCard},
            {scale: cardScale},
          ],
        },
      ]}
      {...panResponder.panHandlers}>
      {/* NOPE Label */}
      <Animated.View
        style={[styles.labelContainer, styles.labelLeft, {opacity: opacityNope}]}>
        <View style={[styles.label, styles.labelNope]}>
          <Text style={styles.labelText}>NOPE</Text>
        </View>
      </Animated.View>

      {/* LIKE Label */}
      <Animated.View
        style={[styles.labelContainer, styles.labelRight, {opacity: opacityLike}]}>
        <View style={[styles.label, styles.labelLike]}>
          <Text style={styles.labelText}>LIKE</Text>
        </View>
      </Animated.View>

      {/* SUPER LIKE Label */}
      <Animated.View
        style={[styles.labelContainer, styles.labelCenter, {opacity: opacitySuperLike}]}>
        <View style={[styles.label, styles.labelSuperLike]}>
          <Text style={styles.labelText}>SUPER LIKE</Text>
        </View>
      </Animated.View>

      {/* Photo Carousel */}
      <PhotoCarousel
        photos={photos}
        currentIndex={currentPhotoIndex}
        onIndexChange={setCurrentPhotoIndex}
        onTapLeft={handleTapLeft}
        onTapRight={handleTapRight}
      />

      {/* Verified Badge */}
      {profile.verificationStatus === 'verified' && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedIcon}>✓</Text>
        </View>
      )}

      {/* Compatibility Score */}
      {profile.compatibilityScore !== undefined && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{profile.compatibilityScore}%</Text>
          <Text style={styles.scoreLabel}>Match</Text>
        </View>
      )}

      {/* Profile Info Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}>
        <TouchableOpacity
          style={styles.infoContainer}
          onPress={() => setShowDetails(!showDetails)}
          activeOpacity={0.9}>
          {/* Name & Age */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {profile.name}, {profile.age}
            </Text>
            {profile.verificationStatus === 'verified' && (
              <Text style={styles.verifiedText}>Verified</Text>
            )}
          </View>

          {/* Distance & Relationship Goal */}
          <View style={styles.subtitleRow}>
            {profile.distance !== undefined && (
              <Text style={styles.distance}>
                {profile.distance < 1
                  ? 'Less than 1 km away'
                  : `${profile.distance} km away`}
              </Text>
            )}
            {profile.relationshipGoal && (
              <Text style={styles.goal}>
                {' '}• {getGoalLabel(profile.relationshipGoal)}
              </Text>
            )}
          </View>

          {/* Lifestyle Badges */}
          <View style={styles.badgeRow}>
            {getLifestyleInfo().map((info, idx) => (
              <InfoBadge key={idx} icon={info.icon} text={info.text} />
            ))}
          </View>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.interestsRow}>
              {profile.interests.slice(0, 5).map((interest, idx) => (
                <View key={idx} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
              {profile.interests.length > 5 && (
                <View style={styles.interestChip}>
                  <Text style={styles.interestText}>
                    +{profile.interests.length - 5}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bio Preview */}
          {profile.bio && (
            <Text style={styles.bio} numberOfLines={showDetails ? 5 : 2}>
              {profile.bio}
            </Text>
          )}

          {/* Prompts (if showing details) */}
          {showDetails && profile.prompts && profile.prompts.length > 0 && (
            <View style={styles.promptContainer}>
              <Text style={styles.promptQuestion}>
                {profile.prompts[0].question}
              </Text>
              <Text style={styles.promptAnswer}>
                {profile.prompts[0].answer}
              </Text>
            </View>
          )}

          {/* View More Button */}
          {onViewProfile && (
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={onViewProfile}>
              <Text style={styles.viewMoreText}>
                {showDetails ? 'View Full Profile' : 'Tap for more'}
              </Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

// ============================================
// Action Buttons Component (for external use)
// ============================================

interface ActionButtonsProps {
  onPass: () => void;
  onLike: () => void;
  onSuperLike: () => void;
  onRewind?: () => void;
  onBoost?: () => void;
  canSuperLike?: boolean;
  canRewind?: boolean;
  canBoost?: boolean;
  isBoostActive?: boolean;
}

export const SwipeActionButtons: React.FC<ActionButtonsProps> = ({
  onPass,
  onLike,
  onSuperLike,
  onRewind,
  onBoost,
  canSuperLike = true,
  canRewind = false,
  canBoost = false,
  isBoostActive = false,
}) => {
  return (
    <View style={styles.actionButtons}>
      {/* Rewind Button */}
      {onRewind && (
        <TouchableOpacity
          style={[styles.actionButton, styles.smallButton, !canRewind && styles.disabledButton]}
          onPress={onRewind}
          disabled={!canRewind}>
          <Text style={styles.actionIcon}>↩️</Text>
        </TouchableOpacity>
      )}

      {/* Pass Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.passButton]}
        onPress={onPass}>
        <Text style={styles.actionIconLarge}>✕</Text>
      </TouchableOpacity>

      {/* Super Like Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.superLikeButton,
          !canSuperLike && styles.disabledButton,
        ]}
        onPress={onSuperLike}
        disabled={!canSuperLike}>
        <Text style={styles.actionIcon}>⭐</Text>
      </TouchableOpacity>

      {/* Like Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.likeButton]}
        onPress={onLike}>
        <Text style={styles.actionIconLarge}>♥</Text>
      </TouchableOpacity>

      {/* Boost Button */}
      {onBoost && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.smallButton,
            styles.boostButton,
            !canBoost && styles.disabledButton,
            isBoostActive && styles.boostActiveButton,
          ]}
          onPress={onBoost}
          disabled={!canBoost || isBoostActive}>
          <Text style={styles.actionIcon}>⚡</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  // Carousel
  carouselContainer: {
    flex: 1,
    backgroundColor: COLORS.GRAY_100,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapZoneLeft: {
    flex: 1,
  },
  tapZoneRight: {
    flex: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  indicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  indicatorActive: {
    backgroundColor: COLORS.WHITE,
  },

  // Labels
  labelContainer: {
    position: 'absolute',
    top: 50,
    zIndex: 100,
  },
  labelLeft: {
    right: 20,
  },
  labelRight: {
    left: 20,
  },
  labelCenter: {
    top: 100,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 8,
    transform: [{rotate: '0deg'}],
  },
  labelNope: {
    borderColor: '#FF6B6B',
    transform: [{rotate: '15deg'}],
  },
  labelLike: {
    borderColor: '#51CF66',
    transform: [{rotate: '-15deg'}],
  },
  labelSuperLike: {
    borderColor: '#339AF0',
  },
  labelText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },

  // Badges
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#339AF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
  },
  scoreContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  scoreLabel: {
    fontSize: 10,
    color: COLORS.GRAY_600,
    marginTop: -2,
  },

  // Overlay
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 80,
  },
  infoContainer: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  verifiedText: {
    fontSize: 12,
    color: '#339AF0',
    fontWeight: '600',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  goal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },

  // Info Badges
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  infoBadgeIcon: {
    fontSize: 12,
  },
  infoBadgeText: {
    fontSize: 12,
    color: COLORS.WHITE,
  },

  // Interests
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  interestChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: '500',
  },

  // Bio
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginTop: 12,
  },

  // Prompts
  promptContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
  },
  promptQuestion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 4,
  },
  promptAnswer: {
    fontSize: 14,
    color: COLORS.WHITE,
    fontStyle: 'italic',
  },

  // View More
  viewMoreButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  viewMoreText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  smallButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.WHITE,
  },
  passButton: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  likeButton: {
    width: 60,
    height: 60,
    backgroundColor: '#51CF66',
  },
  superLikeButton: {
    width: 50,
    height: 50,
    backgroundColor: '#339AF0',
  },
  boostButton: {
    backgroundColor: '#BE4BDB',
  },
  boostActiveButton: {
    backgroundColor: '#9C36B5',
    borderWidth: 2,
    borderColor: '#FFD43B',
  },
  disabledButton: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionIconLarge: {
    fontSize: 28,
    color: '#FF6B6B',
  },
});
