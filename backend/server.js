// backend/server.js - Simple Mock Backend for Testing
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user database
const users = new Map();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register endpoint
app.post('/auth/register', (req, res) => {
  const { phone, password, name, email } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  if (users.has(phone)) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = {
    id: `user_${Date.now()}`,
    phone,
    name: name || 'User',
    email: email || '',
    avatar: '',
  };

  users.set(phone, { ...user, password });

  const token = `mock_token_${user.id}_${Date.now()}`;

  console.log(`[Register] New user: ${phone}`);

  res.status(201).json({
    access_token: token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    },
  });
});

// Login endpoint
app.post('/auth/login', (req, res) => {
  const { phone, password } = req.body;

  console.log(`[Login] Attempt from: ${phone}`);

  if (!phone || !password) {
    return res.status(400).json({ message: 'Phone and password are required' });
  }

  const user = users.get(phone);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const token = `mock_token_${user.id}_${Date.now()}`;

  console.log(`[Login] Success: ${phone}`);

  res.json({
    access_token: token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    },
  });
});

// Get user profile
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const user = {
    id: 'user_123',
    phone: '+1234567890',
    name: 'Test User',
    email: 'test@example.com',
    avatar: '',
  };

  res.json(user);
});

// Get nearby users
app.get('/api/location/nearby', (req, res) => {
  const nearbyUsers = [
    {
      id: '1',
      name: 'Alice',
      latitude: 42.3601,
      longitude: -71.0589,
      distance: 250,
      isOnline: true
    },
    {
      id: '2',
      name: 'Bob',
      latitude: 42.3605,
      longitude: -71.0595,
      distance: 500,
      isOnline: true
    },
    {
      id: '3',
      name: 'Charlie',
      latitude: 42.3610,
      longitude: -71.0600,
      distance: 800,
      isOnline: false
    },
  ];

  res.json(nearbyUsers);
});

// Update location
app.post('/api/location/update', (req, res) => {
  console.log('[Location] Update:', req.body);
  res.json({ success: true });
});

// Get tasks
app.get('/api/tasks', (req, res) => {
  const tasks = [
    {
      id: '1',
      title: 'Sample Task',
      description: 'This is a test task',
      status: 'pending',
      priority: 'medium',
      userId: 'user_123',
      createdAt: new Date(),
      updatedAt: new Date()
    },
  ];

  res.json(tasks);
});

// Create task
app.post('/api/tasks', (req, res) => {
  const task = {
    id: `task_${Date.now()}`,
    ...req.body,
    status: 'pending',
    userId: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('[Task] Created:', task.title);

  res.status(201).json(task);
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  const task = {
    id: req.params.id,
    ...req.body,
    updatedAt: new Date(),
  };

  console.log('[Task] Updated:', req.params.id);

  res.json(task);
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  console.log('[Task] Deleted:', req.params.id);
  res.json({ success: true });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log('\n✅ Mock backend running on http://localhost:' + PORT);
  console.log('   For Android emulator: http://10.0.2.2:' + PORT);
  console.log('\n📝 Available endpoints:');
  console.log('   POST /auth/register');
  console.log('   POST /auth/login');
  console.log('   GET  /api/auth/me');
  console.log('   GET  /api/location/nearby');
  console.log('   POST /api/location/update');
  console.log('   GET  /api/tasks');
  console.log('   POST /api/tasks');
  console.log('   PUT  /api/tasks/:id');
  console.log('   DELETE /api/tasks/:id');
  console.log('\n💡 Test credentials:');
  console.log('   Phone: +1234567890');
  console.log('   Password: password123');
  console.log('\n');
});
