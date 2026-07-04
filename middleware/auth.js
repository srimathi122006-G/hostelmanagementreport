const jwt = require('jsonwebtoken');

// Token Verification Middleware
const verifyToken = (req, res, next) => {
    // Expect header like "Bearer <token>"
    const bearerHeader = req.headers['authorization'];
    
    if (!bearerHeader) {
        return res.status(403).json({ error: 'A token is required for authentication' });
    }

    try {
        const token = bearerHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Contains id and type
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return next();
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.type === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
};

module.exports = { verifyToken, requireAdmin };
