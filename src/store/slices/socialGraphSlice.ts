// src/store/slices/socialGraphSlice.ts
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  SocialGraphState,
  FriendRelationship,
  FriendRequest,
  SocialCircle,
  Group,
  GroupInvite,
  GroupJoinRequest,
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
  FetchDiscoverySuggestionsParams,
  CirclePermissions,
} from '@/types/socialGraph';
import {
  friendsApi,
  circlesApi,
  groupsApi,
  discoveryApi,
  privacyApi,
} from '@/api/socialGraphApi';
import {RootState} from '@/store';

// Default privacy settings
const defaultPrivacySettings: PrivacySettings = {
  profileVisibility: 'friends',
  bioVisibility: 'friends',
  avatarVisibility: 'everyone',
  locationSharing: 'friends',
  locationPrecision: 'approximate',
  locationSharingCircles: [],
  onlineStatusVisibility: 'friends',
  lastSeenVisibility: 'friends',
  postsVisibility: 'friends',
  activityVisibility: 'friends',
  storiesVisibility: 'friends',
  friendListVisibility: 'friends',
  mutualFriendsVisibility: 'friends',
  groupMembershipVisibility: 'friends',
  whoCanMessage: 'friends',
  whoCanCall: 'friends',
  whoCanAddToGroups: 'friends',
  whoCanSendFriendRequests: 'everyone',
  discoverableByEmail: true,
  discoverableByPhone: true,
  discoverableByLocation: true,
  discoverableByInterests: true,
  discoverableInSearch: true,
  blockedUserIds: [],
  restrictedUserIds: [],
  hiddenFromUserIds: [],
  circleOverrides: {},
};

// Default discovery preferences
const defaultDiscoveryPreferences: DiscoveryPreferences = {
  enableLocationBasedSuggestions: true,
  enableInterestBasedSuggestions: true,
  enableMutualFriendSuggestions: true,
  enableContactSync: false,
  maxDistance: 50000, // 50km
  excludedInterests: [],
  minMutualFriends: 0,
};

const initialState: SocialGraphState = {
  friends: [],
  friendsLoading: false,
  friendsError: null,
  incomingRequests: [],
  outgoingRequests: [],
  requestsLoading: false,
  requestsError: null,
  circles: [],
  circlesLoading: false,
  circlesError: null,
  groups: [],
  groupInvites: [],
  groupJoinRequests: [],
  groupsLoading: false,
  groupsError: null,
  suggestions: [],
  discoveryPreferences: defaultDiscoveryPreferences,
  suggestionsLoading: false,
  suggestionsError: null,
  privacySettings: defaultPrivacySettings,
  privacyLoading: false,
  privacyError: null,
  totalFriendsCount: 0,
  totalGroupsCount: 0,
  lastSyncedAt: null,
};

// ============================================
// Friends Thunks
// ============================================

export const fetchFriends = createAsyncThunk<
  FriendRelationship[],
  void,
  {rejectValue: string}
>('socialGraph/fetchFriends', async (_, {rejectWithValue}) => {
  try {
    return await friendsApi.getFriends();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch friends';
    return rejectWithValue(message);
  }
});

export const sendFriendRequest = createAsyncThunk<
  FriendRequest,
  SendFriendRequestPayload,
  {rejectValue: string}
