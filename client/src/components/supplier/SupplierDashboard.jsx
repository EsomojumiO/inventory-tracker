import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Rating,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useSupplier } from '../../context/SupplierContext';

const SupplierDashboard = () => {
  const { suppliers, getSupplierMetrics } = useSupplier();
  const metrics = getSupplierMetrics();

  // Mock performance data
  const performanceData = suppliers
    .slice(0, 5)
    .map((supplier) => ({
      name: supplier.name,
      onTimeDelivery: supplier.performance.onTimeDelivery,
      qualityScore: supplier.performance.qualityScore * 20, // Convert to percentage
    }));

  // Mock trend data
  const trendData = [
    { month: 'Jan', suppliers: 10 },
    { month: 'Feb', suppliers: 12 },
    { month: 'Mar', suppliers: 15 },
    { month: 'Apr', suppliers: 14 },
    { month: 'May', suppliers: 18 },
    { month: 'Jun', suppliers: 20 },
  ];

  return (
    <Grid container spacing={3}>
      {/* Performance Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Top Supplier Performance
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="onTimeDelivery" name="On-Time Delivery %" fill="#2196f3" />
              <Bar dataKey="qualityScore" name="Quality Score %" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Top Rated Suppliers */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Top Rated Suppliers
          </Typography>
          <List>
            {suppliers
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 5)
              .map((supplier) => (
                <ListItem key={supplier.id} divider>
                  <ListItemText
                    primary={supplier.name}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Rating value={supplier.rating} readOnly size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          ({supplier.rating})
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={supplier.status}
                      color={supplier.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        </Paper>
      </Grid>

      {/* Supplier Growth Trend */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Supplier Growth Trend
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="suppliers" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SupplierDashboard;
