// backend/server.js - Complete Mock Backend
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// IN-MEMORY STORAGE (for demo - replace with DB in production)
// ============================================================================
const users = new Map(); // phone -> user
const conversations = new Map(); // conversationId -> messages[]
const notifications = new Map(); // userId -> notifications[]

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
	const { latitude, longitude, radius = 5000, limit = 50 } = req.query;

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

	res.json(mockUsers.slice(0, parseInt(limit)));
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
// START SERVER
// ============================================================================

app.listen(PORT, () => {
	console.log('\n✅ Mock backend running on http://localhost:' + PORT);
	console.log('   For Android emulator: http://10.0.2.2:' + PORT);
	console.log('\n📝 Test credentials:');
	console.log('   Phone: +1234567890');
	console.log('   Password: password123');
	console.log('\n📊 Total endpoints: 30+\n');
});
