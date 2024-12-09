const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from token
            const user = await User.findById(decoded.userId)
                .select('-password -refreshTokens');
                
            if (!user) {
                throw new ApiError('User not found', 401);
            }

            // Add user to request
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new ApiError('Token expired', 401);
            }
            throw new ApiError('Invalid token', 401);
        }
    } catch (error) {
        next(error);
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ApiError('Not authorized to access this route', 403);
        }
        next();
    };
};

module.exports = { authenticate, authorize };
