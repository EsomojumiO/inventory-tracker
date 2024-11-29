const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    expectedDeliveryDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'confirmed', 'shipped', 'received', 'cancelled'],
        default: 'draft'
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        receivedQuantity: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        discount: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            required: true
        }
    }],
    shipping: {
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            zipCode: String
        },
        method: String,
        cost: Number,
        trackingNumber: String
    },
    paymentTerms: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    subtotal: {
        type: Number,
        required: true
    },
    taxTotal: {
        type: Number,
        required: true,
        default: 0
    },
    discountTotal: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    notes: String,
    attachments: [{
        name: String,
        url: String,
        uploadDate: Date
    }],
    history: [{
        status: String,
        date: Date,
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        notes: String
    }]
}, {
    timestamps: true
});

// Indexes
purchaseOrderSchema.index({ orderNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ supplier: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: 1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });

// Generate order number
purchaseOrderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Find the last order number for the current month
        const lastOrder = await this.constructor.findOne({
            orderNumber: new RegExp(`^PO${year}${month}`)
        }, {}, { sort: { orderNumber: -1 } });

        let sequence = '0001';
        if (lastOrder) {
            const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
            sequence = (lastSequence + 1).toString().padStart(4, '0');
        }

        this.orderNumber = `PO${year}${month}${sequence}`;
    }
    next();
});

// Calculate totals before saving
purchaseOrderSchema.pre('save', function(next) {
    // Calculate item totals
    this.subtotal = this.items.reduce((sum, item) => {
        item.total = (item.quantity * item.unitPrice) - item.discount;
        return sum + item.total;
    }, 0);

    // Calculate tax total
    this.taxTotal = this.items.reduce((sum, item) => {
        return sum + (item.total * (item.tax / 100));
    }, 0);

    // Calculate final total
    this.total = this.subtotal + this.taxTotal + (this.shipping?.cost || 0) - this.discountTotal;

    next();
});

// Method to update inventory when order is received
purchaseOrderSchema.methods.receiveOrder = async function() {
    const Inventory = mongoose.model('Inventory');
    
    for (const item of this.items) {
        const inventory = await Inventory.findById(item.product);
        if (inventory) {
            inventory.quantity += item.receivedQuantity;
            inventory.lastRestockDate = new Date();
            await inventory.save();
        }
    }

    this.status = 'received';
    await this.save();
};

// Method to add status history
purchaseOrderSchema.methods.addStatusHistory = async function(status, user, notes) {
    this.history.push({
        status,
        date: new Date(),
        user,
        notes
    });
    this.status = status;
    await this.save();
};

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

module.exports = PurchaseOrder;
