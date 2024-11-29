const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  // Basic Information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  
  // Business Information
  businessName: { type: String },
  type: { type: String, enum: ['individual', 'business'], default: 'individual' },
  taxId: { type: String },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'Nigeria' },
    postalCode: String
  },
  
  // Customer Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  
  // Customer Classification
  category: {
    type: String,
    enum: ['regular', 'vip', 'wholesale', 'retail'],
    default: 'regular'
  },
  
  // Financial Information
  creditLimit: { type: Number, default: 0 },
  currentCredit: { type: Number, default: 0 },
  paymentTerms: { type: String },
  
  // Customer Engagement
  lastPurchaseDate: Date,
  totalPurchases: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  
  // Communication Preferences
  communicationPreferences: {
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true }
  },
  
  // Custom Fields (for business-specific needs)
  customFields: [{
    name: String,
    value: String
  }],
  
  // Notes and Interactions
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  interactions: [{
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'purchase', 'support', 'other']
    },
    description: String,
    outcome: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Tags for customer segmentation
  tags: [String],
  
  // Metadata
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Indexes for better query performance
customerSchema.index({ email: 1 });
customerSchema.index({ phone: 1 });
customerSchema.index({ 'address.city': 1, 'address.state': 1 });
customerSchema.index({ category: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ tags: 1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to calculate customer lifetime value
customerSchema.methods.calculateLifetimeValue = function() {
  return this.totalSpent;
};

// Method to add loyalty points
customerSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyPoints += points;
  return this.save();
};

// Method to check credit limit
customerSchema.methods.hasAvailableCredit = function(amount) {
  return (this.currentCredit + amount) <= this.creditLimit;
};

// Method to add interaction
customerSchema.methods.addInteraction = function(interaction) {
  this.interactions.push(interaction);
  return this.save();
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
