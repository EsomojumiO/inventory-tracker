import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { useReport } from '../../../context/ReportContext';

const reportTypes = [
  { value: 'stock-levels', label: 'Stock Levels Report' },
  { value: 'stock-movement', label: 'Stock Movement Report' },
  { value: 'reorder-analysis', label: 'Reorder Analysis Report' },
];

const frequencies = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const ScheduleForm = ({ open, onClose, schedule = null }) => {
  const [formData, setFormData] = useState(schedule || {
    name: '',
    type: '',
    frequency: 'daily',
    recipients: '',
    time: null,
  });

  const { scheduleReport, updateScheduledReport } = useReport();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTimeChange = (newValue) => {
    setFormData(prev => ({
      ...prev,
      time: newValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (schedule) {
        await updateScheduledReport(schedule.id, formData);
      } else {
        await scheduleReport(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving scheduled report:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {schedule ? 'Edit Scheduled Report' : 'Schedule New Report'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Report Name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                name="type"
                label="Report Type"
                value={formData.type}
                onChange={handleChange}
                fullWidth
                required
              >
                {reportTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                name="frequency"
                label="Frequency"
                value={formData.frequency}
                onChange={handleChange}
                fullWidth
                required
              >
                {frequencies.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TimePicker
                label="Time"
                value={formData.time}
                onChange={handleTimeChange}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="recipients"
                label="Recipients (comma-separated emails)"
                value={formData.recipients}
                onChange={handleChange}
                fullWidth
                required
                helperText="Enter email addresses separated by commas"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {schedule ? 'Update' : 'Schedule'} Report
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ScheduledReports = () => {
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const { scheduledReports, deleteScheduledReport } = useReport();

  const handleCreateSchedule = () => {
    setSelectedSchedule(null);
    setShowScheduleForm(true);
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (id) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      await deleteScheduledReport(id);
    }
  };

  const handleCloseForm = () => {
    setShowScheduleForm(false);
    setSelectedSchedule(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateSchedule}
        >
          Schedule New Report
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Report Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Frequency</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Recipients</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduledReports.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell>{schedule.name}</TableCell>
                <TableCell>
                  {reportTypes.find(t => t.value === schedule.type)?.label}
                </TableCell>
                <TableCell>{schedule.frequency}</TableCell>
                <TableCell>{schedule.time}</TableCell>
                <TableCell>
                  {Array.isArray(schedule.recipients)
                    ? schedule.recipients.join(', ')
                    : schedule.recipients}
                </TableCell>
                <TableCell>
                  <Chip
                    label={schedule.status}
                    color={schedule.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {schedule.lastRun
                    ? new Date(schedule.lastRun).toLocaleString()
                    : 'Never'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditSchedule(schedule)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showScheduleForm && (
        <ScheduleForm
          open={showScheduleForm}
          onClose={handleCloseForm}
          schedule={selectedSchedule}
        />
      )}
    </Box>
  );
};

export default ScheduledReports;
