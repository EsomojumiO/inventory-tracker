import React, { useState } from 'react';
import { 
    Button, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    Stack,
    Typography,
    FormControlLabel,
    Switch,
    CircularProgress,
    Box,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { 
    ReceiptLong as ReceiptIcon,
    Description as QuotationIcon,
    Receipt as InvoiceIcon,
    CloudDownload as CloudIcon
} from '@mui/icons-material';
import { generateDocument } from '../../utils/documentGenerator';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const DocumentGenerator = ({ open, onClose, order, businessInfo, orderId, orderData }) => {
    const { notify } = useNotification();
    const { token, currentUser } = useAuth();
    const [useServer, setUseServer] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [documentType, setDocumentType] = useState('invoice');

    if (!order && !orderId && !orderData) {
        return null;
    }

    const handleGenerateDocument = async (documentType) => {
        setLoading(true);
        setError(null);

        try {
            if (useServer) {
                // Server-side generation
                const config = {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'blob'
                };

                let response;
                if (orderId) {
                    // Generate document for existing order
                    response = await axios.get(
                        `/api/orders/${orderId}/document/${documentType}`,
                        config
                    );
                } else if (orderData) {
                    // Generate manual document
                    response = await axios.post(
                        '/api/orders/document/manual',
                        {
                            type: documentType,
                            orderData
                        },
                        config
                    );
                } else {
                    // Generate document for existing order
                    response = await axios.get(
                        `/api/orders/${order._id}/document/${documentType}`,
                        config
                    );
                }

                // Create blob and download
                const blob = new Blob([response.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${documentType}_${Date.now()}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } else {
                // Client-side generation
                const documentData = {
                    orderNumber: order.orderNumber || order._id?.slice(-6) || 'N/A',
                    customer: order.customer || { name: 'Guest Customer' },
                    items: order.items || [],
                    total: order.total || 0,
                    subtotal: order.subtotal || 0,
                    tax: order.tax || 0,
                    date: order.createdAt || new Date(),
                    status: order.status || 'PENDING'
                };

                const doc = generateDocument(documentData, documentType, businessInfo);
                const filename = `${documentType}_${documentData.orderNumber}_${new Date().getTime()}.pdf`;
                doc.save(filename);
            }
            
            notify(`${documentType.charAt(0).toUpperCase() + documentType.slice(1)} generated successfully`, 'success');
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Error generating document');
            console.error('Document generation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateDocumentManual = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = await currentUser.getIdToken();
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'blob'
            };

            const response = await axios.post(
                '/api/orders/document/manual',
                {
                    type: documentType,
                    orderData
                },
                config
            );

            // Create blob and download
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${documentType}_${Date.now()}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.response?.data?.message || 'Error generating document');
            console.error('Document generation error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Generate Document</DialogTitle>
            <DialogContent>
                <FormControlLabel
                    control={
                        <Switch
                            checked={useServer}
                            onChange={(e) => setUseServer(e.target.checked)}
                            name="useServer"
                        />
                    }
                    label="Use server-side generation"
                    sx={{ mb: 2, display: 'block' }}
                />
                {orderId || orderData ? (
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Document Type</InputLabel>
                            <Select
                                value={documentType}
                                label="Document Type"
                                onChange={(e) => setDocumentType(e.target.value)}
                            >
                                <MenuItem value="invoice">Invoice</MenuItem>
                                <MenuItem value="receipt">Receipt</MenuItem>
                                <MenuItem value="quotation">Quotation</MenuItem>
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={orderId ? handleGenerateDocument : generateDocumentManual}
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                `Generate ${documentType.charAt(0).toUpperCase() + documentType.slice(1)}`
                            )}
                        </Button>

                        {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={useServer ? <CloudIcon /> : <QuotationIcon />}
                            onClick={() => handleGenerateDocument('quotation')}
                            fullWidth
                            disabled={loading}
                        >
                            Generate Quotation
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={useServer ? <CloudIcon /> : <InvoiceIcon />}
                            onClick={() => handleGenerateDocument('invoice')}
                            fullWidth
                            disabled={loading}
                        >
                            Generate Invoice
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={useServer ? <CloudIcon /> : <ReceiptIcon />}
                            onClick={() => handleGenerateDocument('receipt')}
                            fullWidth
                            disabled={loading || order.status !== 'DELIVERED'}
                        >
                            Generate Receipt
                        </Button>
                    </Stack>
                )}
                {loading && (
                    <CircularProgress 
                        size={24} 
                        sx={{ 
                            position: 'absolute', 
                            top: '50%', 
                            left: '50%', 
                            marginTop: '-12px', 
                            marginLeft: '-12px' 
                        }} 
                    />
                )}
                {order.status !== 'DELIVERED' && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        * Receipt can only be generated for delivered orders
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default DocumentGenerator;
