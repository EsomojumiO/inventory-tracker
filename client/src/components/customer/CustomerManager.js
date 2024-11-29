import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import CustomerList from './CustomerList';
import CustomerDetails from './CustomerDetails';
import { useCustomer } from '../../context/CustomerContext';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const CustomerManager = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { customers, loading, error, updateCustomer } = useCustomer();
  const { showSuccess, showError } = useNotification();
  const { isAuthenticated } = useAuth();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCurrentTab(1);
  };

  const handleCustomerUpdate = async (updatedCustomer) => {
    try {
      await updateCustomer(updatedCustomer._id, updatedCustomer);
      setSelectedCustomer(updatedCustomer);
      showSuccess('Customer updated successfully');
    } catch (error) {
      showError('Failed to update customer');
    }
  };

  if (!isAuthenticated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="warning">
          Please log in to access customer management.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          Error loading customers. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
        <Typography variant="h6" gutterBottom>
          No customers found
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Add Your First Customer
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Customer Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
          >
            Add Customer
          </Button>
        </Box>
        
        <Paper>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Customer List" />
            <Tab label="Customer Details" disabled={!selectedCustomer} />
          </Tabs>
        </Paper>

        <Box mt={3}>
          {currentTab === 0 ? (
            <CustomerList
              customers={customers}
              onCustomerSelect={handleCustomerSelect}
            />
          ) : (
            selectedCustomer && (
              <CustomerDetails
                customer={selectedCustomer}
                onUpdate={handleCustomerUpdate}
              />
            )
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default CustomerManager;