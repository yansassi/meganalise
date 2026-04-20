require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pb } = require('./services/db');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:5173', 'http://localhost:4173', 'https://meganalise.pro', 'https://www.meganalise.pro'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Content-Type check for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Content-Type: ${req.headers['content-type']}`);
    next();
});

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Meganalise API',
        pb_auth: pb.authStore.isValid ? 'authenticated' : 'not_authenticated'
    });
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);

    // Authenticate with PocketBase on startup
    try {
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
        console.log('PocketBase Admin Authenticated!');
    } catch (err) {
        console.error('Failed to authenticate with PocketBase:', err.message);
    }
});
