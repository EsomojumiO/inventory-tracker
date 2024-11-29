const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'CASHIER', 'INVENTORY_MANAGER', 'SALES_ASSOCIATE'],
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'],
    default: 'ACTIVE'
  },
  department: {
    type: String,
    enum: ['MANAGEMENT', 'SALES', 'INVENTORY', 'CUSTOMER_SERVICE'],
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'VIEW_DASHBOARD',
      'MANAGE_INVENTORY',
      'MANAGE_ORDERS',
      'MANAGE_CUSTOMERS',
      'MANAGE_EMPLOYEES',
      'MANAGE_SETTINGS',
      'VIEW_REPORTS',
      'PROCESS_SALES',
      'ISSUE_REFUNDS',
      'MANAGE_PROMOTIONS'
    ]
  }],
  salary: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'NGN'
    }
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  schedule: {
    regularHours: {
      start: String, // HH:mm format
      end: String    // HH:mm format
    },
    workDays: [{
      type: String,
      enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
    }]
  },
  hireDate: {
    type: Date,
    required: true
  },
  lastLogin: Date,
  performanceMetrics: {
    salesTarget: {
      type: Number,
      default: 0
    },
    currentSales: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    customerFeedback: [{
      rating: Number,
      comment: String,
      date: Date
    }]
  }
}, {
  timestamps: true
});

// Indexes
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ role: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Set default permissions based on role
employeeSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.permissions = this.getDefaultPermissions();
  }
  next();
});

// Get default permissions based on role
employeeSchema.methods.getDefaultPermissions = function() {
  const permissions = {
    ADMIN: [
      'VIEW_DASHBOARD',
      'MANAGE_INVENTORY',
      'MANAGE_ORDERS',
      'MANAGE_CUSTOMERS',
      'MANAGE_EMPLOYEES',
      'MANAGE_SETTINGS',
      'VIEW_REPORTS',
      'PROCESS_SALES',
      'ISSUE_REFUNDS',
      'MANAGE_PROMOTIONS'
    ],
    MANAGER: [
      'VIEW_DASHBOARD',
      'MANAGE_INVENTORY',
      'MANAGE_ORDERS',
      'MANAGE_CUSTOMERS',
      'VIEW_REPORTS',
      'PROCESS_SALES',
      'ISSUE_REFUNDS',
      'MANAGE_PROMOTIONS'
    ],
    CASHIER: [
      'PROCESS_SALES',
      'VIEW_DASHBOARD'
    ],
    INVENTORY_MANAGER: [
      'MANAGE_INVENTORY',
      'VIEW_DASHBOARD',
      'VIEW_REPORTS'
    ],
    SALES_ASSOCIATE: [
      'PROCESS_SALES',
      'VIEW_DASHBOARD',
      'MANAGE_CUSTOMERS'
    ]
  };

  return permissions[this.role] || [];
};

// Check if employee has specific permission
employeeSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Update performance metrics
employeeSchema.methods.updatePerformanceMetrics = async function(metrics) {
  Object.assign(this.performanceMetrics, metrics);
  await this.save();
};

// Add customer feedback
employeeSchema.methods.addCustomerFeedback = async function(rating, comment) {
  this.performanceMetrics.customerFeedback.push({
    rating,
    comment,
    date: new Date()
  });

  // Update average rating
  const totalRatings = this.performanceMetrics.customerFeedback.length;
  const sumRatings = this.performanceMetrics.customerFeedback.reduce(
    (sum, feedback) => sum + feedback.rating,
    0
  );
  this.performanceMetrics.averageRating = sumRatings / totalRatings;

  await this.save();
};

// Record sales
employeeSchema.methods.recordSale = async function(amount) {
  this.performanceMetrics.currentSales += amount;
  await this.save();
};

// Static method to find employees by schedule
employeeSchema.statics.findBySchedule = function(day, time) {
  return this.find({
    'schedule.workDays': day,
    'schedule.regularHours.start': { $lte: time },
    'schedule.regularHours.end': { $gte: time },
    status: 'ACTIVE'
  });
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
