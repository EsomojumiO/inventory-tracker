const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, ROLES } = require('../models/User');
const Organization = require('../models/Organization');
const PasswordReset = require('../models/PasswordReset');
const nodemailer = require('nodemailer');
const passport = require('passport'); // Assuming you have installed and configured passport
const AccountingService = require('../services/AccountingService');
const ApiError = require('../utils/ApiError');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Validate email format
const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
};

// Generate access token
const generateAccessToken = (userId) => {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '15m' });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '7d' });
};

// Set token cookie
const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
    });
};

// Login route
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            throw new ApiError('Username and password are required', 400);
        }

        // Find user
        const user = await User.findOne({ username }).select('+password');
        if (!user) {
            throw new ApiError('Invalid username or password', 401);
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new ApiError('Invalid username or password', 401);
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push(refreshToken);
        await user.save();

        // Remove sensitive data
        user.password = undefined;
        user.refreshTokens = undefined;

        res.json({
            success: true,
            data: {
                user,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
});

// Registration route
router.post('/register', async (req, res, next) => {
    try {
        const { 
            username, 
            email, 
            password,
            firstName,
            lastName,
            phone,
            businessName
        } = req.body;

        // Validate input
        if (!username || !email || !password || !firstName || !lastName || !phone || !businessName) {
            throw new ApiError('All fields are required', 400);
        }

        if (!isValidEmail(email)) {
            throw new ApiError('Invalid email format', 400);
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            throw new ApiError('User with this email or username already exists', 400);
        }

        // Create organization
        const organizationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const organization = new Organization({
            name: businessName,
            code: organizationCode,
            contact: {
                email,
                phone
            },
            createdBy: null // Will be updated after user creation
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            businessName,
            organization: organization._id,
            role: ROLES.USER
        });

        // Save organization and update createdBy
        organization.createdBy = user._id;
        await organization.save();
        
        // Save user
        await user.save();

        // Create default accounts for the organization
        await AccountingService.createDefaultAccounts(organization._id, user._id);

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push(refreshToken);
        await user.save();

        // Remove sensitive data
        user.password = undefined;
        user.refreshTokens = undefined;

        res.json({
            success: true,
            data: {
                user,
                accessToken,
                refreshToken
            }
        });
    } catch (error) {
        next(error);
    }
});

// Refresh token
router.post('/refresh-token', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new ApiError('Refresh token is required', 400);
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, SECRET_KEY);

        // Find user and check if refresh token exists
        const user = await User.findById(decoded.userId);
        if (!user || !user.refreshTokens?.includes(refreshToken)) {
            throw new ApiError('Invalid refresh token', 401);
        }

        // Generate new tokens
        const accessToken = generateAccessToken(user._id);
        const newRefreshToken = generateRefreshToken(user._id);

        // Replace old refresh token
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();

        res.json({
            success: true,
            data: {
                accessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new ApiError('Invalid refresh token', 401));
        }
        next(error);
    }
});

// Logout
router.post('/logout', authenticate, async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        // Remove refresh token
        const user = await User.findById(req.user._id);
        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save();

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            throw new ApiError('User not found', 404);
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// Middleware for verifying token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (error) {
        // Clear invalid token
        res.clearCookie('token', { path: '/' });
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// Verify authentication status
router.get('/verify', async (req, res) => {
    try {
        // Check for token in cookies
        const token = req.cookies.token;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, SECRET_KEY);
        
        // Get user data (excluding password)
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
                businessName: user.businessName
            }
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');

        // Save reset token
        await PasswordReset.create({
            userId: user._id,
            token: token
        });

        // Send reset email
        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <h1>Password Reset Request</h1>
                <p>Click the link below to reset your password. This link will expire in 24 hours.</p>
                <a href="${resetLink}">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Password reset instructions sent to your email' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Error processing password reset request' });
    }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Find valid reset token
        const resetRequest = await PasswordReset.findOne({
            token,
            used: false,
            expiresAt: { $gt: new Date() }
        });

        if (!resetRequest) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Find user and update password
        const user = await User.findById(resetRequest.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Mark token as used
        resetRequest.used = true;
        await resetRequest.save();

        res.json({ message: 'Password successfully reset' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login',
        session: false
    }),
    (req, res) => {
        try {
            const token = generateAccessToken(req.user._id);
            setTokenCookie(res, token);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect('/login?error=google_auth_failed');
        }
    }
);

// Apple OAuth routes
router.get('/apple',
    passport.authenticate('apple', { 
        scope: ['name', 'email'],
        prompt: 'select_account'
    })
);

router.get('/apple/callback',
    passport.authenticate('apple', { 
        failureRedirect: '/login',
        session: false
    }),
    (req, res) => {
        try {
            const token = generateAccessToken(req.user._id);
            setTokenCookie(res, token);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
        } catch (error) {
            console.error('Apple callback error:', error);
            res.redirect('/login?error=apple_auth_failed');
        }
    }
);

// Role-based access control middleware
const authorizeRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: 'Access forbidden' });
    }
    next();
};

// Protected route example
router.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
    res.json({ message: 'Welcome, admin!' });
});

module.exports = router;