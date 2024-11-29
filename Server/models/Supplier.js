const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    code: {
        type: String,
        required: [true, 'Supplier code is required'],
        unique: true,
        trim: true,
        uppercase: true,
        validate: {
            validator: function(v) {
                return /^[A-Z0-9]{3,10}$/.test(v);
            },
            message: props => `${props.value} is not a valid supplier code! Code must be 3-10 characters, uppercase letters and numbers only.`
        }
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_REVIEW'],
        default: 'ACTIVE'
    },
    type: {
        type: String,
        enum: ['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER', 'DROPSHIPPER'],
        required: true
    },
    contacts: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        title: String,
        department: String,
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            validate: {
                validator: function(v) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: props => `${props.value} is not a valid email address!`
            }
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    addresses: [{
        type: {
            type: String,
            enum: ['BILLING', 'SHIPPING', 'RETURNS'],
            required: true
        },
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        isDefault: {
            type: Boolean,
            default: false
        }
    }],
    paymentTerms: {
        type: {
            type: String,
            enum: ['NET', 'COD', 'PREPAID'],
            default: 'NET'
        },
        days: {
            type: Number,
            default: 30
        },
        creditLimit: {
            type: Number,
            default: 0
        },
        currentBalance: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: 'USD'
        },
        earlyPaymentDiscount: {
            percentage: Number,
            days: Number
        }
    },
    performance: {
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        onTimeDelivery: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        qualityRating: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        responseTime: {
            type: Number, // in hours
            default: 0
        },
        fulfillmentRate: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    documents: [{
        type: {
            type: String,
            enum: ['CONTRACT', 'INSURANCE', 'TAX_FORM', 'CERTIFICATION', 'OTHER'],
            required: true
        },
        name: String,
        number: String,
        issuedDate: Date,
        expiryDate: Date,
        fileUrl: String,
        status: {
            type: String,
            enum: ['VALID', 'EXPIRED', 'PENDING'],
            default: 'VALID'
        }
    }],
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        supplierSku: String,
        leadTime: Number, // in days
        minimumOrderQuantity: Number,
        unitPrice: Number,
        currency: String,
        isPreferred: Boolean
    }],
    orderHistory: [{
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PurchaseOrder'
        },
        date: Date,
        amount: Number,
        status: String,
        performance: {
            onTime: Boolean,
            qualityIssues: Boolean,
            notes: String
        }
    }],
    notes: [{
        content: String,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
        },
        type: {
            type: String,
            enum: ['GENERAL', 'PERFORMANCE', 'ISSUE', 'COMMUNICATION'],
            default: 'GENERAL'
        }
    }],
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
supplierSchema.index({ code: 1 });
supplierSchema.index({ status: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ 'performance.rating': 1 });
supplierSchema.index({ 'contacts.email': 1 });
supplierSchema.index({ 'products.supplierSku': 1 });

// Methods
supplierSchema.methods = {
    getPrimaryContact() {
        return this.contacts.find(contact => contact.isPrimary) || this.contacts[0];
    },

    getDefaultAddress(type) {
        return this.addresses.find(addr => 
            addr.type === type && addr.isDefault
        ) || this.addresses.find(addr => addr.type === type);
    },

    hasAvailableCredit(amount) {
        return this.paymentTerms.creditLimit >= 
               (this.paymentTerms.currentBalance + amount);
    },

    async updateBalance(amount, type = 'add') {
        if (type === 'add') {
            this.paymentTerms.currentBalance += amount;
        } else {
            this.paymentTerms.currentBalance -= amount;
        }
        await this.save();
    },

    async updatePerformanceMetrics(orderPerformance) {
        const {
            onTime,
            qualityRating,
            responseTimeHours,
            fulfilled
        } = orderPerformance;

        // Update order history
        this.orderHistory.push({
            ...orderPerformance,
            date: new Date()
        });

        // Calculate new metrics
        const orderCount = this.orderHistory.length;
        
        if (onTime !== undefined) {
            this.performance.onTimeDelivery = 
                ((this.performance.onTimeDelivery * (orderCount - 1)) + (onTime ? 100 : 0)) / orderCount;
        }

        if (qualityRating !== undefined) {
            this.performance.qualityRating = 
                ((this.performance.qualityRating * (orderCount - 1)) + qualityRating) / orderCount;
        }

        if (responseTimeHours !== undefined) {
            this.performance.responseTime = 
                ((this.performance.responseTime * (orderCount - 1)) + responseTimeHours) / orderCount;
        }

        if (fulfilled !== undefined) {
            this.performance.fulfillmentRate = 
                ((this.performance.fulfillmentRate * (orderCount - 1)) + (fulfilled ? 100 : 0)) / orderCount;
        }

        // Calculate overall rating (weighted average)
        this.performance.rating = (
            (this.performance.onTimeDelivery * 0.3) +
            (this.performance.qualityRating * 0.3) +
            (this.performance.fulfillmentRate * 0.2) +
            ((100 - Math.min(this.performance.responseTime, 100)) * 0.2)
        ) / 100;

        await this.save();
    },

    async getActiveProducts() {
        return mongoose.model('Product').find({
            '_id': { $in: this.products.map(p => p.productId) },
            'status': 'ACTIVE'
        }).populate('category');
    }
};

// Static methods
supplierSchema.statics = {
    async findByProduct(productId) {
        return this.find({
            'products.productId': productId
        }).sort({ 'performance.rating': -1 });
    },

    async getTopSuppliers(limit = 10) {
        return this.find({
            status: 'ACTIVE',
            'performance.rating': { $gt: 0 }
        })
        .sort({ 'performance.rating': -1 })
        .limit(limit);
    }
};

// Middleware
supplierSchema.pre('save', function(next) {
    // Ensure only one primary contact
    const primaryContacts = this.contacts.filter(c => c.isPrimary);
    if (primaryContacts.length > 1) {
        primaryContacts.slice(1).forEach(c => c.isPrimary = false);
    } else if (this.contacts.length > 0 && primaryContacts.length === 0) {
        this.contacts[0].isPrimary = true;
    }

    // Ensure only one default address per type
    const addressTypes = [...new Set(this.addresses.map(a => a.type))];
    addressTypes.forEach(type => {
        const defaultAddresses = this.addresses.filter(
            a => a.type === type && a.isDefault
        );
        if (defaultAddresses.length > 1) {
            defaultAddresses.slice(1).forEach(a => a.isDefault = false);
        } else if (this.addresses.filter(a => a.type === type).length > 0 && 
                   defaultAddresses.length === 0) {
            this.addresses.find(a => a.type === type).isDefault = true;
        }
    });

    next();
});

module.exports = mongoose.model('Supplier', supplierSchema);
