import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Divider,
    TextField,
    MenuItem,
    Stack,
    Paper,
    Autocomplete
} from '@mui/material';
import {
    ReceiptLong as ReceiptIcon,
    Description as QuotationIcon,
    Receipt as InvoiceIcon,
    Inventory as DeliveryIcon,
    Assignment as PurchaseOrderIcon
} from '@mui/icons-material';
import { useNotification } from '../../context/NotificationContext';
import { generateDocument } from '../../utils/documentGenerator';
import axios from 'axios';
import config from '../../config';
import { useAuth } from '../../context/AuthContext';

const DocumentsPage = () => {
    const { notify } = useNotification();
    const { user } = useAuth();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [documentType, setDocumentType] = useState('quotation');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    const documentTypes = [
        { value: 'quotation', label: 'Quotation', icon: <QuotationIcon /> },
        { value: 'invoice', label: 'Invoice', icon: <InvoiceIcon /> },
        { value: 'receipt', label: 'Receipt', icon: <ReceiptIcon /> },
        { value: 'delivery', label: 'Delivery Note', icon: <DeliveryIcon /> },
        { value: 'purchase', label: 'Purchase Order', icon: <PurchaseOrderIcon /> }
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('inventory_tracker_token');
            if (!token) {
                notify('Authentication token not found', 'error');
                return;
            }

            const response = await axios.get(`${config.apiUrl}/orders`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                setOrders(response.data.orders || []);
            } else {
                notify('Error fetching orders: ' + (response.data?.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            notify(error.response?.data?.message || 'Error fetching orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDocument = () => {
        try {
            if (!selectedOrder) {
                notify('Please select an order first', 'warning');
                return;
            }

            const businessInfo = {
                name: user.businessName || 'Your Business Name',
                address: user.businessAddress || '123 Business St',
                phone: user.businessPhone || '(555) 123-4567',
                email: user.businessEmail || 'business@example.com',
                bankName: user.bankName || 'Your Bank',
                accountName: user.accountName || 'Your Account Name',
                accountNumber: user.accountNumber || '0123456789'
            };

            const doc = generateDocument(selectedOrder, documentType, businessInfo);
            const filename = `${documentType}_${selectedOrder.orderNumber || selectedOrder._id}_${new Date().getTime()}.pdf`;
            doc.save(filename);
            
            notify(`${documentType.charAt(0).toUpperCase() + documentType.slice(1)} generated successfully`, 'success');
        } catch (error) {
            console.error('Document generation error:', error);
            notify('Error generating document', 'error');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Document Generator
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Generate various business documents such as quotations, invoices, receipts, and more.
                </Typography>
                
                <Divider sx={{ my: 3 }} />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Generate Document
                                </Typography>
                                <Stack spacing={3}>
                                    <TextField
                                        select
                                        fullWidth
                                        label="Document Type"
                                        value={documentType}
                                        onChange={(e) => setDocumentType(e.target.value)}
                                    >
                                        {documentTypes.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {type.icon}
                                                    {type.label}
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    <Autocomplete
                                        fullWidth
                                        options={orders}
                                        getOptionLabel={(order) => `Order #${order.orderNumber || order._id.slice(-6)} - ${order.customer?.name || 'Guest'}`}
                                        value={selectedOrder}
                                        onChange={(event, newValue) => setSelectedOrder(newValue)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Select Order"
                                                placeholder="Search by order number or customer name"
                                            />
                                        )}
                                        loading={loading}
                                    />

                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleGenerateDocument}
                                        startIcon={documentTypes.find(t => t.value === documentType)?.icon}
                                        disabled={!selectedOrder}
                                    >
                                        Generate {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Document Types
                                </Typography>
                                <Stack spacing={2}>
                                    {documentTypes.map((type) => (
                                        <Box
                                            key={type.value}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    bgcolor: 'action.hover'
                                                }
                                            }}
                                            onClick={() => setDocumentType(type.value)}
                                        >
                                            {type.icon}
                                            <Box>
                                                <Typography variant="subtitle1">
                                                    {type.label}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Generate {type.label.toLowerCase()} for your business transactions
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default DocumentsPage;
