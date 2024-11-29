const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    theme: {
        mode: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        primaryColor: {
            type: String,
            default: '#1976d2' // Default MUI blue
        },
        customTheme: {
            type: String,
            enum: ['default', 'ocean', 'forest', 'sunset', 'custom'],
            default: 'default'
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);
