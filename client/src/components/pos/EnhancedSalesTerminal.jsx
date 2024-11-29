import React, { useRef, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tab,
  Tabs,
  InputAdornment,
  CircularProgress,
  Alert,
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
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  LocalMall as ProductIcon,
  Category as CategoryIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSalesTerminal } from '../../hooks/useSalesTerminal';
import { formatCurrency } from '../../utils/formatCurrency';
import ProductSearch from './ProductSearch';
import PaymentDialog from './PaymentDialog';
import SalesStats from './SalesStats';

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

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  minWidth: 120,
}));

const QuickActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  minWidth: 100,
  height: 80,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: 24,
    marginBottom: theme.spacing(1),
  },
}));

const EnhancedSalesTerminal = () => {
  const {
    cart,
    searchQuery,
    barcodeInput,
    paymentMethod,
    splitPayment,
    paymentAmounts,
    dailyStats,
    offlineMode,
    pendingSync,
    setSearchQuery,
    setBarcodeInput,
    setPaymentMethod,
    setSplitPayment,
    setPaymentAmounts,
    addToCart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    handleBarcodeScan,
    processPayment,
    calculateTotals
  } = useSalesTerminal();

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const barcodeInputRef = useRef(null);

  // Calculate totals
  const { subtotal, tax, total } = calculateTotals();

  // Handle barcode submission
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    handleBarcodeScan(barcodeInput);
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentDetails) => {
    const success = await processPayment(paymentDetails);
    if (success) {
      setPaymentDialogOpen(false);
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Left Panel - Product Search and Cart */}
      <Grid item xs={8}>
        <TerminalPaper>
          {/* Status Bar */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Sales Terminal</Typography>
            <Box>
              <Chip
                icon={offlineMode ? <WifiOffIcon /> : <WifiIcon />}
                label={offlineMode ? 'Offline Mode' : 'Online'}
                color={offlineMode ? 'error' : 'success'}
                sx={{ mr: 1 }}
              />
              {pendingSync.length > 0 && (
                <Chip
                  label={`${pendingSync.length} pending sync`}
                  color="warning"
                />
              )}
            </Box>
          </Box>

          {/* Barcode Scanner */}
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

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Products" icon={<ProductIcon />} />
              <Tab label="Categories" icon={<CategoryIcon />} />
              <Tab label="Quick Actions" icon={<TrendingIcon />} />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ mt: 2, flexGrow: 1 }}>
            {activeTab === 0 && (
              <ProductSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onProductSelect={addToCart}
              />
            )}
            {activeTab === 1 && (
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {/* Add your categories here */}
                  </Select>
                </FormControl>
                {/* Add category-specific product list */}
              </Box>
            )}
            {activeTab === 2 && (
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <QuickActionButton
                    variant="outlined"
                    onClick={() => setPaymentDialogOpen(true)}
                  >
                    <PaymentIcon />
                    Payment
                  </QuickActionButton>
                </Grid>
                {/* Add more quick action buttons */}
              </Grid>
            )}
          </Box>

          {/* Cart */}
          <CartContainer>
            <List>
              {cart.map((item) => (
                <ListItem
                  key={item.id}
                  divider
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => removeFromCart(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={item.name}
                    secondary={formatCurrency(item.price)}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <RemoveIcon />
                    </IconButton>
                    <Typography>{item.quantity}</Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <AddIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </CartContainer>

          {/* Totals */}
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>Subtotal: {formatCurrency(subtotal)}</Typography>
                <Typography>Tax (7.5%): {formatCurrency(tax)}</Typography>
                <Typography variant="h6">
                  Total: {formatCurrency(total)}
                </Typography>
              </Grid>
              <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ActionButton
                  variant="contained"
                  color="primary"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentDialogOpen(true)}
                  disabled={cart.length === 0}
                >
                  Checkout
                </ActionButton>
              </Grid>
            </Grid>
          </Box>
        </TerminalPaper>
      </Grid>

      {/* Right Panel - Stats and Quick Actions */}
      <Grid item xs={4}>
        <Paper sx={{ p: 2, height: 'calc(100vh - 100px)', overflowY: 'auto' }}>
          <SalesStats stats={dailyStats} />
        </Paper>
      </Grid>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        total={total}
        paymentMethod={paymentMethod}
        splitPayment={splitPayment}
        paymentAmounts={paymentAmounts}
        setPaymentMethod={setPaymentMethod}
        setSplitPayment={setSplitPayment}
        setPaymentAmounts={setPaymentAmounts}
        onComplete={handlePaymentComplete}
      />
    </Grid>
  );
};

export default EnhancedSalesTerminal;
