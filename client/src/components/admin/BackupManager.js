import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  RestoreFromBackup as RestoreIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

const BackupManager = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState({ open: false, backup: null });
  const { showSuccess, showError } = useNotification();

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/backups/list');
      setBackups(response.data.data);
    } catch (error) {
      showError('Failed to fetch backups');
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await api.post('/api/backups/create');
      showSuccess('Backup created successfully');
      fetchBackups();
    } catch (error) {
      showError('Failed to create backup');
      console.error('Error creating backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreDialog.backup) return;

    try {
      setLoading(true);
      await api.post(`/api/backups/restore/${restoreDialog.backup.filename}`);
      showSuccess('Backup restored successfully');
      setRestoreDialog({ open: false, backup: null });
    } catch (error) {
      showError('Failed to restore backup');
      console.error('Error restoring backup:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Backup Management</Typography>
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchBackups}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              onClick={handleCreateBackup}
              disabled={loading}
            >
              Create Backup
            </Button>
          </Box>
        </Box>

        {loading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filename</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Size</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.filename}>
                  <TableCell>{backup.filename}</TableCell>
                  <TableCell>
                    {format(new Date(backup.lastModified), 'PPpp')}
                  </TableCell>
                  <TableCell>{formatBytes(backup.size)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => setRestoreDialog({ open: true, backup })}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {backups.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="textSecondary">
                      No backups available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={restoreDialog.open}
          onClose={() => setRestoreDialog({ open: false, backup: null })}
        >
          <DialogTitle>Confirm Restore</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to restore the backup from{' '}
              {restoreDialog.backup &&
                format(new Date(restoreDialog.backup.lastModified), 'PPpp')}
              ? This will replace all current data with the backup data.
            </DialogContentText>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone. Make sure to create a backup of your current data first if needed.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setRestoreDialog({ open: false, backup: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreBackup}
              color="primary"
              variant="contained"
              disabled={loading}
            >
              Restore
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default BackupManager;
