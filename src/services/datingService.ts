// src/services/datingService.ts
// Advanced Dating Matching Algorithm Service

import {
  DatingProfile,
  DatingPreferences,
  DatingScore,
  ScoreBreakdown,
  MatchingWeights,
  DEFAULT_MATCHING_WEIGHTS,
  RelationshipGoal,
  DrinkingHabit,
  SmokingHabit,
  ExerciseFrequency,
  ChildrenPreference,
} from '@/types/dating';

// ============================================
// Matching Weight Configurations
// ============================================

interface AdvancedMatchingConfig {
  weights: MatchingWeights;
  boostVerifiedProfiles: boolean;
  boostActiveProfiles: boolean;
  verifiedBonus: number;
  activeBonus: number;
  superLikeBonus: number;
  activeDaysThreshold: number;
}

const DEFAULT_CONFIG: AdvancedMatchingConfig = {
  weights: DEFAULT_MATCHING_WEIGHTS,
  boostVerifiedProfiles: true,
  boostActiveProfiles: true,
  verifiedBonus: 10,
  activeBonus: 5,
  superLikeBonus: 15,
  activeDaysThreshold: 7,
};

// ============================================
// Dating Service Class
// ============================================

export class DatingService {
  private static config: AdvancedMatchingConfig = DEFAULT_CONFIG;

  /**
   * Configure matching algorithm parameters
   */
  static configure(config: Partial<AdvancedMatchingConfig>): void {
    this.config = {...this.config, ...config};
  }

  /**
   * Calculate comprehensive compatibility score between two users
   */
  static calculateCompatibility(
    userA: DatingProfile,
    userB: DatingProfile,
    weights: MatchingWeights = this.config.weights
  ): DatingScore {
    // Calculate individual component scores
    const proximityResult = this.calculateProximityScore(userA, userB);
    const interestResult = this.calculateInterestScore(userA, userB);
    const ageResult = this.calculateAgeScore(userA, userB);
    const lifestyleResult = this.calculateLifestyleScore(userA, userB);
    const activityResult = this.calculateActivityScore(userB);
    const goalsResult = this.calculateGoalsScore(userA, userB);

    // Build breakdown for transparency
    const breakdown: ScoreBreakdown = {
      distance: {
        value: proximityResult.distance,
        weight: weights.proximity,
        score: proximityResult.score,
      },
      interests: {
        shared: interestResult.shared,
        total: interestResult.total,
        weight: weights.interests,
        score: interestResult.score,
      },
      age: {
        inRange: ageResult.inRange,
        weight: weights.age,
        score: ageResult.score,
      },
      lifestyle: {
        matches: lifestyleResult.matches,
        weight: weights.lifestyle,
        score: lifestyleResult.score,
      },
      activity: {
        daysAgo: activityResult.daysAgo,
        weight: weights.activity,
        score: activityResult.score,
      },
      goals: {
        compatible: goalsResult.compatible,
        weight: weights.goals,
        score: goalsResult.score,
      },
    };

    // Calculate weighted final score
    let finalScore =
      proximityResult.score * weights.proximity +
      interestResult.score * weights.interests +
      ageResult.score * weights.age +
      lifestyleResult.score * weights.lifestyle +
      activityResult.score * weights.activity +
      goalsResult.score * weights.goals;

    // Apply bonuses
    if (this.config.boostVerifiedProfiles && userB.verificationStatus === 'verified') {
      finalScore += this.config.verifiedBonus;
    }

    if (this.config.boostActiveProfiles && activityResult.daysAgo <= 1) {
      finalScore += this.config.activeBonus;
    }

    // Clamp to 0-100
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    return {
      userId: userA.id,
      targetUserId: userB.id,
      proximityScore: proximityResult.score,
      interestMatch: interestResult.score,
      compatibilityScore: ageResult.score,
      lifestyleMatch: lifestyleResult.score,
      activityScore: activityResult.score,
      finalScore,
      breakdown,
    };
  }

