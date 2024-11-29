const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, ROLES } = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const nodemailer = require('nodemailer');
const passport = require('passport'); // Assuming you have installed and configured passport

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

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        SECRET_KEY,
        { expiresIn: '24h' }
    );
};

// Set token cookie
const setTokenCookie = (res, token) => {
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
};

// Register a new user
router.post('/register', async (req, res) => {
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

        // Set content type
        res.setHeader('Content-Type', 'application/json');
        
        // Validate required fields
        if (!username || !email || !password || !firstName || !lastName || !phone || !businessName) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Validate username format
        if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
            return res.status(400).json({ 
                success: false,
                message: 'Username must be 3-20 alphanumeric characters' 
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format' 
            });
        }

        // Validate password length and complexity
        if (password.length < 8) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 8 characters long' 
            });
        }
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must contain at least one uppercase letter' 
            });
        }
        if (!/[a-z]/.test(password)) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must contain at least one lowercase letter' 
            });
        }
        if (!/[0-9]/.test(password)) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must contain at least one number' 
            });
        }

        // Validate phone number
        if (!/^\+?[\d\s-]{10,}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Check for existing username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ 
                success: false,
                message: 'Username already exists' 
            });
        }

        // Check for existing email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered' 
            });
        }

        // Create new user
        const newUser = new User({ 
            username,
            email,
            password,
            firstName,
            lastName,
            phone,
            businessName,
            role: 'user'
        });
        
        await newUser.save();
        
        res.status(201).json({ 
            success: true,
            message: 'User registered successfully'
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: Object.values(error.errors).map(err => err.message).join(', ')
            });
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        // Set content type
        res.setHeader('Content-Type', 'application/json');

        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Check password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Generate token and set cookie
        const token = generateToken(user);
        setTokenCookie(res, token);

        // Return success response
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: Object.values(error.errors).map(err => err.message).join(', ')
            });
        }
        
        // Handle other errors
        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
});

// Refresh token
router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new token and set cookie
        const newToken = generateToken(user);
        setTokenCookie(res, newToken);

        res.json({
            success: true,
            token: newToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Middleware for verifying token
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

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
        const user = await User.findById(decoded.id).select('-password');
        
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
            const token = generateToken(req.user);
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
            const token = generateToken(req.user);
            setTokenCookie(res, token);
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
        } catch (error) {
            console.error('Apple callback error:', error);
            res.redirect('/login?error=apple_auth_failed');
        }
    }
);

module.exports = router;