const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TokenService = require('../services/tokenService');
const ApiError = require('../utils/ApiError');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET || 'your-jwt-secret',
        { expiresIn: '24h' }
    );
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError('Invalid credentials', 401);
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new ApiError('Invalid credentials', 401);
        }

        // Generate tokens
        const tokens = TokenService.generateTokens(user);

        // Save refresh token
        await TokenService.saveRefreshToken(user._id, tokens.refreshToken);

        // Set cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };

        // Send response with cookie
        res.cookie('token', tokens.accessToken, cookieOptions)
           .json({
                success: true,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                tokens
            });

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        user = await User.create({
            email,
            password,
            name,
            role: 'user'
        });

        // Generate token
        const token = generateToken(user);

        // Set cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };

        // Send response with cookie
        res.cookie('token', token, cookieOptions)
           .status(201)
           .json({
                success: true,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                },
                token
            });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration'
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            throw new ApiError('Refresh token is required', 400);
        }

        // Revoke refresh token
        await TokenService.revokeRefreshToken(req.user._id, refreshToken);

        res.clearCookie('token')
           .json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

exports.logoutAll = async (req, res) => {
    try {
        // Revoke all refresh tokens for the user
        await TokenService.revokeAllUserTokens(req.user._id);

        res.clearCookie('token')
           .json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching user data'
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            throw new ApiError('Refresh token is required', 400);
        }

        // Generate new tokens
        const tokens = await TokenService.refreshAccessToken(refreshToken);

        // Set cookie options
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        };

        // Send response with new cookie
        res.cookie('token', tokens.accessToken, cookieOptions)
           .json({ tokens });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};
