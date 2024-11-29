const mongoose = require('mongoose');

const pointsTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['EARN', 'REDEEM', 'EXPIRE', 'ADJUST'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  reason: String,
  expiryDate: Date
}, {
  timestamps: true
});

const loyaltySchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true
  },
  tier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    default: 'BRONZE'
  },
  points: {
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    lifetime: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  transactions: [pointsTransactionSchema],
  memberSince: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
loyaltySchema.index({ 'customer': 1 });
loyaltySchema.index({ 'points.current': -1 });
loyaltySchema.index({ 'tier': 1 });

// Update tier based on lifetime points
loyaltySchema.methods.updateTier = function() {
  const lifetimePoints = this.points.lifetime;
  
  if (lifetimePoints >= 10000) {
    this.tier = 'PLATINUM';
  } else if (lifetimePoints >= 5000) {
    this.tier = 'GOLD';
  } else if (lifetimePoints >= 2000) {
    this.tier = 'SILVER';
  } else {
    this.tier = 'BRONZE';
  }
};

// Add points
loyaltySchema.methods.addPoints = async function(points, order = null, expiryDays = 365) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);

  const transaction = {
    type: 'EARN',
    points,
    order,
    expiryDate
  };

  this.transactions.push(transaction);
  this.points.current += points;
  this.points.lifetime += points;
  this.lastActivity = new Date();
  
  this.updateTier();
  await this.save();
};

// Redeem points
loyaltySchema.methods.redeemPoints = async function(points, reason) {
  if (points > this.points.current) {
    throw new Error('Insufficient points');
  }

  const transaction = {
    type: 'REDEEM',
    points: -points,
    reason
  };

  this.transactions.push(transaction);
  this.points.current -= points;
  this.lastActivity = new Date();
  
  await this.save();
};

// Check for expired points
loyaltySchema.methods.processExpiredPoints = async function() {
  const now = new Date();
  let expiredPoints = 0;

  this.transactions.forEach(transaction => {
    if (transaction.type === 'EARN' && 
        transaction.expiryDate && 
        transaction.expiryDate < now) {
      expiredPoints += transaction.points;
    }
  });

  if (expiredPoints > 0) {
    const transaction = {
      type: 'EXPIRE',
      points: -expiredPoints,
      reason: 'Points expiration'
    };

    this.transactions.push(transaction);
    this.points.current = Math.max(0, this.points.current - expiredPoints);
    this.lastActivity = now;
    
    await this.save();
  }
};

// Get points expiring soon
loyaltySchema.methods.getExpiringPoints = function(daysThreshold = 30) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return this.transactions
    .filter(transaction => 
      transaction.type === 'EARN' && 
      transaction.expiryDate && 
      transaction.expiryDate > new Date() &&
      transaction.expiryDate <= thresholdDate
    )
    .reduce((sum, transaction) => sum + transaction.points, 0);
};

// Static methods
loyaltySchema.statics.calculatePointsForOrder = function(orderTotal) {
  // Base rate: 1 point per ₦100 spent
  return Math.floor(orderTotal / 100);
};

const Loyalty = mongoose.model('Loyalty', loyaltySchema);

module.exports = Loyalty;
