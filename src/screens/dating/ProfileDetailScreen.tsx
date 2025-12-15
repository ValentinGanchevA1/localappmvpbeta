// src/screens/dating/ProfileDetailScreen.tsx
// Full Profile Detail Screen with all profile information

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import {useAppDispatch} from '@/store/hooks';
import {recordSwipe, blockDatingUser, reportProfile} from '@/store/slices/datingSlice';
import {DatingProfile, DatingPhoto, ReportReason} from '@/types/dating';
import {COLORS, SPACING} from '@/config/theme';

// ============================================
// Types
// ============================================

type ProfileDetailRouteProp = RouteProp<
  {ProfileDetail: {profile: DatingProfile}},
  'ProfileDetail'
>;

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
}

interface PromptCardProps {
  question: string;
  answer: string;
}

// ============================================
// Constants
// ============================================

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * 1.25;

// ============================================
// Info Item Component
// ============================================

const InfoItem: React.FC<InfoItemProps> = ({icon, label, value}) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoIcon}>{icon}</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ============================================
// Prompt Card Component
// ============================================

const PromptCard: React.FC<PromptCardProps> = ({question, answer}) => (
  <View style={styles.promptCard}>
    <Text style={styles.promptQuestion}>{question}</Text>
    <Text style={styles.promptAnswer}>{answer}</Text>
  </View>
);

// ============================================
// Main Screen Component
// ============================================

