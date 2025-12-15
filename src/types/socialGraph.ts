// src/types/socialGraph.ts
// Social Graph Management Types

import {GeoLocation, PublicProfile} from './social';

// ============================================
// Relationship & Connection Types
// ============================================

export type FriendshipStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'accepted'
  | 'blocked';

export type ConnectionStrength = 'weak' | 'moderate' | 'strong' | 'best_friend';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderProfile: PublicProfile;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  respondedAt?: string;
  mutualFriendsCount: number;
  mutualFriends: string[]; // User IDs of mutual friends
}

export interface FriendRelationship {
  id: string;
  userId: string;
  friendId: string;
  friendProfile: PublicProfile;
  status: FriendshipStatus;
  connectionStrength: ConnectionStrength;
  createdAt: string;
  lastInteraction?: string;
  mutualFriendsCount: number;
  sharedCircles: string[]; // Circle IDs they share
  interactionScore: number; // 0-100 based on activity
  notes?: string; // Private notes about this friend
  nickname?: string; // Custom nickname
  isFavorite: boolean;
  notificationsMuted: boolean;
}

export interface UserConnection {
  userId: string;
  profile: PublicProfile;
  relationship: FriendRelationship | null;
  connectionPath: string[]; // Chain of user IDs connecting to this user
  degreeOfSeparation: number; // 1 = direct friend, 2 = friend of friend, etc.
  commonInterests: string[];
  mutualFriendsCount: number;
}

// ============================================
// Social Circle Types (Privacy-Controlled Groups)
// ============================================

export type CircleVisibility = 'private' | 'friends_only' | 'public';

export interface SocialCircle {
  id: string;
  name: string;
  description?: string;
  color: string; // For UI display
  icon: string; // Icon name
  ownerId: string;
  memberIds: string[];
  members: PublicProfile[];
  visibility: CircleVisibility;
  permissions: CirclePermissions;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean; // e.g., "Close Friends", "Family"
}

export interface CirclePermissions {
  canViewLocation: boolean;
  canViewOnlineStatus: boolean;
  canViewPosts: boolean;
  canViewStories: boolean;
  canSendMessages: boolean;
  canViewActivity: boolean;
  canViewFriendList: boolean;
  canViewBio: boolean;
  canViewPhotos: boolean;
  customPermissions: Record<string, boolean>;
}

export interface CircleMembership {
  circleId: string;
  userId: string;
  addedAt: string;
  addedBy: string;
}

// ============================================
// Group Types (Shared Groups)
// ============================================

export type GroupType = 'public' | 'private' | 'secret';
export type GroupRole = 'owner' | 'admin' | 'moderator' | 'member';
export type JoinMethod = 'open' | 'approval_required' | 'invite_only';

export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  type: GroupType;
  joinMethod: JoinMethod;
  category?: string;
  tags: string[];
  ownerId: string;
  memberCount: number;
  members: GroupMember[];
  admins: string[];
  moderators: string[];
  settings: GroupSettings;
  rules: string[];
  location?: GeoLocation;
  locationName?: string;
  isLocationBased: boolean;
  radius?: number; // For location-based groups, in meters
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
}

export interface GroupMember {
  userId: string;
  profile: PublicProfile;
  role: GroupRole;
  joinedAt: string;
  invitedBy?: string;
  contributionScore: number;
  isMuted: boolean;
  lastSeen?: string;
}

export interface GroupSettings {
  allowMemberPosts: boolean;
  allowMemberInvites: boolean;
  requirePostApproval: boolean;
  allowPolls: boolean;
  allowEvents: boolean;
  allowMediaSharing: boolean;
  notifyOnNewMembers: boolean;
  notifyOnNewPosts: boolean;
  maxMembers?: number;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  group: Pick<Group, 'id' | 'name' | 'avatar' | 'type' | 'memberCount'>;
  inviterId: string;
  inviterProfile: PublicProfile;
  inviteeId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt?: string;
}

export interface GroupJoinRequest {
  id: string;
  groupId: string;
  userId: string;
  userProfile: PublicProfile;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

// ============================================
// Privacy Settings Types
// ============================================

export type PrivacyLevel = 'everyone' | 'friends' | 'friends_of_friends' | 'circles' | 'nobody';

export interface PrivacySettings {
  // Profile Visibility
  profileVisibility: PrivacyLevel;
  bioVisibility: PrivacyLevel;
  avatarVisibility: PrivacyLevel;

  // Location Privacy
  locationSharing: PrivacyLevel;
  locationPrecision: 'exact' | 'approximate' | 'city_only' | 'hidden';
  locationSharingCircles: string[]; // Circle IDs allowed to see location

  // Online Status
  onlineStatusVisibility: PrivacyLevel;
  lastSeenVisibility: PrivacyLevel;

  // Activity & Posts
  postsVisibility: PrivacyLevel;
  activityVisibility: PrivacyLevel;
  storiesVisibility: PrivacyLevel;

  // Friend List & Connections
  friendListVisibility: PrivacyLevel;
  mutualFriendsVisibility: PrivacyLevel;
  groupMembershipVisibility: PrivacyLevel;

  // Communication
  whoCanMessage: PrivacyLevel;
  whoCanCall: PrivacyLevel;
  whoCanAddToGroups: PrivacyLevel;
  whoCanSendFriendRequests: PrivacyLevel;

  // Discovery
  discoverableByEmail: boolean;
  discoverableByPhone: boolean;
  discoverableByLocation: boolean;
  discoverableByInterests: boolean;
  discoverableInSearch: boolean;

