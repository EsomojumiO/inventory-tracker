import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  LocalOffer as DiscountIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  ClearAll as ClearIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { formatCurrency } from '../../utils/formatCurrency';

// Styled Components
const TerminalPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: 'calc(100vh - 100px)',
  display: 'flex',
  flexDirection: 'column',
}));

const CartContainer = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: 'auto',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const TotalSection = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
}));

const SalesTerminal = () => {
  // State management
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const barcodeInputRef = useRef(null);

  // Calculate totals whenever cart or discount changes
  useEffect(() => {
    const newSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTax = newSubtotal * 0.075; // 7.5% tax rate
    const newTotal = newSubtotal + newTax - discount;
    
    setSubtotal(newSubtotal);
    setTax(newTax);
    setTotal(newTotal);
  }, [cart, discount]);

  // Handle barcode input
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput) return;

    try {
      const response = await fetch(`/api/products/barcode/${barcodeInput}`);
      const product = await response.json();

      if (product) {
        addToCart(product);
      } else {
        // Show error notification
        console.error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }

    setBarcodeInput('');
  };

  // Add item to cart
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // Update item quantity
  const updateQuantity = (productId, change) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = item.quantity + change;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setBarcodeInput('');
  };

  // Handle payment
  const handlePayment = () => {
    // Implement payment processing logic here
    console.log('Processing payment:', {
      items: cart,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      amountReceived
    });

    // Clear cart after successful payment
    clearCart();
    setPaymentDialog(false);
  };

  return (
    <Grid container spacing={2}>
      {/* Left side - Product Search and Cart */}
      <Grid item xs={8}>
        <TerminalPaper>
          {/* Barcode Input */}
          <form onSubmit={handleBarcodeSubmit}>
            <TextField
              fullWidth
              label="Scan Barcode"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              inputRef={barcodeInputRef}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setBarcodeInput('')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </form>

          {/* Cart Items */}
          <CartContainer>
            <List>
              {cart.map((item) => (
                <ListItem key={item.id} divider>
                  <ListItemText
                    primary={item.name}
                    secondary={formatCurrency(item.price)}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography>{item.quantity}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <AddIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => removeFromCart(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CartContainer>

          {/* Totals Section */}
          <TotalSection>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Subtotal: {formatCurrency(subtotal)}</Typography>
                <Typography>Tax (7.5%): {formatCurrency(tax)}</Typography>
                <Typography>Discount: {formatCurrency(discount)}</Typography>
                <Typography variant="h6">
                  Total: {formatCurrency(total)}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ textAlign: 'right' }}>
              </Grid>
            </Grid>
          </TotalSection>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentDialog(true)}
              disabled={cart.length === 0}
              fullWidth
            >
              Payment
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={clearCart}
              disabled={cart.length === 0}
              fullWidth
            >
              Clear Cart
            </Button>
          </Box>
        </TerminalPaper>
      </Grid>

      {/* Right side - Product Search and Quick Actions */}
      <Grid item xs={4}>
        <TerminalPaper>
          {/* Product Search */}
          <TextField
            fullWidth
            label="Search Products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Quick Actions */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<DiscountIcon />}
                  onClick={() => {/* Implement discount dialog */}}
                >
                  Add Discount
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ReceiptIcon />}
                  onClick={() => {/* Implement receipt preview */}}
                >
                  Preview Receipt
                </Button>
              </Grid>
            </Grid>
          </Box>
        </TerminalPaper>
      </Grid>

      {/* Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)}>
        <DialogTitle>Payment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="transfer">Bank Transfer</MenuItem>
            </Select>
          </FormControl>
          {paymentMethod === 'cash' && (
            <TextField
              fullWidth
              label="Amount Received"
              type="number"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handlePayment} variant="contained" color="primary">
            Complete Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SalesTerminal;