  /**
   * Calculate proximity score based on distance
   */
  private static calculateProximityScore(
    userA: DatingProfile,
    userB: DatingProfile
  ): {score: number; distance: number} {
    const distance = this.haversineDistance(
      userA.location.latitude,
      userA.location.longitude,
      userB.location.latitude,
      userB.location.longitude
    );

    const maxDistance = userA.datingPreferences?.maxDistance ?? 50;

    // Outside max distance = 0 score
    if (distance > maxDistance) {
      return {score: 0, distance};
    }

    // Exponential decay: closer is much better
    // At 0km = 100, at maxDistance = 0
    const decayFactor = 2;
    const normalizedDistance = distance / maxDistance;
    const score = 100 * Math.pow(1 - normalizedDistance, decayFactor);

    return {score: Math.round(score), distance: Math.round(distance)};
  }

  /**
   * Calculate interest overlap score with weighting
   */
  private static calculateInterestScore(
    userA: DatingProfile,
    userB: DatingProfile
  ): {score: number; shared: number; total: number} {
    const interestsA = userA.interests || [];
    const interestsB = userB.interests || [];

    if (interestsA.length === 0 && interestsB.length === 0) {
      return {score: 50, shared: 0, total: 0}; // Neutral
    }

    const setA = new Set(interestsA.map(i => i.toLowerCase()));
    const setB = new Set(interestsB.map(i => i.toLowerCase()));

    let shared = 0;
    setA.forEach(interest => {
      if (setB.has(interest)) {
        shared++;
      }
    });

    const total = new Set([...interestsA, ...interestsB]).size;

    // Jaccard similarity with boost for more shared interests
    const jaccard = total > 0 ? shared / total : 0;

    // Bonus for having multiple shared interests
    const sharedBonus = Math.min(shared * 5, 20);

    const score = Math.min(100, Math.round(jaccard * 80 + sharedBonus));

    return {score, shared, total};
  }

  /**
   * Calculate age compatibility score
   */
  private static calculateAgeScore(
    userA: DatingProfile,
    userB: DatingProfile
  ): {score: number; inRange: boolean} {
    const prefsA = userA.datingPreferences;
    const prefsB = userB.datingPreferences;

    // Check if both are in each other's age range
    const aInBRange =
      prefsB &&
      userA.age >= prefsB.ageRange.min &&
      userA.age <= prefsB.ageRange.max;

    const bInARange =
      prefsA &&
      userB.age >= prefsA.ageRange.min &&
      userB.age <= prefsA.ageRange.max;

    if (aInBRange && bInARange) {
      // Both in range - calculate how centered they are
      const midA = (prefsA.ageRange.min + prefsA.ageRange.max) / 2;
      const midB = (prefsB.ageRange.min + prefsB.ageRange.max) / 2;

      const deviationA = Math.abs(userB.age - midA) / ((prefsA.ageRange.max - prefsA.ageRange.min) / 2);
      const deviationB = Math.abs(userA.age - midB) / ((prefsB.ageRange.max - prefsB.ageRange.min) / 2);

      const avgDeviation = (deviationA + deviationB) / 2;
      const score = Math.round(100 * (1 - avgDeviation * 0.3));

      return {score: Math.max(70, score), inRange: true};
    }

    if (aInBRange || bInARange) {
      // One in range
      return {score: 40, inRange: false};
    }

    // Neither in range
    return {score: 0, inRange: false};
  }

