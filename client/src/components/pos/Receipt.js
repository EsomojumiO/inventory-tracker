import React from 'react';
import {
    Paper,
    Typography,
    Divider,
    Box,
    Button
} from '@mui/material';
import { formatCurrency, DEFAULT_CURRENCY } from '../../utils/currency';

const Receipt = ({ sale = {}, businessInfo = {} }) => {
    const items = sale.items || [];
    const subtotal = items.reduce((sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)), 0);
    const taxRate = sale.taxRate || 0;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Paper sx={{
            p: 2,
            mt: 2,
            '@media print': {
                boxShadow: 'none',
                margin: 0
            }
        }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h6">{businessInfo?.name || 'Your Business Name'}</Typography>
                <Typography variant="body2">{businessInfo?.address || 'Business Address'}</Typography>
                <Typography variant="body2">{businessInfo?.phone || 'Phone Number'}</Typography>
                <Typography variant="body2">{businessInfo?.email || 'Email'}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
                Receipt
            </Typography>

            <Typography variant="body2" color="textSecondary" gutterBottom>
                Date: {new Date(sale.date).toLocaleDateString()}
            </Typography>

            <Box sx={{ my: 2 }}>
                {items.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                            {item.name} x {item.quantity}
                        </Typography>
                        <Typography variant="body2">
                            {formatCurrency(item.price * item.quantity, DEFAULT_CURRENCY.code)}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal</Typography>
                <Typography>{formatCurrency(subtotal, DEFAULT_CURRENCY.code)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax</Typography>
                <Typography>{formatCurrency(tax, DEFAULT_CURRENCY.code)}</Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6">{formatCurrency(total, DEFAULT_CURRENCY.code)}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">Thank you for your business!</Typography>
                <Typography variant="caption" display="block" gutterBottom>
                    Please keep this receipt for your records
                </Typography>
            </Box>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', '@media print': { display: 'none' } }}>
                <Button variant="contained" onClick={handlePrint}>
                    Print Receipt
                </Button>
            </Box>
        </Paper>
    );
};

export default Receipt;
