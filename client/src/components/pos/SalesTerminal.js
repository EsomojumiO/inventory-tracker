import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  TextField,
  Autocomplete,
  Typography,
  Button,
  IconButton,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  InputAdornment,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  LocalOffer as DiscountIcon,
  AttachMoney as PaymentIcon,
} from '@mui/icons-material';
import { useInventory } from '../../context/InventoryContext';
import { formatNaira } from '../../utils/formatCurrency';

const SalesTerminal = () => {
  // State management
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [splitPayment, setSplitPayment] = useState(false);
  const [payments, setPayments] = useState([{ method: 'cash', amount: 0 }]);
  const [error, setError] = useState('');

  const { inventory } = useInventory();

  // Format prices with Naira
  const formatPrice = (price) => formatNaira(price);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.1; // 10% tax rate - should come from settings
  const taxAmount = subtotal * taxRate;
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * (discountValue / 100))
    : discountValue;
  const total = subtotal + taxAmount - discountAmount;

  // Display totals
  const displaySubtotal = formatNaira(subtotal);
  const displayTax = formatNaira(taxAmount);
  const displayDiscount = formatNaira(discountAmount);
  const displayTotal = formatNaira(total);

  // Product search and addition
  const handleProductSearch = (event, value) => {
    setSearchTerm(value);
    setSelectedProduct(null);
  };

  const handleProductSelect = (event, product) => {
    if (product) {
      setSelectedProduct(product);
      addToCart(product);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setSelectedProduct(null);
    setSearchTerm('');
  };

  // Cart management
  const updateQuantity = (productId, change) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item._id === productId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };

  // Payment handling
  const createOrder = async () => {
    try {
      const orderData = {
        customer: selectedCustomer,
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        payment: {
          method: paymentMethod,
          status: 'PENDING'
        },
        status: 'PENDING'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const newOrder = await response.json();
      setError('');
      setCart([]);
      return newOrder;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const processPayment = async () => {
    try {
      const order = await createOrder();
      
      const paymentResponse = await fetch(`/api/orders/${order._id}/payment`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payments: splitPayment ? payments : [{
            method: paymentMethod,
            amount: total
          }]
        })
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }

      const receipt = await paymentResponse.json();
      setPaymentDialog(false);
      return receipt;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const handlePayment = async () => {
    try {
      // Validate payment amount
      const totalPayment = payments.reduce((sum, payment) => sum + payment.amount, 0);
      if (totalPayment !== total) {
        setError('Payment amount must equal total amount');
        return;
      }

      await processPayment();

      // Generate receipt
      // generateReceipt(result);

      // Clear cart and reset state
      // setCart([]);
      setSelectedCustomer(null);
      setDiscountValue(0);
      setPayments([{ method: 'cash', amount: 0 }]);
      setPaymentDialog(false);
      
    } catch (error) {
      setError(error.message);
    }
  };

  // Receipt generation
  const generateReceipt = async (sale) => {
    try {
      const response = await fetch(`/api/receipts/${sale._id}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to generate receipt');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${sale._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to generate receipt');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Left Panel - Product Search and Cart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Autocomplete
              fullWidth
              options={inventory}
              getOptionLabel={(option) => 
                option.name ? `${option.name} (${option.sku})` : ''
              }
              inputValue={searchTerm}
              onInputChange={handleProductSearch}
              onChange={handleProductSelect}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Products"
                  variant="outlined"
                />
              )}
            />
          </Paper>

          <Paper sx={{ p: 2 }}>
            {cart.map((item) => (
              <Card key={item._id} sx={{ mb: 1 }}>
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="subtitle1">{item.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        SKU: {item.sku}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography>{formatPrice(item.price)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item._id, -1)}
                        >
                          <RemoveIcon />
                        </IconButton>
                        <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item._id, 1)}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                    <Grid item xs={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Typography>
                          {formatPrice(item.price * item.quantity)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        {/* Right Panel - Totals and Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PersonIcon />}
              onClick={() => setCustomerDialog(true)}
              sx={{ mb: 2 }}
            >
              {selectedCustomer 
                ? selectedCustomer.name 
                : 'Select Customer'}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1">
              Subtotal: {displaySubtotal}
            </Typography>
            <Typography variant="subtitle1">
              Tax ({(taxRate * 100).toFixed(0)}%): {displayTax}
            </Typography>
            <Typography variant="subtitle1">
              Discount: {displayDiscount}
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>
              Total: {displayTotal}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentDialog(true)}
              disabled={cart.length === 0}
              sx={{ mb: 1 }}
            >
              Process Payment
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialog}
        onClose={() => setPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Payment</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Total Amount: {displayTotal}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setSplitPayment(!splitPayment)}
            >
              {splitPayment ? 'Single Payment' : 'Split Payment'}
            </Button>
          </Box>

          {splitPayment ? (
            payments.map((payment, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      select
                      fullWidth
                      label="Payment Method"
                      value={payment.method}
                      onChange={(e) => {
                        const newPayments = [...payments];
                        newPayments[index].method = e.target.value;
                        setPayments(newPayments);
                      }}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="mobile">Mobile Money</option>
                    </TextField>
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Amount"
                      value={payment.amount}
                      onChange={(e) => {
                        const newPayments = [...payments];
                        newPayments[index].amount = Number(e.target.value);
                        setPayments(newPayments);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">₦</InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))
          ) : (
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={payments[0].method}
                onChange={(e) => {
                  setPayments([{ method: e.target.value, amount: total }]);
                }}
                sx={{ mb: 2 }}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile">Mobile Money</option>
              </TextField>
            </Box>
          )}

          {splitPayment && (
            <Button
              startIcon={<AddIcon />}
              onClick={() => setPayments([...payments, { method: 'cash', amount: 0 }])}
            >
              Add Payment Method
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePayment}
          >
            Complete Sale
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesTerminal;
