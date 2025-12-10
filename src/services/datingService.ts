// src/services/datingService.ts
import { DatingProfile, DatingScore } from '@/types/dating';

export class DatingService {
  /**
   * Calculate compatibility between two users
   * Factors: interests, age, location, preferences
   */
  static calculateCompatibility(
    userA: DatingProfile,
    userB: DatingProfile
  ): DatingScore {
    const proximityScore = this.calculateProximityScore(userA, userB);
    const interestMatch = this.calculateInterestMatch(userA, userB);
    const ageCompatibility = this.calculateAgeCompatibility(userA, userB);

    // Weighted scoring
    const finalScore =
      proximityScore * 0.3 + // 30% location proximity
      interestMatch * 0.4 +   // 40% shared interests
      ageCompatibility * 0.3; // 30% age compatibility

    return {
      userId: userA.id,
      targetUserId: userB.id,
      proximityScore,
      interestMatch,
      compatibilityScore: ageCompatibility,
      finalScore: Math.round(finalScore),
    };
  }

  /**
   * Distance-based scoring (inverse)
   * Closer = higher score
   */
  private static calculateProximityScore(
    userA: DatingProfile,
    userB: DatingProfile
  ): number {
    const distance = this.haversineDistance(
      userA.location.latitude,
      userA.location.longitude,
      userB.location.latitude,
      userB.location.longitude
    );

    // If within max distance, score based on closeness
    if (distance > userB.datingPreferences.maxDistance) {
      return 0; // Outside preference range
    }

    // Inverse: closer = higher score (100 at 0km, 0 at maxDistance)
    return Math.max(0, 100 * (1 - distance / userB.datingPreferences.maxDistance));
  }

  /**
   * Calculate % of shared interests
   */
  private static calculateInterestMatch(
    userA: DatingProfile,
    userB: DatingProfile
  ): number {
    if (!userA.interests?.length || !userB.interests?.length) {
      return 50; // Neutral score if no interests
    }

    const shared = userA.interests.filter(i =>
      userB.interests.includes(i)
    ).length;

    const totalUnique = new Set([...userA.interests, ...userB.interests]).size;
    return Math.round((shared / totalUnique) * 100);
  }

  /**
   * Check if age falls within preference ranges
   */
  private static calculateAgeCompatibility(
    userA: DatingProfile,
    userB: DatingProfile
  ): number {
    const aInBRange =
      userA.age >= userB.datingPreferences.ageRange.min &&
      userA.age <= userB.datingPreferences.ageRange.max;

    const bInARange =
      userB.age >= userA.datingPreferences.ageRange.min &&
      userB.age <= userA.datingPreferences.ageRange.max;

    // Mutual compatibility
    return aInBRange && bInARange ? 100 : 0;
  }

  /**
   * Haversine formula for lat/long distance
   */
  private static haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get recommended profiles for user (filtered + scored)
   */
  static async getRecommendations(
    currentUser: DatingProfile,
    allProfiles: DatingProfile[]
  ): Promise<DatingProfile[]> {
    return allProfiles
      .filter(p => {
        // Filter out: self, already swiped, wrong gender preference
        if (p.id === currentUser.id) return false;
        if (p.gender !== currentUser.lookingFor && currentUser.lookingFor !== 'any') {
          return false;
        }
        return true;
      })
      .map(profile => ({
        ...profile,
        _score: this.calculateCompatibility(currentUser, profile).finalScore,
      }))
      .sort((a, b) => (b._score || 0) - (a._score || 0))
      .slice(0, 50); // Top 50 recommendations
  }
}
