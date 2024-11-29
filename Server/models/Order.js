const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
    set: v => Math.round(v * 100) / 100
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    required: true,
    enum: ['POS', 'SHOPIFY', 'WOOCOMMERCE', 'OTHER']
  },
  type: {
    type: String,
    required: true,
    enum: ['IN_STORE', 'ONLINE']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'Nigeria' }
    }
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  shipping: {
    cost: {
      type: Number,
      default: 0,
      min: 0,
      get: v => Math.round(v * 100) / 100,
      set: v => Math.round(v * 100) / 100
    },
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    shippedAt: Date,
    deliveredAt: Date,
    updatedAt: Date
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    get: v => Math.round(v * 100) / 100,
    set: v => Math.round(v * 100) / 100
  },
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN']
  },
  payment: {
    method: {
      type: String,
      required: true,
      enum: ['CASH', 'CARD', 'TRANSFER', 'OTHER']
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      default: 'PENDING'
    },
    reference: String,
    paidAt: Date,
    refundedAt: Date,
    notes: String
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedAt: Date,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes for common queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ source: 1 });

// Calculate totals before saving
orderSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity) - item.discount;
  }, 0);

  // Calculate total
  this.total = this.subtotal + this.tax + (this.shipping.cost || 0) - this.discount;
  
  next();
});

// Instance methods
orderSchema.methods.updateStatus = async function(status, userId) {
  this.status = status;
  this.lastUpdatedBy = userId;
  this.lastUpdatedAt = new Date();
  return this.save();
};

orderSchema.methods.addTrackingInfo = async function(trackingInfo) {
  this.shipping = {
    ...this.shipping,
    ...trackingInfo,
    updatedAt: new Date()
  };
  return this.save();
};

orderSchema.methods.markAsPaid = async function(paymentDetails) {
  this.payment = {
    ...this.payment,
    ...paymentDetails,
    status: 'COMPLETED',
    paidAt: new Date()
  };
  return this.save();
};

// Static methods
orderSchema.statics.generateOrderNumber = async function() {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  
  // Get the count of orders for today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const count = await this.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  const sequence = (count + 1).toString().padStart(4, '0');
  return `ORD-${year}${month}${day}-${sequence}`;
};

orderSchema.statics.getOrdersByDateRange = async function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ createdAt: -1 });
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
