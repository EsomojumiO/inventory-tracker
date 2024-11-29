const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SalesTerminalSchema = new Schema({
    terminalId: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active'
    },
    currentShift: {
        type: Schema.Types.ObjectId,
        ref: 'Shift'
    },
    currentCart: {
        items: [{
            product: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: Number,
            price: Number,
            discount: Number,
            subtotal: Number
        }],
        subtotal: Number,
        tax: Number,
        total: Number,
        status: {
            type: String,
            enum: ['active', 'completed', 'voided'],
            default: 'active'
        }
    },
    dailyStats: {
        totalSales: {
            type: Number,
            default: 0
        },
        transactionCount: {
            type: Number,
            default: 0
        },
        averageTransactionValue: {
            type: Number,
            default: 0
        }
    },
    settings: {
        taxRate: {
            type: Number,
            default: 0
        },
        enabledPaymentMethods: [{
            type: String,
            enum: ['cash', 'card', 'digital']
        }],
        printerSettings: {
            enabled: Boolean,
            printerName: String,
            paperSize: String
        },
        offlineMode: {
            type: Boolean,
            default: false
        }
    },
    lastSync: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better query performance
SalesTerminalSchema.index({ terminalId: 1 });
SalesTerminalSchema.index({ location: 1 });
SalesTerminalSchema.index({ 'currentCart.status': 1 });

// Methods
SalesTerminalSchema.methods.addToCart = async function(productId, quantity, price) {
    const existingItem = this.currentCart.items.find(item => 
        item.product.toString() === productId.toString()
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        this.currentCart.items.push({
            product: productId,
            quantity,
            price,
            subtotal: quantity * price
        });
    }

    this.updateCartTotals();
    return this.save();
};

SalesTerminalSchema.methods.removeFromCart = async function(productId) {
    this.currentCart.items = this.currentCart.items.filter(item => 
        item.product.toString() !== productId.toString()
    );
    this.updateCartTotals();
    return this.save();
};

SalesTerminalSchema.methods.updateCartTotals = function() {
    this.currentCart.subtotal = this.currentCart.items.reduce((sum, item) => 
        sum + item.subtotal, 0
    );
    this.currentCart.tax = this.currentCart.subtotal * (this.settings.taxRate / 100);
    this.currentCart.total = this.currentCart.subtotal + this.currentCart.tax;
};

SalesTerminalSchema.methods.clearCart = async function() {
    this.currentCart = {
        items: [],
        subtotal: 0,
        tax: 0,
        total: 0,
        status: 'active'
    };
    return this.save();
};

SalesTerminalSchema.methods.updateDailyStats = async function(saleAmount) {
    this.dailyStats.totalSales += saleAmount;
    this.dailyStats.transactionCount += 1;
    this.dailyStats.averageTransactionValue = 
        this.dailyStats.totalSales / this.dailyStats.transactionCount;
    return this.save();
};

module.exports = mongoose.model('SalesTerminal', SalesTerminalSchema);
