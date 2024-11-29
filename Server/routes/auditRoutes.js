const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAuditLogs,
  getEntityAuditLogs,
  getUserActivityLogs,
  exportAuditLogs
} = require('../controllers/auditController');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAuditLogs);
router.get('/export', exportAuditLogs);
router.get('/entity/:entityType/:entityId', getEntityAuditLogs);
router.get('/user/:userId', getUserActivityLogs);

module.exports = router;
