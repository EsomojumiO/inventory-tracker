const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  profileImage: { type: String },
  
  // Business Information
  businessName: { type: String },
  type: { type: String, enum: ['individual', 'business'], default: 'individual' },
  taxId: { type: String },
  industry: { type: String },
  website: { type: String },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Nigeria' },
    postalCode: String,
    isShippingAddress: { type: Boolean, default: true },
    isBillingAddress: { type: Boolean, default: true }
  },
  
  additionalAddresses: [{
    type: { type: String, enum: ['shipping', 'billing', 'both'] },
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    isDefault: { type: Boolean, default: false }
  }],
  
  // Customer Status and Classification
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  category: {
    type: String,
    enum: ['regular', 'vip', 'wholesale', 'retail'],
    default: 'regular'
  },
  
  // Financial Information
  creditLimit: { type: Number, default: 0 },
  currentCredit: { type: Number, default: 0 },
  paymentTerms: {
    type: String,
    enum: ['prepaid', 'net15', 'net30', 'net60', 'custom'],
    default: 'prepaid'
  },
  customPaymentTerms: { type: String },
  preferredPaymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'credit_card', 'check', 'mobile_money'],
    default: 'cash'
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  
  // Customer Engagement & Loyalty
  lastPurchaseDate: Date,
  totalPurchases: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  
  // Communication Preferences & History
  communicationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    marketing: { type: Boolean, default: true }
  },
  
  communications: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'call', 'meeting', 'other']
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      default: 'outbound'
    },
    subject: String,
    content: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Custom Fields & Tags
  customFields: [{
    name: String,
    value: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean'],
      default: 'text'
    }
  }],
  tags: [String],
  
  // Notes & Interactions
  notes: [{
    title: String,
    content: String,
    type: {
      type: String,
      enum: ['general', 'payment', 'complaint', 'feedback'],
      default: 'general'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  interactions: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'purchase', 'support', 'complaint', 'feedback', 'other']
    },
    description: String,
    outcome: String,
    followUpRequired: { type: Boolean, default: false },
    followUpDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indexes for better query performance
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ businessName: 1 });
customerSchema.index({ 'address.city': 1, 'address.state': 1 });
customerSchema.index({ category: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ tags: 1 });
customerSchema.index({ lastPurchaseDate: -1 });
customerSchema.index({ totalSpent: -1 });
customerSchema.index({ loyaltyPoints: -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to calculate customer lifetime value
customerSchema.methods.calculateLifetimeValue = function() {
  return this.totalSpent;
};

// Method to add loyalty points
customerSchema.methods.addLoyaltyPoints = async function(points, reason = 'purchase') {
  this.loyaltyPoints += points;
  
  // Update loyalty tier based on total points
  if (this.loyaltyPoints >= 10000) this.loyaltyTier = 'platinum';
  else if (this.loyaltyPoints >= 5000) this.loyaltyTier = 'gold';
  else if (this.loyaltyPoints >= 1000) this.loyaltyTier = 'silver';
  
  await this.save();
  return this.loyaltyPoints;
};

// Method to check credit limit
customerSchema.methods.hasAvailableCredit = function(amount) {
  return (this.creditLimit - this.currentCredit) >= amount;
};

// Method to add interaction
customerSchema.methods.addInteraction = async function(interaction) {
  this.interactions.push(interaction);
  await this.save();
  return this.interactions[this.interactions.length - 1];
};

// Method to update order statistics
customerSchema.methods.updateOrderStats = async function(orderAmount) {
  this.totalPurchases += 1;
  this.totalSpent += orderAmount;
  this.lastPurchaseDate = new Date();
  this.averageOrderValue = this.totalSpent / this.totalPurchases;
  await this.save();
};

// Method to get recent interactions
customerSchema.methods.getRecentInteractions = function(limit = 5) {
  return this.interactions
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
};

// Pre-save middleware to update averageOrderValue
customerSchema.pre('save', function(next) {
  if (this.totalPurchases > 0) {
    this.averageOrderValue = this.totalSpent / this.totalPurchases;
  }
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
