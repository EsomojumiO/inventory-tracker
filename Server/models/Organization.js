const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['BUSINESS', 'NON_PROFIT', 'GOVERNMENT'],
        default: 'BUSINESS'
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    contact: {
        email: String,
        phone: String,
        website: String
    },
    settings: {
        fiscalYearStart: {
            type: Date,
            default: () => new Date(new Date().getFullYear(), 0, 1) // January 1st of current year
        },
        currency: {
            type: String,
            default: 'NGN'
        },
        timezone: {
            type: String,
            default: 'Africa/Lagos'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Organization', organizationSchema);
