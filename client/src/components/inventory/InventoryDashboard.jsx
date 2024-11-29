import React, { useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  WarningAmber as AlertIcon,
  Inventory as StockIcon,
  Category as CategoryIcon,
  MonetizationOn as ValueIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';

const InventoryDashboard = ({ products }) => {
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const lowStockItems = products.filter(p => p.quantity <= 5).length;
    const outOfStockItems = products.filter(p => p.quantity === 0).length;
    const categories = [...new Set(products.map(p => p.category))];
    
    const categoryStats = categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      return {
        name: category,
        count: categoryProducts.length,
        value: categoryProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0),
      };
    }).sort((a, b) => b.value - a.value);

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      categories: categoryStats,
    };
  }, [products]);

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <StockIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Products</Typography>
            </Box>
            <Typography variant="h4">{stats.totalProducts}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ValueIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Total Value</Typography>
            </Box>
            <Typography variant="h4">{formatCurrency(stats.totalValue)}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CategoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Categories</Typography>
            </Box>
            <Typography variant="h4">{stats.categories.length}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AlertIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">Stock Alerts</Typography>
            </Box>
            <Typography variant="h4">{stats.lowStockItems}</Typography>
            <Typography variant="body2" color="text.secondary">
              Including {stats.outOfStockItems} out of stock
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Category Breakdown */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Category Breakdown
          </Typography>
          <Grid container spacing={2}>
            {stats.categories.map((category) => (
              <Grid item xs={12} key={category.name}>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1">{category.name}</Typography>
                    <Typography variant="subtitle1">
                      {formatCurrency(category.value)}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(category.count / stats.totalProducts) * 100}
                      />
                    </Box>
                    <Typography variant="body2">
                      {category.count} items
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default InventoryDashboard;
