const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    saleNumber: {
        type: String,
        required: true,
        unique: true
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
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
        },
        cost: {
            type: Number,
            required: true,
            min: [0, 'Cost cannot be negative']
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Discount cannot be negative']
        }
    }],
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative']
    },
    discounts: [{
        type: {
            type: String,
            enum: ['percentage', 'fixed', 'promotion'],
            required: true
        },
        code: String,
        amount: {
            type: Number,
            required: true,
            min: [0, 'Discount amount cannot be negative']
        },
        description: String
    }],
    taxes: [{
        name: {
            type: String,
            required: true
        },
        rate: {
            type: Number,
            required: true,
            min: [0, 'Tax rate cannot be negative']
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Tax amount cannot be negative']
        }
    }],
    total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative']
    },
    profit: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'card', 'transfer', 'check', 'credit']
    },
    paymentDetails: {
        cardType: String,
        lastFourDigits: String,
        transactionId: String,
        checkNumber: String
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'cancelled', 'refunded', 'partially_refunded'],
        default: 'completed'
    },
    refunds: [{
        amount: {
            type: Number,
            required: true,
            min: [0, 'Refund amount cannot be negative']
        },
        reason: String,
        date: {
            type: Date,
            default: Date.now
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    }],
    notes: String,
    salesPerson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invoice: {
        number: {
            type: String,
            required: true,
            unique: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        dueDate: Date,
        terms: String
    }
}, {
    timestamps: true
});

// Generate sale number before saving
saleSchema.pre('save', async function(next) {
    if (this.isNew) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        // Get the last sale number for this month
        const lastSale = await this.constructor.findOne({
            saleNumber: new RegExp(`^S${year}${month}`)
        }).sort({ saleNumber: -1 });
        
        let sequence = '0001';
        if (lastSale) {
            const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
            sequence = (lastSequence + 1).toString().padStart(4, '0');
        }
        
        this.saleNumber = `S${year}${month}${sequence}`;
        
        // Generate invoice number
        this.invoice.number = `INV-${this.saleNumber}`;
    }
    
    // Calculate totals
    if (this.isModified('items') || this.isModified('discounts') || this.isModified('taxes')) {
        // Calculate subtotal
        this.subtotal = this.items.reduce((sum, item) => 
            sum + (item.quantity * item.price - item.discount), 0);
        
        // Calculate total discounts
        const totalDiscounts = this.discounts.reduce((sum, discount) => 
            sum + (discount.type === 'percentage' 
                ? this.subtotal * (discount.amount / 100) 
                : discount.amount), 0);
        
        // Calculate total taxes
        const taxableAmount = this.subtotal - totalDiscounts;
        this.taxes.forEach(tax => {
            tax.amount = taxableAmount * (tax.rate / 100);
        });
        const totalTaxes = this.taxes.reduce((sum, tax) => sum + tax.amount, 0);
        
        // Calculate final total
        this.total = this.subtotal - totalDiscounts + totalTaxes;
        
        // Calculate profit
        this.profit = this.items.reduce((sum, item) => 
            sum + (item.quantity * (item.price - item.cost) - item.discount), 0);
    }
    
    next();
});

// Index for faster queries
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ 'invoice.number': 1 });
saleSchema.index({ customer: 1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ status: 1 });
saleSchema.index({ salesPerson: 1 });

// Virtual for total items
saleSchema.virtual('totalItems').get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for total discounts
saleSchema.virtual('totalDiscounts').get(function() {
    return this.discounts.reduce((sum, discount) => 
        sum + (discount.type === 'percentage' 
            ? this.subtotal * (discount.amount / 100) 
            : discount.amount), 0);
});

// Virtual for total taxes
saleSchema.virtual('totalTaxes').get(function() {
    return this.taxes.reduce((sum, tax) => sum + tax.amount, 0);
});

// Virtual for total refunds
saleSchema.virtual('totalRefunds').get(function() {
    return this.refunds.reduce((sum, refund) => sum + refund.amount, 0);
});

module.exports = mongoose.model('Sale', saleSchema);
