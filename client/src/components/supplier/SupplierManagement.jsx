import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { useSupplier } from '../../context/SupplierContext';
import SupplierDashboard from './SupplierDashboard';
import SupplierList from './SupplierList';
import SupplierForm from './SupplierForm';
import SupplierMetrics from './SupplierMetrics';

const SupplierManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const { suppliers } = useSupplier();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setShowSupplierForm(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierForm(true);
  };

  const handleCloseForm = () => {
    setShowSupplierForm(false);
    setSelectedSupplier(null);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <SupplierDashboard />;
      case 1:
        return <SupplierList onEditSupplier={handleEditSupplier} />;
      default:
        return <SupplierDashboard />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Supplier Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateSupplier}
            sx={{ mr: 2 }}
          >
            Add Supplier
          </Button>
          <IconButton color="primary" aria-label="refresh data">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Metrics Overview */}
        <Grid item xs={12}>
          <SupplierMetrics />
        </Grid>

        {/* Main Content */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Dashboard" />
              <Tab label="Supplier List" />
            </Tabs>
            {renderTabContent()}
          </Paper>
        </Grid>
      </Grid>

      {/* Supplier Form Dialog */}
      {showSupplierForm && (
        <SupplierForm
          open={showSupplierForm}
          onClose={handleCloseForm}
          supplier={selectedSupplier}
        />
      )}
    </Container>
  );
};

export default SupplierManagement;