  // Blocking & Restrictions
  blockedUserIds: string[];
  restrictedUserIds: string[]; // Limited interaction without blocking
  hiddenFromUserIds: string[]; // Hidden from specific users

  // Per-Circle Overrides
  circleOverrides: Record<string, Partial<CirclePermissions>>;
}

export interface PrivacyException {
  userId: string;
  overrides: Partial<PrivacySettings>;
  reason?: string;
  createdAt: string;
}

// ============================================
// Friend Discovery Types
// ============================================

export type DiscoverySource =
  | 'mutual_friends'
  | 'location_based'
  | 'interest_based'
  | 'contacts_sync'
  | 'group_members'
  | 'event_attendees'
  | 'algorithm';

export interface DiscoverySuggestion {
  userId: string;
  profile: PublicProfile;
  source: DiscoverySource;
  score: number; // 0-100 recommendation score
  reasons: DiscoveryReason[];
  mutualFriendsCount: number;
  mutualFriends: PublicProfile[];
  commonInterests: string[];
  commonGroups: Pick<Group, 'id' | 'name' | 'avatar'>[];
  distance?: number; // In meters, if location-based
  lastActive?: string;
  isDismissed: boolean;
  dismissedAt?: string;
}

export interface DiscoveryReason {
  type: DiscoverySource;
  description: string;
  weight: number; // How much this contributed to the score
  metadata?: Record<string, unknown>;
}

export interface DiscoveryPreferences {
  enableLocationBasedSuggestions: boolean;
  enableInterestBasedSuggestions: boolean;
  enableMutualFriendSuggestions: boolean;
  enableContactSync: boolean;
  maxDistance?: number; // Max distance for location-based suggestions
  preferredAgeRange?: {min: number; max: number};
  excludedInterests: string[];
  minMutualFriends: number;
}

// ============================================
// Social Graph State Types
// ============================================

export interface SocialGraphState {
  // Friends
  friends: FriendRelationship[];
  friendsLoading: boolean;
  friendsError: string | null;

  // Friend Requests
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  requestsLoading: boolean;
  requestsError: string | null;

  // Social Circles
  circles: SocialCircle[];
  circlesLoading: boolean;
  circlesError: string | null;

  // Groups
  groups: Group[];
  groupInvites: GroupInvite[];
  groupJoinRequests: GroupJoinRequest[];
  groupsLoading: boolean;
  groupsError: string | null;

  // Discovery
  suggestions: DiscoverySuggestion[];
  discoveryPreferences: DiscoveryPreferences;
  suggestionsLoading: boolean;
  suggestionsError: string | null;

  // Privacy
  privacySettings: PrivacySettings;
  privacyLoading: boolean;
  privacyError: string | null;

  // Graph Metadata
  totalFriendsCount: number;
  totalGroupsCount: number;
  lastSyncedAt: string | null;
}

// ============================================
// API Request/Response Types
// ============================================

export interface SendFriendRequestPayload {
  targetUserId: string;
  message?: string;
}

export interface RespondToFriendRequestPayload {
  requestId: string;
  action: 'accept' | 'reject';
}

export interface UpdateFriendPayload {
  friendId: string;
  updates: Partial<Pick<FriendRelationship, 'nickname' | 'notes' | 'isFavorite' | 'notificationsMuted'>>;
}

export interface CreateCirclePayload {
  name: string;
  description?: string;
  color: string;
  icon: string;
  visibility: CircleVisibility;
  permissions: CirclePermissions;
  memberIds?: string[];
}

export interface UpdateCirclePayload {
  circleId: string;
  updates: Partial<Omit<SocialCircle, 'id' | 'ownerId' | 'createdAt'>>;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  type: GroupType;
  joinMethod: JoinMethod;
  category?: string;
  tags?: string[];
  settings?: Partial<GroupSettings>;
  rules?: string[];
  location?: GeoLocation;
  locationName?: string;
  radius?: number;
}

export interface UpdateGroupPayload {
  groupId: string;
  updates: Partial<Omit<Group, 'id' | 'ownerId' | 'createdAt' | 'members'>>;
}

export interface InviteToGroupPayload {
  groupId: string;
  userIds: string[];
  message?: string;
}

export interface UpdatePrivacyPayload {
  settings: Partial<PrivacySettings>;
}

export interface BlockUserPayload {
  userId: string;
  reason?: string;
}

export interface FetchDiscoverySuggestionsParams {
  limit?: number;
  offset?: number;
  sources?: DiscoverySource[];
  location?: GeoLocation;
  maxDistance?: number;
}

// ============================================
// Graph Algorithm Types
// ============================================

export interface GraphNode {
  id: string;
  profile: PublicProfile;
  connections: string[]; // Connected user IDs
  connectionCount: number;
  clusterCoefficient: number; // 0-1, how interconnected their friends are
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number; // Connection strength
  type: 'friend' | 'group_member' | 'circle_member';
}

export interface SocialGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  communities: Community[];
}

export interface Community {
  id: string;
  name?: string;
  memberIds: string[];
  cohesion: number; // 0-1, how tightly connected the community is
  keyMembers: string[]; // Most influential members
}

export interface PathResult {
  exists: boolean;
  path: string[];
  distance: number;
}

export interface MutualConnectionsResult {
  connections: UserConnection[];
  count: number;
}

export interface ConnectionRecommendation {
  user: PublicProfile;
  score: number;
  reasons: string[];
  mutualConnections: number;
  pathToConnect: string[];
}