>('socialGraph/sendFriendRequest', async (payload, {rejectWithValue}) => {
  try {
    return await friendsApi.sendFriendRequest(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send friend request';
    return rejectWithValue(message);
  }
});

export const fetchIncomingRequests = createAsyncThunk<
  FriendRequest[],
  void,
  {rejectValue: string}
>('socialGraph/fetchIncomingRequests', async (_, {rejectWithValue}) => {
  try {
    return await friendsApi.getIncomingRequests();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch incoming requests';
    return rejectWithValue(message);
  }
});

export const fetchOutgoingRequests = createAsyncThunk<
  FriendRequest[],
  void,
  {rejectValue: string}
>('socialGraph/fetchOutgoingRequests', async (_, {rejectWithValue}) => {
  try {
    return await friendsApi.getOutgoingRequests();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch outgoing requests';
    return rejectWithValue(message);
  }
});

export const respondToFriendRequest = createAsyncThunk<
  {request: FriendRequest; newFriend?: FriendRelationship},
  RespondToFriendRequestPayload,
  {rejectValue: string}
>('socialGraph/respondToFriendRequest', async (payload, {rejectWithValue}) => {
  try {
    const request = await friendsApi.respondToRequest(payload);
    let newFriend: FriendRelationship | undefined;

    // If accepted, fetch the new friend relationship
    if (payload.action === 'accept') {
      newFriend = await friendsApi.getFriendById(request.senderId);
    }

    return {request, newFriend};
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to respond to friend request';
    return rejectWithValue(message);
  }
});

export const cancelFriendRequest = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('socialGraph/cancelFriendRequest', async (requestId, {rejectWithValue}) => {
  try {
    await friendsApi.cancelRequest(requestId);
    return requestId;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to cancel friend request';
    return rejectWithValue(message);
  }
});

export const updateFriend = createAsyncThunk<
  FriendRelationship,
  UpdateFriendPayload,
  {rejectValue: string}
>('socialGraph/updateFriend', async (payload, {rejectWithValue}) => {
  try {
    return await friendsApi.updateFriend(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update friend';
    return rejectWithValue(message);
  }
});

export const removeFriend = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('socialGraph/removeFriend', async (friendId, {rejectWithValue}) => {
  try {
    await friendsApi.removeFriend(friendId);
    return friendId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to remove friend';
    return rejectWithValue(message);
  }
});

// ============================================
// Circles Thunks
// ============================================

export const fetchCircles = createAsyncThunk<
  SocialCircle[],
  void,
  {rejectValue: string}
>('socialGraph/fetchCircles', async (_, {rejectWithValue}) => {
  try {
    return await circlesApi.getCircles();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch circles';
    return rejectWithValue(message);
  }
});

export const createCircle = createAsyncThunk<
  SocialCircle,
  CreateCirclePayload,
  {rejectValue: string}
>('socialGraph/createCircle', async (payload, {rejectWithValue}) => {
  try {
    return await circlesApi.createCircle(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create circle';
    return rejectWithValue(message);
  }
});

export const updateCircle = createAsyncThunk<
  SocialCircle,
  UpdateCirclePayload,
  {rejectValue: string}
>('socialGraph/updateCircle', async (payload, {rejectWithValue}) => {
  try {
    return await circlesApi.updateCircle(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update circle';
    return rejectWithValue(message);
  }
});

export const deleteCircle = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('socialGraph/deleteCircle', async (circleId, {rejectWithValue}) => {
  try {
    await circlesApi.deleteCircle(circleId);
    return circleId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete circle';
    return rejectWithValue(message);
  }
});

export const addMembersToCircle = createAsyncThunk<
  SocialCircle,
  {circleId: string; memberIds: string[]},
  {rejectValue: string}
>('socialGraph/addMembersToCircle', async (payload, {rejectWithValue}) => {
  try {
    return await circlesApi.addMembersToCircle(
      payload.circleId,
      payload.memberIds,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to add members to circle';
    return rejectWithValue(message);
  }
});

export const removeMemberFromCircle = createAsyncThunk<
  SocialCircle,
  {circleId: string; memberId: string},
  {rejectValue: string}
>('socialGraph/removeMemberFromCircle', async (payload, {rejectWithValue}) => {
  try {
    return await circlesApi.removeMemberFromCircle(
      payload.circleId,
      payload.memberId,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to remove member from circle';
    return rejectWithValue(message);
  }
});

// ============================================
// Groups Thunks
// ============================================

export const fetchGroups = createAsyncThunk<
  Group[],
  void,
  {rejectValue: string}
>('socialGraph/fetchGroups', async (_, {rejectWithValue}) => {
  try {
    return await groupsApi.getGroups();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch groups';
    return rejectWithValue(message);
  }
});

export const fetchGroupById = createAsyncThunk<
  Group,
  string,
  {rejectValue: string}
>('socialGraph/fetchGroupById', async (groupId, {rejectWithValue}) => {
  try {
    return await groupsApi.getGroupById(groupId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch group';
    return rejectWithValue(message);
  }
});

export const createGroup = createAsyncThunk<
  Group,
  CreateGroupPayload,
  {rejectValue: string}
>('socialGraph/createGroup', async (payload, {rejectWithValue}) => {
  try {
    return await groupsApi.createGroup(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to create group';
    return rejectWithValue(message);
  }
});

export const updateGroup = createAsyncThunk<
  Group,
  UpdateGroupPayload,
  {rejectValue: string}
>('socialGraph/updateGroup', async (payload, {rejectWithValue}) => {
  try {
    return await groupsApi.updateGroup(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to update group';
    return rejectWithValue(message);
  }
});

export const deleteGroup = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('socialGraph/deleteGroup', async (groupId, {rejectWithValue}) => {
  try {
    await groupsApi.deleteGroup(groupId);
    return groupId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to delete group';
    return rejectWithValue(message);
  }
});

export const joinGroup = createAsyncThunk<
  {groupId: string; result: GroupJoinRequest | Group},
  {groupId: string; message?: string},
  {rejectValue: string}
>('socialGraph/joinGroup', async (payload, {rejectWithValue}) => {
  try {
    const result = await groupsApi.joinGroup(payload.groupId, payload.message);
    return {groupId: payload.groupId, result};
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to join group';
    return rejectWithValue(message);
  }
});

export const leaveGroup = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('socialGraph/leaveGroup', async (groupId, {rejectWithValue}) => {
  try {
    await groupsApi.leaveGroup(groupId);
    return groupId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to leave group';
    return rejectWithValue(message);
  }
});

export const fetchGroupInvites = createAsyncThunk<
  GroupInvite[],
  void,
  {rejectValue: string}
>('socialGraph/fetchGroupInvites', async (_, {rejectWithValue}) => {
  try {
    return await groupsApi.getGroupInvites();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch group invites';
    return rejectWithValue(message);
  }
});

export const inviteToGroup = createAsyncThunk<
  GroupInvite[],
  InviteToGroupPayload,
  {rejectValue: string}
>('socialGraph/inviteToGroup', async (payload, {rejectWithValue}) => {
  try {
    return await groupsApi.inviteToGroup(payload);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to send group invitations';
    return rejectWithValue(message);
  }
});

export const respondToGroupInvite = createAsyncThunk<
  {invite: GroupInvite; group?: Group},
  {inviteId: string; action: 'accept' | 'reject'},
  {rejectValue: string}
>('socialGraph/respondToGroupInvite', async (payload, {rejectWithValue}) => {
  try {
    const invite = await groupsApi.respondToGroupInvite(
      payload.inviteId,
      payload.action,
    );
    let group: Group | undefined;

    if (payload.action === 'accept') {
      group = await groupsApi.getGroupById(invite.groupId);
    }

    return {invite, group};
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to respond to group invite';
    return rejectWithValue(message);
  }
});

// ============================================
// Discovery Thunks
// ============================================

export const fetchSuggestions = createAsyncThunk<
  DiscoverySuggestion[],
  FetchDiscoverySuggestionsParams | undefined,
  {rejectValue: string}
>('socialGraph/fetchSuggestions', async (params, {rejectWithValue}) => {
  try {
    return await discoveryApi.getSuggestions(params);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch suggestions';
    return rejectWithValue(message);
  }
});

export const dismissSuggestion = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('socialGraph/dismissSuggestion', async (userId, {rejectWithValue}) => {
  try {
    await discoveryApi.dismissSuggestion(userId);
    return userId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to dismiss suggestion';
    return rejectWithValue(message);
  }
});

export const fetchDiscoveryPreferences = createAsyncThunk<
  DiscoveryPreferences,
  void,
  {rejectValue: string}
>('socialGraph/fetchDiscoveryPreferences', async (_, {rejectWithValue}) => {
  try {
    return await discoveryApi.getDiscoveryPreferences();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch discovery preferences';
    return rejectWithValue(message);
  }
});

export const updateDiscoveryPreferences = createAsyncThunk<
  DiscoveryPreferences,
  Partial<DiscoveryPreferences>,
  {rejectValue: string}
>(
  'socialGraph/updateDiscoveryPreferences',
  async (preferences, {rejectWithValue}) => {
    try {
      return await discoveryApi.updateDiscoveryPreferences(preferences);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update discovery preferences';
      return rejectWithValue(message);
    }
  },
);

// ============================================
// Privacy Thunks
// ============================================

export const fetchPrivacySettings = createAsyncThunk<
  PrivacySettings,
  void,
  {rejectValue: string}
>('socialGraph/fetchPrivacySettings', async (_, {rejectWithValue}) => {
  try {
    return await privacyApi.getPrivacySettings();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch privacy settings';
    return rejectWithValue(message);
  }
});

export const updatePrivacySettings = createAsyncThunk<
  PrivacySettings,
  Partial<PrivacySettings>,
  {rejectValue: string}
>('socialGraph/updatePrivacySettings', async (settings, {rejectWithValue}) => {
  try {
    return await privacyApi.updatePrivacySettings({settings});
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to update privacy settings';
    return rejectWithValue(message);
  }
});

export const blockUser = createAsyncThunk<
  string,
  {userId: string; reason?: string},
  {rejectValue: string}
>('socialGraph/blockUser', async (payload, {rejectWithValue}) => {
  try {
    await privacyApi.blockUser(payload);
    return payload.userId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to block user';
    return rejectWithValue(message);
  }
});

export const unblockUser = createAsyncThunk<
  string,
  string,
  {rejectValue: string}
>('socialGraph/unblockUser', async (userId, {rejectWithValue}) => {
  try {
    await privacyApi.unblockUser(userId);
    return userId;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to unblock user';
    return rejectWithValue(message);
  }
});

export const setCirclePrivacyOverride = createAsyncThunk<
  PrivacySettings,
  {circleId: string; overrides: Partial<CirclePermissions>},
  {rejectValue: string}
>(
  'socialGraph/setCirclePrivacyOverride',
  async (payload, {rejectWithValue}) => {
    try {
      return await privacyApi.setCircleOverride(
        payload.circleId,
        payload.overrides as Record<string, boolean>,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to set circle privacy override';
      return rejectWithValue(message);
    }
  },
);

// ============================================
// Slice
// ============================================

const socialGraphSlice = createSlice({
  name: 'socialGraph',
  initialState,
  reducers: {
    clearFriendsError: state => {
      state.friendsError = null;
    },
    clearRequestsError: state => {
      state.requestsError = null;
    },
    clearCirclesError: state => {
      state.circlesError = null;
    },
    clearGroupsError: state => {
      state.groupsError = null;
    },
    clearSuggestionsError: state => {
      state.suggestionsError = null;
    },
    clearPrivacyError: state => {
      state.privacyError = null;
    },
    clearAllErrors: state => {
      state.friendsError = null;
      state.requestsError = null;
      state.circlesError = null;
      state.groupsError = null;
      state.suggestionsError = null;
      state.privacyError = null;
    },
    // Real-time updates from socket events
    addIncomingRequest: (state, action: PayloadAction<FriendRequest>) => {
      const exists = state.incomingRequests.some(
        r => r.id === action.payload.id,
      );
      if (!exists) {
        state.incomingRequests.unshift(action.payload);
      }
    },
    removeIncomingRequest: (state, action: PayloadAction<string>) => {
      state.incomingRequests = state.incomingRequests.filter(
        r => r.id !== action.payload,
      );
    },
    addFriend: (state, action: PayloadAction<FriendRelationship>) => {
      const exists = state.friends.some(f => f.id === action.payload.id);
      if (!exists) {
        state.friends.unshift(action.payload);
        state.totalFriendsCount += 1;
      }
    },
    updateFriendInList: (state, action: PayloadAction<FriendRelationship>) => {
      const index = state.friends.findIndex(f => f.id === action.payload.id);
      if (index !== -1) {
        state.friends[index] = action.payload;
      }
    },
    removeFriendFromList: (state, action: PayloadAction<string>) => {
      state.friends = state.friends.filter(f => f.friendId !== action.payload);
      state.totalFriendsCount = Math.max(0, state.totalFriendsCount - 1);
    },
    addGroupInvite: (state, action: PayloadAction<GroupInvite>) => {
      const exists = state.groupInvites.some(i => i.id === action.payload.id);
      if (!exists) {
        state.groupInvites.unshift(action.payload);
      }
    },
    removeGroupInvite: (state, action: PayloadAction<string>) => {
      state.groupInvites = state.groupInvites.filter(
        i => i.id !== action.payload,
      );
    },
    addGroup: (state, action: PayloadAction<Group>) => {
      const exists = state.groups.some(g => g.id === action.payload.id);
      if (!exists) {
        state.groups.unshift(action.payload);
        state.totalGroupsCount += 1;
      }
    },
    updateGroupInList: (state, action: PayloadAction<Group>) => {
      const index = state.groups.findIndex(g => g.id === action.payload.id);
      if (index !== -1) {
        state.groups[index] = action.payload;
      }
    },
    removeGroupFromList: (state, action: PayloadAction<string>) => {
      state.groups = state.groups.filter(g => g.id !== action.payload);
      state.totalGroupsCount = Math.max(0, state.totalGroupsCount - 1);
    },
    setLastSyncedAt: (state, action: PayloadAction<string>) => {
      state.lastSyncedAt = action.payload;
    },
    resetSocialGraph: () => initialState,
  },
  extraReducers: builder => {
    builder
      // ============================================
      // Friends
      // ============================================
      .addCase(fetchFriends.pending, state => {
        state.friendsLoading = true;
        state.friendsError = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friends = action.payload;
        state.totalFriendsCount = action.payload.length;
        state.friendsLoading = false;
        state.lastSyncedAt = new Date().toISOString();
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.friendsLoading = false;
        state.friendsError = action.payload ?? 'Failed to fetch friends';
      })

      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.outgoingRequests.unshift(action.payload);
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.requestsError =
          action.payload ?? 'Failed to send friend request';
      })

      .addCase(fetchIncomingRequests.pending, state => {
        state.requestsLoading = true;
        state.requestsError = null;
      })
      .addCase(fetchIncomingRequests.fulfilled, (state, action) => {
        state.incomingRequests = action.payload;
        state.requestsLoading = false;
      })
      .addCase(fetchIncomingRequests.rejected, (state, action) => {
        state.requestsLoading = false;
        state.requestsError =
          action.payload ?? 'Failed to fetch incoming requests';
      })

      .addCase(fetchOutgoingRequests.fulfilled, (state, action) => {
        state.outgoingRequests = action.payload;
      })

      .addCase(respondToFriendRequest.fulfilled, (state, action) => {
        const {request, newFriend} = action.payload;
        state.incomingRequests = state.incomingRequests.filter(
          r => r.id !== request.id,
        );
        if (newFriend) {
          state.friends.unshift(newFriend);
          state.totalFriendsCount += 1;
        }
      })

      .addCase(cancelFriendRequest.fulfilled, (state, action) => {
        state.outgoingRequests = state.outgoingRequests.filter(
          r => r.id !== action.payload,
        );
      })

      .addCase(updateFriend.fulfilled, (state, action) => {
        const index = state.friends.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.friends[index] = action.payload;
        }
      })

      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(
          f => f.friendId !== action.payload,
        );
        state.totalFriendsCount = Math.max(0, state.totalFriendsCount - 1);
      })

      // ============================================
      // Circles
      // ============================================
      .addCase(fetchCircles.pending, state => {
        state.circlesLoading = true;
        state.circlesError = null;
      })
      .addCase(fetchCircles.fulfilled, (state, action) => {
        state.circles = action.payload;
        state.circlesLoading = false;
      })
      .addCase(fetchCircles.rejected, (state, action) => {
        state.circlesLoading = false;
        state.circlesError = action.payload ?? 'Failed to fetch circles';
      })

      .addCase(createCircle.fulfilled, (state, action) => {
        state.circles.unshift(action.payload);
      })

      .addCase(updateCircle.fulfilled, (state, action) => {
        const index = state.circles.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.circles[index] = action.payload;
        }
      })

      .addCase(deleteCircle.fulfilled, (state, action) => {
        state.circles = state.circles.filter(c => c.id !== action.payload);
      })

      .addCase(addMembersToCircle.fulfilled, (state, action) => {
        const index = state.circles.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.circles[index] = action.payload;
        }
      })

      .addCase(removeMemberFromCircle.fulfilled, (state, action) => {
        const index = state.circles.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.circles[index] = action.payload;
        }
      })

      // ============================================
      // Groups
      // ============================================
      .addCase(fetchGroups.pending, state => {
        state.groupsLoading = true;
        state.groupsError = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
        state.totalGroupsCount = action.payload.length;
        state.groupsLoading = false;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.groupsLoading = false;
        state.groupsError = action.payload ?? 'Failed to fetch groups';
      })

      .addCase(fetchGroupById.fulfilled, (state, action) => {
        const index = state.groups.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        } else {
          state.groups.push(action.payload);
        }
      })

      .addCase(createGroup.fulfilled, (state, action) => {
        state.groups.unshift(action.payload);
        state.totalGroupsCount += 1;
      })

      .addCase(updateGroup.fulfilled, (state, action) => {
        const index = state.groups.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.groups[index] = action.payload;
        }
      })

      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g.id !== action.payload);
        state.totalGroupsCount = Math.max(0, state.totalGroupsCount - 1);
      })

      .addCase(joinGroup.fulfilled, (state, action) => {
        if ('memberCount' in action.payload.result) {
          // Direct join - result is the Group
          const group = action.payload.result as Group;
          if (!state.groups.find(g => g.id === group.id)) {
            state.groups.unshift(group);
            state.totalGroupsCount += 1;
          }
        }
        // Otherwise it's a join request, nothing to update in groups
      })

      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g.id !== action.payload);
        state.totalGroupsCount = Math.max(0, state.totalGroupsCount - 1);
      })

      .addCase(fetchGroupInvites.fulfilled, (state, action) => {
        state.groupInvites = action.payload;
      })

      .addCase(respondToGroupInvite.fulfilled, (state, action) => {
        const {invite, group} = action.payload;
        state.groupInvites = state.groupInvites.filter(i => i.id !== invite.id);
        if (group) {
          state.groups.unshift(group);
          state.totalGroupsCount += 1;
        }
      })

      // ============================================
      // Discovery
      // ============================================
      .addCase(fetchSuggestions.pending, state => {
        state.suggestionsLoading = true;
        state.suggestionsError = null;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
        state.suggestionsLoading = false;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.suggestionsLoading = false;
        state.suggestionsError =
          action.payload ?? 'Failed to fetch suggestions';
      })

      .addCase(dismissSuggestion.fulfilled, (state, action) => {
        state.suggestions = state.suggestions.filter(
          s => s.userId !== action.payload,
        );
      })

      .addCase(fetchDiscoveryPreferences.fulfilled, (state, action) => {
        state.discoveryPreferences = action.payload;
      })

      .addCase(updateDiscoveryPreferences.fulfilled, (state, action) => {
        state.discoveryPreferences = action.payload;
      })

      // ============================================
      // Privacy
      // ============================================
      .addCase(fetchPrivacySettings.pending, state => {
        state.privacyLoading = true;
        state.privacyError = null;
      })
      .addCase(fetchPrivacySettings.fulfilled, (state, action) => {
        state.privacySettings = action.payload;
        state.privacyLoading = false;
      })
      .addCase(fetchPrivacySettings.rejected, (state, action) => {
        state.privacyLoading = false;
        state.privacyError =
          action.payload ?? 'Failed to fetch privacy settings';
      })

      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        state.privacySettings = action.payload;
      })

      .addCase(blockUser.fulfilled, (state, action) => {
        if (!state.privacySettings.blockedUserIds.includes(action.payload)) {
          state.privacySettings.blockedUserIds.push(action.payload);
        }
        // Remove from friends if blocked
        state.friends = state.friends.filter(
          f => f.friendId !== action.payload,
        );
      })

      .addCase(unblockUser.fulfilled, (state, action) => {
        state.privacySettings.blockedUserIds =
          state.privacySettings.blockedUserIds.filter(
            id => id !== action.payload,
          );
      })

      .addCase(setCirclePrivacyOverride.fulfilled, (state, action) => {
        state.privacySettings = action.payload;
      });
  },
});

