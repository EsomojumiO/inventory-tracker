import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
  Stack,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Visibility, 
  Edit, 
  Delete, 
  ReceiptLong,
  Description as QuotationIcon,
  Receipt as InvoiceIcon,
  Description as DescriptionIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import axios from 'axios';
import config from '../../config';
import DocumentGenerator from './DocumentGenerator';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showDocumentGenerator, setShowDocumentGenerator] = useState(false);

  const { token, user } = useAuth();
  const { notify } = useNotification();

  const statusColors = {
    PENDING: 'warning',
    PROCESSING: 'info',
    SHIPPED: 'primary',
    DELIVERED: 'success',
    CANCELLED: 'error'
  };

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/orders${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(response.data.orders);
    } catch (error) {
      notify('Error fetching orders', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/orders`,
        {
          ...orderData,
          source: 'POS',
          type: 'IN_STORE'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notify('Order created successfully', 'success');
      fetchOrders();
    } catch (error) {
      notify('Error creating order', 'error');
      console.error('Error:', error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${config.apiUrl}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notify('Order status updated successfully', 'success');
      fetchOrders();
      setEditDialogOpen(false);
    } catch (error) {
      notify('Error updating order status', 'error');
      console.error('Error:', error);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      await axios.delete(
        `${config.apiUrl}/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notify('Order deleted successfully', 'success');
      fetchOrders();
    } catch (error) {
      notify('Error deleting order', 'error');
      console.error('Error:', error);
    }
  };

  const handleGenerateDocument = (order, documentType) => {
    if (!order) return;
    setSelectedOrder({ ...order, documentType });
    setShowDocumentGenerator(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Orders</Typography>
        <Box>
          <Button
            component={RouterLink}
            to="/orders/documents"
            variant="outlined"
            color="primary"
            startIcon={<DescriptionIcon />}
            sx={{ mr: 2 }}
          >
            Document Generator
          </Button>
        </Box>
      </Box>

      <TextField
        select
        label="Filter by Status"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        sx={{ minWidth: 200 }}
      >
        {statusOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order #</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Documents</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.orderNumber || order._id.slice(-6)}</TableCell>
                  <TableCell>{order.customer?.name || 'Guest'}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>${order.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      color={statusColors[order.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Generate Quotation">
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateDocument(order, 'quotation')}
                          color="primary"
                        >
                          <QuotationIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate Invoice">
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateDocument(order, 'invoice')}
                          color="primary"
                        >
                          <InvoiceIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate Receipt">
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateDocument(order, 'receipt')}
                          color="primary"
                          disabled={order.status !== 'DELIVERED'}
                        >
                          <ReceiptLong />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrder(order);
                        setViewDialogOpen(true);
                      }}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOrder(order);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteOrder(order._id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedOrder && (
        <DocumentGenerator
          open={showDocumentGenerator}
          onClose={() => {
            setShowDocumentGenerator(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          businessInfo={{
            name: user?.businessName || 'Your Business Name',
            address: user?.businessAddress || '123 Business St',
            phone: user?.businessPhone || '(555) 123-4567',
            email: user?.businessEmail || 'business@example.com',
            bankName: user?.bankName || 'Your Bank',
            accountName: user?.accountName || 'Your Account Name',
            accountNumber: user?.accountNumber || '0123456789'
          }}
        />
      )}

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography variant="h6">Order #{selectedOrder._id.slice(-6)}</Typography>
              <Typography>Customer: {selectedOrder.customer?.name || 'Guest'}</Typography>
              <Typography>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</Typography>
              <Typography>Status: {selectedOrder.status}</Typography>

              <Typography variant="h6" sx={{ mt: 2 }}>Items:</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                        <TableCell align="right">
                          ${(item.quantity * item.price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2 }}>
                <Typography>
                  Subtotal: ${selectedOrder.subtotal.toFixed(2)}
                </Typography>
                <Typography>
                  Tax: ${selectedOrder.tax.toFixed(2)}
                </Typography>
                <Typography variant="h6">
                  Total: ${selectedOrder.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <TextField
              select
              fullWidth
              label="Status"
              value={selectedOrder.status}
              onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
              sx={{ mt: 2 }}
            >
              {statusOptions.filter(option => option.value !== 'all').map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OrdersPage;
