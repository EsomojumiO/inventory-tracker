const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['INCOME', 'EXPENSE'],
    required: true
  },
  category: {
    type: String,
    enum: [
      // Income categories
      'SALES', 'REFUND', 'INVESTMENT', 'OTHER_INCOME',
      // Expense categories
      'INVENTORY', 'SALARY', 'RENT', 'UTILITIES', 'SUPPLIES',
      'MAINTENANCE', 'MARKETING', 'INSURANCE', 'TAX', 'OTHER_EXPENSE'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'OTHER'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'CANCELLED', 'FAILED'],
    default: 'COMPLETED'
  },
  metadata: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    invoiceNumber: String,
    taxInfo: {
      taxRate: Number,
      taxAmount: Number,
      taxType: {
        type: String,
        enum: ['VAT', 'SALES_TAX', 'WITHHOLDING', 'NONE']
      }
    }
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  notes: String,
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ type: 1, date: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ 'metadata.orderId': 1 });
transactionSchema.index({ 'metadata.employeeId': 1 });
transactionSchema.index({ 'metadata.supplierId': 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Methods
transactionSchema.methods.updateStatus = async function(status) {
  this.status = status;
  await this.save();
};

// Statics
transactionSchema.statics.getIncomeByPeriod = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        type: 'INCOME',
        date: { $gte: startDate, $lte: endDate },
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

transactionSchema.statics.getExpensesByPeriod = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        type: 'EXPENSE',
        date: { $gte: startDate, $lte: endDate },
        status: 'COMPLETED'
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

transactionSchema.statics.getDailyTransactions = async function(date) {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  return this.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'COMPLETED'
  }).sort({ date: 1 });
};

transactionSchema.statics.generateReference = async function() {
  const date = new Date();
  const prefix = 'TXN';
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
