const express = require('express');
const router = express.Router();
const { User, ROLES } = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Create new user (admin only)
router.post('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // Validate role
        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const user = new User({
            username,
            email,
            password,
            role
        });

        await user.save();
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(201).json(userResponse);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Username or email already exists' });
        } else {
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }
});

// Update user (admin only)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { username, email, role, isActive } = req.body;
        const updates = { username, email, role, isActive };

        // If password is provided, hash it
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        // Remove undefined fields
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Username or email already exists' });
        } else {
            res.status(500).json({ message: 'Error updating user', error: error.message });
        }
    }
});

// Delete user (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        // Prevent deleting the last admin
        const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
        const userToDelete = await User.findById(req.params.id);

        if (userToDelete.role === ROLES.ADMIN && adminCount <= 1) {
            return res.status(400).json({ message: 'Cannot delete the last admin user' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profile', error: error.message });
    }
});

// Update current user's own profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { username, email } = req.body;
        const updates = { username, email };

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).json({ message: 'Username or email already exists' });
        } else {
            res.status(500).json({ message: 'Error updating profile', error: error.message });
        }
    }
});

module.exports = router;
