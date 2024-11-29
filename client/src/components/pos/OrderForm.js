import React, { useState, useEffect } from 'react';
import {
  Grid,
  TextField,
  Autocomplete,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const OrderForm = ({ order, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    customer: {
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    },
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
    payment: {
      method: 'CASH',
      status: 'PENDING',
    },
    shipping: {
      method: '',
      trackingNumber: '',
      carrier: '',
      estimatedDelivery: null,
    },
    notes: '',
    status: 'PENDING',
  });

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/inventory', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

  // Load order data if editing
  useEffect(() => {
    if (order) {
      setFormData(order);
    }
  }, [order]);

  // Calculate totals
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax rate
    const total = subtotal + tax + formData.shipping - formData.discount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
    }));
  }, [formData.items, formData.shipping, formData.discount]);

  // Add product to order
  const handleAddProduct = () => {
    if (!selectedProduct) return;

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: selectedProduct._id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          quantity: quantity,
        },
      ],
    }));

    setSelectedProduct(null);
    setQuantity(1);
  };

  // Remove product from order
  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/orders', {
        method: order ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save order');
      }

      const savedOrder = await response.json();
      onSave(savedOrder);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Customer Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Customer Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name"
                value={formData.customer.name}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, name: e.target.value },
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.customer.email}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value },
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.customer.phone}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, phone: e.target.value },
                  }))
                }
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Products */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Products
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Product" />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
                disabled={!selectedProduct}
              >
                Add Product
              </Button>
            </Grid>
          </Grid>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Order Details */}
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>
            Order Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, status: e.target.value }))
                  }
                >
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PROCESSING">Processing</MenuItem>
                  <MenuItem value="SHIPPED">Shipped</MenuItem>
                  <MenuItem value="DELIVERED">Delivered</MenuItem>
                  <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.payment.method}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      payment: { ...prev.payment, method: e.target.value },
                    }))
                  }
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="TRANSFER">Transfer</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={formData.notes}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Totals */}
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" gutterBottom>
            Totals
          </Typography>
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Subtotal:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography align="right">
                  ${formData.subtotal.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Tax (10%):</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography align="right">${formData.tax.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>Shipping:</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  size="small"
                  value={formData.shipping}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      shipping: parseFloat(e.target.value) || 0,
                    }))
                  }
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography>Discount:</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  size="small"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      discount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">Total:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6" align="right">
                  ${formData.total.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Form Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={formData.items.length === 0}
            >
              {order ? 'Update Order' : 'Create Order'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </form>
  );
};

export default OrderForm;
