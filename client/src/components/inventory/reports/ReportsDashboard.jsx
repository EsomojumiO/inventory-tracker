import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useReport } from '../../../context/ReportContext';
import dayjs from 'dayjs';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const MetricCard = ({ title, value, subtitle }) => (
  <Paper sx={{ p: 2, height: '100%' }}>
    <Typography variant="h6" component="div" color="text.secondary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="h4" component="div">
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const ReportsDashboard = () => {
  const { getInventoryMetrics } = useReport();
  const metrics = getInventoryMetrics() || {
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    itemsByCategory: [],
    recentSales: [],
    topSellingItems: []
  };

  // Ensure we have valid data for the pie chart
  const stockDistributionData = [
    { 
      name: 'Normal Stock', 
      value: Math.max(0, metrics.totalItems - metrics.lowStockItems) 
    },
    { 
      name: 'Low Stock', 
      value: metrics.lowStockItems 
    },
  ].filter(item => item.value > 0);

  return (
    <Grid container spacing={3}>
      {/* Metrics Summary */}
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Total Items"
          value={metrics.totalItems.toLocaleString()}
          subtitle="Products in inventory"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockItems.toLocaleString()}
          subtitle="Items below reorder point"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <MetricCard
          title="Total Inventory Value"
          value={formatCurrency(metrics.totalValue)}
          subtitle="Current stock value"
        />
      </Grid>

      {/* Category Distribution Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Items by Category
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={metrics.itemsByCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'value') return formatCurrency(value);
                  return value;
                }}
              />
              <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Items" />
              <Bar yAxisId="right" dataKey="value" fill="#82ca9d" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Stock Distribution Pie Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Stock Level Distribution
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              {stockDistributionData.length > 0 && (
                <Pie
                  data={stockDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {stockDistributionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Low Stock' ? '#FF8042' : '#00C49F'} 
                    />
                  ))}
                </Pie>
              )}
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Recent Sales */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Recent Sales
          </Typography>
          <List>
            {metrics.recentSales.map((sale, index) => (
              <React.Fragment key={sale.id}>
                <ListItem>
                  <ListItemText
                    primary={`Order ${sale.orderId}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {formatCurrency(sale.total)}
                        </Typography>
                        {` - ${dayjs(sale.date).format('MMM D, YYYY HH:mm')}`}
                        <br />
                        {`${sale.items.length} items`}
                      </>
                    }
                  />
                </ListItem>
                {index < metrics.recentSales.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Top Selling Items */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Top Selling Items
          </Typography>
          <List>
            {metrics.topSellingItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem>
                  <ListItemText
                    primary={item.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {`${item.quantity} units`}
                        </Typography>
                        {` - Total Value: ${formatCurrency(item.value)}`}
                      </>
                    }
                  />
                </ListItem>
                {index < metrics.topSellingItems.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ReportsDashboard;
