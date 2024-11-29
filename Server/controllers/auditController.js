const auditService = require('../services/auditService');
const { asyncHandler } = require('../middleware/asyncHandler');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page,
    limit,
    startDate,
    endDate,
    userId,
    action,
    entityType,
    entityId,
    status,
    searchTerm
  } = req.query;

  const result = await auditService.getAuditLogs({
    page: parseInt(page),
    limit: parseInt(limit),
    startDate,
    endDate,
    userId,
    action,
    entityType,
    entityId,
    status,
    searchTerm
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

exports.getEntityAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const { page, limit } = req.query;

  const result = await auditService.getEntityAuditLogs(entityType, entityId, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

exports.getUserActivityLogs = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  const result = await auditService.getUserActivityLogs(userId, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

exports.exportAuditLogs = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    userId,
    action,
    entityType,
    status
  } = req.query;

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
  if (status) query.status = status;

  const { fields, data } = await auditService.exportAuditLogs(query);

  const csvStringifier = createCsvStringifier({
    header: fields.map(id => ({ id, title: id }))
  });

  const records = data.map(row => 
    fields.reduce((obj, field, index) => {
      obj[field] = row[index];
      return obj;
    }, {})
  );

  const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString()}.csv`);
  
  res.status(200).send(csvString);
});
