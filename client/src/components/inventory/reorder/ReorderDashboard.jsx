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
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useInventory } from '../../../context/InventoryContext';

const ReorderDashboard = () => {
  const { inventory } = useInventory();

  // Mock data for demonstration
  const reorderFrequencyData = [
    { name: 'Product A', frequency: 12 },
    { name: 'Product B', frequency: 8 },
    { name: 'Product C', frequency: 15 },
    { name: 'Product D', frequency: 6 },
    { name: 'Product E', frequency: 10 },
  ];

  const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint || 10);

  return (
    <Grid container spacing={3}>
      {/* Reorder Frequency Chart */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2, height: 400 }}>
          <Typography variant="h6" gutterBottom>
            Reorder Frequency by Product
          </Typography>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={reorderFrequencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="frequency" fill="#2196f3" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Low Stock Items */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            Low Stock Items
          </Typography>
          <List>
            {lowStockItems.map((item) => (
              <ListItem key={item.id} divider>
                <ListItemText
                  primary={item.name}
                  secondary={`Stock: ${item.quantity} units`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    color={item.quantity === 0 ? 'error' : 'warning'}
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Recent Reorders */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Reorders
          </Typography>
          <List>
            {/* Mock recent reorders */}
            {[1, 2, 3].map((index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={`Reorder #${index}`}
                  secondary={`Supplier: Supplier ${index} | Status: In Transit`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label="In Transit"
                    color="info"
                    size="small"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ReorderDashboard;
