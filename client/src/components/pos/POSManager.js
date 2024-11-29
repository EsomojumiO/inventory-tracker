import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useCustomer } from '../../context/CustomerContext';
import BarcodeScanner from '../common/BarcodeScanner';
import PaymentDialog from './PaymentDialog';
import Receipt from './Receipt';
import CustomerAutocomplete from '../common/CustomerAutocomplete';
import config from '../../config/config';
import { formatCurrency, DEFAULT_CURRENCY } from '../../utils/currency';

const TAX_RATE = 0.075; // 7.5% tax rate

const validationSchema = yup.object({
  customerName: yup.string().required('Customer name is required'),
  customerPhone: yup.string(),
  customerEmail: yup.string().email('Invalid email format'),
});

const POSManager = () => {
  const { user, isAuthenticated, getToken } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [currentSale, setCurrentSale] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [profile, setProfile] = useState(null);

  const formik = useFormik({
    initialValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
    },
    validationSchema,
    onSubmit: (values) => {
      handleCreateOrder(values);
    },
  });

  const fetchProducts = useCallback(async () => {
    if (!isAuthenticated || !user?.token) {
      showError('Please log in to view products');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/api/inventory`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch products');
      }

      const data = await response.json();
      
      // Filter out items with no stock
      const availableProducts = (data.inventory || []).filter(item => 
        item.quantity > 0 && item.price > 0
      );

      setProducts(availableProducts.map(item => ({
        _id: item._id,
        name: item.name,
        sku: item.sku,
        price: Number(item.price),
        physicalStock: item.quantity,
        barcode: item.barcode
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Failed to fetch products: ' + error.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, showError]);

  useEffect(() => {
    if (isAuthenticated && user?.token) {
      fetchProducts();
    }
  }, [isAuthenticated, user, fetchProducts]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/profile`, {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  const handleBarcodeDetected = async (barcode) => {
    try {
      const response = await config.api.get(`/products/barcode/${barcode}`);
      const product = response.data;
      addToCart(product);
      setShowScanner(false);
    } catch (error) {
      showError('Product not found');
    }
  };

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      if (existingItem) {
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prevItems => {
      return prevItems.map(item => {
        if (item._id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity < 1) return item;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE; // 7.5% tax rate
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 7.5; // Can be made configurable
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    const saleData = {
      receiptNumber: Date.now().toString(),
      date: new Date(),
      cashierName: user.name,
      items: cartItems,
      subtotal,
      taxRate,
      tax,
      total
    };

    setCurrentSale(saleData);
    setShowReceipt(true);
    
    // Reset cart
    setCartItems([]);
    formik.resetForm();
    showSuccess('Order created successfully');
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCurrentSale(null);
  };

  const validateForm = () => {
    // TO DO: implement form validation
    return true;
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  const handleCustomerSelect = (event, newValue) => {
    setSelectedCustomer(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {loading && <CircularProgress />}
      <Grid container spacing={3}>
        {/* Product Search and Scanner */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  label="Search Products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<Receipt />}
                  onClick={() => setShowScanner(true)}
                >
                  Scan Barcode
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Product List */}
          <Paper sx={{ p: 2, maxHeight: '60vh', overflow: 'auto' }}>
            <List>
              {products
                .filter(product => 
                  product.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(product => (
                  <ListItem key={product._id} divider>
                    <ListItemText
                      primary={product.name}
                      secondary={`Price: ${formatCurrency(product.price, profile?.currency || DEFAULT_CURRENCY.code)} | Stock: ${product.physicalStock}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => addToCart(product)}
                        disabled={product.physicalStock < 1}
                      >
                        Add to Cart
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
            </List>
          </Paper>
        </Grid>

        {/* Cart and Checkout */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Shopping Cart
            </Typography>
            <List>
              {cartItems.map(item => (
                <ListItem key={item._id} divider>
                  <ListItemText
                    primary={item.name}
                    secondary={formatCurrency(item.price * item.quantity, profile?.currency || DEFAULT_CURRENCY.code)}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item._id, -1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item._id, 1)}
                    >
                      <AddIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => removeFromCart(item._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">
                Subtotal: {formatCurrency(calculateTotals().subtotal, profile?.currency || DEFAULT_CURRENCY.code)}
              </Typography>
              <Typography variant="subtitle1">
                Tax ({(TAX_RATE * 100).toFixed(1)}%): {formatCurrency(calculateTotals().tax, profile?.currency || DEFAULT_CURRENCY.code)}
              </Typography>
              <Typography variant="h6">
                Total: {formatCurrency(calculateTotals().total, profile?.currency || DEFAULT_CURRENCY.code)}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <CustomerAutocomplete
                value={selectedCustomer}
                onChange={handleCustomerSelect}
                required
              />
            </Box>

            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                name="customerName"
                label="Customer Name"
                value={formik.values.customerName}
                onChange={formik.handleChange}
                error={formik.touched.customerName && Boolean(formik.errors.customerName)}
                helperText={formik.touched.customerName && formik.errors.customerName}
              />
              <TextField
                fullWidth
                margin="normal"
                name="customerPhone"
                label="Phone Number"
                value={formik.values.customerPhone}
                onChange={formik.handleChange}
                error={formik.touched.customerPhone && Boolean(formik.errors.customerPhone)}
                helperText={formik.touched.customerPhone && formik.errors.customerPhone}
              />
              <TextField
                fullWidth
                margin="normal"
                name="customerEmail"
                label="Email"
                value={formik.values.customerEmail}
                onChange={formik.handleChange}
                error={formik.touched.customerEmail && Boolean(formik.errors.customerEmail)}
                helperText={formik.touched.customerEmail && formik.errors.customerEmail}
              />

              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                sx={{ mt: 2 }}
                disabled={cartItems.length === 0}
              >
                Proceed to Payment
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onClose={() => setShowScanner(false)}>
        <DialogTitle>Scan Barcode</DialogTitle>
        <DialogContent>
          <BarcodeScanner onDetected={handleBarcodeDetected} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowScanner(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={calculateTotals().total}
      />

      {/* Receipt Dialog */}
      <Dialog 
        open={showReceipt} 
        onClose={handleCloseReceipt}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Receipt
        </DialogTitle>
        <DialogContent>
          <Receipt 
            sale={currentSale} 
            businessInfo={{
              name: 'Retail Master',
              address: '123 Business Street',
              phone: '(555) 123-4567',
              email: 'info@retailmaster.com'
            }} 
            currency={profile?.currency || DEFAULT_CURRENCY.code}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReceipt}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => window.print()}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alert.severity}
          elevation={6}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default POSManager;
