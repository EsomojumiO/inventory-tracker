const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']
    },
    subtype: {
        type: String,
        required: true,
        enum: ['CURRENT', 'NON_CURRENT', 'OPERATING', 'NON_OPERATING']
    },
    description: String,
    parentAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account'
    },
    balance: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'NGN',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
accountSchema.index({ code: 1, organization: 1 }, { unique: true });
accountSchema.index({ name: 1, organization: 1 });
accountSchema.index({ type: 1 });
accountSchema.index({ parentAccount: 1 });

// Export the schema only if the model hasn't been registered
module.exports = mongoose.models.Account || mongoose.model('Account', accountSchema);
