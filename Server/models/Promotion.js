const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    type: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed', 'buy_x_get_y', 'free_shipping']
    },
    value: {
        type: Number,
        required: true,
        min: [0, 'Value cannot be negative']
    },
    minPurchase: {
        type: Number,
        default: 0,
        min: [0, 'Minimum purchase amount cannot be negative']
    },
    maxDiscount: {
        type: Number,
        min: [0, 'Maximum discount cannot be negative']
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        perCustomer: {
            type: Number,
            min: [0, 'Usage limit per customer cannot be negative']
        },
        total: {
            type: Number,
            min: [0, 'Total usage limit cannot be negative']
        }
    },
    currentUsage: {
        type: Number,
        default: 0
    },
    conditions: {
        categories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category'
        }],
        products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory'
        }],
        customerGroups: [String],
        minItems: Number,
        maxItems: Number
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Check if promotion is valid
promotionSchema.methods.isValid = function() {
    const now = new Date();
    return this.isActive && 
           now >= this.startDate && 
           now <= this.endDate &&
           (!this.usageLimit.total || this.currentUsage < this.usageLimit.total);
};

// Calculate discount amount
promotionSchema.methods.calculateDiscount = function(subtotal, items) {
    if (!this.isValid()) return 0;

    let discount = 0;
    switch (this.type) {
        case 'percentage':
            discount = subtotal * (this.value / 100);
            if (this.maxDiscount) {
                discount = Math.min(discount, this.maxDiscount);
            }
            break;
        case 'fixed':
            if (subtotal >= this.minPurchase) {
                discount = this.value;
            }
            break;
        case 'buy_x_get_y':
            // Implementation for buy X get Y free promotion
            break;
        case 'free_shipping':
            // Implementation for free shipping promotion
            break;
    }

    return discount;
};

// Indexes for faster queries
promotionSchema.index({ code: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ 'conditions.categories': 1 });
promotionSchema.index({ 'conditions.products': 1 });

module.exports = mongoose.model('Promotion', promotionSchema);
