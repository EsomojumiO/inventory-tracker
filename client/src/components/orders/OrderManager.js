import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  TextField,
  MenuItem,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Print as PrintIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import Receipt from '../pos/Receipt';
import config from '../../config/config';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'warning' },
  PROCESSING: { label: 'Processing', color: 'info' },
  SHIPPED: { label: 'Shipped', color: 'primary' },
  DELIVERED: { label: 'Delivered', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error' }
};

const OrderManager = () => {
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !user?.token) {
      showError('Please log in to view orders');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/api/orders${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Failed to fetch orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, filterStatus, showError]);

  useEffect(() => {
    if (isAuthenticated && user?.token) {
      fetchOrders();
    }
  }, [isAuthenticated, user, fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      showSuccess('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      showError('Failed to update order status: ' + error.message);
    }
  };

  const handleViewReceipt = (order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h6">Order Management</Typography>
          </Grid>
          <Grid item>
            <TextField
              select
              label="Filter by Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">All Orders</MenuItem>
              {Object.keys(STATUS_CONFIG).map((status) => (
                <MenuItem key={status} value={status}>
                  {STATUS_CONFIG[status].label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Items</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order._id}</TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    {order.customer?.name || 'N/A'}
                    {order.customer?.email && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        {order.customer.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{order.items?.length || 0} items</TableCell>
                  <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_CONFIG[order.status]?.label || order.status}
                      color={STATUS_CONFIG[order.status]?.color || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewReceipt(order)}
                      title="View Receipt"
                    >
                      <ViewIcon />
                    </IconButton>
                    {order.status === 'PENDING' && (
                      <>
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(order._id, 'DELIVERED')}
                          title="Mark as Delivered"
                          color="success"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleStatusChange(order._id, 'CANCELLED')}
                          title="Cancel Order"
                          color="error"
                        >
                          <EditIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Receipt Dialog */}
      <Dialog
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Order Receipt
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Receipt
              sale={{
                receiptNumber: selectedOrder._id,
                date: selectedOrder.createdAt,
                cashierName: selectedOrder.cashier?.name || 'System',
                items: selectedOrder.items,
                subtotal: selectedOrder.subtotal,
                tax: selectedOrder.tax,
                taxRate: selectedOrder.taxRate,
                total: selectedOrder.total
              }}
              businessInfo={{
                name: 'Retail Master',
                address: '123 Business Street',
                phone: '(555) 123-4567',
                email: 'info@retailmaster.com'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceipt(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderManager;
