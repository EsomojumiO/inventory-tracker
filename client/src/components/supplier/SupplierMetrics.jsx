import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Group as SuppliersIcon,
  CheckCircle as ActiveIcon,
  Block as InactiveIcon,
  Star as RatingIcon,
} from '@mui/icons-material';
import { useSupplier } from '../../context/SupplierContext';

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

const SupplierMetrics = () => {
  const { getSupplierMetrics } = useSupplier();
  const metrics = getSupplierMetrics();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Total Suppliers"
          value={metrics.totalSuppliers}
          icon={<SuppliersIcon sx={{ color: 'primary.main' }} />}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Active Suppliers"
          value={metrics.activeSuppliers}
          icon={<ActiveIcon sx={{ color: 'success.main' }} />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Inactive Suppliers"
          value={metrics.inactiveSuppliers}
          icon={<InactiveIcon sx={{ color: 'error.main' }} />}
          color="error"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <MetricCard
          title="Average Rating"
          value={metrics.averageRating.toFixed(1)}
          icon={<RatingIcon sx={{ color: 'warning.main' }} />}
          color="warning"
        />
      </Grid>
    </Grid>
  );
};

export default SupplierMetrics;
