const mongoose = require('mongoose');

const discountRuleSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y', 'POINTS_MULTIPLIER'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  buyQuantity: Number, // For BUY_X_GET_Y
  getQuantity: Number  // For BUY_X_GET_Y
});

const targetingRuleSchema = new mongoose.Schema({
  customerTiers: [{
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
  }],
  minTotalSpent: {
    type: Number,
    min: 0
  },
  minOrderCount: {
    type: Number,
    min: 0
  },
  lastPurchaseWithin: {
    type: Number, // days
    min: 0
  },
  specificProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  productCategories: [String],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
});

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['DISCOUNT', 'LOYALTY', 'SPECIAL_OFFER'],
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED'],
    default: 'DRAFT'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  discountRules: [discountRuleSchema],
  targetingRules: targetingRuleSchema,
  usageLimit: {
    perCustomer: {
      type: Number,
      min: 0
    },
    total: {
      type: Number,
      min: 0
    }
  },
  currentUsage: {
    type: Number,
    default: 0
  },
  customerUsage: [{
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    },
    usageCount: {
      type: Number,
      default: 0
    }
  }],
  notificationSettings: {
    sendEmail: {
      type: Boolean,
      default: true
    },
    sendSMS: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
campaignSchema.index({ 'customerUsage.customer': 1 });

// Check if campaign is active
campaignSchema.methods.isActive = function() {
  const now = new Date();
  return (
    this.status === 'ACTIVE' &&
    this.startDate <= now &&
    this.endDate >= now &&
    (!this.usageLimit.total || this.currentUsage < this.usageLimit.total)
  );
};

// Check if customer is eligible
campaignSchema.methods.isCustomerEligible = async function(customer) {
  if (!this.isActive()) return false;

  // Check usage limits
  const customerUsage = this.customerUsage.find(
    usage => usage.customer.toString() === customer._id.toString()
  );
  
  if (this.usageLimit.perCustomer && 
      customerUsage && 
      customerUsage.usageCount >= this.usageLimit.perCustomer) {
    return false;
  }

  // Check targeting rules
  const rules = this.targetingRules;
  if (!rules) return true;

  // Check customer tier
  if (rules.customerTiers && rules.customerTiers.length > 0) {
    const loyalty = await mongoose.model('Loyalty').findOne({ customer: customer._id });
    if (!loyalty || !rules.customerTiers.includes(loyalty.tier)) {
      return false;
    }
  }

  // Check minimum spent
  if (rules.minTotalSpent) {
    const totalSpent = await mongoose.model('Order')
      .aggregate([
        { $match: { 'customer._id': customer._id } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);
    
    if (!totalSpent.length || totalSpent[0].total < rules.minTotalSpent) {
      return false;
    }
  }

  // Check order count
  if (rules.minOrderCount) {
    const orderCount = await mongoose.model('Order')
      .countDocuments({ 'customer._id': customer._id });
    
    if (orderCount < rules.minOrderCount) {
      return false;
    }
  }

  // Check last purchase
  if (rules.lastPurchaseWithin) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - rules.lastPurchaseWithin);

    const recentOrder = await mongoose.model('Order')
      .findOne({
        'customer._id': customer._id,
        createdAt: { $gte: cutoffDate }
      });

    if (!recentOrder) {
      return false;
    }
  }

  return true;
};

// Record campaign usage
campaignSchema.methods.recordUsage = async function(customer) {
  const customerUsageIndex = this.customerUsage.findIndex(
    usage => usage.customer.toString() === customer._id.toString()
  );

  if (customerUsageIndex >= 0) {
    this.customerUsage[customerUsageIndex].usageCount++;
  } else {
    this.customerUsage.push({
      customer: customer._id,
      usageCount: 1
    });
  }

  this.currentUsage++;
  await this.save();
};

// Calculate discount for order
campaignSchema.methods.calculateDiscount = function(orderTotal, products) {
  let totalDiscount = 0;

  for (const rule of this.discountRules) {
    if (orderTotal < rule.minPurchase) continue;

    let discount = 0;
    switch (rule.type) {
      case 'PERCENTAGE':
        discount = orderTotal * (rule.value / 100);
        break;
      case 'FIXED_AMOUNT':
        discount = rule.value;
        break;
      case 'BUY_X_GET_Y':
        // Implementation depends on specific business rules
        break;
    }

    if (rule.maxDiscount) {
      discount = Math.min(discount, rule.maxDiscount);
    }

    totalDiscount += discount;
  }

  return totalDiscount;
};

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
