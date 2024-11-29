import React, { useState, useEffect } from 'react';
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
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useInventory } from '../../../context/InventoryContext';
import ReorderDashboard from './ReorderDashboard';
import ReorderList from './ReorderList';
import ReorderForm from './ReorderForm';
import ReorderRules from './ReorderRules';
import ReorderMetrics from './ReorderMetrics';

const ReorderManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [showReorderForm, setShowReorderForm] = useState(false);
  const [selectedReorder, setSelectedReorder] = useState(null);
  const { inventory } = useInventory();

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleCreateReorder = () => {
    setSelectedReorder(null);
    setShowReorderForm(true);
  };

  const handleEditReorder = (reorder) => {
    setSelectedReorder(reorder);
    setShowReorderForm(true);
  };

  const handleCloseForm = () => {
    setShowReorderForm(false);
    setSelectedReorder(null);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <ReorderDashboard />;
      case 1:
        return <ReorderList onEditReorder={handleEditReorder} />;
      case 2:
        return <ReorderRules />;
      default:
        return <ReorderDashboard />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reorder Management
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateReorder}
            sx={{ mr: 2 }}
          >
            Create Reorder
          </Button>
          <IconButton color="primary" aria-label="refresh data">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Metrics Overview */}
        <Grid item xs={12}>
          <ReorderMetrics />
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
              <Tab label="Reorder List" />
              <Tab label="Reorder Rules" />
            </Tabs>
            {renderTabContent()}
          </Paper>
        </Grid>
      </Grid>

      {/* Reorder Form Dialog */}
      {showReorderForm && (
        <ReorderForm
          open={showReorderForm}
          onClose={handleCloseForm}
          reorder={selectedReorder}
        />
      )}
    </Container>
  );
};

export default ReorderManagement;
