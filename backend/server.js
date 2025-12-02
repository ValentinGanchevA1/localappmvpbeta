const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());


});

app.post('/auth/register', (req, res) => {
	const { phone, password, name, email } = req.body;

	if (!phone || !password) {
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




	res.status(201).json({
		user: {
			id: user.id,
			phone: user.phone,
			name: user.name,
			email: user.email,
		},
	});
});

	}


	const authHeader = req.headers.authorization;
	if (!authHeader) {
	}

		id: 'user_123',
		name: 'Test User',
		email: 'test@example.com',
		avatar: '',

});

app.get('/api/location/nearby', (req, res) => {
		{
			id: '1',
			name: 'Alice',
			distance: 250,
		},
		{
			id: '2',
			name: 'Bob',
			distance: 500,
		},
		{
			id: '3',
			name: 'Charlie',
			distance: 800,
		},
	];

});

	res.json({ success: true });
});

app.get('/api/tasks', (req, res) => {
		{
			status: 'pending',
			userId: 'user_123',
		},
	];
});

app.post('/api/tasks', (req, res) => {
	const task = {
		id: `task_${Date.now()}`,
		...req.body,
		status: 'pending',
		userId: 'user_123',
	};
	res.status(201).json(task);
});

app.put('/api/tasks/:id', (req, res) => {
		id: req.params.id,
		...req.body,
});

app.delete('/api/tasks/:id', (req, res) => {
	res.json({ success: true });
});

app.use((req, res) => {
});

app.listen(PORT, () => {
	console.log('\n✅ Mock backend running on http://localhost:' + PORT);
	console.log('   For Android emulator: http://10.0.2.2:' + PORT);
	console.log('   Phone: +1234567890');
	console.log('   Password: password123');
});
