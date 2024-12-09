const mongoose = require('mongoose');

const transactionEntrySchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    debit: {
        type: Number,
        default: 0
    },
    credit: {
        type: Number,
        default: 0
    },
    description: String
});

const transactionSchema = new mongoose.Schema({
    transactionNumber: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    type: {
        type: String,
        required: true,
        enum: ['SALE', 'PURCHASE', 'EXPENSE', 'JOURNAL', 'PAYMENT', 'RECEIPT']
    },
    status: {
        type: String,
        required: true,
        enum: ['DRAFT', 'POSTED', 'VOID'],
        default: 'DRAFT'
    },
    reference: {
        type: String,
        required: true
    },
    description: String,
    entries: [transactionEntrySchema],
    attachments: [{
        name: String,
        url: String,
        type: String
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    currency: {
        type: String,
        default: 'NGN',
        required: true
    },
    exchangeRate: {
        type: Number,
        default: 1
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
transactionSchema.index({ transactionNumber: 1, organization: 1 }, { unique: true });
transactionSchema.index({ date: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ reference: 1 });

// Middleware to validate double-entry
transactionSchema.pre('save', function(next) {
    let totalDebit = 0;
    let totalCredit = 0;
    
    this.entries.forEach(entry => {
        totalDebit += entry.debit || 0;
        totalCredit += entry.credit || 0;
    });
    
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
        next(new Error('Transaction entries must balance (total debits must equal total credits)'));
    }
    next();
});

// Export the schema only if the model hasn't been registered
module.exports = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
