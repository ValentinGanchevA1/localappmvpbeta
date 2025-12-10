// src/services/datingService.ts
import { DatingProfile } from '@/types/dating';

export class DatingService {
  /**
   * Provides dating recommendations based on a user's profile and a list of potential candidates.
   * This is a simplified example. A real-world algorithm would be much more complex.
   */
  public static getRecommendations(
    currentUser: DatingProfile,
    allProfiles: DatingProfile[]
  ): DatingProfile[] {
    return allProfiles.filter(profile => {
      if (profile.id === currentUser.id) {
        return false; // Exclude self
      }
      // Simple logic: recommend profiles with at least one common interest
      const commonInterests = profile.interests.filter(interest =>
        currentUser.interests.includes(interest)
      );
      return commonInterests.length > 0;
    });
  }
}