export const {
  clearFriendsError,
  clearRequestsError,
  clearCirclesError,
  clearGroupsError,
  clearSuggestionsError,
  clearPrivacyError,
  clearAllErrors,
  addIncomingRequest,
  removeIncomingRequest,
  addFriend,
  updateFriendInList,
  removeFriendFromList,
  addGroupInvite,
  removeGroupInvite,
  addGroup,
  updateGroupInList,
  removeGroupFromList,
  setLastSyncedAt,
  resetSocialGraph,
} = socialGraphSlice.actions;

// ============================================
// Selectors
// ============================================

export const selectFriends = (state: RootState) => state.socialGraph.friends;
export const selectFriendsLoading = (state: RootState) =>
  state.socialGraph.friendsLoading;
export const selectFriendsError = (state: RootState) =>
  state.socialGraph.friendsError;
export const selectFavoriteFriends = (state: RootState) =>
  state.socialGraph.friends.filter(f => f.isFavorite);
export const selectFriendById = (friendId: string) => (state: RootState) =>
  state.socialGraph.friends.find(f => f.friendId === friendId);

export const selectIncomingRequests = (state: RootState) =>
  state.socialGraph.incomingRequests;
export const selectOutgoingRequests = (state: RootState) =>
  state.socialGraph.outgoingRequests;