  /**
   * Calculate lifestyle compatibility score
   */
  private static calculateLifestyleScore(
    userA: DatingProfile,
    userB: DatingProfile
  ): {score: number; matches: string[]} {
    const matches: string[] = [];
    let totalFactors = 0;
    let matchedFactors = 0;

    // Drinking compatibility
    if (userA.lifestyle?.drinking && userB.lifestyle?.drinking) {
      totalFactors++;
      if (this.areDrinkingHabitsCompatible(userA.lifestyle.drinking, userB.lifestyle.drinking)) {
        matchedFactors++;
        matches.push('drinking');
      }
    }

    // Smoking compatibility
    if (userA.lifestyle?.smoking && userB.lifestyle?.smoking) {
      totalFactors++;
      if (this.areSmokingHabitsCompatible(userA.lifestyle.smoking, userB.lifestyle.smoking)) {
        matchedFactors++;
        matches.push('smoking');
      }
    }

    // Exercise compatibility
    if (userA.lifestyle?.exercise && userB.lifestyle?.exercise) {
      totalFactors++;
      if (this.areExerciseHabitsCompatible(userA.lifestyle.exercise, userB.lifestyle.exercise)) {
        matchedFactors++;
        matches.push('exercise');
      }
    }

    // Diet compatibility
    if (userA.lifestyle?.diet && userB.lifestyle?.diet) {
      totalFactors++;
      if (userA.lifestyle.diet === userB.lifestyle.diet) {
        matchedFactors++;
        matches.push('diet');
      }
    }

    // Children preference compatibility
    if (userA.lifestyle?.children && userB.lifestyle?.children) {
      totalFactors++;
      if (this.areChildrenPrefsCompatible(userA.lifestyle.children, userB.lifestyle.children)) {
        matchedFactors++;
        matches.push('children');
      }
    }

    // Pet compatibility
    if (userA.lifestyle?.pets && userB.lifestyle?.pets) {
      totalFactors++;
      if (this.arePetPrefsCompatible(userA.lifestyle.pets, userB.lifestyle.pets)) {
        matchedFactors++;
        matches.push('pets');
      }
    }

    if (totalFactors === 0) {
      return {score: 50, matches}; // Neutral if no lifestyle data
    }

    const score = Math.round((matchedFactors / totalFactors) * 100);
    return {score, matches};
  }

  /**
   * Calculate activity/recency score
   */
  private static calculateActivityScore(
    userB: DatingProfile
  ): {score: number; daysAgo: number} {
    if (!userB.lastActive) {
      return {score: 50, daysAgo: -1};
    }

    const lastActive = new Date(userB.lastActive);
    const now = new Date();
    const daysAgo = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Active today = 100, decay over time
    if (daysAgo === 0) {
      return {score: 100, daysAgo};
    } else if (daysAgo === 1) {
      return {score: 90, daysAgo};
    } else if (daysAgo <= 3) {
      return {score: 75, daysAgo};
    } else if (daysAgo <= 7) {
      return {score: 50, daysAgo};
    } else if (daysAgo <= 14) {
      return {score: 25, daysAgo};
    } else if (daysAgo <= 30) {
      return {score: 10, daysAgo};
    }

    return {score: 0, daysAgo};
  }

  /**
   * Calculate relationship goals compatibility
   */
  private static calculateGoalsScore(
    userA: DatingProfile,
    userB: DatingProfile
  ): {score: number; compatible: boolean} {
    const goalA = userA.relationshipGoal;
    const goalB = userB.relationshipGoal;

    if (!goalA || !goalB) {
      return {score: 50, compatible: true};
    }

    // Exact match
    if (goalA === goalB) {
      return {score: 100, compatible: true};
    }

    // Compatible combinations
    const compatiblePairs: [RelationshipGoal, RelationshipGoal][] = [
      ['long_term', 'not_sure'],
      ['short_term', 'casual'],
      ['short_term', 'not_sure'],
      ['casual', 'not_sure'],
      ['friendship', 'not_sure'],
    ];

    const isCompatible = compatiblePairs.some(
      ([a, b]) =>
        (goalA === a && goalB === b) || (goalA === b && goalB === a)
    );

    if (isCompatible) {
      return {score: 70, compatible: true};
    }

    // Incompatible
    return {score: 20, compatible: false};
  }

  // ============================================
  // Lifestyle Compatibility Helpers
  // ============================================

  private static areDrinkingHabitsCompatible(a: DrinkingHabit, b: DrinkingHabit): boolean {
    // Never drinkers may not match well with regular drinkers
    if ((a === 'never' && b === 'regularly') || (b === 'never' && a === 'regularly')) {
      return false;
    }
    // Social drinkers match with most
    if (a === 'socially' || b === 'socially') {
      return true;
    }
    return a === b;
  }

  private static areSmokingHabitsCompatible(a: SmokingHabit, b: SmokingHabit): boolean {
    // Non-smokers typically prefer other non-smokers
    if (a === 'never' && b === 'never') {
      return true;
    }
    if (a === 'never' || b === 'never') {
      return false;
    }
    return true;
  }

