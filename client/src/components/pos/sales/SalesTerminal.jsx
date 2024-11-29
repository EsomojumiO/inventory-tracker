import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
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
    Tab,
    Tabs,
    Alert,
    Autocomplete,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    Payment as PaymentIcon,
    Save as SaveIcon,
    Print as PrintIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useInventory } from '../../../context/InventoryContext';
import { useSales } from '../../../context/SalesContext';
import { useAuth } from '../../../hooks/useAuth';
import { useCurrency } from '../../../context/CurrencyContext';
import { PAYMENT_METHODS } from '../../../utils/constants';

const SalesTerminal = () => {
    const { user } = useAuth();
    const { inventory } = useInventory();
    const { createSale } = useSales();
    const { formatAmount } = useCurrency();
    
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [amountReceived, setAmountReceived] = useState('');
    const [error, setError] = useState('');

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const change = Number(amountReceived) - cartTotal;

    const handleAddToCart = (product) => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
        setSelectedProduct(null);
        setSearchQuery('');
    };

    const handleUpdateQuantity = (productId, change) => {
        setCart(cart.map(item => {
            if (item.id === productId) {
                const newQuantity = item.quantity + change;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const handleRemoveItem = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const handlePayment = async () => {
        if (!cart.length) {
            setError('Cart is empty');
            return;
        }

        if (paymentMethod === PAYMENT_METHODS.CASH && Number(amountReceived) < cartTotal) {
            setError('Insufficient amount received');
            return;
        }

        try {
            const saleData = {
                items: cart,
                total: cartTotal,
                paymentMethod,
                amountReceived: Number(amountReceived),
                change: change,
                cashierId: user.id,
                timestamp: new Date().toISOString(),
            };

            await createSale(saleData);
            handleClearSale();
            setIsPaymentDialogOpen(false);
        } catch (error) {
            setError('Failed to process sale');
            console.error('Sale processing error:', error);
        }
    };

    const handleClearSale = () => {
        setCart([]);
        setSearchQuery('');
        setSelectedProduct(null);
        setAmountReceived('');
        setError('');
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Product Search and Cart */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Sales Terminal
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Autocomplete
                                    value={selectedProduct}
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            handleAddToCart(newValue);
                                        }
                                    }}
                                    options={inventory || []}
                                    getOptionLabel={(option) => option.name}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Search Products"
                                            variant="outlined"
                                            fullWidth
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <IconButton>
                                                        <SearchIcon />
                                                    </IconButton>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Cart Items */}
                    <Paper sx={{ p: 2 }}>
                        <List>
                            {cart.map((item) => (
                                <React.Fragment key={item.id}>
                                    <ListItem>
                                        <ListItemText
                                            primary={item.name}
                                            secondary={formatAmount(item.price)}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                            >
                                                <RemoveIcon />
                                            </IconButton>
                                            <Typography>{item.quantity}</Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveItem(item.id)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                        <ListItemSecondaryAction>
                                            <Typography>
                                                {formatAmount(item.price * item.quantity)}
                                            </Typography>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* Payment Section */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Sale Summary
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h4">
                                {formatAmount(cartTotal)}
                            </Typography>
                            <Typography color="text.secondary">
                                {cart.length} items
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<PaymentIcon />}
                                onClick={() => setIsPaymentDialogOpen(true)}
                                disabled={!cart.length}
                                fullWidth
                            >
                                Payment
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<CancelIcon />}
                                onClick={handleClearSale}
                                disabled={!cart.length}
                                fullWidth
                            >
                                Clear
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Payment Dialog */}
            <Dialog
                open={isPaymentDialogOpen}
                onClose={() => setIsPaymentDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Process Payment</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Tabs
                        value={paymentMethod}
                        onChange={(e, value) => setPaymentMethod(value)}
                        sx={{ mb: 2 }}
                    >
                        {Object.values(PAYMENT_METHODS).map((method) => (
                            <Tab key={method} label={method} value={method} />
                        ))}
                    </Tabs>
                    {paymentMethod === PAYMENT_METHODS.CASH && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Amount Received"
                                    type="number"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    fullWidth
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h6">
                                    Change: {formatAmount(change)}
                                </Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsPaymentDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePayment}
                        startIcon={<PaymentIcon />}
                    >
                        Complete Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SalesTerminal;
