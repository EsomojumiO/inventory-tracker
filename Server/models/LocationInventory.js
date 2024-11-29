const mongoose = require('mongoose');

const locationInventorySchema = new mongoose.Schema({
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    reservedQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    availableQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 0,
        min: 0
    },
    reorderPoint: {
        type: Number,
        default: 0,
        min: 0
    },
    reorderQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    storageLocation: {
        aisle: String,
        rack: String,
        shelf: String,
        bin: String
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'LOW_STOCK', 'DISCONTINUED'],
        default: 'ACTIVE'
    },
    lastStockCheck: {
        date: Date,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    },
    stockMovements: [{
        date: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['RECEIVED', 'SHIPPED', 'TRANSFERRED', 'ADJUSTED', 'RETURNED', 'DAMAGED']
        },
        quantity: Number,
        reference: String,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
    }
}, {
    timestamps: true
});

// Indexes
locationInventorySchema.index({ location: 1, product: 1 }, { unique: true });
locationInventorySchema.index({ status: 1 });
locationInventorySchema.index({ quantity: 1 });
locationInventorySchema.index({ 'storageLocation.aisle': 1, 'storageLocation.rack': 1 });

// Virtual for available quantity
locationInventorySchema.virtual('actualAvailableQuantity').get(function() {
    return this.quantity - this.reservedQuantity;
});

// Methods
locationInventorySchema.methods.needsReorder = function() {
    return this.quantity <= this.reorderPoint;
};

locationInventorySchema.methods.isLowStock = function() {
    return this.quantity <= this.lowStockThreshold;
};

locationInventorySchema.methods.canFulfill = function(requestedQuantity) {
    return this.actualAvailableQuantity >= requestedQuantity;
};

locationInventorySchema.methods.addStockMovement = function(type, quantity, user, reference = '', notes = '') {
    this.stockMovements.push({
        type,
        quantity,
        user,
        reference,
        notes
    });
};

// Middleware
locationInventorySchema.pre('save', function(next) {
    // Update available quantity
    this.availableQuantity = this.quantity - this.reservedQuantity;
    
    // Update status based on quantity
    if (this.quantity === 0) {
        this.status = 'OUT_OF_STOCK';
    } else if (this.quantity <= this.lowStockThreshold) {
        this.status = 'LOW_STOCK';
    } else if (this.status !== 'DISCONTINUED' && this.status !== 'INACTIVE') {
        this.status = 'ACTIVE';
    }
    
    next();
});

const LocationInventory = mongoose.model('LocationInventory', locationInventorySchema);
module.exports = LocationInventory;
