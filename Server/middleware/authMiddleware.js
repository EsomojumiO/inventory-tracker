const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const config = require('../config/config');

// Extract token from request
const extractToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        return req.headers.authorization.split(' ')[1];
    }
    return req.cookies?.[config.TOKEN_KEY];
};

// Authenticate token and attach user to request
const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req);
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required'
            });
        }

        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'User not found'
                });
            }

            if (!user.isActive) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Account is deactivated'
                });
            }

            // Attach user to request
            req.user = {
                id: user._id,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            };

            next();
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error'
        });
    }
};

// Check if user has required permission
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user.permissions?.includes(permission)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }
        next();
    };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    next();
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (getUserId) => {
    return (req, res, next) => {
        const resourceUserId = getUserId(req);
        if (req.user.role !== 'admin' && req.user.id.toString() !== resourceUserId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    hasPermission,
    isAdmin,
    isOwnerOrAdmin
};
