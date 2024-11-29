const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['LOW_STOCK', 'RESTOCK_NEEDED', 'STOCK_UPDATE', 'ERROR']
  },
  message: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'error'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for querying unread notifications
notificationSchema.index({ read: 1, createdAt: -1 });

// Method to mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  await this.save();
};

// Static method to get unread notifications
notificationSchema.statics.getUnread = function() {
  return this.find({ read: false })
    .sort({ createdAt: -1 })
    .populate('product');
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function() {
  const now = new Date();
  await this.updateMany(
    { read: false },
    { 
      $set: { 
        read: true,
        readAt: now
      }
    }
  );
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
