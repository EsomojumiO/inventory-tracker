import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ImportExport as ImportExportIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import CustomerList from './CustomerList';
import CustomerDetails from './CustomerDetails';
import CustomerForm from './CustomerForm';
import CustomerAnalytics from './CustomerAnalytics';
import { useCustomer } from '../../context/CustomerContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const CustomerManager = () => {
  // State management
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    category: ''
  });
  const [sortBy, setSortBy] = useState('lastPurchaseDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Context hooks
  const { 
    customers, 
    loading, 
    error, 
    addCustomer,
    updateCustomer,
    deleteCustomer 
  } = useCustomer();
  const { showSuccess, showError } = useNotification();
  const { isAuthenticated } = useAuth();

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCurrentTab(1);
  };

  const handleViewModeChange = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    handleFilterClose();
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    handleSortClose();
  };

  const handleAddCustomer = () => {
    setShowForm(true);
    setSelectedCustomer(null);
  };

  const handleCustomerSubmit = async (customerData) => {
    try {
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer._id, customerData);
        showSuccess('Customer updated successfully');
      } else {
        await addCustomer(customerData);
        showSuccess('Customer created successfully');
      }
      setShowForm(false);
    } catch (error) {
      showError(error.message);
    }
  };

  const handleCustomerDelete = async (customerId) => {
    try {
      await deleteCustomer(customerId);
      showSuccess('Customer deleted successfully');
      setSelectedCustomer(null);
      setCurrentTab(0);
    } catch (error) {
      showError(error.message);
    }
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="warning">
          Please log in to access customer management.
        </Alert>
      </Box>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          Error loading customers. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={2}>
      {/* Header */}
      <Box p={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h1">
              Customer Management
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddCustomer}
              >
                Add Customer
              </Button>
              <Button
                variant="outlined"
                startIcon={<ImportExportIcon />}
              >
                Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Toolbar */}
      <Box p={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              <IconButton onClick={handleFilterClick}>
                <FilterIcon />
              </IconButton>
              <IconButton onClick={handleSortClick}>
                <SortIcon />
              </IconButton>
              <IconButton onClick={handleViewModeChange}>
                {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Active filters */}
        {Object.entries(filters).some(([_, value]) => value) && (
          <Box mt={2} display="flex" gap={1}>
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  onDelete={() => handleFilterChange(key, '')}
                />
              )
            )}
          </Box>
        )}
      </Box>

      <Divider />

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="All Customers" />
        {selectedCustomer && <Tab label="Customer Details" />}
        <Tab label="Analytics" />
      </Tabs>

      {/* Content */}
      <Box p={3}>
        {currentTab === 0 && (
          <CustomerList
            customers={customers || []}
            onCustomerSelect={handleCustomerSelect}
          />
        )}
        {currentTab === 1 && selectedCustomer && (
          <CustomerDetails
            customer={selectedCustomer}
            onEdit={() => setShowForm(true)}
            onDelete={handleCustomerDelete}
          />
        )}
        {currentTab === 2 && (
          <CustomerAnalytics />
        )}
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={() => handleFilterChange('type', 'individual')}>
          Individual Customers
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('type', 'business')}>
          Business Customers
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('status', 'active')}>
          Active Customers
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('status', 'inactive')}>
          Inactive Customers
        </MenuItem>
        <MenuItem onClick={() => handleFilterChange('category', 'vip')}>
          VIP Customers
        </MenuItem>
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem onClick={() => handleSortChange('lastPurchaseDate')}>
          Last Purchase Date
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('totalSpent')}>
          Total Spent
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('loyaltyPoints')}>
          Loyalty Points
        </MenuItem>
        <MenuItem onClick={() => handleSortChange('name')}>
          Customer Name
        </MenuItem>
      </Menu>

      {/* Customer Form Dialog */}
      {showForm && (
        <CustomerForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCustomerSubmit}
          customer={selectedCustomer}
        />
      )}
    </Paper>
  );
};

export default CustomerManager;