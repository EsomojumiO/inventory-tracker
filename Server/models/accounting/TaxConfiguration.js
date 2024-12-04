const mongoose = require('mongoose');

const taxRateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    description: String,
    isDefault: {
        type: Boolean,
        default: false
    }
});

const taxConfigurationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['VAT', 'WITHHOLDING', 'SALES', 'CUSTOM']
    },
    rates: [taxRateSchema],
    accountPayable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    accountReceivable: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
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
taxConfigurationSchema.index({ name: 1, organization: 1 }, { unique: true });
taxConfigurationSchema.index({ type: 1 });

const TaxConfiguration = mongoose.model('TaxConfiguration', taxConfigurationSchema);
module.exports = TaxConfiguration;
