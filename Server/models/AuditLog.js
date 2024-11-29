const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE',
      'READ',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'EXPORT',
      'IMPORT',
      'BACKUP',
      'RESTORE',
      'SETTINGS_CHANGE',
      'PASSWORD_CHANGE',
      'PERMISSION_CHANGE',
      'API_ACCESS'
    ]
  },
  entityType: {
    type: String,
    required: true,
    enum: [
      'USER',
      'PRODUCT',
      'CATEGORY',
      'ORDER',
      'SUPPLIER',
      'CUSTOMER',
      'INVENTORY',
      'BACKUP',
      'SETTINGS',
      'REPORT',
      'SYSTEM'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ user: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
