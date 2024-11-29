const backupService = require('../services/backupService');
const { asyncHandler } = require('../middleware/asyncHandler');

exports.createBackup = asyncHandler(async (req, res) => {
  const result = await backupService.createBackup();
  res.status(200).json({
    success: true,
    data: result
  });
});

exports.restoreBackup = asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const result = await backupService.restoreFromBackup(filename);
  res.status(200).json({
    success: true,
    data: result
  });
});

exports.listBackups = asyncHandler(async (req, res) => {
  const backups = await backupService.listBackups();
  res.status(200).json({
    success: true,
    data: backups
  });
});
