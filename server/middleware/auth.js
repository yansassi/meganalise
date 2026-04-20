const { pb } = require('../services/db');
const PocketBase = require('pocketbase/cjs');

const requireAuth = async (req, res, next) => {
    // Check for API key (useful for scripts or server-to-server)
    const apiKey = req.headers['x-api-key'];
    if (apiKey && process.env.API_KEY && apiKey === process.env.API_KEY) {
        return next();
    }

    // Check for Bearer token (PocketBase JWT token from client)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // To properly verify the token signature and validity without the JWT secret,
        // we can authenticate with PocketBase using the provided token.
        // We create a new client instance so we don't pollute the global admin instance's auth store.
        const authPb = new PocketBase(process.env.PB_URL || 'https://auth.meganalise.pro');
        authPb.authStore.save(token, null); // Save token to the new instance

        if (!authPb.authStore.isValid) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }

        // Optionally, make a quick API call to ensure the token actually works
        // by fetching the user's own profile. This handles revoked tokens.
        const authRecord = await authPb.collection('users').authRefresh();

        req.user = authRecord.record;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = { requireAuth };
