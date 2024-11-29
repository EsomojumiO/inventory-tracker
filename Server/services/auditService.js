const AuditLog = require('../models/AuditLog');
const { getClientIp } = require('request-ip');

class AuditService {
  constructor() {
    this.defaultOptions = {
      status: 'SUCCESS'
    };
  }

  /**
   * Create an audit log entry
   */
  async log(req, {
    action,
    entityType,
    entityId = null,
    description,
    changes = null,
    status = 'SUCCESS',
    metadata = {}
  }) {
    try {
      const auditLog = new AuditLog({
        user: req.user._id,
        action,
        entityType,
        entityId,
        description,
        changes,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
        status,
        metadata
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw the error - we don't want to break the main operation
      // if audit logging fails
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs({
    page = 1,
    limit = 50,
    startDate,
    endDate,
    userId,
    action,
    entityType,
    entityId,
    status,
    searchTerm
  }) {
    try {
      const query = {};

      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      if (userId) query.user = userId;
      if (action) query.action = action;
      if (entityType) query.entityType = entityType;
      if (entityId) query.entityId = entityId;
      if (status) query.status = status;

      if (searchTerm) {
        query.$or = [
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email role')
          .lean(),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(entityType, entityId, { page = 1, limit = 20 } = {}) {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find({ entityType, entityId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .populate('user', 'name email role')
          .lean(),
        AuditLog.countDocuments({ entityType, entityId })
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      throw error;
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId, { page = 1, limit = 20 } = {}) {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find({ user: userId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments({ user: userId })
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      throw error;
    }
  }

  /**
   * Create middleware for automatic audit logging
   */
  createAuditMiddleware(action, entityType, descriptionFn) {
    return async (req, res, next) => {
      const originalJson = res.json;
      const originalEnd = res.end;
      let logged = false;

      res.json = function(data) {
        if (!logged) {
          const description = typeof descriptionFn === 'function' 
            ? descriptionFn(req, data)
            : descriptionFn;

          this.log(req, {
            action,
            entityType,
            entityId: data?._id || req.params.id,
            description,
            status: res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS',
            changes: data
          }).catch(console.error);
          
          logged = true;
        }
        return originalJson.call(this, data);
      };

      res.end = function(chunk, encoding) {
        if (!logged && res.statusCode >= 400) {
          this.log(req, {
            action,
            entityType,
            entityId: req.params.id,
            description: `${action} operation failed`,
            status: 'FAILURE',
            metadata: { error: res.statusMessage }
          }).catch(console.error);
        }
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(query) {
    try {
      const logs = await AuditLog.find(query)
        .sort({ timestamp: -1 })
        .populate('user', 'name email role')
        .lean();

      const fields = [
        'Timestamp',
        'User',
        'Action',
        'Entity Type',
        'Entity ID',
        'Description',
        'Status',
        'IP Address'
      ];

      const data = logs.map(log => ([
        new Date(log.timestamp).toISOString(),
        log.user ? `${log.user.name} (${log.user.email})` : 'System',
        log.action,
        log.entityType,
        log.entityId,
        log.description,
        log.status,
        log.ipAddress
      ]));

      return { fields, data };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