  private static areExerciseHabitsCompatible(a: ExerciseFrequency, b: ExerciseFrequency): boolean {
    const levels: Record<ExerciseFrequency, number> = {
      never: 0,
      sometimes: 1,
      often: 2,
      daily: 3,
    };
    // Within 1 level is compatible
    return Math.abs(levels[a] - levels[b]) <= 1;
  }

  private static areChildrenPrefsCompatible(a: ChildrenPreference, b: ChildrenPreference): boolean {
    // Want kids + don't want = incompatible
    if (
      (a === 'want_someday' && b === 'dont_want') ||
      (b === 'want_someday' && a === 'dont_want')
    ) {
      return false;
    }
    // Not sure matches with anything
    if (a === 'not_sure' || b === 'not_sure') {
      return true;
    }
    // Open to kids matches with most
    if (a === 'open_to_kids' || b === 'open_to_kids') {
      return true;
    }
    return a === b;
  }

  private static arePetPrefsCompatible(a: string, b: string): boolean {
    // Allergic + have pets = problem
    if ((a === 'allergic' && b === 'have_pets') || (b === 'allergic' && a === 'have_pets')) {
      return false;
    }
    return true;
  }

  // ============================================
  // Distance Calculation
  // ============================================

  /**
   * Haversine formula for distance between coordinates
   */
  static haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  // ============================================
  // Profile Filtering
  // ============================================

  /**
   * Filter profiles based on user preferences
   */
  static filterProfiles(
    profiles: DatingProfile[],
    currentUser: DatingProfile,
    preferences: DatingPreferences
  ): DatingProfile[] {
    return profiles.filter(profile => {
      // Never show self
      if (profile.id === currentUser.id || profile.userId === currentUser.userId) {
        return false;
      }

      // Gender preference
      if (preferences.genderPreference !== 'everyone') {
        if (profile.gender !== preferences.genderPreference) {
          return false;
        }
      }

      // Age range
      if (profile.age < preferences.ageRange.min || profile.age > preferences.ageRange.max) {
        return false;
      }

      // Distance
      const distance = this.haversineDistance(
        currentUser.location.latitude,
        currentUser.location.longitude,
        profile.location.latitude,
        profile.location.longitude
      );
      if (distance > preferences.maxDistance) {
        return false;
      }

      // Relationship goals
      if (preferences.relationshipGoals && preferences.relationshipGoals.length > 0) {
        if (!preferences.relationshipGoals.includes(profile.relationshipGoal)) {
          return false;
        }
      }

      // Verified only
      if (preferences.showOnlyVerified && profile.verificationStatus !== 'verified') {
        return false;
      }

      // With bio only
      if (preferences.showOnlyWithBio && (!profile.bio || profile.bio.trim().length === 0)) {
        return false;
      }

      // With photos only
      if (preferences.showOnlyWithPhotos && (!profile.photos || profile.photos.length === 0)) {
        return false;
      }

      // Active only (within last 7 days)
      if (preferences.showOnlyActive && profile.lastActive) {
        const lastActive = new Date(profile.lastActive);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (lastActive < sevenDaysAgo) {
          return false;
        }
      }

      // Height range (advanced filter)
      if (preferences.heightRange && profile.basics?.height) {
        if (
          profile.basics.height < preferences.heightRange.min ||
          profile.basics.height > preferences.heightRange.max
        ) {
          return false;
        }
      }

      // Education level (advanced filter)
      if (preferences.educationLevels && preferences.educationLevels.length > 0) {
        if (profile.work?.education && !preferences.educationLevels.includes(profile.work.education)) {
          return false;
        }
      }

      // Drinking (advanced filter)
      if (preferences.drinking && preferences.drinking.length > 0) {
        if (profile.lifestyle?.drinking && !preferences.drinking.includes(profile.lifestyle.drinking)) {
          return false;
        }
      }

      // Smoking (advanced filter)
      if (preferences.smoking && preferences.smoking.length > 0) {
        if (profile.lifestyle?.smoking && !preferences.smoking.includes(profile.lifestyle.smoking)) {
          return false;
        }
      }

      return true;
    });
  }

  // ============================================
  // Recommendations Engine
  // ============================================

