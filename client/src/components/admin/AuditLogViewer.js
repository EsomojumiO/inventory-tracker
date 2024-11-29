import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Grid,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';

const ACTIONS = [
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
];

const ENTITY_TYPES = [
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
];

const STATUS_COLORS = {
  SUCCESS: 'success',
  FAILURE: 'error',
  WARNING: 'warning'
};

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);
  const { showError } = useNotification();

  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    action: '',
    entityType: '',
    status: '',
    searchTerm: ''
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()
      });

      const response = await api.get(`/api/audit?${queryParams}`);
      setLogs(response.data.data.logs);
      setTotalRows(response.data.data.total);
    } catch (error) {
      showError('Failed to fetch audit logs');
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, rowsPerPage, filters]);

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString()
      });

      const response = await api.get(`/api/audit/export?${queryParams}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showError('Failed to export audit logs');
      console.error('Error exporting audit logs:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      action: '',
      entityType: '',
      status: '',
      searchTerm: ''
    });
    setPage(0);
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Audit Logs</Typography>
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchLogs}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              label="Action"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {ACTIONS.map(action => (
                <MenuItem key={action} value={action}>
                  {action}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              label="Entity Type"
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {ENTITY_TYPES.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Search"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              InputProps={{
                endAdornment: filters.searchTerm && (
                  <IconButton size="small" onClick={() => handleFilterChange('searchTerm', '')}>
                    <ClearIcon />
                  </IconButton>
                )
              }}
            />
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP Address</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {format(new Date(log.timestamp), 'PPpp')}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={log.user.email}>
                          <span>{log.user.name}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell>{log.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={log.status}
                          color={STATUS_COLORS[log.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="textSecondary">
                          No audit logs found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalRows}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AuditLogViewer;