export const selectRequestsLoading = (state: RootState) =>
  state.socialGraph.requestsLoading;
export const selectPendingRequestsCount = (state: RootState) =>
  state.socialGraph.incomingRequests.length;

export const selectCircles = (state: RootState) => state.socialGraph.circles;
export const selectCirclesLoading = (state: RootState) =>
  state.socialGraph.circlesLoading;
export const selectCircleById = (circleId: string) => (state: RootState) =>
  state.socialGraph.circles.find(c => c.id === circleId);
export const selectDefaultCircles = (state: RootState) =>
  state.socialGraph.circles.filter(c => c.isDefault);

export const selectGroups = (state: RootState) => state.socialGraph.groups;
export const selectGroupsLoading = (state: RootState) =>
  state.socialGraph.groupsLoading;
export const selectGroupById = (groupId: string) => (state: RootState) =>
  state.socialGraph.groups.find(g => g.id === groupId);
export const selectGroupInvites = (state: RootState) =>
  state.socialGraph.groupInvites;
export const selectGroupInvitesCount = (state: RootState) =>
  state.socialGraph.groupInvites.length;

export const selectSuggestions = (state: RootState) =>
  state.socialGraph.suggestions;
export const selectSuggestionsLoading = (state: RootState) =>
  state.socialGraph.suggestionsLoading;
export const selectDiscoveryPreferences = (state: RootState) =>
  state.socialGraph.discoveryPreferences;

export const selectPrivacySettings = (state: RootState) =>
  state.socialGraph.privacySettings;
export const selectPrivacyLoading = (state: RootState) =>
  state.socialGraph.privacyLoading;
export const selectBlockedUserIds = (state: RootState) =>
  state.socialGraph.privacySettings.blockedUserIds;
export const selectIsUserBlocked = (userId: string) => (state: RootState) =>
  state.socialGraph.privacySettings.blockedUserIds.includes(userId);

export const selectTotalFriendsCount = (state: RootState) =>
  state.socialGraph.totalFriendsCount;
export const selectTotalGroupsCount = (state: RootState) =>
  state.socialGraph.totalGroupsCount;
export const selectLastSyncedAt = (state: RootState) =>
  state.socialGraph.lastSyncedAt;

export default socialGraphSlice.reducer;