  /**
   * Get recommended profiles sorted by compatibility
   */
  static getRecommendations(
    currentUser: DatingProfile,
    allProfiles: DatingProfile[],
    preferences?: DatingPreferences,
    limit: number = 50
  ): DatingProfile[] {
    const prefs = preferences || currentUser.datingPreferences;

    // Filter profiles first
    const filteredProfiles = this.filterProfiles(allProfiles, currentUser, prefs);

    // Calculate scores and sort
    const scoredProfiles = filteredProfiles.map(profile => {
      const score = this.calculateCompatibility(currentUser, profile);
      return {
        ...profile,
        compatibilityScore: score.finalScore,
        distance: Math.round(
          this.haversineDistance(
            currentUser.location.latitude,
            currentUser.location.longitude,
            profile.location.latitude,
            profile.location.longitude
          )
        ),
      };
    });

    // Sort by score (with some randomization to avoid staleness)
    scoredProfiles.sort((a, b) => {
      // Add small random factor for variety (up to 5 points)
      const randomFactorA = Math.random() * 5;
      const randomFactorB = Math.random() * 5;
      return (b.compatibilityScore! + randomFactorB) - (a.compatibilityScore! + randomFactorA);
    });

    // Prioritize shared interests if preference is set
    if (prefs.prioritizeSharedInterests) {
      scoredProfiles.sort((a, b) => {
        const sharedA = this.countSharedInterests(currentUser.interests, a.interests);
        const sharedB = this.countSharedInterests(currentUser.interests, b.interests);

        // Heavily weight shared interests
        const adjustedScoreA = (a.compatibilityScore || 0) + sharedA * 10;
        const adjustedScoreB = (b.compatibilityScore || 0) + sharedB * 10;

        return adjustedScoreB - adjustedScoreA;
      });
    }

    return scoredProfiles.slice(0, limit);
  }

  /**
   * Count shared interests between two users
   */
  private static countSharedInterests(
    interestsA: string[] = [],
    interestsB: string[] = []
  ): number {
    const setA = new Set(interestsA.map(i => i.toLowerCase()));
    let count = 0;
    interestsB.forEach(interest => {
      if (setA.has(interest.toLowerCase())) {
        count++;
      }
    });
    return count;
  }

  // ============================================
  // Boost & Premium Features
  // ============================================

  /**
   * Apply boost multiplier to profile visibility score
   */
  static applyBoost(score: number, boostMultiplier: number = 2): number {
    return Math.min(100, score * boostMultiplier);
  }

  /**
   * Check if user can perform action based on limits
   */
  static canPerformAction(
    action: 'like' | 'super_like' | 'rewind' | 'boost',
    remaining: number,
    isPremium: boolean = false
  ): {allowed: boolean; reason?: string} {
    if (isPremium && action === 'like') {
      return {allowed: true}; // Unlimited likes for premium
    }

    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `No ${action.replace('_', ' ')}s remaining. Try again tomorrow.`,
      };
    }

    return {allowed: true};
  }

  // ============================================
  // Ice Breakers
  // ============================================

  /**
   * Generate ice breaker questions based on shared interests
   */
  static generateIceBreakers(
    userA: DatingProfile,
    userB: DatingProfile
  ): string[] {
    const iceBreakers: string[] = [];
    const sharedInterests = (userA.interests || []).filter(i =>
      (userB.interests || []).map(x => x.toLowerCase()).includes(i.toLowerCase())
    );

    // Add interest-based ice breakers
    sharedInterests.slice(0, 2).forEach(interest => {
      iceBreakers.push(`I noticed you're also into ${interest}! What got you started?`);
    });

    // Add prompt-based ice breakers
    if (userB.prompts && userB.prompts.length > 0) {
      const randomPrompt = userB.prompts[Math.floor(Math.random() * userB.prompts.length)];
      if (randomPrompt.answer) {
        iceBreakers.push(`Loved your answer about "${randomPrompt.question.slice(0, 30)}..." - tell me more!`);
      }
    }

    // Add location-based ice breaker
    if (userB.location.city) {
      iceBreakers.push(`What's your favorite spot in ${userB.location.city}?`);
    }

    // Generic fallbacks
    if (iceBreakers.length < 3) {
      iceBreakers.push("What's been the highlight of your week?");
      iceBreakers.push("If you could travel anywhere tomorrow, where would you go?");
    }

    return iceBreakers.slice(0, 3);
  }
}
