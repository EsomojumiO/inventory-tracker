import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  IconButton,
  Button,
  Tooltip,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useReceipt } from '../../../context/ReceiptContext';
import ReceiptViewer from './ReceiptViewer';
import ReceiptEditor from './ReceiptEditor';
import DocumentGenerator from './DocumentGenerator';

const ReceiptsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { receipts, searchReceipts, RECEIPT_STATUS } = useReceipt();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSearch = () => {
    const filters = {
      customerName: searchTerm,
      dateRange: dateRange.startDate && dateRange.endDate ? dateRange : null,
      status: activeTab === 1 ? RECEIPT_STATUS.PAID :
             activeTab === 2 ? RECEIPT_STATUS.PENDING :
             activeTab === 3 ? RECEIPT_STATUS.VOID : null
    };
    return searchReceipts(filters);
  };

  const handleView = (receipt) => {
    setSelectedReceipt(receipt);
    setIsViewerOpen(true);
  };

  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setIsEditorOpen(true);
  };

  const filteredReceipts = handleSearch();

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Receipts & Documents
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsEditorOpen(true)}
            >
              New Receipt
            </Button>
          </Box>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="Start Date"
                  value={dateRange.startDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <DatePicker
                  label="End Date"
                  value={dateRange.endDate}
                  onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab label="All" />
              <Tab label="Paid" />
              <Tab label="Pending" />
              <Tab label="Void" />
            </Tabs>
          </Paper>
        </Grid>

        {/* Receipts List */}
        <Grid item xs={12}>
          <Paper>
            {filteredReceipts.map((receipt) => (
              <Box
                key={receipt.id}
                sx={{
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle1">
                      {receipt.receiptNumber}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {new Date(receipt.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body1">
                      {receipt.customerName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {receipt.paymentMethod}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body1">
                      {receipt.formattedTotal}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: receipt.status === RECEIPT_STATUS.PAID ? 'success.main' :
                               receipt.status === RECEIPT_STATUS.PENDING ? 'warning.main' :
                               'error.main'
                      }}
                    >
                      {receipt.status}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="View">
                        <IconButton onClick={() => handleView(receipt)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEdit(receipt)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton>
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Print">
                        <IconButton>
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>

      {/* Receipt Viewer Dialog */}
      <ReceiptViewer
        open={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Receipt Editor Dialog */}
      <ReceiptEditor
        open={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedReceipt(null);
        }}
        receipt={selectedReceipt}
      />

      {/* Document Generator */}
      <DocumentGenerator />
    </Box>
  );
};

export default ReceiptsPage;
