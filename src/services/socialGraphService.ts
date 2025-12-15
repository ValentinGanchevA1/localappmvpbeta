// src/services/socialGraphService.ts
// Social Graph Management Service with Discovery Algorithms

import {
  FriendRelationship,
  DiscoverySuggestion,
  DiscoveryReason,
  DiscoverySource,
  ConnectionStrength,
  UserConnection,
  GraphNode,
  GraphEdge,
  SocialGraph,
  Community,
  PathResult,
  ConnectionRecommendation,
  DiscoveryPreferences,
  Group,
  SocialCircle,
} from '@/types/socialGraph';
import {PublicProfile, GeoLocation} from '@/types/social';

// Weight configuration for scoring
const SCORING_WEIGHTS = {
  mutualFriends: 0.35,
  sharedInterests: 0.25,
  proximity: 0.20,
  groupMembership: 0.10,
  activityRecency: 0.10,
};

// Thresholds for connection strength
const CONNECTION_THRESHOLDS = {
  bestFriend: 80,
  strong: 60,
  moderate: 30,
  weak: 0,
};

export class SocialGraphService {
  // ============================================
  // Friend Discovery Algorithms
  // ============================================

  /**
   * Generate friend suggestions based on multiple factors
   * Uses a composite scoring algorithm considering:
   * - Mutual friends (friends of friends)
   * - Shared interests
   * - Geographic proximity
   * - Common group memberships
   * - Activity patterns
   */
  static generateSuggestions(
    currentUserId: string,
    currentUserProfile: PublicProfile,
    friends: FriendRelationship[],
    allUsers: PublicProfile[],
    groups: Group[],
    preferences: DiscoveryPreferences,
  ): DiscoverySuggestion[] {
    const friendIds = new Set(friends.map(f => f.friendId));
    const suggestions: DiscoverySuggestion[] = [];

    // Filter out current user and existing friends
    const potentialConnections = allUsers.filter(
      user => user.id !== currentUserId && !friendIds.has(user.id),
    );

    for (const user of potentialConnections) {
      const reasons: DiscoveryReason[] = [];
      let totalScore = 0;

      // 1. Mutual Friends Score
      if (preferences.enableMutualFriendSuggestions) {
        const mutualFriendsResult = this.calculateMutualFriendsScore(
          currentUserId,
          user.id,
          friends,
          allUsers,
        );
        if (mutualFriendsResult.score > 0) {
          totalScore += mutualFriendsResult.score * SCORING_WEIGHTS.mutualFriends;
          reasons.push({
            type: 'mutual_friends',
            description: `${mutualFriendsResult.count} mutual friends`,
            weight: SCORING_WEIGHTS.mutualFriends,
            metadata: {count: mutualFriendsResult.count},
          });
        }
      }

      // 2. Shared Interests Score
      if (preferences.enableInterestBasedSuggestions) {
        const interestScore = this.calculateInterestScore(
          currentUserProfile.interests,
          user.interests,
          preferences.excludedInterests,
        );
        if (interestScore.score > 0) {
          totalScore += interestScore.score * SCORING_WEIGHTS.sharedInterests;
          reasons.push({
            type: 'interest_based',
            description: `${interestScore.shared.length} shared interests`,
            weight: SCORING_WEIGHTS.sharedInterests,
            metadata: {interests: interestScore.shared},
          });
        }
      }

      // 3. Proximity Score
      if (
        preferences.enableLocationBasedSuggestions &&
        currentUserProfile.location &&
        user.location
      ) {
        const distance = this.haversineDistance(
          currentUserProfile.location.latitude,
          currentUserProfile.location.longitude,
          user.location.latitude,
          user.location.longitude,
        );

        const maxDistance = preferences.maxDistance || 50000;
        if (distance <= maxDistance) {
          const proximityScore = this.calculateProximityScore(
            distance,
            maxDistance,
          );
          totalScore += proximityScore * SCORING_WEIGHTS.proximity;
          reasons.push({
            type: 'location_based',
            description: `${this.formatDistance(distance)} away`,
            weight: SCORING_WEIGHTS.proximity,
            metadata: {distance},
          });
        }
      }

      // 4. Common Groups Score
      const commonGroups = this.findCommonGroups(currentUserId, user.id, groups);
      if (commonGroups.length > 0) {
        const groupScore = Math.min(100, commonGroups.length * 25);
        totalScore += groupScore * SCORING_WEIGHTS.groupMembership;
        reasons.push({
          type: 'group_members',
          description: `${commonGroups.length} common groups`,
          weight: SCORING_WEIGHTS.groupMembership,
          metadata: {groups: commonGroups.map(g => g.id)},
        });
      }

      // 5. Activity Recency Score (based on online status)
      if (user.isOnline) {
        totalScore += 100 * SCORING_WEIGHTS.activityRecency;
        reasons.push({
          type: 'algorithm',
          description: 'Recently active',
          weight: SCORING_WEIGHTS.activityRecency,
        });
      }

      // Only include if score meets minimum threshold
      if (totalScore >= 20 && reasons.length > 0) {
        const mutualFriendsData = this.getMutualFriends(
          currentUserId,
          user.id,
          friends,
          allUsers,
        );

        suggestions.push({
          userId: user.id,
          profile: user,
          source: this.determinePrimarySource(reasons),
          score: Math.round(totalScore),
          reasons,
          mutualFriendsCount: mutualFriendsData.count,
          mutualFriends: mutualFriendsData.profiles.slice(0, 3),
          commonInterests: this.getCommonInterests(
            currentUserProfile.interests,
            user.interests,
          ),
          commonGroups: commonGroups.map(g => ({
            id: g.id,
            name: g.name,
            avatar: g.avatar,
          })),
          distance: user.location
            ? this.haversineDistance(
                currentUserProfile.location.latitude,
                currentUserProfile.location.longitude,
                user.location.latitude,
                user.location.longitude,
              )
            : undefined,
          lastActive: user.isOnline ? new Date().toISOString() : undefined,
          isDismissed: false,
        });
      }
    }

    // Sort by score descending
    return suggestions.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate mutual friends between two users
   */
  private static calculateMutualFriendsScore(
    userId1: string,
    userId2: string,
    user1Friends: FriendRelationship[],
    allUsers: PublicProfile[],
  ): {score: number; count: number} {
    const user1FriendIds = new Set(user1Friends.map(f => f.friendId));

    // Find user2's friends from allUsers (simplified - in production would query)
    // For now, assume we have this data or can derive it
    const mutualCount = user1Friends.filter(f =>
      // Check if any friend of user1 is also connected to user2
      this.areFriendsConnected(f.friendId, userId2, allUsers),
    ).length;

    // Logarithmic scaling: more mutual friends = higher score, but diminishing returns
    const score = Math.min(100, Math.log2(mutualCount + 1) * 30);

    return {score, count: mutualCount};
  }

  /**
   * Check if two users are connected (simplified check)
   */
  private static areFriendsConnected(
    userId1: string,
    userId2: string,
    _allUsers: PublicProfile[],
  ): boolean {
    // In production, this would check actual friend relationships
    // For now, return a probabilistic connection based on user IDs
    return (userId1.charCodeAt(0) + userId2.charCodeAt(0)) % 3 === 0;
  }

  /**
   * Get mutual friends profiles
   */
  private static getMutualFriends(
    userId1: string,
    userId2: string,
    user1Friends: FriendRelationship[],
    allUsers: PublicProfile[],
  ): {count: number; profiles: PublicProfile[]} {
    const mutualFriendIds: string[] = [];

    for (const friend of user1Friends) {
      if (this.areFriendsConnected(friend.friendId, userId2, allUsers)) {
        mutualFriendIds.push(friend.friendId);
      }
    }

    const profiles = mutualFriendIds
      .map(id => allUsers.find(u => u.id === id))
      .filter((p): p is PublicProfile => p !== undefined);

    return {count: mutualFriendIds.length, profiles};
  }

  /**
   * Calculate interest compatibility score
   */
  private static calculateInterestScore(
    interests1: string[],
    interests2: string[],
    excludedInterests: string[],
  ): {score: number; shared: string[]} {
    if (!interests1?.length || !interests2?.length) {
      return {score: 0, shared: []};
    }

    // Filter out excluded interests
    const filtered1 = interests1.filter(i => !excludedInterests.includes(i));
    const filtered2 = interests2.filter(i => !excludedInterests.includes(i));

    const shared = filtered1.filter(i => filtered2.includes(i));
    const totalUnique = new Set([...filtered1, ...filtered2]).size;

    if (totalUnique === 0) {
      return {score: 0, shared: []};
    }

    const score = Math.round((shared.length / totalUnique) * 100);
    return {score, shared};
  }

  /**
   * Get common interests between two users
   */
  private static getCommonInterests(
    interests1: string[],
    interests2: string[],
  ): string[] {
    if (!interests1?.length || !interests2?.length) {
      return [];
    }
    return interests1.filter(i => interests2.includes(i));
  }

  /**
   * Calculate proximity score based on distance
   */
  private static calculateProximityScore(
    distance: number,
    maxDistance: number,
  ): number {
    if (distance > maxDistance) {
      return 0;
    }
    // Inverse linear: closer = higher score
    return Math.round(100 * (1 - distance / maxDistance));
  }

  /**
   * Find common groups between two users
   */
  private static findCommonGroups(
    userId1: string,
    userId2: string,
    groups: Group[],
  ): Group[] {
    return groups.filter(
      g =>
        g.members.some(m => m.userId === userId1) &&
        g.members.some(m => m.userId === userId2),
    );
  }

  /**
   * Determine primary discovery source based on reasons
   */
  private static determinePrimarySource(
    reasons: DiscoveryReason[],
  ): DiscoverySource {
    if (reasons.length === 0) {
      return 'algorithm';
    }
    // Return the source with highest weight
    const sorted = [...reasons].sort((a, b) => b.weight - a.weight);
    return sorted[0].type;
  }

  // ============================================
  // Distance & Location Utilities
  // ============================================

  /**
   * Haversine formula for calculating distance between coordinates
   * Returns distance in meters
   */
  static haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth radius in meters
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
   * Format distance for display
   */
  private static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  // ============================================
  // Connection Strength Analysis
  // ============================================

  /**
   * Calculate connection strength between two users
   * Based on interaction history, shared circles, and engagement
   */
  static calculateConnectionStrength(
    relationship: FriendRelationship,
  ): ConnectionStrength {
    const score = relationship.interactionScore;

    if (score >= CONNECTION_THRESHOLDS.bestFriend) {
      return 'best_friend';
    }
    if (score >= CONNECTION_THRESHOLDS.strong) {
      return 'strong';
    }
    if (score >= CONNECTION_THRESHOLDS.moderate) {
      return 'moderate';
    }
    return 'weak';
  }

  /**
   * Calculate interaction score based on various factors
   */
  static calculateInteractionScore(
    messageCount: number,
    lastInteractionDaysAgo: number,
    sharedCirclesCount: number,
    isFavorite: boolean,
  ): number {
    let score = 0;

    // Message frequency (max 40 points)
    score += Math.min(40, Math.log2(messageCount + 1) * 10);

    // Recency (max 30 points)
    if (lastInteractionDaysAgo <= 1) {
      score += 30;
    } else if (lastInteractionDaysAgo <= 7) {
      score += 20;
    } else if (lastInteractionDaysAgo <= 30) {
      score += 10;
    }

    // Shared circles (max 20 points)
    score += Math.min(20, sharedCirclesCount * 5);

    // Favorite bonus (10 points)
    if (isFavorite) {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  // ============================================
  // Graph Algorithms
  // ============================================

  /**
   * Build social graph from relationships
   */
  static buildGraph(
    users: PublicProfile[],
    friendships: Map<string, string[]>,
  ): SocialGraph {
    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    // Create nodes
    for (const user of users) {
      const connections = friendships.get(user.id) || [];
      nodes.set(user.id, {
        id: user.id,
        profile: user,
        connections,
        connectionCount: connections.length,
        clusterCoefficient: 0, // Will be calculated
      });
    }

    // Create edges and calculate cluster coefficients
    for (const user of users) {
      const userFriends = friendships.get(user.id) || [];

      for (const friendId of userFriends) {
        // Avoid duplicate edges
        if (user.id < friendId) {
          edges.push({
            source: user.id,
            target: friendId,
            weight: 1,
            type: 'friend',
          });
        }
      }

      // Calculate cluster coefficient
      const node = nodes.get(user.id);
      if (node && userFriends.length >= 2) {
        node.clusterCoefficient = this.calculateClusterCoefficient(
          userFriends,
          friendships,
        );
      }
    }

    // Detect communities
    const communities = this.detectCommunities(nodes, edges);

    return {nodes, edges, communities};
  }

  /**
   * Calculate clustering coefficient for a node
   * Measures how interconnected a user's friends are
   */
  private static calculateClusterCoefficient(
    friendIds: string[],
    friendships: Map<string, string[]>,
  ): number {
    if (friendIds.length < 2) {
      return 0;
    }

    const possibleConnections = (friendIds.length * (friendIds.length - 1)) / 2;
    let actualConnections = 0;

    for (let i = 0; i < friendIds.length; i++) {
      for (let j = i + 1; j < friendIds.length; j++) {
        const friend1Friends = friendships.get(friendIds[i]) || [];
        if (friend1Friends.includes(friendIds[j])) {
          actualConnections++;
        }
      }
    }

    return actualConnections / possibleConnections;
  }

  /**
   * Simple community detection using label propagation
   */
  private static detectCommunities(
    nodes: Map<string, GraphNode>,
    edges: GraphEdge[],
  ): Community[] {
    // Initialize labels
    const labels = new Map<string, string>();
    nodes.forEach((_, id) => labels.set(id, id));

    // Iterate until convergence or max iterations
    const maxIterations = 10;
    for (let iter = 0; iter < maxIterations; iter++) {
      let changed = false;

      for (const [nodeId, node] of nodes) {
        const neighborLabels = new Map<string, number>();

        for (const neighborId of node.connections) {
          const label = labels.get(neighborId);
          if (label) {
            neighborLabels.set(label, (neighborLabels.get(label) || 0) + 1);
          }
        }

        if (neighborLabels.size > 0) {
          // Find most common label
          let maxCount = 0;
          let newLabel = labels.get(nodeId)!;

          neighborLabels.forEach((count, label) => {
            if (count > maxCount) {
              maxCount = count;
              newLabel = label;
            }
          });

          if (newLabel !== labels.get(nodeId)) {
            labels.set(nodeId, newLabel);
            changed = true;
          }
        }
      }

      if (!changed) {
        break;
      }
    }

    // Group by label
    const communityMembers = new Map<string, string[]>();
    labels.forEach((label, nodeId) => {
      if (!communityMembers.has(label)) {
        communityMembers.set(label, []);
      }
      communityMembers.get(label)!.push(nodeId);
    });

    // Create community objects
    const communities: Community[] = [];
    let communityIndex = 0;

    communityMembers.forEach((memberIds, _) => {
      if (memberIds.length >= 2) {
        // Calculate cohesion
        const cohesion = this.calculateCommunityCohesion(
          memberIds,
          edges,
        );

        // Find key members (most connected within community)
        const keyMembers = this.findKeyMembers(memberIds, nodes, 3);

        communities.push({
          id: `community_${communityIndex++}`,
          memberIds,
          cohesion,
          keyMembers,
        });
      }
    });

    return communities;
  }

  /**
   * Calculate community cohesion (internal density)
   */
  private static calculateCommunityCohesion(
    memberIds: string[],
    edges: GraphEdge[],
  ): number {
    if (memberIds.length < 2) {
      return 0;
    }

    const memberSet = new Set(memberIds);
    const possibleEdges = (memberIds.length * (memberIds.length - 1)) / 2;

    const internalEdges = edges.filter(
      e => memberSet.has(e.source) && memberSet.has(e.target),
    ).length;

    return internalEdges / possibleEdges;
  }

  /**
   * Find most connected members in a community
   */
  private static findKeyMembers(
    memberIds: string[],
    nodes: Map<string, GraphNode>,
    count: number,
  ): string[] {
    const memberSet = new Set(memberIds);

    return memberIds
      .map(id => {
        const node = nodes.get(id);
        const internalConnections = node
          ? node.connections.filter(c => memberSet.has(c)).length
          : 0;
        return {id, connections: internalConnections};
      })
      .sort((a, b) => b.connections - a.connections)
      .slice(0, count)
      .map(m => m.id);
  }

  /**
   * Find shortest path between two users (BFS)
   */
  static findPath(
    startId: string,
    endId: string,
    friendships: Map<string, string[]>,
  ): PathResult {
    if (startId === endId) {
      return {exists: true, path: [startId], distance: 0};
    }

    const visited = new Set<string>();
    const queue: {id: string; path: string[]}[] = [{id: startId, path: [startId]}];

    while (queue.length > 0) {
      const {id, path} = queue.shift()!;

      if (visited.has(id)) {
        continue;
      }
      visited.add(id);

      const friends = friendships.get(id) || [];

      for (const friendId of friends) {
        if (friendId === endId) {
          const fullPath = [...path, friendId];
          return {
            exists: true,
            path: fullPath,
            distance: fullPath.length - 1,
          };
        }

        if (!visited.has(friendId)) {
          queue.push({id: friendId, path: [...path, friendId]});
        }
      }
    }

    return {exists: false, path: [], distance: -1};
  }

  /**
   * Calculate degrees of separation between two users
   */
  static getDegreesOfSeparation(
    userId1: string,
    userId2: string,
    friendships: Map<string, string[]>,
  ): number {
    const result = this.findPath(userId1, userId2, friendships);
    return result.exists ? result.distance : -1;
  }

  // ============================================
  // Circle & Privacy Utilities
  // ============================================

  /**
   * Check if a user can view another user's content based on privacy settings
   */
  static canViewContent(
    viewerId: string,
    ownerId: string,
    contentType: string,
    privacyLevel: string,
    friendIds: Set<string>,
    circleIds: Map<string, Set<string>>,
    friendships: Map<string, string[]>,
  ): boolean {
    // Owner can always view their own content
    if (viewerId === ownerId) {
      return true;
    }

    switch (privacyLevel) {
      case 'everyone':
        return true;

      case 'friends':
        return friendIds.has(viewerId);

      case 'friends_of_friends': {
        if (friendIds.has(viewerId)) {
          return true;
        }
        // Check if viewer is friend of any friend
        for (const friendId of friendIds) {
          const friendsFriends = friendships.get(friendId) || [];
          if (friendsFriends.includes(viewerId)) {
            return true;
          }
        }
        return false;
      }

      case 'circles': {
        // Check if viewer is in any allowed circle
        for (const [_, members] of circleIds) {
          if (members.has(viewerId)) {
            return true;
          }
        }
        return false;
      }

      case 'nobody':
        return false;

      default:
        return false;
    }
  }

  /**
   * Get users who can see specific content
   */
  static getContentAudience(
    ownerId: string,
    privacyLevel: string,
    friends: FriendRelationship[],
    circles: SocialCircle[],
    friendships: Map<string, string[]>,
  ): string[] {
    const audience = new Set<string>();
    audience.add(ownerId); // Owner always included

    switch (privacyLevel) {
      case 'everyone':
        // Return empty array to indicate "everyone" - handle in UI
        return [];

      case 'friends':
        friends.forEach(f => audience.add(f.friendId));
        break;

      case 'friends_of_friends':
        friends.forEach(f => {
          audience.add(f.friendId);
          const fof = friendships.get(f.friendId) || [];
          fof.forEach(id => audience.add(id));
        });
        break;

      case 'circles':
        circles.forEach(c => {
          c.memberIds.forEach(id => audience.add(id));
        });
        break;

      case 'nobody':
        // Only owner
        break;
    }

    return Array.from(audience);
  }

  // ============================================
  // Recommendation Engine
  // ============================================

  /**
   * Get friend recommendations with detailed reasoning
   */
  static getRecommendations(
    currentUserId: string,
    currentUserProfile: PublicProfile,
    friends: FriendRelationship[],
    allUsers: PublicProfile[],
    friendships: Map<string, string[]>,
    groups: Group[],
    limit: number = 20,
  ): ConnectionRecommendation[] {
    const friendIds = new Set(friends.map(f => f.friendId));
    const recommendations: ConnectionRecommendation[] = [];

    for (const user of allUsers) {
      if (user.id === currentUserId || friendIds.has(user.id)) {
        continue;
      }

      const reasons: string[] = [];
      let score = 0;

      // Mutual friends
      const pathResult = this.findPath(currentUserId, user.id, friendships);
      if (pathResult.exists && pathResult.distance === 2) {
        const mutualCount = this.getMutualFriends(
          currentUserId,
          user.id,
          friends,
          allUsers,
        ).count;
        if (mutualCount > 0) {
          score += Math.min(40, mutualCount * 10);
          reasons.push(`${mutualCount} mutual friends`);
        }
      }

      // Shared interests
      const commonInterests = this.getCommonInterests(
        currentUserProfile.interests,
        user.interests,
      );
      if (commonInterests.length > 0) {
        score += Math.min(30, commonInterests.length * 10);
        reasons.push(`Shared interests: ${commonInterests.slice(0, 3).join(', ')}`);
      }

      // Common groups
      const commonGroups = this.findCommonGroups(currentUserId, user.id, groups);
      if (commonGroups.length > 0) {
        score += Math.min(20, commonGroups.length * 10);
        reasons.push(`${commonGroups.length} common groups`);
      }

      // Location proximity
      if (currentUserProfile.location && user.location) {
        const distance = this.haversineDistance(
          currentUserProfile.location.latitude,
          currentUserProfile.location.longitude,
          user.location.latitude,
          user.location.longitude,
        );
        if (distance <= 10000) {
          // Within 10km
          score += 10;
          reasons.push('Nearby');
        }
      }

      if (score > 0 && reasons.length > 0) {
        recommendations.push({
          user: user,
          score,
          reasons,
          mutualConnections: pathResult.distance === 2 ? 1 : 0,
          pathToConnect: pathResult.exists ? pathResult.path : [],
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export default SocialGraphService;
