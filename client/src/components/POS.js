import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    TextField,
    Button,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Box,
    Autocomplete,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import config from '../config/config';

const POS = () => {
    const { getToken } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    // Fetch products on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${config.API_URL}/api/inventory`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data.items.filter(item => item.quantity > 0));
        } catch (error) {
            showError('Error loading products: ' + error.message);
        }
    };

    const handleAddToCart = () => {
        if (!selectedProduct || quantity < 1) {
            showError('Please select a product and valid quantity');
            return;
        }

        if (quantity > selectedProduct.quantity) {
            showError(`Only ${selectedProduct.quantity} units available`);
            return;
        }

        const existingItem = cart.find(item => item.product.id === selectedProduct.id);
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > selectedProduct.quantity) {
                showError(`Cannot add more than available stock (${selectedProduct.quantity} units)`);
                return;
            }
            setCart(cart.map(item =>
                item.product.id === selectedProduct.id
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        } else {
            setCart([...cart, {
                product: selectedProduct,
                quantity,
                price: selectedProduct.price
            }]);
        }

        setSelectedProduct(null);
        setQuantity(1);
    };

    const handleRemoveFromCart = (productId) => {
        setCart(cart.filter(item => item.product.id !== productId));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    };

    const handleCheckout = async () => {
        setConfirmDialogOpen(true);
    };

    const processCheckout = async () => {
        try {
            setLoading(true);
            const token = getToken();

            const saleData = {
                items: cart.map(item => ({
                    product: item.product.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                customer: customerInfo,
                paymentMethod,
                total: calculateTotal()
            };

            const response = await fetch(`${config.API_URL}/api/sales`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saleData)
            });

            if (!response.ok) {
                throw new Error('Failed to process sale');
            }

            showSuccess('Sale completed successfully');
            setCart([]);
            setCustomerInfo({ name: '', email: '', phone: '' });
            setPaymentMethod('cash');
            fetchProducts(); // Refresh product list to update stock
        } catch (error) {
            showError('Error processing sale: ' + error.message);
        } finally {
            setLoading(false);
            setConfirmDialogOpen(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Product Selection */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" gutterBottom>
                            Add Products
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Autocomplete
                                options={products}
                                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                                value={selectedProduct}
                                onChange={(event, newValue) => setSelectedProduct(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Product"
                                        variant="outlined"
                                        fullWidth
                                    />
                                )}
                                sx={{ flexGrow: 1 }}
                            />
                            <TextField
                                type="number"
                                label="Quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                                sx={{ width: 100 }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddToCart}
                                disabled={!selectedProduct}
                            >
                                Add
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {cart.map((item) => (
                                        <TableRow key={item.product.id}>
                                            <TableCell>{item.product.name}</TableCell>
                                            <TableCell align="right">{item.quantity}</TableCell>
                                            <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                ${(item.quantity * item.price).toFixed(2)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    onClick={() => handleRemoveFromCart(item.product.id)}
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={3} align="right">
                                            <strong>Total:</strong>
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>${calculateTotal().toFixed(2)}</strong>
                                        </TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Customer Information and Checkout */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" gutterBottom>
                            Customer Information
                        </Typography>
                        <TextField
                            label="Name"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                            margin="normal"
                        />
                        <TextField
                            label="Email"
                            type="email"
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                            margin="normal"
                        />
                        <TextField
                            label="Phone"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                            margin="normal"
                        />

                        <FormControl fullWidth margin="normal">
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

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || loading}
                            sx={{ mt: 2 }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Complete Sale'}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
                <DialogTitle>Confirm Sale</DialogTitle>
                <DialogContent>
                    <Typography>
                        Total Amount: ${calculateTotal().toFixed(2)}
                    </Typography>
                    <Typography>
                        Payment Method: {paymentMethod}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button onClick={processCheckout} color="primary" autoFocus>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default POS;
