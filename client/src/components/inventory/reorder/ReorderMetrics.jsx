import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Warning as WarningIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Notifications as AlertIcon,
} from '@mui/icons-material';
import { useInventory } from '../../../context/InventoryContext';

const MetricCard = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          backgroundColor: `${color}.light`,
          borderRadius: '50%',
          p: 1,
          mr: 2,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" component="div">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

const ReorderMetrics = () => {
  const { inventory } = useInventory();

  // Calculate metrics
  const lowStockCount = inventory.filter(item => item.quantity <= (item.reorderPoint || 10)).length;
  
  // Mock data for other metrics
  const pendingReorders = 5;
  const inTransit = 3;
  const alertsCount = 8;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={<WarningIcon sx={{ color: 'warning.main' }} />}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Pending Reorders"
          value={pendingReorders}
          icon={<CheckIcon sx={{ color: 'info.main' }} />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="In Transit"
          value={inTransit}
          icon={<ShippingIcon sx={{ color: 'success.main' }} />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Alerts"
          value={alertsCount}
          icon={<AlertIcon sx={{ color: 'error.main' }} />}
          color="error"
        />
      </Grid>
    </Grid>
  );
};

export default ReorderMetrics;
