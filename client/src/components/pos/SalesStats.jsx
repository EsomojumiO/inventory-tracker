import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';

const StatCard = ({ title, value, icon, color }) => (
  <Paper
    sx={{
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: `${color}.light`,
      color: `${color}.dark`,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      {icon}
      <Typography variant="h6" sx={{ ml: 1 }}>
        {title}
      </Typography>
    </Box>
    <Typography variant="h4" component="div">
      {value}
    </Typography>
  </Paper>
);

const SalesStats = ({ stats }) => {
  if (!stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Today's Statistics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Total Sales"
            value={formatCurrency(stats.totalSales)}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Transactions"
            value={stats.transactionCount}
            icon={<CartIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            title="Avg. Transaction"
            value={formatCurrency(stats.averageTransaction)}
            icon={<PaymentIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Top Selling Products
      </Typography>
      
      <Paper>
        <List>
          {stats.topProducts.map((product, index) => (
            <React.Fragment key={product.id}>
              {index > 0 && <Divider />}
              <ListItem>
                <ListItemText
                  primary={product.name}
                  secondary={`${product.quantity} units sold`}
                />
                <Typography variant="body2" color="text.secondary">
                  {formatCurrency(product.revenue)}
                </Typography>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default SalesStats;
