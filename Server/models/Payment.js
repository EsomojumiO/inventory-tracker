const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'PurchaseOrder'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'NGN'
  },
  method: {
    type: String,
    required: true,
    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'PAYPAL', 'FLUTTERWAVE']
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PENDING'
  },
  gatewayReference: {
    type: String,
    sparse: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  splits: [{
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    amount: Number,
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    }
  }],
  refunds: [{
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    gatewayReference: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'splits.recipient': 1 });
paymentSchema.index({ gatewayReference: 1 }, { sparse: true });

// Methods
paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'COMPLETED' && 
         !this.refunds.some(refund => ['PENDING', 'COMPLETED'].includes(refund.status));
};

paymentSchema.methods.getTotalRefunded = function() {
  return this.refunds
    .filter(refund => refund.status === 'COMPLETED')
    .reduce((total, refund) => total + refund.amount, 0);
};

paymentSchema.methods.getRemainingRefundableAmount = function() {
  return this.amount - this.getTotalRefunded();
};

// Virtuals
paymentSchema.virtual('isFullyRefunded').get(function() {
  return this.status === 'REFUNDED';
});

paymentSchema.virtual('isPartiallyRefunded').get(function() {
  return this.status === 'PARTIALLY_REFUNDED';
});

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Update status based on refunds
  if (this.refunds.length > 0) {
    const totalRefunded = this.getTotalRefunded();
    if (totalRefunded === this.amount) {
      this.status = 'REFUNDED';
    } else if (totalRefunded > 0) {
      this.status = 'PARTIALLY_REFUNDED';
    }
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
