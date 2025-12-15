// src/api/socialGraphApi.ts
// Social Graph Management API

import axiosInstance from './axiosInstance';
import {
  FriendRelationship,
  FriendRequest,
  SocialCircle,
  Group,
  GroupInvite,
  GroupJoinRequest,
  GroupMember,
  DiscoverySuggestion,
  DiscoveryPreferences,
  PrivacySettings,
  SendFriendRequestPayload,
  RespondToFriendRequestPayload,
  UpdateFriendPayload,
  CreateCirclePayload,
  UpdateCirclePayload,
  CreateGroupPayload,
  UpdateGroupPayload,
  InviteToGroupPayload,
  UpdatePrivacyPayload,
  BlockUserPayload,
  FetchDiscoverySuggestionsParams,
  UserConnection,
  MutualConnectionsResult,
} from '@/types/socialGraph';

// ============================================
// Friends API
// ============================================

export const friendsApi = {
  getFriends: async (): Promise<FriendRelationship[]> => {
    try {
      const response = await axiosInstance.get<FriendRelationship[]>('/api/social/friends');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch friends list. Please try again.';
      throw new Error(message);
    }
  },

  getFriendById: async (friendId: string): Promise<FriendRelationship> => {
    try {
      if (!friendId) {
        throw new Error('Friend ID is required');
      }
      const response = await axiosInstance.get<FriendRelationship>(`/api/social/friends/${friendId}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch friend details. Please try again.';
      throw new Error(message);
    }
  },

  sendFriendRequest: async (payload: SendFriendRequestPayload): Promise<FriendRequest> => {
    try {
      if (!payload.targetUserId) {
        throw new Error('Target user ID is required');
      }
      const response = await axiosInstance.post<FriendRequest>('/api/social/friends/request', payload);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send friend request. Please try again.';
      throw new Error(message);
    }
  },

  getIncomingRequests: async (): Promise<FriendRequest[]> => {
    try {
      const response = await axiosInstance.get<FriendRequest[]>('/api/social/friends/requests/incoming');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch incoming friend requests. Please try again.';
      throw new Error(message);
    }
  },

  getOutgoingRequests: async (): Promise<FriendRequest[]> => {
    try {
      const response = await axiosInstance.get<FriendRequest[]>('/api/social/friends/requests/outgoing');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch outgoing friend requests. Please try again.';
      throw new Error(message);
    }
  },

  respondToRequest: async (payload: RespondToFriendRequestPayload): Promise<FriendRequest> => {
    try {
      if (!payload.requestId) {
        throw new Error('Request ID is required');
      }
      if (!payload.action) {
        throw new Error('Action is required');
      }
      const response = await axiosInstance.put<FriendRequest>(
        `/api/social/friends/request/${payload.requestId}`,
        {action: payload.action}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to respond to friend request. Please try again.';
      throw new Error(message);
    }
  },

  cancelRequest: async (requestId: string): Promise<void> => {
    try {
      if (!requestId) {
        throw new Error('Request ID is required');
      }
      await axiosInstance.delete(`/api/social/friends/request/${requestId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to cancel friend request. Please try again.';
      throw new Error(message);
    }
  },

  updateFriend: async (payload: UpdateFriendPayload): Promise<FriendRelationship> => {
    try {
      if (!payload.friendId) {
        throw new Error('Friend ID is required');
      }
      const response = await axiosInstance.put<FriendRelationship>(
        `/api/social/friends/${payload.friendId}`,
        payload.updates
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update friend. Please try again.';
      throw new Error(message);
    }
  },

  removeFriend: async (friendId: string): Promise<void> => {
    try {
      if (!friendId) {
        throw new Error('Friend ID is required');
      }
      await axiosInstance.delete(`/api/social/friends/${friendId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to remove friend. Please try again.';
      throw new Error(message);
    }
  },

  getMutualFriends: async (userId: string): Promise<MutualConnectionsResult> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      const response = await axiosInstance.get<MutualConnectionsResult>(
        `/api/social/friends/mutual/${userId}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch mutual friends. Please try again.';
      throw new Error(message);
    }
  },

  searchFriends: async (query: string): Promise<FriendRelationship[]> => {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }
      const response = await axiosInstance.get<FriendRelationship[]>(
        `/api/social/friends/search`,
        {params: {q: query}}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to search friends. Please try again.';
      throw new Error(message);
    }
  },
};

// ============================================
// Social Circles API
// ============================================

export const circlesApi = {
  getCircles: async (): Promise<SocialCircle[]> => {
    try {
      const response = await axiosInstance.get<SocialCircle[]>('/api/social/circles');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch social circles. Please try again.';
      throw new Error(message);
    }
  },

  getCircleById: async (circleId: string): Promise<SocialCircle> => {
    try {
      if (!circleId) {
        throw new Error('Circle ID is required');
      }
      const response = await axiosInstance.get<SocialCircle>(`/api/social/circles/${circleId}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch circle details. Please try again.';
      throw new Error(message);
    }
  },

  createCircle: async (payload: CreateCirclePayload): Promise<SocialCircle> => {
    try {
      if (!payload.name || payload.name.trim() === '') {
        throw new Error('Circle name is required');
      }
      const response = await axiosInstance.post<SocialCircle>('/api/social/circles', payload);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create social circle. Please try again.';
      throw new Error(message);
    }
  },

  updateCircle: async (payload: UpdateCirclePayload): Promise<SocialCircle> => {
    try {
      if (!payload.circleId) {
        throw new Error('Circle ID is required');
      }
      const response = await axiosInstance.put<SocialCircle>(
        `/api/social/circles/${payload.circleId}`,
        payload.updates
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update social circle. Please try again.';
      throw new Error(message);
    }
  },

  deleteCircle: async (circleId: string): Promise<void> => {
    try {
      if (!circleId) {
        throw new Error('Circle ID is required');
      }
      await axiosInstance.delete(`/api/social/circles/${circleId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete social circle. Please try again.';
      throw new Error(message);
    }
  },

  addMembersToCircle: async (circleId: string, memberIds: string[]): Promise<SocialCircle> => {
    try {
      if (!circleId) {
        throw new Error('Circle ID is required');
      }
      if (!memberIds || memberIds.length === 0) {
        throw new Error('At least one member ID is required');
      }
      const response = await axiosInstance.post<SocialCircle>(
        `/api/social/circles/${circleId}/members`,
        {memberIds}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to add members to circle. Please try again.';
      throw new Error(message);
    }
  },

  removeMemberFromCircle: async (circleId: string, memberId: string): Promise<SocialCircle> => {
    try {
      if (!circleId) {
        throw new Error('Circle ID is required');
      }
      if (!memberId) {
        throw new Error('Member ID is required');
      }
      const response = await axiosInstance.delete<SocialCircle>(
        `/api/social/circles/${circleId}/members/${memberId}`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to remove member from circle. Please try again.';
      throw new Error(message);
    }
  },
};

// ============================================
// Groups API
// ============================================

export const groupsApi = {
  getGroups: async (): Promise<Group[]> => {
    try {
      const response = await axiosInstance.get<Group[]>('/api/social/groups');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch groups. Please try again.';
      throw new Error(message);
    }
  },

  getGroupById: async (groupId: string): Promise<Group> => {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      const response = await axiosInstance.get<Group>(`/api/social/groups/${groupId}`);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch group details. Please try again.';
      throw new Error(message);
    }
  },

  createGroup: async (payload: CreateGroupPayload): Promise<Group> => {
    try {
      if (!payload.name || payload.name.trim() === '') {
        throw new Error('Group name is required');
      }
      const response = await axiosInstance.post<Group>('/api/social/groups', payload);
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to create group. Please try again.';
      throw new Error(message);
    }
  },

  updateGroup: async (payload: UpdateGroupPayload): Promise<Group> => {
    try {
      if (!payload.groupId) {
        throw new Error('Group ID is required');
      }
      const response = await axiosInstance.put<Group>(
        `/api/social/groups/${payload.groupId}`,
        payload.updates
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update group. Please try again.';
      throw new Error(message);
    }
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      await axiosInstance.delete(`/api/social/groups/${groupId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to delete group. Please try again.';
      throw new Error(message);
    }
  },

  joinGroup: async (groupId: string, message?: string): Promise<GroupJoinRequest | Group> => {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      const response = await axiosInstance.post<GroupJoinRequest | Group>(
        `/api/social/groups/${groupId}/join`,
        {message}
      );
      return response.data;
    } catch (error: any) {
      const message_ =
        error.response?.data?.message ||
        error.message ||
        'Failed to join group. Please try again.';
      throw new Error(message_);
    }
  },

  leaveGroup: async (groupId: string): Promise<void> => {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      await axiosInstance.post(`/api/social/groups/${groupId}/leave`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to leave group. Please try again.';
      throw new Error(message);
    }
  },

  inviteToGroup: async (payload: InviteToGroupPayload): Promise<GroupInvite[]> => {
    try {
      if (!payload.groupId) {
        throw new Error('Group ID is required');
      }
      if (!payload.userIds || payload.userIds.length === 0) {
        throw new Error('At least one user ID is required');
      }
      const response = await axiosInstance.post<GroupInvite[]>(
        `/api/social/groups/${payload.groupId}/invite`,
        {userIds: payload.userIds, message: payload.message}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to send group invites. Please try again.';
      throw new Error(message);
    }
  },

  getGroupInvites: async (): Promise<GroupInvite[]> => {
    try {
      const response = await axiosInstance.get<GroupInvite[]>('/api/social/groups/invites');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch group invites. Please try again.';
      throw new Error(message);
    }
  },

  respondToGroupInvite: async (
    inviteId: string,
    action: 'accept' | 'reject'
  ): Promise<GroupInvite> => {
    try {
      if (!inviteId) {
        throw new Error('Invite ID is required');
      }
      const response = await axiosInstance.put<GroupInvite>(
        `/api/social/groups/invites/${inviteId}`,
        {action}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to respond to group invite. Please try again.';
      throw new Error(message);
    }
  },

  getJoinRequests: async (groupId: string): Promise<GroupJoinRequest[]> => {
    try {
      if (!groupId) {
        throw new Error('Group ID is required');
      }
      const response = await axiosInstance.get<GroupJoinRequest[]>(
        `/api/social/groups/${groupId}/requests`
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch join requests. Please try again.';
      throw new Error(message);
    }
  },

  respondToJoinRequest: async (
    groupId: string,
    requestId: string,
    action: 'approve' | 'reject'
  ): Promise<GroupJoinRequest> => {
    try {
      if (!groupId || !requestId) {
        throw new Error('Group ID and Request ID are required');
      }
      const response = await axiosInstance.put<GroupJoinRequest>(
        `/api/social/groups/${groupId}/requests/${requestId}`,
        {action}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to respond to join request. Please try again.';
      throw new Error(message);
    }
  },

  updateMemberRole: async (
    groupId: string,
    memberId: string,
    role: string
  ): Promise<GroupMember> => {
    try {
      if (!groupId || !memberId) {
        throw new Error('Group ID and Member ID are required');
      }
      const response = await axiosInstance.put<GroupMember>(
        `/api/social/groups/${groupId}/members/${memberId}`,
        {role}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update member role. Please try again.';
      throw new Error(message);
    }
  },

  removeMember: async (groupId: string, memberId: string): Promise<void> => {
    try {
      if (!groupId || !memberId) {
        throw new Error('Group ID and Member ID are required');
      }
      await axiosInstance.delete(`/api/social/groups/${groupId}/members/${memberId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to remove member. Please try again.';
      throw new Error(message);
    }
  },

  searchGroups: async (query: string, filters?: {
    type?: string;
    category?: string;
    nearLocation?: {lat: number; lng: number; radius: number};
  }): Promise<Group[]> => {
    try {
      const response = await axiosInstance.get<Group[]>('/api/social/groups/search', {
        params: {q: query, ...filters},
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to search groups. Please try again.';
      throw new Error(message);
    }
  },

  getNearbyGroups: async (lat: number, lng: number, radius: number): Promise<Group[]> => {
    try {
      const response = await axiosInstance.get<Group[]>('/api/social/groups/nearby', {
        params: {lat, lng, radius},
      });
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch nearby groups. Please try again.';
      throw new Error(message);
    }
  },
};

// ============================================
// Discovery API
// ============================================

export const discoveryApi = {
  getSuggestions: async (params?: FetchDiscoverySuggestionsParams): Promise<DiscoverySuggestion[]> => {
    try {
      const response = await axiosInstance.get<DiscoverySuggestion[]>(
        '/api/social/discovery/suggestions',
        {params}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch friend suggestions. Please try again.';
      throw new Error(message);
    }
  },

  dismissSuggestion: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.post(`/api/social/discovery/dismiss/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to dismiss suggestion. Please try again.';
      throw new Error(message);
    }
  },

  getDiscoveryPreferences: async (): Promise<DiscoveryPreferences> => {
    try {
      const response = await axiosInstance.get<DiscoveryPreferences>(
        '/api/social/discovery/preferences'
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch discovery preferences. Please try again.';
      throw new Error(message);
    }
  },

  updateDiscoveryPreferences: async (
    preferences: Partial<DiscoveryPreferences>
  ): Promise<DiscoveryPreferences> => {
    try {
      const response = await axiosInstance.put<DiscoveryPreferences>(
        '/api/social/discovery/preferences',
        preferences
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update discovery preferences. Please try again.';
      throw new Error(message);
    }
  },

  searchUsers: async (query: string): Promise<UserConnection[]> => {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }
      const response = await axiosInstance.get<UserConnection[]>(
        '/api/social/discovery/search',
        {params: {q: query}}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to search users. Please try again.';
      throw new Error(message);
    }
  },

  getNearbyUsers: async (lat: number, lng: number, radius: number): Promise<UserConnection[]> => {
    try {
      const response = await axiosInstance.get<UserConnection[]>(
        '/api/social/discovery/nearby',
        {params: {lat, lng, radius}}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch nearby users. Please try again.';
      throw new Error(message);
    }
  },

  syncContacts: async (contacts: {phone?: string; email?: string}[]): Promise<UserConnection[]> => {
    try {
      const response = await axiosInstance.post<UserConnection[]>(
        '/api/social/discovery/sync-contacts',
        {contacts}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to sync contacts. Please try again.';
      throw new Error(message);
    }
  },
};

// ============================================
// Privacy API
// ============================================

export const privacyApi = {
  getPrivacySettings: async (): Promise<PrivacySettings> => {
    try {
      const response = await axiosInstance.get<PrivacySettings>('/api/social/privacy');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch privacy settings. Please try again.';
      throw new Error(message);
    }
  },

  updatePrivacySettings: async (payload: UpdatePrivacyPayload): Promise<PrivacySettings> => {
    try {
      const response = await axiosInstance.put<PrivacySettings>(
        '/api/social/privacy',
        payload.settings
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update privacy settings. Please try again.';
      throw new Error(message);
    }
  },

  blockUser: async (payload: BlockUserPayload): Promise<void> => {
    try {
      if (!payload.userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.post('/api/social/privacy/block', payload);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to block user. Please try again.';
      throw new Error(message);
    }
  },

  unblockUser: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.delete(`/api/social/privacy/block/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to unblock user. Please try again.';
      throw new Error(message);
    }
  },

  getBlockedUsers: async (): Promise<UserConnection[]> => {
    try {
      const response = await axiosInstance.get<UserConnection[]>('/api/social/privacy/blocked');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch blocked users. Please try again.';
      throw new Error(message);
    }
  },

  restrictUser: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.post(`/api/social/privacy/restrict/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to restrict user. Please try again.';
      throw new Error(message);
    }
  },

  unrestrictUser: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.delete(`/api/social/privacy/restrict/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to unrestrict user. Please try again.';
      throw new Error(message);
    }
  },

  getRestrictedUsers: async (): Promise<UserConnection[]> => {
    try {
      const response = await axiosInstance.get<UserConnection[]>('/api/social/privacy/restricted');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch restricted users. Please try again.';
      throw new Error(message);
    }
  },

  hideFromUser: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.post(`/api/social/privacy/hide/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to hide from user. Please try again.';
      throw new Error(message);
    }
  },

  unhideFromUser: async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      await axiosInstance.delete(`/api/social/privacy/hide/${userId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to unhide from user. Please try again.';
      throw new Error(message);
    }
  },

  setCircleOverride: async (
    circleId: string,
    overrides: Record<string, boolean>
  ): Promise<PrivacySettings> => {
    try {
      if (!circleId) {
        throw new Error('Circle ID is required');
      }
      const response = await axiosInstance.put<PrivacySettings>(
        `/api/social/privacy/circles/${circleId}`,
        {overrides}
      );
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to set circle privacy override. Please try again.';
      throw new Error(message);
    }
  },
};

// Combined export for convenience
export const socialGraphApi = {
  friends: friendsApi,
  circles: circlesApi,
  groups: groupsApi,
  discovery: discoveryApi,
  privacy: privacyApi,
};
