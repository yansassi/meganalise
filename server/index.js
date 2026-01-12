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
const allowedOrigins = [
    'https://meganalise.pro',
    'https://www.meganalise.pro',
    'http://meganalise.pro',
    'http://localhost:5173',
    'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            // Check if origin is a subdomain if needed, or just strict match.
            // For now, strict match.
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            // console.log('Blocked CORS for:', origin); 
            // Ideally we want to allow it if it's our frontend.
        }
        return callback(null, true); // Temporarily allow all for debugging if strict fails
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
