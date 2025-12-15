// backend/server.js - Complete Mock Backend
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// IN-MEMORY STORAGE (for demo - replace with DB in production)
// ============================================================================
const users = new Map(); // phone -> user
const conversations = new Map(); // conversationId -> messages[]


// ============================================================================
// DATING ENDPOINTS - Comprehensive Dating API
// ============================================================================

// In-memory dating storage
const datingProfiles = new Map();
const datingMatches = new Map();
const datingLikes = new Map();
const datingSwipes = new Map();
const datingPreferences = new Map();
const datingStats = new Map();
const blockedDatingUsers = new Map();

// Helper: Generate mock dating profile
const generateDatingProfile = (id, name, age, gender, lat, lng) => ({
  id: `profile_${id}`,
  userId: `user_${id}`,
  name,
  age,
  birthDate: new Date(Date.now() - age * 365 * 24 * 60 * 60 * 1000).toISOString(),
  gender,
  lookingFor: gender === 'female' ? 'male' : 'female',
  relationshipGoal: ['long_term', 'short_term', 'casual', 'friendship', 'not_sure'][Math.floor(Math.random() * 5)],
  interests: ['travel', 'music', 'fitness', 'cooking', 'photography', 'reading', 'hiking', 'movies'].sort(() => 0.5 - Math.random()).slice(0, 4 + Math.floor(Math.random() * 3)),
  bio: `Hey there! I'm ${name}. Looking for someone to share life's adventures with.`,
  prompts: [
    { id: 'p1', question: "I'm looking for someone who...", answer: 'Can make me laugh and is up for spontaneous adventures' },
    { id: 'p2', question: 'My ideal first date would be...', answer: 'Coffee, then a walk in the park if we hit it off' },
  ],
  photos: [
    { id: 'photo1', url: `https://i.pravatar.cc/400?u=${id}`, isMain: true, order: 0, uploadedAt: new Date().toISOString() },
    { id: 'photo2', url: `https://i.pravatar.cc/400?u=${id}_2`, isMain: false, order: 1, uploadedAt: new Date().toISOString() },
  ],
  location: {
    latitude: lat + (Math.random() - 0.5) * 0.1,
    longitude: lng + (Math.random() - 0.5) * 0.1,
    city: 'San Francisco',
    country: 'USA',
  },
  basics: {
    height: 160 + Math.floor(Math.random() * 30),
    bodyType: ['slim', 'athletic', 'average', 'curvy'][Math.floor(Math.random() * 4)],
    ethnicity: 'Prefer not to say',
    languages: ['English', 'Spanish'].slice(0, 1 + Math.floor(Math.random() * 2)),
  },
  lifestyle: {
    drinking: ['never', 'rarely', 'socially', 'regularly'][Math.floor(Math.random() * 4)],
    smoking: ['never', 'sometimes', 'regularly'][Math.floor(Math.random() * 3)],
    exercise: ['never', 'sometimes', 'often', 'daily'][Math.floor(Math.random() * 4)],
    diet: 'omnivore',
    pets: 'love_them',
    children: 'not_sure',
  },
  work: {
    jobTitle: ['Software Engineer', 'Designer', 'Marketing Manager', 'Teacher', 'Nurse', 'Consultant'][Math.floor(Math.random() * 6)],
    company: 'Some Company',
    education: ['bachelors', 'masters', 'doctorate'][Math.floor(Math.random() * 3)],
    school: 'State University',
  },
  zodiacSign: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'][Math.floor(Math.random() * 12)],
  datingPreferences: {
    ageRange: { min: 22, max: 40 },
    maxDistance: 50,
    genderPreference: gender === 'female' ? 'male' : 'female',
    relationshipGoals: ['long_term', 'short_term', 'casual'],
    showOnlyVerified: false,
    showOnlyWithBio: false,
    showOnlyWithPhotos: true,
    showOnlyActive: false,
    prioritizeSharedInterests: true,
    hideAge: false,
    hideDistance: false,
    incognitoMode: false,
  },
  verificationStatus: Math.random() > 0.7 ? 'verified' : 'none',
  isActive: true,
  lastActive: new Date().toISOString(),
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  distance: Math.floor(Math.random() * 30) + 1,
  compatibilityScore: Math.floor(Math.random() * 30) + 70,
});

// Generate initial mock profiles
const mockDatingProfiles = [
  generateDatingProfile('sarah', 'Sarah', 26, 'female', 37.7749, -122.4194),
  generateDatingProfile('emma', 'Emma', 24, 'female', 37.7749, -122.4194),
  generateDatingProfile('olivia', 'Olivia', 28, 'female', 37.7749, -122.4194),
  generateDatingProfile('sophia', 'Sophia', 25, 'female', 37.7749, -122.4194),
  generateDatingProfile('ava', 'Ava', 27, 'female', 37.7749, -122.4194),
  generateDatingProfile('mia', 'Mia', 23, 'female', 37.7749, -122.4194),
  generateDatingProfile('james', 'James', 28, 'male', 37.7749, -122.4194),
  generateDatingProfile('david', 'David', 30, 'male', 37.7749, -122.4194),
  generateDatingProfile('michael', 'Michael', 26, 'male', 37.7749, -122.4194),
];

mockDatingProfiles.forEach(p => datingProfiles.set(p.id, p));

// --- Dating Profile Endpoints ---
app.get('/api/dating/profile', (req, res) => {
  // Return mock current user profile
  res.json(generateDatingProfile('current_user', 'You', 27, 'male', 37.7749, -122.4194));
});

