const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['purchase', 'sale', 'adjustment', 'return', 'transfer']
    },
    quantity: {
        type: Number,
        required: true
    },
    unitCost: {
        type: Number,
        required: true,
        min: [0, 'Unit cost cannot be negative']
    },
    totalCost: {
        type: Number,
        required: true,
        min: [0, 'Total cost cannot be negative']
    },
    reference: {
        type: String,
        required: true
    },
    referenceType: {
        type: String,
        required: true,
        enum: ['purchase_order', 'sale', 'manual', 'return', 'transfer']
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceType'
    },
    location: {
        from: String,
        to: String
    },
    batch: {
        number: String,
        expiryDate: Date,
        manufacturingDate: Date
    },
    notes: String,
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Calculate total cost before saving
stockTransactionSchema.pre('save', function(next) {
    this.totalCost = this.quantity * this.unitCost;
    next();
});

// Indexes for faster queries
stockTransactionSchema.index({ product: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1 });
stockTransactionSchema.index({ reference: 1 });
stockTransactionSchema.index({ 'batch.number': 1 });
stockTransactionSchema.index({ 'batch.expiryDate': 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
