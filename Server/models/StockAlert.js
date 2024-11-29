const mongoose = require('mongoose');

const stockAlertSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['low_stock', 'out_of_stock', 'expiring_soon', 'expired', 'price_change', 'custom']
    },
    level: {
        type: String,
        required: true,
        enum: ['info', 'warning', 'critical'],
        default: 'warning'
    },
    message: {
        type: String,
        required: true
    },
    details: {
        currentStock: Number,
        threshold: Number,
        daysToExpiry: Number,
        priceChange: {
            old: Number,
            new: Number
        }
    },
    status: {
        type: String,
        required: true,
        enum: ['active', 'acknowledged', 'resolved'],
        default: 'active'
    },
    acknowledgedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    acknowledgedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,
    notificationsSent: [{
        method: {
            type: String,
            enum: ['email', 'sms', 'push', 'in_app']
        },
        sentTo: String,
        sentAt: Date,
        status: {
            type: String,
            enum: ['sent', 'delivered', 'failed']
        }
    }]
}, {
    timestamps: true
});

// Indexes for faster queries
stockAlertSchema.index({ product: 1, type: 1, status: 1 });
stockAlertSchema.index({ level: 1 });
stockAlertSchema.index({ status: 1 });
stockAlertSchema.index({ createdAt: 1 });

// Virtual for alert age
stockAlertSchema.virtual('age').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60)); // Age in hours
});

// Method to send notifications
stockAlertSchema.methods.sendNotifications = async function(methods = ['email']) {
    const notifications = [];
    for (const method of methods) {
        try {
            // Implementation for each notification method
            const notification = {
                method,
                sentTo: 'recipient',
                sentAt: new Date(),
                status: 'sent'
            };
            notifications.push(notification);
        } catch (error) {
            notifications.push({
                method,
                sentTo: 'recipient',
                sentAt: new Date(),
                status: 'failed'
            });
        }
    }
    this.notificationsSent.push(...notifications);
    await this.save();
};

// Method to acknowledge alert
stockAlertSchema.methods.acknowledge = async function(userId) {
    this.status = 'acknowledged';
    this.acknowledgedBy = userId;
    this.acknowledgedAt = new Date();
    await this.save();
};

// Method to resolve alert
stockAlertSchema.methods.resolve = async function(userId) {
    this.status = 'resolved';
    this.resolvedBy = userId;
    this.resolvedAt = new Date();
    await this.save();
};

module.exports = mongoose.model('StockAlert', stockAlertSchema);
