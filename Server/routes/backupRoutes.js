const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createBackup,
  restoreBackup,
  listBackups
} = require('../controllers/backupController');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

router.post('/create', createBackup);
router.post('/restore/:filename', restoreBackup);
router.get('/list', listBackups);

module.exports = router;