export const ProfileDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ProfileDetailRouteProp>();
  const dispatch = useAppDispatch();

  const profile = route.params?.profile;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Get photo URL helper
  const getPhotoUrl = (photo: DatingPhoto | string): string => {
    if (typeof photo === 'string') return photo;
    return photo.url;
  };

  // Photos array - use placeholder if no profile or photos
  const photos = profile?.photos && profile.photos.length > 0
    ? profile.photos
    : ['https://via.placeholder.com/400x500?text=No+Photo'];

  // Handle swipe actions - all hooks must be called unconditionally
  const handleLike = useCallback(() => {
    if (!profile) return;
    dispatch(recordSwipe({targetUserId: profile.userId, action: 'like'}));
    navigation.goBack();
  }, [dispatch, profile, navigation]);

  const handlePass = useCallback(() => {
    if (!profile) return;
    dispatch(recordSwipe({targetUserId: profile.userId, action: 'pass'}));
    navigation.goBack();
  }, [dispatch, profile, navigation]);

  const handleSuperLike = useCallback(() => {
    if (!profile) return;
    dispatch(recordSwipe({targetUserId: profile.userId, action: 'super_like'}));
    navigation.goBack();
  }, [dispatch, profile, navigation]);

  // Handle block
  const handleBlock = useCallback(() => {
    if (!profile) return;
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profile.name}? You won't see each other anymore.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            dispatch(blockDatingUser(profile.userId));
            navigation.goBack();
          },
        },
      ]
    );
  }, [dispatch, profile, navigation]);

  // Handle report
  const handleReport = useCallback(() => {
    if (!profile) return;
    const reasons: {label: string; value: ReportReason}[] = [
      {label: 'Fake Profile', value: 'fake_profile'},
      {label: 'Inappropriate Photos', value: 'inappropriate_photos'},
      {label: 'Harassment', value: 'harassment'},
      {label: 'Spam', value: 'spam'},
      {label: 'Underage User', value: 'underage'},
      {label: 'Other', value: 'other'},
    ];

    Alert.alert(
      'Report Profile',
      'Why are you reporting this profile?',
      [
        ...reasons.map(reason => ({
          text: reason.label,
          onPress: () => {
            dispatch(reportProfile({
              reportedUserId: profile.userId,
              reason: reason.value,
            }));
            Alert.alert('Reported', 'Thank you for helping keep our community safe.');
          },
        })),
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  }, [dispatch, profile]);

  // Early return after all hooks are called
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Profile not found</Text>
      </SafeAreaView>
    );
  }

  // Format lifestyle values
  const formatLifestyle = (key: string, value: string): string => {
    const formatters: Record<string, Record<string, string>> = {
      drinking: {
        never: 'Never drinks',
        rarely: 'Drinks rarely',
        socially: 'Social drinker',
        regularly: 'Regular drinker',
      },
      smoking: {
        never: 'Non-smoker',
        sometimes: 'Sometimes smokes',
        regularly: 'Smoker',
      },
      exercise: {
        never: 'Never exercises',
        sometimes: 'Sometimes exercises',
        often: 'Exercises often',
        daily: 'Exercises daily',
      },
      diet: {
        omnivore: 'Omnivore',
        vegetarian: 'Vegetarian',
        vegan: 'Vegan',
        pescatarian: 'Pescatarian',
        other: 'Other diet',
      },
      pets: {
        love_them: 'Loves pets',
        allergic: 'Allergic to pets',
        have_pets: 'Has pets',
        no_preference: 'No preference',
      },
      children: {
        want_someday: 'Wants children someday',
        dont_want: 'Doesn\'t want children',
        have_kids: 'Has children',
        open_to_kids: 'Open to children',
        not_sure: 'Not sure about children',
      },
    };

    return formatters[key]?.[value] || value;
  };

  // Format relationship goal
  const formatGoal = (goal: string): string => {
    const goals: Record<string, string> = {
      long_term: 'Long-term relationship',
      short_term: 'Short-term dating',
      casual: 'Casual dating',
      friendship: 'New friends',
      not_sure: 'Figuring things out',
    };
    return goals[goal] || goal;
  };

  // Format height
  const formatHeight = (cm: number): string => {
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return `${feet}'${inches}" (${cm} cm)`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Photo Gallery */}
        <View style={styles.photoContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentPhotoIndex(index);
            }}>
            {photos.map((photo, index) => (
              <Image
                key={index}
                source={{uri: getPhotoUrl(photo)}}
                style={styles.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Photo indicators */}
          {photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.photoIndicator,
                    index === currentPhotoIndex && styles.photoIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>x</Text>
          </TouchableOpacity>

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.photoGradient}>
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>
                  {profile.name}, {profile.age}
                </Text>
                {profile.verificationStatus === 'verified' && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedIcon}>check</Text>
                  </View>
                )}
              </View>

              <View style={styles.locationRow}>
                {profile.distance !== undefined && (
                  <Text style={styles.distance}>
                    {profile.distance < 1
                      ? 'Less than 1 km away'
                      : `${profile.distance} km away`}
                  </Text>
                )}
                {profile.location?.city && (
                  <Text style={styles.city}> - {profile.location.city}</Text>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Profile Content */}
        <View style={styles.content}>
          {/* Relationship Goal */}
          {profile.relationshipGoal && (
            <View style={styles.goalContainer}>
              <Text style={styles.goalIcon}>heart</Text>
              <Text style={styles.goalText}>
                Looking for {formatGoal(profile.relationshipGoal).toLowerCase()}
              </Text>
            </View>
          )}

          {/* Bio */}
          {profile.bio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>
          )}

          {/* Prompts */}
          {profile.prompts && profile.prompts.length > 0 && (
            <View style={styles.section}>
              {profile.prompts.map((prompt, index) => (
                <PromptCard
                  key={index}
                  question={prompt.question}
                  answer={prompt.answer}
                />
              ))}
            </View>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsContainer}>
                {profile.interests.map((interest, index) => (
                  <View key={index} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Basics */}
          {profile.basics && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basics</Text>
              <View style={styles.infoGrid}>
                {profile.basics.height && (
                  <InfoItem
                    icon="ruler"
                    label="Height"
                    value={formatHeight(profile.basics.height)}
                  />
                )}
                {profile.basics.bodyType && (
                  <InfoItem
                    icon="user"
                    label="Body Type"
                    value={profile.basics.bodyType.charAt(0).toUpperCase() +
                      profile.basics.bodyType.slice(1).replace('_', ' ')}
                  />
                )}
                {profile.basics.ethnicity && (
                  <InfoItem
                    icon="globe"
                    label="Ethnicity"
                    value={profile.basics.ethnicity}
                  />
                )}
                {profile.basics.religion && (
                  <InfoItem
                    icon="pray"
                    label="Religion"
                    value={profile.basics.religion}
                  />
                )}
                {profile.zodiacSign && (
                  <InfoItem
                    icon="star"
                    label="Zodiac"
                    value={profile.zodiacSign.charAt(0).toUpperCase() +
                      profile.zodiacSign.slice(1)}
                  />
                )}
              </View>
            </View>
          )}

          {/* Work & Education */}
          {profile.work && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work & Education</Text>
              <View style={styles.infoGrid}>
                {profile.work.jobTitle && (
                  <InfoItem
                    icon="briefcase"
                    label="Job"
                    value={profile.work.jobTitle}
                  />
                )}
                {profile.work.company && (
                  <InfoItem
                    icon="building"
                    label="Company"
                    value={profile.work.company}
                  />
                )}
                {profile.work.education && (
                  <InfoItem
                    icon="graduation"
                    label="Education"
                    value={profile.work.education.charAt(0).toUpperCase() +
                      profile.work.education.slice(1).replace('_', ' ')}
                  />
                )}
                {profile.work.school && (
                  <InfoItem
                    icon="school"
                    label="School"
                    value={profile.work.school}
                  />
                )}
              </View>
            </View>
          )}

          {/* Lifestyle */}
          {profile.lifestyle && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
              <View style={styles.infoGrid}>
                {profile.lifestyle.drinking && (
                  <InfoItem
                    icon="wine"
                    label="Drinking"
                    value={formatLifestyle('drinking', profile.lifestyle.drinking)}
                  />
                )}
                {profile.lifestyle.smoking && (
                  <InfoItem
                    icon="cigarette"
                    label="Smoking"
                    value={formatLifestyle('smoking', profile.lifestyle.smoking)}
                  />
                )}
                {profile.lifestyle.exercise && (
                  <InfoItem
                    icon="dumbbell"
                    label="Exercise"
                    value={formatLifestyle('exercise', profile.lifestyle.exercise)}
                  />
                )}
                {profile.lifestyle.diet && (
                  <InfoItem
                    icon="food"
                    label="Diet"
                    value={formatLifestyle('diet', profile.lifestyle.diet)}
                  />
                )}
                {profile.lifestyle.pets && (
                  <InfoItem
                    icon="paw"
                    label="Pets"
                    value={formatLifestyle('pets', profile.lifestyle.pets)}
                  />
                )}
                {profile.lifestyle.children && (
                  <InfoItem
                    icon="baby"
                    label="Children"
                    value={formatLifestyle('children', profile.lifestyle.children)}
                  />
                )}
              </View>
            </View>
          )}

          {/* Languages */}
          {profile.basics?.languages && profile.basics.languages.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.interestsContainer}>
                {profile.basics.languages.map((lang, index) => (
                  <View key={index} style={styles.languageChip}>
                    <Text style={styles.languageText}>{lang}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Report/Block */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
              <Text style={styles.reportButtonText}>Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.blockButton} onPress={handleBlock}>
              <Text style={styles.blockButtonText}>Block</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer for bottom buttons */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.passButton} onPress={handlePass}>
          <Text style={styles.passIcon}>X</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.superLikeButton} onPress={handleSuperLike}>
          <Text style={styles.superLikeIcon}>star</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Text style={styles.likeIcon}>heart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  scrollView: {
    flex: 1,
  },

  // Photo section
  photoContainer: {
    height: PHOTO_HEIGHT,
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: COLORS.GRAY_200,
  },
  photoIndicators: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    maxWidth: 50,
  },
  photoIndicatorActive: {
    backgroundColor: COLORS.WHITE,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontSize: 20,
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  headerInfo: {},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.WHITE,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#339AF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedIcon: {
    color: COLORS.WHITE,
    fontSize: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distance: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  city: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },

  // Content
  content: {
    padding: SPACING.LG,
  },

  // Goal
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: SPACING.LG,
    gap: 8,
  },
  goalIcon: {
    fontSize: 18,
    color: '#FF6B6B',
  },
  goalText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },

  // Section
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.GRAY_500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.SM,
  },
  bio: {
    fontSize: 16,
    color: COLORS.GRAY_800,
    lineHeight: 24,
  },

  // Prompt
  promptCard: {
    backgroundColor: COLORS.GRAY_50,
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.SM,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  promptQuestion: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    fontWeight: '600',
    marginBottom: 4,
  },
  promptAnswer: {
    fontSize: 16,
    color: COLORS.GRAY_900,
    fontStyle: 'italic',
  },

  // Interests
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    color: COLORS.GRAY_700,
  },
  languageChip: {
    backgroundColor: '#E7F5FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageText: {
    fontSize: 14,
    color: '#1C7ED6',
  },

  // Info grid
  infoGrid: {
    gap: SPACING.SM,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: SPACING.XS,
  },
  infoIcon: {
    fontSize: 18,
    width: 24,
    color: COLORS.GRAY_500,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.GRAY_900,
    fontWeight: '500',
  },

  // Action section
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: SPACING.LG,
    paddingTop: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  reportButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  reportButtonText: {
    fontSize: 14,
    color: COLORS.GRAY_500,
  },
  blockButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  blockButtonText: {
    fontSize: 14,
    color: '#FF6B6B',
  },

  // Bottom action buttons
  bottomActions: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  passButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  passIcon: {
    fontSize: 24,
    color: '#FF6B6B',
  },
  superLikeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#339AF0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  superLikeIcon: {
    fontSize: 20,
    color: COLORS.WHITE,
  },
  likeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#51CF66',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  likeIcon: {
    fontSize: 24,
    color: COLORS.WHITE,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default ProfileDetailScreen;