app.post('/api/dating/profile', (req, res) => {
  const profile = { id: `profile_${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  datingProfiles.set(profile.id, profile);
  res.status(201).json(profile);
});

app.patch('/api/dating/profile', (req, res) => {
  const profile = generateDatingProfile('current_user', 'You', 27, 'male', 37.7749, -122.4194);
  Object.assign(profile, req.body, { updatedAt: new Date().toISOString() });
  res.json(profile);
});

app.get('/api/dating/profile/:userId', (req, res) => {
  const profile = datingProfiles.get(`profile_${req.params.userId}`) || generateDatingProfile(req.params.userId, 'User', 25, 'female', 37.7749, -122.4194);
  res.json(profile);
});

app.patch('/api/dating/profile/active', (req, res) => {
  const profile = generateDatingProfile('current_user', 'You', 27, 'male', 37.7749, -122.4194);
  profile.isActive = req.body.isActive;
  res.json(profile);
});

// --- Discovery Endpoints ---
app.get('/api/dating/nearby', (req, res) => {
  const profiles = Array.from(datingProfiles.values()).slice(0, 10);
  console.log(`[Dating] Fetched ${profiles.length} nearby profiles`);
  res.json(profiles);
});

app.get('/api/dating/recommendations', (req, res) => {
  const profiles = Array.from(datingProfiles.values())
    .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    .slice(0, 20);
  res.json(profiles);
});

app.post('/api/dating/refresh', (req, res) => {
  const profiles = Array.from(datingProfiles.values()).slice(0, 10);
  res.json(profiles);
});

// --- Swipe Endpoints ---
app.post('/api/dating/swipe', (req, res) => {
  const { userId, targetUserId, action } = req.body;
  const swipe = {
    id: `swipe_${Date.now()}`,
    userId,
    targetUserId,
    action,
    timestamp: new Date().toISOString(),
    seen: false,
  };

  // Check for match (50% chance on like)
  let match = null;
  if ((action === 'like' || action === 'super_like') && Math.random() > 0.5) {
    const targetProfile = datingProfiles.get(`profile_${targetUserId}`) || generateDatingProfile(targetUserId, 'Match', 25, 'female', 37.7749, -122.4194);
    match = {
      id: `match_${Date.now()}`,
      user1Id: userId,
      user2Id: targetUserId,
      user1Profile: generateDatingProfile('current_user', 'You', 27, 'male', 37.7749, -122.4194),
      user2Profile: targetProfile,
      matchedAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageAt: null,
      unreadCount: 0,
      status: 'active',
      matchedVia: action === 'super_like' ? 'super_like' : 'mutual_like',
      iceBreakers: ['What brings you here?', 'Whats your favorite hobby?', 'Been on any adventures lately?'],
    };
    datingMatches.set(match.id, match);
  }

  console.log(`[Dating] Swipe: ${userId} ${action} ${targetUserId}${match ? ' - MATCH!' : ''}`);

  res.status(201).json({
    swipe,
    match,
    likesRemaining: 95,
    superLikesRemaining: action === 'super_like' ? 0 : 1,
  });
});

app.post('/api/dating/rewind', (req, res) => {
  const profile = Array.from(datingProfiles.values())[0];
  res.json({ profile, rewindsRemaining: 2 });
});

// --- Matches Endpoints ---
app.get('/api/dating/matches', (req, res) => {
  const matches = Array.from(datingMatches.values());
  if (matches.length === 0) {
    // Return mock matches
    const mockMatches = [
      {
        id: 'match_1',
        user1Id: 'current_user',
        user2Id: 'user_sarah',
        user1Profile: generateDatingProfile('current_user', 'You', 27, 'male', 37.7749, -122.4194),
        user2Profile: datingProfiles.get('profile_sarah'),
        matchedAt: new Date(Date.now() - 86400000).toISOString(),
        lastMessage: { id: 'msg_1', content: 'Hey! Nice to match with you', senderId: 'user_sarah', timestamp: new Date().toISOString() },
        lastMessageAt: new Date().toISOString(),
        unreadCount: 1,
        status: 'active',
        matchedVia: 'mutual_like',
      },
      {
        id: 'match_2',
        user1Id: 'current_user',
        user2Id: 'user_emma',
        user1Profile: generateDatingProfile('current_user', 'You', 27, 'male', 37.7749, -122.4194),
        user2Profile: datingProfiles.get('profile_emma'),
        matchedAt: new Date(Date.now() - 172800000).toISOString(),
        lastMessage: null,
        lastMessageAt: null,
        unreadCount: 0,
        status: 'active',
        matchedVia: 'super_like',
      },
    ];
    return res.json(mockMatches);
  }
  res.json(matches);
});

app.get('/api/dating/matches/new/count', (req, res) => {
  res.json({ count: 2 });
});

app.get('/api/dating/matches/:matchId', (req, res) => {
  const match = datingMatches.get(req.params.matchId);
  if (!match) {
    return res.status(404).json({ message: 'Match not found' });
  }
  res.json(match);
});

app.delete('/api/dating/matches/:matchId', (req, res) => {
  datingMatches.delete(req.params.matchId);
  res.json({ success: true });
});

app.patch('/api/dating/matches/:matchId/archive', (req, res) => {
  const match = datingMatches.get(req.params.matchId);
  if (match) {
    match.status = 'archived';
    res.json(match);
  } else {
    res.status(404).json({ message: 'Match not found' });
  }
});

app.patch('/api/dating/matches/:matchId/unarchive', (req, res) => {
  const match = datingMatches.get(req.params.matchId);
  if (match) {
    match.status = 'active';
    res.json(match);
  } else {
    res.status(404).json({ message: 'Match not found' });
  }
});

app.patch('/api/dating/matches/:matchId/seen', (req, res) => {
  res.json({ success: true });
});

// --- Match Messages ---
app.get('/api/dating/matches/:matchId/messages', (req, res) => {
  res.json([
    { id: 'msg_1', content: 'Hey! Nice to match with you!', senderId: 'other_user', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'msg_2', content: 'Hi! Thanks, likewise!', senderId: 'current_user', timestamp: new Date(Date.now() - 1800000).toISOString() },
  ]);
});

app.post('/api/dating/matches/:matchId/messages', (req, res) => {
  const message = {
    id: `msg_${Date.now()}`,
    content: req.body.content,
    senderId: 'current_user',
    timestamp: new Date().toISOString(),
  };
  res.status(201).json(message);
});

app.patch('/api/dating/matches/:matchId/messages/read', (req, res) => {
  res.json({ success: true });
});

// --- Likes Endpoints ---
app.get('/api/dating/likes', (req, res) => {
  const likes = [
    {
      id: 'like_1',
      fromUserId: 'user_mia',
      toUserId: 'current_user',
      fromProfile: datingProfiles.get('profile_mia'),
      isSuperLike: true,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      seen: false,
    },
    {
      id: 'like_2',
      fromUserId: 'user_ava',
      toUserId: 'current_user',
      fromProfile: datingProfiles.get('profile_ava'),
      isSuperLike: false,
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      seen: false,
    },
  ];
  res.json(likes);
});

app.get('/api/dating/likes/count', (req, res) => {
  res.json({ count: 5 });
});

app.patch('/api/dating/likes/:likeId/seen', (req, res) => {
  res.json({ success: true });
});

// --- Preferences Endpoints ---
app.get('/api/dating/preferences', (req, res) => {
  res.json({
    ageRange: { min: 22, max: 35 },
    maxDistance: 50,
    genderPreference: 'female',
    relationshipGoals: ['long_term', 'short_term'],
    showOnlyVerified: false,
    showOnlyWithBio: false,
    showOnlyWithPhotos: true,
    showOnlyActive: false,
    prioritizeSharedInterests: true,
    hideAge: false,
    hideDistance: false,
    incognitoMode: false,
  });
});

app.patch('/api/dating/preferences', (req, res) => {
  res.json({ ...req.body });
});

// --- Stats Endpoints ---
app.get('/api/dating/stats', (req, res) => {
  res.json({
    totalLikes: 45,
    totalPasses: 30,
    totalSuperLikes: 5,
    totalMatches: 8,
    likesRemaining: 95,
    superLikesRemaining: 1,
    rewindsRemaining: 3,
    boostsRemaining: 1,
    nextRefresh: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    isBoostActive: false,
  });
});

// --- Boost Endpoints ---
app.post('/api/dating/boost', (req, res) => {
  res.json({
    id: `boost_${Date.now()}`,
    userId: 'current_user',
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    multiplier: 2,
    isActive: true,
  });
});

app.get('/api/dating/boost/status', (req, res) => {
  res.json(null);
});

// --- Block & Report Endpoints ---
app.post('/api/dating/report', (req, res) => {
  res.json({
    id: `report_${Date.now()}`,
    reporterId: 'current_user',
    reportedUserId: req.body.reportedUserId,
    reason: req.body.reason,
    details: req.body.details,
    createdAt: new Date().toISOString(),
    status: 'pending',
  });
});

app.post('/api/dating/block/:userId', (req, res) => {
  blockedDatingUsers.set(req.params.userId, true);
  res.json({ success: true });
});

app.delete('/api/dating/block/:userId', (req, res) => {
  blockedDatingUsers.delete(req.params.userId);
  res.json({ success: true });
});

app.get('/api/dating/blocked', (req, res) => {
  res.json([]);
});

// --- Verification Endpoints ---
app.post('/api/dating/verify', (req, res) => {
  res.json({ status: 'pending' });
});

app.get('/api/dating/verify/status', (req, res) => {
  res.json({ status: 'none' });
});

// --- Photo Endpoints ---
app.post('/api/dating/photos', (req, res) => {
  res.json({ photoId: `photo_${Date.now()}`, url: 'https://via.placeholder.com/400x600' });
});

app.delete('/api/dating/photos/:photoId', (req, res) => {
  res.json({ success: true });
});

app.put('/api/dating/photos/reorder', (req, res) => {
  res.json({ success: true });
});

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

app.post('/auth/login', (req, res) => {
	const { phone, password } = req.body;

	if (!phone || !password) {
		return res.status(400).json({ message: 'Phone and password required' });
	}

	const user = users.get(phone);
	if (!user || user.password !== password) {
		return res.status(401).json({ message: 'Invalid credentials' });
	}

	const access_token = `token_${user.id}_${Date.now()}`;

	res.json({
		access_token,
		user: {
			id: user.id,
			phone: user.phone,
			name: user.name,
			email: user.email,
			avatar: user.avatar || '',
		},
	});
});

app.post('/auth/register', (req, res) => {
	const { phone, password, name, email } = req.body;

	if (!phone || !password) {
		return res.status(400).json({ message: 'Phone and password required' });
	}

	if (users.has(phone)) {
		return res.status(409).json({ message: 'User already exists' });
	}

	const user = {
		id: `user_${Date.now()}`,
		phone,
		password,
		name: name || 'User',
		email: email || '',
		avatar: '',
		createdAt: new Date(),
	};

	users.set(phone, user);

	const access_token = `token_${user.id}_${Date.now()}`;

	console.log(`[Auth] New user registered: ${phone}`);

	res.status(201).json({
		access_token,
		user: {
			id: user.id,
			phone: user.phone,
			name: user.name,
			email: user.email,
			avatar: user.avatar,
		},
	});
});

app.post('/auth/refresh', (req, res) => {
	const { token } = req.body;
	if (!token) {
		return res.status(401).json({ message: 'No token provided' });
	}
	// Return new token
	res.json({ token: `token_refreshed_${Date.now()}` });
});

// ============================================================================
// USER ENDPOINTS
// ============================================================================

app.get('/user/profile', (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: 'No auth token' });
	}

	// Return mock user
	res.json({
		id: 'user_123',
		name: 'Test User',
		email: 'test@example.com',
		phone: '+1234567890',
		avatar: '',
	});
});

app.put('/user/profile', (req, res) => {
	res.json({
		id: 'user_123',
		name: req.body.name || 'Test User',
		email: req.body.email || 'test@example.com',
		phone: '+1234567890',
	});
});

app.post('/user/avatar', (req, res) => {
	// Mock avatar upload
	res.json({ avatarUrl: 'https://example.com/avatar.jpg' });
});

app.delete('/user/account', (req, res) => {
	res.json({ success: true, message: 'Account deleted' });
});

app.get('/users/:userId', (req, res) => {
	res.json({
		id: req.params.userId,
		name: 'Other User',
		email: 'other@example.com',
		avatar: '',
	});
});

app.put('/user/preferences', (req, res) => {
	res.json({ ...req.body, theme: 'light' });
});

app.post('/users/:userId/block', (req, res) => {
	res.json({ success: true });
});

app.post('/users/:userId/report', (req, res) => {
	res.json({ success: true, message: 'User reported' });
});

// ============================================================================
// LOCATION ENDPOINTS
// ============================================================================

app.post('/api/location/update', (req, res) => {
	console.log(`[Location] Update from user:`, req.body);
	res.json({ success: true });
});

app.get('/api/location/nearby', (req, res) => {
	const { latitude, longitude, limit = 50 } = req.query;

	// Mock nearby users
	const mockUsers = [
		{
			id: '1',
			name: 'Alice',
			avatar: '',
			latitude: parseFloat(latitude) + 0.001,
			longitude: parseFloat(longitude) + 0.001,
			distance: 250,
			isOnline: true,
		},
		{
			id: '2',
			name: 'Bob',
			avatar: '',
			latitude: parseFloat(latitude) + 0.002,
			longitude: parseFloat(longitude) + 0.002,
			distance: 500,
			isOnline: true,
		},
		{
			id: '3',
			name: 'Charlie',
			avatar: '',
			latitude: parseFloat(latitude) + 0.003,
			longitude: parseFloat(longitude) + 0.003,
			distance: 800,
			isOnline: false,
		},
	];

	res.json(mockUsers.slice(0, parseInt(limit, 10)));
});

app.get('/api/location/geofences', (req, res) => {
	res.json([]);
});

// ============================================================================
// CHAT ENDPOINTS
// ============================================================================

app.get('/api/chat/conversations', (req, res) => {
	res.json([]);
});

app.get('/api/chat/conversations/:conversationId/messages', (req, res) => {
	const messages = conversations.get(req.params.conversationId) || [];
	res.json(messages);
});

app.post('/api/chat/conversations/:conversationId/messages', (req, res) => {
	const { content } = req.body;
	const message = {
		id: `msg_${Date.now()}`,
		conversationId: req.params.conversationId,
		senderId: 'user_123',
		content,
		createdAt: new Date().toISOString(),
		read: false,
	};

	if (!conversations.has(req.params.conversationId)) {
		conversations.set(req.params.conversationId, []);
	}
	conversations.get(req.params.conversationId).push(message);

	res.status(201).json(message);
});

app.put('/api/chat/conversations/:conversationId/read', (req, res) => {
	res.json({ success: true });
});

app.post('/api/chat/conversations', (req, res) => {
	const { participantId } = req.body;
	res.status(201).json({
		id: `conv_${Date.now()}`,
		participantId,
		lastMessage: null,
		unreadCount: 0,
	});
});

// ============================================================================
// NOTIFICATIONS ENDPOINTS
// ============================================================================

app.get('/api/notifications', (req, res) => {
	const mockNotifications = [
		{
			id: 'notif_1',
			title: 'User Nearby',
			body: 'Alice is 250m away',
			type: 'nearby_user',
			read: false,
			createdAt: new Date().toISOString(),
		},
	];
	res.json(mockNotifications);
});

app.put('/api/notifications/:notificationId/read', (req, res) => {
	res.json({ success: true });
});

app.delete('/api/notifications/:notificationId', (req, res) => {
	res.json({ success: true });
});

app.post('/api/notifications/nearby-alerts', (req, res) => {
	res.json({ success: true });
});

// ============================================================================
// PAYMENT ENDPOINTS
// ============================================================================

app.post('/api/payments/intent', (req, res) => {
	const { amount, currency = 'usd' } = req.body;
	res.json({
		clientSecret: `pi_test_${Date.now()}`,
		amount,
		currency,
	});
});

app.post('/api/payments/:paymentIntentId/confirm', (req, res) => {
	res.json({
		id: req.params.paymentIntentId,
		amount: 1000,
		status: 'completed',
		createdAt: new Date().toISOString(),
	});
});

app.get('/api/payments/transactions', (req, res) => {
	res.json([]);
});

// ============================================================================
// TASK ENDPOINTS
// ============================================================================

app.get('/api/tasks', (req, res) => {
	const mockTasks = [
		{
			id: 'task_1',
			title: 'Buy groceries',
			description: 'Milk, bread, eggs',
			status: 'pending',
			priority: 'high',
			userId: 'user_123',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		},
	];
	res.json(mockTasks);
});

app.post('/api/tasks', (req, res) => {
	const task = {
		id: `task_${Date.now()}`,
		...req.body,
		status: 'pending',
		userId: 'user_123',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
	res.json({
		id: req.params.id,
		...req.body,
		updatedAt: new Date().toISOString(),
	});
});

app.delete('/api/tasks/:id', (req, res) => {
	res.json({ success: true });
});

// ============================================================================
// SOCIAL GRAPH ENDPOINTS
// ============================================================================

// In-memory storage for social graph
const friends = new Map(); // userId -> FriendRelationship[]
const friendRequests = new Map(); // userId -> FriendRequest[]
const socialCircles = new Map(); // userId -> SocialCircle[]
const groups = new Map(); // groupId -> Group
const groupMemberships = new Map(); // userId -> groupId[]
const privacySettings = new Map(); // userId -> PrivacySettings
const suggestions = new Map(); // userId -> DiscoverySuggestion[]

// Mock data generators
const generateMockProfile = (id, name) => ({
  id,
  username: name.toLowerCase().replace(' ', '_'),
  avatarUrl: `https://i.pravatar.cc/150?u=${id}`,
  bio: `Hi, I'm ${name}!`,
  location: { latitude: 37.7749 + Math.random() * 0.1, longitude: -122.4194 + Math.random() * 0.1 },
  isOnline: Math.random() > 0.5,
  interests: ['travel', 'music', 'fitness', 'food', 'tech'].slice(0, Math.floor(Math.random() * 4) + 1),
});

const generateMockFriend = (userId, friendId, name) => ({
  id: `rel_${userId}_${friendId}`,
  userId,
  friendId,
  friendProfile: generateMockProfile(friendId, name),
  status: 'accepted',
  connectionStrength: ['weak', 'moderate', 'strong', 'best_friend'][Math.floor(Math.random() * 4)],
  createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  lastInteraction: new Date().toISOString(),
  mutualFriendsCount: Math.floor(Math.random() * 10),
  sharedCircles: [],
  interactionScore: Math.floor(Math.random() * 100),
  isFavorite: Math.random() > 0.8,
  notificationsMuted: false,
});

// --- Friends API ---
app.get('/api/social/friends', (req, res) => {
  // Return mock friends list
  const mockFriends = [
    generateMockFriend('user_123', 'friend_1', 'Alice Johnson'),
    generateMockFriend('user_123', 'friend_2', 'Bob Smith'),
    generateMockFriend('user_123', 'friend_3', 'Carol Davis'),
    generateMockFriend('user_123', 'friend_4', 'David Wilson'),
    generateMockFriend('user_123', 'friend_5', 'Emma Brown'),
  ];
  console.log('[Social] Fetched friends list');
  res.json(mockFriends);
});

app.get('/api/social/friends/:friendId', (req, res) => {
  const friend = generateMockFriend('user_123', req.params.friendId, 'Friend User');
  res.json(friend);
});

app.post('/api/social/friends/request', (req, res) => {
  const { targetUserId, message } = req.body;
  const request = {
    id: `req_${Date.now()}`,
    senderId: 'user_123',
    receiverId: targetUserId,
    senderProfile: generateMockProfile('user_123', 'Current User'),
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
    mutualFriendsCount: Math.floor(Math.random() * 5),
    mutualFriends: [],
  };
  console.log(`[Social] Friend request sent to ${targetUserId}`);
  res.status(201).json(request);
});

app.get('/api/social/friends/requests/incoming', (req, res) => {
  const mockRequests = [
    {
      id: 'req_1',
      senderId: 'user_sender_1',
      receiverId: 'user_123',
      senderProfile: generateMockProfile('user_sender_1', 'Frank Miller'),
      message: 'Hey! We met at the conference.',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      mutualFriendsCount: 3,
      mutualFriends: ['friend_1', 'friend_2', 'friend_3'],
    },
    {
      id: 'req_2',
      senderId: 'user_sender_2',
      receiverId: 'user_123',
      senderProfile: generateMockProfile('user_sender_2', 'Grace Lee'),
      status: 'pending',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      mutualFriendsCount: 1,
      mutualFriends: ['friend_1'],
    },
  ];
  res.json(mockRequests);
});

app.get('/api/social/friends/requests/outgoing', (req, res) => {
  const mockRequests = [
    {
      id: 'req_out_1',
      senderId: 'user_123',
      receiverId: 'user_target_1',
      senderProfile: generateMockProfile('user_123', 'Current User'),
      message: 'Would love to connect!',
      status: 'pending',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      mutualFriendsCount: 2,
      mutualFriends: [],
    },
  ];
  res.json(mockRequests);
});

app.put('/api/social/friends/request/:requestId', (req, res) => {
  const { action } = req.body;
  const request = {
    id: req.params.requestId,
    senderId: 'user_sender_1',
    receiverId: 'user_123',
    status: action === 'accept' ? 'accepted' : 'rejected',
    respondedAt: new Date().toISOString(),
  };
  console.log(`[Social] Friend request ${action}ed: ${req.params.requestId}`);
  res.json(request);
});

app.delete('/api/social/friends/request/:requestId', (req, res) => {
  console.log(`[Social] Friend request cancelled: ${req.params.requestId}`);
  res.json({ success: true });
});

app.put('/api/social/friends/:friendId', (req, res) => {
  const updated = {
    ...generateMockFriend('user_123', req.params.friendId, 'Friend User'),
    ...req.body,
  };
  res.json(updated);
});

app.delete('/api/social/friends/:friendId', (req, res) => {
  console.log(`[Social] Friend removed: ${req.params.friendId}`);
  res.json({ success: true });
});

app.get('/api/social/friends/mutual/:userId', (req, res) => {
  const mockMutual = {
    connections: [
      { userId: 'friend_1', profile: generateMockProfile('friend_1', 'Alice Johnson'), relationship: null, connectionPath: [], degreeOfSeparation: 1, commonInterests: ['travel'], mutualFriendsCount: 0 },
      { userId: 'friend_2', profile: generateMockProfile('friend_2', 'Bob Smith'), relationship: null, connectionPath: [], degreeOfSeparation: 1, commonInterests: ['music'], mutualFriendsCount: 0 },
    ],
    count: 2,
  };
  res.json(mockMutual);
});

app.get('/api/social/friends/search', (req, res) => {
  const { q } = req.query;
  const results = [
    generateMockFriend('user_123', 'friend_1', 'Alice Johnson'),
  ].filter(f => f.friendProfile.username.includes(q?.toLowerCase() || ''));
  res.json(results);
});

// --- Social Circles API ---
app.get('/api/social/circles', (req, res) => {
  const defaultPermissions = {
    canViewLocation: true,
    canViewOnlineStatus: true,
    canViewPosts: true,
    canViewStories: true,
    canSendMessages: true,
    canViewActivity: true,
    canViewFriendList: false,
    canViewBio: true,
    canViewPhotos: true,
    customPermissions: {},
  };

  const mockCircles = [
    {
      id: 'circle_close_friends',
      name: 'Close Friends',
      description: 'My closest friends who can see everything',
      color: '#FF6B6B',
      icon: '❤️',
      ownerId: 'user_123',
      memberIds: ['friend_1', 'friend_2'],
      members: [generateMockProfile('friend_1', 'Alice'), generateMockProfile('friend_2', 'Bob')],
      visibility: 'private',
      permissions: { ...defaultPermissions, canViewLocation: true, canViewFriendList: true },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true,
    },
    {
      id: 'circle_family',
      name: 'Family',
      description: 'Family members',
      color: '#4ECDC4',
      icon: '👨‍👩‍👧‍👦',
      ownerId: 'user_123',
      memberIds: ['friend_3'],
      members: [generateMockProfile('friend_3', 'Carol')],
      visibility: 'private',
      permissions: defaultPermissions,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true,
    },
    {
      id: 'circle_work',
      name: 'Work Colleagues',
      description: 'People from work',
      color: '#45B7D1',
      icon: '💼',
      ownerId: 'user_123',
      memberIds: ['friend_4', 'friend_5'],
      members: [generateMockProfile('friend_4', 'David'), generateMockProfile('friend_5', 'Emma')],
      visibility: 'private',
      permissions: { ...defaultPermissions, canViewLocation: false },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    },
  ];
  res.json(mockCircles);
});

app.get('/api/social/circles/:circleId', (req, res) => {
  res.json({
    id: req.params.circleId,
    name: 'Custom Circle',
    color: '#9B59B6',
    icon: '⭐',
    ownerId: 'user_123',
    memberIds: [],
    members: [],
    visibility: 'private',
    permissions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
  });
});

app.post('/api/social/circles', (req, res) => {
  const circle = {
    id: `circle_${Date.now()}`,
    ...req.body,
    ownerId: 'user_123',
    memberIds: req.body.memberIds || [],
    members: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
  };
  console.log(`[Social] Circle created: ${circle.name}`);
  res.status(201).json(circle);
});

app.put('/api/social/circles/:circleId', (req, res) => {
  res.json({
    id: req.params.circleId,
    ...req.body,
    updatedAt: new Date().toISOString(),
  });
});

app.delete('/api/social/circles/:circleId', (req, res) => {
  console.log(`[Social] Circle deleted: ${req.params.circleId}`);
  res.json({ success: true });
});

app.post('/api/social/circles/:circleId/members', (req, res) => {
  const { memberIds } = req.body;
  console.log(`[Social] Added members to circle ${req.params.circleId}:`, memberIds);
  res.json({
    id: req.params.circleId,
    memberIds,
    members: memberIds.map((id, i) => generateMockProfile(id, `User ${i + 1}`)),
  });
});

app.delete('/api/social/circles/:circleId/members/:memberId', (req, res) => {
  console.log(`[Social] Removed ${req.params.memberId} from circle ${req.params.circleId}`);
  res.json({ id: req.params.circleId, memberIds: [], members: [] });
});

// --- Groups API ---
app.get('/api/social/groups', (req, res) => {
  const mockGroups = [
    {
      id: 'group_1',
      name: 'Tech Enthusiasts SF',
      description: 'A community for tech lovers in San Francisco',
      avatar: 'https://i.pravatar.cc/150?u=group1',
      type: 'public',
      joinMethod: 'open',
      category: 'Technology',
      tags: ['tech', 'startups', 'networking'],
      ownerId: 'user_owner_1',
      memberCount: 156,
      members: [],
      admins: ['user_owner_1'],
      moderators: [],
      settings: { allowMemberPosts: true, allowMemberInvites: true, requirePostApproval: false, allowPolls: true, allowEvents: true, allowMediaSharing: true, notifyOnNewMembers: true, notifyOnNewPosts: false },
      rules: ['Be respectful', 'No spam', 'Stay on topic'],
      isLocationBased: true,
      locationName: 'San Francisco, CA',
      location: { latitude: 37.7749, longitude: -122.4194 },
      radius: 50000,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    },
    {
      id: 'group_2',
      name: 'Hiking Adventures',
      description: 'Find hiking buddies and explore trails together',
      avatar: 'https://i.pravatar.cc/150?u=group2',
      type: 'public',
      joinMethod: 'open',
      category: 'Outdoors',
      tags: ['hiking', 'nature', 'fitness'],
      ownerId: 'user_owner_2',
      memberCount: 89,
      members: [],
      admins: ['user_owner_2'],
      moderators: [],
      settings: { allowMemberPosts: true, allowMemberInvites: true, requirePostApproval: false, allowPolls: true, allowEvents: true, allowMediaSharing: true, notifyOnNewMembers: false, notifyOnNewPosts: false },
      rules: ['Safety first', 'Leave no trace'],
      isLocationBased: false,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
  res.json(mockGroups);
});

app.get('/api/social/groups/:groupId', (req, res) => {
  res.json({
    id: req.params.groupId,
    name: 'Sample Group',
    description: 'A sample group',
    type: 'public',
    joinMethod: 'open',
    memberCount: 50,
    members: [
      { userId: 'member_1', profile: generateMockProfile('member_1', 'Member One'), role: 'member', joinedAt: new Date().toISOString(), contributionScore: 10, isMuted: false },
    ],
    createdAt: new Date().toISOString(),
  });
});

app.post('/api/social/groups', (req, res) => {
  const group = {
    id: `group_${Date.now()}`,
    ...req.body,
    ownerId: 'user_123',
    memberCount: 1,
    members: [{ userId: 'user_123', role: 'owner', joinedAt: new Date().toISOString() }],
    admins: ['user_123'],
    moderators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  console.log(`[Social] Group created: ${group.name}`);
  res.status(201).json(group);
});

app.put('/api/social/groups/:groupId', (req, res) => {
  res.json({ id: req.params.groupId, ...req.body, updatedAt: new Date().toISOString() });
});

app.delete('/api/social/groups/:groupId', (req, res) => {
  console.log(`[Social] Group deleted: ${req.params.groupId}`);
  res.json({ success: true });
});

app.post('/api/social/groups/:groupId/join', (req, res) => {
  // For open groups, return the group. For others, return a join request.
  res.json({
    id: req.params.groupId,
    name: 'Joined Group',
    memberCount: 51,
  });
});

app.post('/api/social/groups/:groupId/leave', (req, res) => {
  console.log(`[Social] User left group: ${req.params.groupId}`);
  res.json({ success: true });
});

app.get('/api/social/groups/invites', (req, res) => {
  const mockInvites = [
    {
      id: 'invite_1',
      groupId: 'group_3',
      group: { id: 'group_3', name: 'Book Club', avatar: 'https://i.pravatar.cc/150?u=group3', type: 'private', memberCount: 25 },
      inviterId: 'friend_1',
      inviterProfile: generateMockProfile('friend_1', 'Alice Johnson'),
      inviteeId: 'user_123',
      message: 'You should join us!',
      status: 'pending',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
  res.json(mockInvites);
});

app.post('/api/social/groups/:groupId/invite', (req, res) => {
  const { userIds, message } = req.body;
  const invites = userIds.map(userId => ({
    id: `invite_${Date.now()}_${userId}`,
    groupId: req.params.groupId,
    inviterId: 'user_123',
    inviteeId: userId,
    message,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }));
  res.json(invites);
});

app.put('/api/social/groups/invites/:inviteId', (req, res) => {
  const { action } = req.body;
  res.json({
    id: req.params.inviteId,
    groupId: 'group_3',
    status: action === 'accept' ? 'accepted' : 'rejected',
  });
});

app.get('/api/social/groups/search', (req, res) => {
  res.json([]);
});

app.get('/api/social/groups/nearby', (req, res) => {
  res.json([]);
});

// --- Discovery API ---
app.get('/api/social/discovery/suggestions', (req, res) => {
  const mockSuggestions = [
    {
      userId: 'suggested_1',
      profile: generateMockProfile('suggested_1', 'Hannah White'),
      source: 'mutual_friends',
      score: 85,
      reasons: [
        { type: 'mutual_friends', description: '5 mutual friends', weight: 0.35 },
        { type: 'interest_based', description: '3 shared interests', weight: 0.25 },
      ],
      mutualFriendsCount: 5,
      mutualFriends: [generateMockProfile('friend_1', 'Alice'), generateMockProfile('friend_2', 'Bob')],
      commonInterests: ['travel', 'photography', 'cooking'],
      commonGroups: [],
      isDismissed: false,
    },
    {
      userId: 'suggested_2',
      profile: generateMockProfile('suggested_2', 'Ian Thompson'),
      source: 'location_based',
      score: 72,
      reasons: [
        { type: 'location_based', description: '2.5km away', weight: 0.20 },
        { type: 'interest_based', description: '2 shared interests', weight: 0.25 },
      ],
      mutualFriendsCount: 2,
      mutualFriends: [generateMockProfile('friend_3', 'Carol')],
      commonInterests: ['fitness', 'tech'],
      commonGroups: [{ id: 'group_1', name: 'Tech Enthusiasts SF', avatar: '' }],
      distance: 2500,
      isDismissed: false,
    },
    {
      userId: 'suggested_3',
      profile: generateMockProfile('suggested_3', 'Julia Martinez'),
      source: 'interest_based',
      score: 68,
      reasons: [
        { type: 'interest_based', description: '4 shared interests', weight: 0.25 },
        { type: 'group_members', description: '2 common groups', weight: 0.10 },
      ],
      mutualFriendsCount: 0,
      mutualFriends: [],
      commonInterests: ['music', 'art', 'food', 'travel'],
      commonGroups: [{ id: 'group_2', name: 'Hiking Adventures' }],
      isDismissed: false,
    },
  ];
  res.json(mockSuggestions);
});

app.post('/api/social/discovery/dismiss/:userId', (req, res) => {
  console.log(`[Social] Suggestion dismissed: ${req.params.userId}`);
  res.json({ success: true });
});

app.get('/api/social/discovery/preferences', (req, res) => {
  res.json({
    enableLocationBasedSuggestions: true,
    enableInterestBasedSuggestions: true,
    enableMutualFriendSuggestions: true,
    enableContactSync: false,
    maxDistance: 50000,
    excludedInterests: [],
    minMutualFriends: 0,
  });
});

app.put('/api/social/discovery/preferences', (req, res) => {
  res.json({ ...req.body });
});

app.get('/api/social/discovery/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const results = [
    { userId: 'search_1', profile: generateMockProfile('search_1', `${q} User`), relationship: null, connectionPath: [], degreeOfSeparation: 2, commonInterests: ['travel'], mutualFriendsCount: 1 },
  ];
  res.json(results);
});

app.get('/api/social/discovery/nearby', (req, res) => {
  res.json([]);
});

app.post('/api/social/discovery/sync-contacts', (req, res) => {
  res.json([]);
});

// --- Privacy API ---
app.get('/api/social/privacy', (req, res) => {
  res.json({
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
  });
});

app.put('/api/social/privacy', (req, res) => {
  console.log('[Social] Privacy settings updated');
  res.json({ ...req.body });
});

app.post('/api/social/privacy/block', (req, res) => {
  console.log(`[Social] User blocked: ${req.body.userId}`);
  res.json({ success: true });
});

app.delete('/api/social/privacy/block/:userId', (req, res) => {
  console.log(`[Social] User unblocked: ${req.params.userId}`);
  res.json({ success: true });
});

app.get('/api/social/privacy/blocked', (req, res) => {
  res.json([]);
});

app.post('/api/social/privacy/restrict/:userId', (req, res) => {
  res.json({ success: true });
});

app.delete('/api/social/privacy/restrict/:userId', (req, res) => {
  res.json({ success: true });
});

app.get('/api/social/privacy/restricted', (req, res) => {
  res.json([]);
});

app.post('/api/social/privacy/hide/:userId', (req, res) => {
  res.json({ success: true });
});

app.delete('/api/social/privacy/hide/:userId', (req, res) => {
  res.json({ success: true });
});

app.put('/api/social/privacy/circles/:circleId', (req, res) => {
  res.json({ circleOverrides: { [req.params.circleId]: req.body.overrides } });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
	res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ message: 'Endpoint not found', path: req.path });
});

// ============================================================================
// SOCKET.IO HANDLERS
// ============================================================================

io.on('connection', (socket) => {
	console.log('[Socket] Client connected:', socket.id);

	// Join a room (for user-specific messaging)
	socket.on('join', (userId) => {
		socket.join(userId);
		console.log(`[Socket] User ${userId} joined room`);
	});

	// Handle chat messages
	socket.on('chat:message', (data) => {
		console.log('[Socket] Chat message:', data);
		// Broadcast to recipient
		if (data.recipientId) {
			io.to(data.recipientId).emit('chat:message', data);
		}
	});

	// Handle typing indicators
	socket.on('chat:typing', (data) => {
		if (data.recipientId) {
			io.to(data.recipientId).emit('chat:typing', data);
		}
	});

	// Handle location updates
	socket.on('location:update', (data) => {
		console.log('[Socket] Location update:', data);
		// Broadcast to nearby users (simplified)
		socket.broadcast.emit('location:nearby', data);
	});

	// Handle disconnect
	socket.on('disconnect', () => {
		console.log('[Socket] Client disconnected:', socket.id);
	});
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
	console.log('\n✅ Mock backend running on http://localhost:' + PORT);
	console.log('   For Android emulator: http://10.0.2.2:' + PORT);
	console.log('\n🔌 Socket.IO enabled');
	console.log('\n📝 Test credentials:');
	console.log('   Phone: +1234567890');
	console.log('   Password: password123');
	console.log('\n📊 Total endpoints: 30+\n');
});
