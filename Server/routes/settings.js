Invalid inventory data received from serverconst express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/authMiddleware');
const BusinessProfile = require('../models/BusinessProfile');
const UserPreferences = require('../models/UserPreferences');

// Configure multer for logo upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/logos';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
});

// Get business profile
router.get('/business-profile', authenticateToken, async (req, res) => {
    try {
        const profile = await BusinessProfile.findOne({ userId: req.user.id });
        res.json({ success: true, profile });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching business profile',
            error: error.message
        });
    }
});

// Update business profile
router.put('/business-profile', authenticateToken, upload.single('logo'), async (req, res) => {
    try {
        const { businessName, email, phone, address } = req.body;
        
        let updateData = {
            businessName,
            contactDetails: {
                email,
                phone,
                address: JSON.parse(address)
            }
        };

        // Handle logo upload if present
        if (req.file) {
            updateData.logo = {
                url: `/uploads/logos/${req.file.filename}`,
                publicId: req.file.filename
            };
        }

        const profile = await BusinessProfile.findOneAndUpdate(
            { userId: req.user.id },
            updateData,
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            profile,
            message: 'Business profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating business profile',
            error: error.message
        });
    }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
    try {
        const preferences = await UserPreferences.findOne({ userId: req.user.id });
        res.json({ success: true, preferences });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user preferences',
            error: error.message
        });
    }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
    try {
        const { theme } = req.body;
        
        const preferences = await UserPreferences.findOneAndUpdate(
            { userId: req.user.id },
            { theme },
            { new: true, upsert: true }
        );

        res.json({
            success: true,
            preferences,
            message: 'User preferences updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user preferences',
            error: error.message
        });
    }
});

module.exports = router;
