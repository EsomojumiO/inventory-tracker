const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    sku: {
        type: String,
        required: [true, 'SKU is required'],
        unique: true,
        trim: true
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    barcodeType: {
        type: String,
        enum: ['EAN-13', 'UPC', 'CODE128', 'QR'],
        default: 'CODE128'
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'Electronics',
            'Clothing',
            'Food & Beverages',
            'Home & Garden',
            'Books',
            'Sports & Outdoors',
            'Toys & Games',
            'Health & Beauty',
            'Automotive',
            'Other'
        ]
    },
    brand: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative']
    },
    minQuantity: {
        type: Number,
        required: [true, 'Minimum quantity is required'],
        min: [0, 'Minimum quantity cannot be negative']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    cost: {
        type: Number,
        min: [0, 'Cost cannot be negative']
    },
    supplier: {
        name: String,
        contact: String,
        email: String,
        phone: String,
        address: String
    },
    location: {
        type: String,
        trim: true
    },
    lastRestocked: {
        type: Date,
        default: Date.now
    },
    attributes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    images: [{
        url: String,
        isPrimary: Boolean
    }],
    status: {
        type: String,
        enum: ['active', 'discontinued', 'out_of_stock'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Index for barcode lookup
inventorySchema.index({ barcode: 1 });

// Index for category and status combination
inventorySchema.index({ category: 1, status: 1 });

// Index for low stock alerts
inventorySchema.index({ quantity: 1, minQuantity: 1 });

// Virtual for profit margin
inventorySchema.virtual('profitMargin').get(function() {
    if (!this.cost || !this.price) return null;
    return ((this.price - this.cost) / this.price) * 100;
});

// Method to check if stock is low
inventorySchema.methods.isLowStock = function() {
    return this.quantity <= this.minQuantity;
};

// Method to generate barcode if not exists
inventorySchema.pre('save', async function(next) {
    if (!this.barcode) {
        // Generate CODE128 compatible barcode
        this.barcode = 'P' + String(Date.now()).slice(-12);
        this.barcodeType = 'CODE128';
    }
    next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
