const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['REGULAR', 'OVERTIME', 'HOLIDAY'],
    default: 'REGULAR'
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'MISSED', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  schedule: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },
  actual: {
    clockIn: Date,
    clockOut: Date,
    breaks: [{
      start: Date,
      end: Date,
      type: {
        type: String,
        enum: ['LUNCH', 'BREAK', 'OTHER'],
        default: 'BREAK'
      }
    }]
  },
  location: {
    type: String,
    required: true
  },
  notes: String,
  overrideReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  sales: {
    total: {
      type: Number,
      default: 0
    },
    transactions: {
      type: Number,
      default: 0
    },
    averageTicket: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
shiftSchema.index({ employee: 1, date: 1 });
shiftSchema.index({ status: 1 });
shiftSchema.index({ 'schedule.start': 1, 'schedule.end': 1 });

// Calculate duration in hours
shiftSchema.virtual('scheduledDuration').get(function() {
  return (this.schedule.end - this.schedule.start) / (1000 * 60 * 60);
});

shiftSchema.virtual('actualDuration').get(function() {
  if (!this.actual.clockIn || !this.actual.clockOut) return 0;
  
  let duration = (this.actual.clockOut - this.actual.clockIn) / (1000 * 60 * 60);
  
  // Subtract break durations
  if (this.actual.breaks && this.actual.breaks.length > 0) {
    const breakDuration = this.actual.breaks.reduce((total, break_) => {
      if (break_.start && break_.end) {
        return total + (break_.end - break_.start) / (1000 * 60 * 60);
      }
      return total;
    }, 0);
    duration -= breakDuration;
  }
  
  return duration;
});

// Check if employee is currently clocked in
shiftSchema.virtual('isClockedIn').get(function() {
  return this.actual.clockIn && !this.actual.clockOut;
});

// Methods
shiftSchema.methods.clockIn = async function() {
  if (this.status !== 'SCHEDULED') {
    throw new Error('Shift is not in scheduled status');
  }

  this.actual.clockIn = new Date();
  this.status = 'IN_PROGRESS';
  await this.save();
};

shiftSchema.methods.clockOut = async function() {
  if (!this.actual.clockIn) {
    throw new Error('Cannot clock out before clocking in');
  }
  if (this.actual.clockOut) {
    throw new Error('Already clocked out');
  }

  this.actual.clockOut = new Date();
  this.status = 'COMPLETED';
  
  // Update sales metrics
  if (this.sales.transactions > 0) {
    this.sales.averageTicket = this.sales.total / this.sales.transactions;
  }

  await this.save();
};

shiftSchema.methods.startBreak = async function(type = 'BREAK') {
  if (!this.actual.clockIn) {
    throw new Error('Must be clocked in to start break');
  }
  if (this.actual.clockOut) {
    throw new Error('Cannot start break after clock out');
  }

  const activeBreak = this.actual.breaks.find(b => b.start && !b.end);
  if (activeBreak) {
    throw new Error('Cannot start new break while another is in progress');
  }

  this.actual.breaks.push({
    start: new Date(),
    type
  });
  await this.save();
};

shiftSchema.methods.endBreak = async function() {
  const activeBreak = this.actual.breaks.find(b => b.start && !b.end);
  if (!activeBreak) {
    throw new Error('No active break found');
  }

  activeBreak.end = new Date();
  await this.save();
};

shiftSchema.methods.recordSale = async function(amount) {
  this.sales.total += amount;
  this.sales.transactions += 1;
  this.sales.averageTicket = this.sales.total / this.sales.transactions;
  await this.save();
};

// Static methods
shiftSchema.statics.findCurrentShifts = function() {
  const now = new Date();
  return this.find({
    status: 'IN_PROGRESS',
    'schedule.start': { $lte: now },
    'schedule.end': { $gte: now }
  }).populate('employee');
};

shiftSchema.statics.findUpcomingShifts = function(days = 7) {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  return this.find({
    status: 'SCHEDULED',
    'schedule.start': {
      $gte: now,
      $lte: future
    }
  }).populate('employee');
};

const Shift = mongoose.model('Shift', shiftSchema);

module.exports = Shift;
