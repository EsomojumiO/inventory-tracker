import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  CircularProgress, Box, Tooltip as MuiTooltip, IconButton, Typography,
  Paper, Grid, Link, Card, CardContent, Divider, Avatar 
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InventoryIcon from '@mui/icons-material/Inventory';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useTheme } from '@mui/material/styles';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Dashboard.css';

const COLORS = ['#E3F2FD', '#90CAF9', '#42A5F5', '#1E88E5', '#1565C0', '#0D47A1'];
const REFRESH_INTERVAL = 30000; // 30 seconds

const MetricCard = ({ title, value, description, className, icon: Icon, trend, trendLabel }) => (
  <MuiTooltip title={description} arrow placement="top">
    <Card className={`metric-card ${className}`} elevation={2}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="textSecondary">
            {title}
          </Typography>
          {Icon && (
            <Avatar className="metric-icon">
              <Icon />
            </Avatar>
          )}
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          {value}
        </Typography>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            <TrendingUpIcon 
              color={trend >= 0 ? "success" : "error"} 
              fontSize="small" 
              sx={{ mr: 1 }}
            />
            <Typography 
              variant="body2" 
              color={trend >= 0 ? "success.main" : "error.main"}
            >
              {Math.abs(trend)}% {trendLabel}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  </MuiTooltip>
);

const TopProductCard = ({ product, rank }) => (
  <Card sx={{ mb: 1 }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Typography variant="h6" color="primary" sx={{ mr: 2, minWidth: 24 }}>
            #{rank}
          </Typography>
          <Box>
            <Typography variant="subtitle1">{product.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {product.category}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h6">
          {product.salesCount} sales
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const { user, token } = useAuth();
  const { showSuccess, showError } = useNotification();
  const theme = useTheme();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        throw new Error('Please log in to view the dashboard');
      }

      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${config.apiUrl}/inventory/dashboard`, { 
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Inventory fetch error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error('Failed to fetch inventory data');
      }

      const inventoryResult = await response.json();

      if (!inventoryResult.success) {
        throw new Error(inventoryResult.message || 'Failed to fetch inventory data');
      }

      setInventoryData(inventoryResult.items || []);
      setInventorySummary(inventoryResult.summary || {
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
      });
      setError(null);
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError(error.message || 'Failed to load dashboard data');
      setInventoryData([]);
      setInventorySummary({
        totalItems: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, REFRESH_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [token]);

  const chartData = useMemo(() => {
    return {
      inventoryValue: inventoryData.map(item => ({
        name: item.name,
        value: (item.price || 0) * (item.quantity || 0)
      })),
      stockLevels: inventoryData.map(item => ({
        name: item.name,
        quantity: item.quantity || 0,
        threshold: item.lowStockThreshold || 10
      }))
    };
  }, [inventoryData]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="200px"
          color="error.main"
        >
          <Typography color="error" gutterBottom>{error}</Typography>
          <IconButton 
            onClick={fetchDashboardData} 
            size="small"
            color="primary"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Items"
            value={inventorySummary.totalItems}
            description="Total number of items in inventory"
            icon={InventoryIcon}
            className="total-items"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Low Stock"
            value={inventorySummary.lowStock}
            description="Items below threshold"
            icon={ShoppingCartIcon}
            className="low-stock"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Out of Stock"
            value={inventorySummary.outOfStock}
            description="Items with zero quantity"
            icon={InventoryIcon}
            className="out-of-stock"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <MetricCard
            title="Total Value"
            value={`₦${inventorySummary.totalValue.toFixed(2)}`}
            description="Total inventory value"
            icon={MonetizationOnIcon}
            className="total-value"
          />
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Inventory Value Distribution</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.inventoryValue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Stock Level Overview</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'In Stock', value: inventorySummary.totalItems - inventorySummary.lowStock },
                    { name: 'Low Stock', value: inventorySummary.lowStock },
                    { name: 'Out of Stock', value: inventorySummary.outOfStock }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill={theme.palette.primary.main}
                  dataKey="value"
                >
                  {chartData.inventoryValue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <IconButton onClick={fetchDashboardData} size="large">
          <RefreshIcon />
        </IconButton>
      </Box>
      {renderContent()}
    </Box>
  );
};

export default Dashboard;
